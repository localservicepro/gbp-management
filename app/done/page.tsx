import { FlowShell } from "@/components/FlowShell";
import { InvalidLink } from "@/components/InvalidLink";
import { COMPANY, OFFER } from "@/lib/config";
import { getContact, readCustomFields } from "@/lib/ghl";
import { verifyContact } from "@/lib/token";

export const metadata = { title: "Agreement signed · GBP Management by LSP" };
export const dynamic = "force-dynamic";

export default async function DonePage({ searchParams }: { searchParams: Promise<{ c?: string; t?: string }> }) {
  const { c = "", t = "" } = await searchParams;
  if (!verifyContact(c, t)) return <InvalidLink />;

  let email = "your email";
  let pdfUrl = "";
  let invoiceNumber = "";
  try {
    const contact = await getContact(c);
    const cf = await readCustomFields(contact);
    email = contact.email || email;
    pdfUrl = cf.gbp_agreement_pdf_url ? String(cf.gbp_agreement_pdf_url) : "";
    invoiceNumber = cf.gbp_invoice_number ? String(cf.gbp_invoice_number) : "";
  } catch (e) {
    console.error("done page lookup failed", e);
  }

  return (
    <FlowShell current={3} title="Signed. Your invoice is on its way.">
      <div className="done-hero">
        <p style={{ fontSize: "1.1rem" }}>
          Your first invoice{invoiceNumber ? ` (#${invoiceNumber})` : ""} for ${OFFER.priceMonthly} inc GST has been emailed to <b>{email}</b>. Here&apos;s what happens next:
        </p>
        <ul className="checklist">
          <li><span>01</span><div><b>Pay the first month</b> from the link in the invoice email. Card or bank.</div></li>
          <li><span>02</span><div><b>Fill in the onboarding form</b> (the link arrives once payment clears) and grant LSP manager access to your profile.</div></li>
          <li><span>03</span><div><b>We rebuild the profile</b> in month one and send every change to you for approval before it goes live.</div></li>
        </ul>
        <div className="form-actions" style={{ borderTop: 0, paddingTop: 8 }}>
          {pdfUrl && <a className="btn secondary" href={pdfUrl} target="_blank" rel="noreferrer">Download signed agreement (PDF)</a>}
          <a className="btn secondary" href="/">Back to home</a>
        </div>
        <p className="muted">Nothing in your inbox after 10 minutes? Check spam, then email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.</p>
      </div>
    </FlowShell>
  );
}
