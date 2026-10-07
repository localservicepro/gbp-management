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
          <li><span>01</span><div><b>Pay the first invoice</b> from the link in the email.</div></li>
          <li><span>02</span><div><b>Add us as Managers on your Google Business Profile</b> using the steps below. This is the only access we need.</div></li>
          <li><span>03</span><div><b>Month one: we rebuild the profile</b> and send every change to you for approval before it goes live. Posting starts in month two.</div></li>
        </ul>

        <div className="howto">
          <div className="eyebrow">Add us to your Google Business Profile</div>
          <p className="muted" style={{ marginTop: 6 }}>Takes about two minutes. You stay the Owner; we&apos;re added as Managers and you can remove us any time.</p>
          <ol className="howto-steps">
            <li>On a computer, open <a href="https://business.google.com/" target="_blank" rel="noreferrer">business.google.com</a> and sign in with the Google account that owns your profile. (Or search your business name on Google while signed in and click <b>Edit profile</b>.)</li>
            <li>Open your profile&apos;s menu (the three dots) and choose <b>Business Profile settings</b>.</li>
            <li>Click <b>People and access</b>, then <b>Add</b>.</li>
            <li>Enter the first email below, set the role to <b>Manager</b>, and click <b>Invite</b>. Repeat for the second email.</li>
          </ol>
          <div className="emails">
            {COMPANY.gbpManagerEmails.map((e) => (
              <code key={e}>{e}</code>
            ))}
          </div>
          <p className="muted">We accept the invites the same business day and email you when we&apos;ve started. Stuck? Reply to the invoice email or write to <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> and we&apos;ll walk you through it on a call.</p>
        </div>
        <div className="form-actions" style={{ borderTop: 0, paddingTop: 8 }}>
          {pdfUrl && <a className="btn secondary" href={pdfUrl} target="_blank" rel="noreferrer">Download signed agreement (PDF)</a>}
          <a className="btn secondary" href="/">Back to home</a>
        </div>
        <p className="muted">Nothing in your inbox after 10 minutes? Check spam, then email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.</p>
      </div>
    </FlowShell>
  );
}
