// Step 3: e-signature -> PDF -> GHL file custom field -> invoice created and sent.
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { COMPANY, OFFER, TAGS } from "@/lib/config";
import {
  addTags,
  createInvoice,
  ensureCustomFields,
  getContact,
  GhlError,
  ghlEnv,
  readCustomFields,
  sendInvoice,
  setCustomFields,
  uploadToFileField,
} from "@/lib/ghl";
import { renderAgreementPdf } from "@/lib/pdf";
import { stepUrl, verifyContact } from "@/lib/token";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = { c?: string; t?: string; signerName?: string; signature?: string; agreed?: boolean };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const contactId = body.c || "";
  if (!verifyContact(contactId, body.t)) return NextResponse.json({ error: "This link isn't valid. Start again from the sign-up form." }, { status: 403 });

  const signerName = (body.signerName || "").trim();
  const sigMatch = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(body.signature || "");
  const errors: Record<string, string> = {};
  if (!signerName) errors.signerName = "Type your full name.";
  if (!sigMatch) errors.signature = "Draw your signature.";
  else if (sigMatch[1].length > 1_500_000) errors.signature = "Signature image is too large.";
  if (!body.agreed) errors.agreed = "Tick the box to agree.";
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 });

  try {
    const contact = await getContact(contactId);
    const cf = await readCustomFields(contact);
    const str = (v: unknown) => (v == null ? "" : String(v));

    if (str(cf.gbp_agreement_status) === "Signed" && cf.gbp_invoice_id) {
      // Already done (double submit / back button). Don't invoice twice.
      return NextResponse.json({ next: stepUrl("/done", contactId) });
    }
    if (!cf.registered_business_name || !cf.abn) {
      return NextResponse.json({ error: "Business details are missing. Go back one step and fill them in." }, { status: 409 });
    }

    const signedAtISO = new Date().toISOString();
    const agreementId = `GBP-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const contactName = contact.name || `${contact.firstName || ""} ${contact.lastName || ""}`.trim();

    let logo: Uint8Array | undefined;
    try {
      logo = new Uint8Array(await readFile(path.join(process.cwd(), "public", "lsp-logo.png")));
    } catch {
      logo = undefined;
    }

    const pdf = await renderAgreementPdf(
      {
        contactName,
        contactRole: str(cf.contact_role) || "Authorised representative",
        email: contact.email || "",
        phone: contact.phone || "",
        companyName: contact.companyName || str(cf.registered_business_name),
        registeredBusinessName: str(cf.registered_business_name),
        abn: str(cf.abn),
        businessAddress: str(cf.business_address) || contact.address1 || "",
        website: contact.website || undefined,
        suburbs: str(cf.gbp_priority_suburbs) || undefined,
        services: str(cf.gbp_priority_services) || undefined,
        signerName,
        signedAtISO,
        signaturePngBase64: sigMatch![1],
        ip,
        userAgent,
        agreementId,
      },
      logo,
    );

    // 1. PDF into the FILE_UPLOAD custom field (and the URL into a plain text field as a reliable fallback).
    const safeName = str(cf.registered_business_name).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "client";
    const filename = `GBP-Agreement-${safeName}-${agreementId}.pdf`;
    const fields = await ensureCustomFields(["gbp_agreement_pdf"]);
    let pdfUrl = "";
    let fileFieldValue: unknown = undefined;
    try {
      const up = await uploadToFileField(fields.gbp_agreement_pdf.id, filename, pdf);
      pdfUrl = up.url;
      fileFieldValue = up.map;
    } catch (e) {
      console.error("PDF upload to custom field failed", e);
    }

    await setCustomFields(contactId, {
      gbp_agreement_status: "Signed",
      gbp_agreement_signed_at: signedAtISO,
      gbp_agreement_signer: `${signerName} (${agreementId})`,
      ...(pdfUrl ? { gbp_agreement_pdf_url: pdfUrl } : {}),
    });
    if (fileFieldValue) {
      try {
        await setCustomFields(contactId, { gbp_agreement_pdf: fileFieldValue });
      } catch (e) {
        // URL is already in the text field; the file-field attach is best effort.
        console.error("file custom field attach failed", e);
      }
    }
    await addTags(contactId, [TAGS.signed]);

    // 2. Create and send the first invoice.
    const { locationId } = ghlEnv();
    const today = signedAtISO.slice(0, 10);
    const due = new Date(Date.now() + OFFER.invoiceDueDays * 86_400_000).toISOString().slice(0, 10);
    const appUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
    const invoice = await createInvoice({
      altId: locationId,
      altType: "location",
      name: `${OFFER.name} - Month 1 - ${str(cf.registered_business_name)}`,
      title: "TAX INVOICE",
      currency: OFFER.currency,
      businessDetails: {
        name: COMPANY.legalName,
        website: COMPANY.website,
        ...(appUrl ? { logoUrl: `${appUrl}/lsp-logo.png` } : {}),
      },
      contactDetails: {
        id: contactId,
        name: contactName,
        email: contact.email || "",
        phoneNo: contact.phone || "",
        companyName: str(cf.registered_business_name),
        address: { addressLine1: str(cf.business_address), countryCode: "AU" },
      },
      items: [
        {
          name: `${OFFER.name} - monthly fee`,
          description: `Google Business Profile management, month 1 of ${OFFER.minimumTermMonths} (minimum term). Agreement ${agreementId}. Includes GST.`,
          currency: OFFER.currency,
          amount: OFFER.priceMonthly,
          qty: 1,
          type: "one_time",
          taxInclusive: true,
        },
      ],
      discount: { type: "percentage", value: 0 },
      issueDate: today,
      dueDate: due,
      sentTo: { email: [contact.email || ""] },
      liveMode: true,
      termsNotes: `<p>${COMPANY.legalName} · ABN ${COMPANY.abn}</p><p>Thanks for signing up. This is the first month of your ${OFFER.name} agreement (${agreementId}). Once paid, the onboarding form link follows by email. Questions: ${COMPANY.email}</p>`,
    });

    let sent = true;
    try {
      await sendInvoice(invoice._id, "email");
    } catch (e) {
      // Invoice exists in GHL; a human can send it from there if email delivery failed.
      console.error("sendInvoice failed", e);
      sent = false;
    }

    await setCustomFields(contactId, {
      gbp_invoice_id: invoice._id,
      gbp_invoice_number: invoice.invoiceNumber != null ? String(invoice.invoiceNumber) : "",
    });
    if (sent) await addTags(contactId, [TAGS.invoiced]);

    return NextResponse.json({ next: stepUrl("/done", contactId), invoiceSent: sent });
  } catch (e) {
    console.error("sign failed", e);
    const status = e instanceof GhlError ? 502 : 500;
    const ref = e instanceof GhlError ? `GHL ${e.status} on ${e.path}: ${e.body.slice(0, 200)}` : e instanceof Error ? e.message.slice(0, 200) : "unknown";
    return NextResponse.json({ error: `Couldn't finalise the agreement just now. Nothing has been charged. Try again in a moment. (Ref: ${ref})` }, { status });
  }
}
