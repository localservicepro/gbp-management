// Step 3: e-signature -> PDF -> GHL file custom field -> invoice created and sent.
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { COMPANY, OFFER, TAGS } from "@/lib/config";
import {
  addTags,
  createInvoice,
  createInvoiceSchedule,
  ensureCustomFields,
  getContact,
  GhlError,
  contactAppUrl,
  invoicePublicUrl,
  ghlEnv,
  readCustomFields,
  removeTags,
  sendInvoice,
  setCustomFields,
  startInvoiceSchedule,
  uploadToFileField,
} from "@/lib/ghl";
import { clickupEnv, createSignupTask } from "@/lib/clickup";
import { renderAgreementPdf } from "@/lib/pdf";
import { labelBusinessNumber } from "@/lib/validate";
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

    if (str(cf.gbp_agreement_status) === "Signed" && (cf.gbp_invoice_schedule_id || cf.gbp_invoice_id)) {
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

    let providerSig: Uint8Array | undefined;
    try {
      providerSig = new Uint8Array(await readFile(path.join(process.cwd(), "public", COMPANY.signatureFile)));
    } catch {
      providerSig = undefined;
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
      providerSig,
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
    await addTags(contactId, [TAGS.signed, TAGS.client]);
    try {
      await removeTags(contactId, [TAGS.lead]); // they're a client now, not a lead
    } catch (e) {
      console.error("removing lead tag failed", e);
    }

    // 2. Recurring monthly invoice, like a subscription: first invoice today, then the same
    //    day each month, each due on its issue date. Email only; GHL never texts from this.
    const { locationId } = ghlEnv();
    const today = signedAtISO.slice(0, 10);
    const dayOfMonth = Math.min(new Date(signedAtISO).getUTCDate(), 28); // keep a stable billing day in short months
    const appUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
    const businessDetails = {
      name: COMPANY.legalName,
      website: COMPANY.website,
      ...(appUrl ? { logoUrl: `${appUrl}/lsp-logo.png` } : {}),
    };
    const contactDetails = {
      id: contactId,
      name: contactName,
      email: contact.email || "",
      phoneNo: contact.phone || "",
      companyName: str(cf.registered_business_name),
      address: { addressLine1: str(cf.business_address), countryCode: "AU" },
    };
    const items = [
      {
        name: `${OFFER.name} - monthly fee`,
        description: `Google Business Profile management. Agreement ${agreementId}. ${OFFER.minimumTermMonths}-month minimum term, then month to month. Includes GST.`,
        currency: OFFER.currency,
        amount: OFFER.priceMonthly,
        qty: 1,
        type: "recurring",
        taxInclusive: true,
      },
    ];
    const termsNotes = `<p>${COMPANY.legalName} · ABN ${COMPANY.abn}</p><p>Your ${OFFER.name} agreement (${agreementId}) is billed monthly on the ${ordinal(dayOfMonth)}. Once the first payment clears, the onboarding form link follows by email. Questions: ${COMPANY.email}</p>`;

    let scheduleId = "";
    let invoiceId = "";
    let invoiceNumber = "";
    let sent = false;
    try {
      const schedule = await createInvoiceSchedule({
        altId: locationId,
        altType: "location",
        name: `${OFFER.name} - ${str(cf.registered_business_name)}`,
        title: "TAX INVOICE",
        currency: OFFER.currency,
        businessDetails,
        contactDetails,
        items,
        discount: { type: "percentage", value: 0 },
        termsNotes,
        liveMode: true,
        schedule: {
          rrule: {
            intervalType: "monthly",
            interval: 1,
            startDate: today,
            dayOfMonth,
            endType: "never",
          },
        },
      });
      scheduleId = schedule._id;
      const started = await startInvoiceSchedule(scheduleId);
      const first = started.invoices?.[0] || schedule.invoices?.[0];
      if (first) {
        invoiceId = first._id;
        invoiceNumber = first.invoiceNumber != null ? String(first.invoiceNumber) : "";
      }
      sent = true;
    } catch (e) {
      // Fall back to a one-off invoice for month 1 so the client is never left without a bill;
      // the recurring schedule can be set up by hand in GHL. Usually a missing invoices/schedule.write scope.
      console.error("recurring invoice schedule failed, falling back to one-off invoice", e);
      const invoice = await createInvoice({
        altId: locationId,
        altType: "location",
        name: `${OFFER.name} - Month 1 - ${str(cf.registered_business_name)}`,
        title: "TAX INVOICE",
        currency: OFFER.currency,
        businessDetails,
        contactDetails,
        items: items.map((i) => ({ ...i, type: "one_time" })),
        discount: { type: "percentage", value: 0 },
        issueDate: today,
        dueDate: today,
        sentTo: { email: [contact.email || ""] },
        liveMode: true,
        termsNotes,
      });
      invoiceId = invoice._id;
      invoiceNumber = invoice.invoiceNumber != null ? String(invoice.invoiceNumber) : "";
      try {
        await sendInvoice(invoiceId, "email");
        sent = true;
      } catch (e2) {
        console.error("sendInvoice failed", e2);
      }
    }

    await setCustomFields(contactId, {
      ...(scheduleId ? { gbp_invoice_schedule_id: scheduleId } : {}),
      gbp_invoice_id: invoiceId,
      gbp_invoice_number: invoiceNumber,
      ...(invoiceId ? { gbp_invoice_url: invoicePublicUrl(invoiceId) } : {}),
    });
    if (sent) await addTags(contactId, [TAGS.invoiced]);

    // 3. ClickUp task for the ops team (Operations > New Project > GBP Optimisation).
    //    Best effort: a ClickUp outage must not block a client who has already signed and been invoiced.
    if (clickupEnv().enabled) {
      try {
        const task = await createSignupTask({
          businessName: contact.companyName || str(cf.registered_business_name),
          legalName: str(cf.registered_business_name),
          businessNumber: labelBusinessNumber(str(cf.abn)),
          contactName,
          role: str(cf.contact_role) || "Authorised representative",
          email: contact.email || "",
          phone: contact.phone || "",
          address: str(cf.business_address) || contact.address1 || "",
          website: contact.website || undefined,
          suburbs: str(cf.gbp_priority_suburbs) || undefined,
          services: str(cf.gbp_priority_services) || undefined,
          agreementId,
          signedAtISO,
          pdfUrl: pdfUrl || undefined,
          ghlContactUrl: contactAppUrl(contactId),
          invoiceNumber: invoiceNumber || undefined,
          invoiceUrl: invoiceId ? invoicePublicUrl(invoiceId) : undefined,
          invoiceScheduleId: scheduleId || undefined,
          monthlyFee: OFFER.priceMonthly,
        });
        await setCustomFields(contactId, { gbp_clickup_task_url: task.url });
      } catch (e) {
        console.error("ClickUp task creation failed", e);
      }
    }

    return NextResponse.json({ next: stepUrl("/done", contactId), invoiceSent: sent });
  } catch (e) {
    console.error("sign failed", e);
    const status = e instanceof GhlError ? 502 : 500;
    const ref = e instanceof GhlError ? `GHL ${e.status} on ${e.path}: ${e.body.slice(0, 200)}` : e instanceof Error ? e.message.slice(0, 200) : "unknown";
    return NextResponse.json({ error: `Couldn't finalise the agreement just now. Nothing has been charged. Try again in a moment. (Ref: ${ref})` }, { status });
  }
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
