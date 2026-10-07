import Link from "next/link";
import { Footer, Steps, TopBar } from "@/components/Chrome";
import { InvalidLink } from "@/components/InvalidLink";
import { SignForm } from "@/components/SignForm";
import { AGREEMENT_CLAUSES, COMPANY, OFFER, SERVICE_SCOPE } from "@/lib/config";
import { getContact, readCustomFields } from "@/lib/ghl";
import { stepUrl, verifyContact } from "@/lib/token";

export const metadata = { title: "Sign your agreement · GBP Management by LSP" };
export const dynamic = "force-dynamic";

export default async function ContractPage({ searchParams }: { searchParams: Promise<{ c?: string; t?: string }> }) {
  const { c = "", t = "" } = await searchParams;
  if (!verifyContact(c, t)) return <InvalidLink />;

  const contact = await getContact(c);
  const cf = await readCustomFields(contact);
  const s = (v: unknown) => (v == null ? "" : String(v));
  const contactName = contact.name || `${contact.firstName || ""} ${contact.lastName || ""}`.trim();

  if (!cf.registered_business_name || !cf.abn) {
    return (
      <div className="wrap narrow">
        <TopBar />
        <section>
          <h2>One step missing.</h2>
          <p className="muted" style={{ marginTop: 12 }}>We need your business details before the agreement can be prepared.</p>
          <div className="actions"><Link className="btn" href={stepUrl("/details", c)}>Add business details</Link></div>
        </section>
        <Footer />
      </div>
    );
  }

  const alreadySigned = s(cf.gbp_agreement_status) === "Signed";
  const suburbs = s(cf.gbp_priority_suburbs);
  const services = s(cf.gbp_priority_services);

  return (
    <div className="wrap narrow">
      <TopBar />
      <section>
        <div className="eyebrow">Agreement</div>
        <h2>GBP Management Agreement.</h2>
        <p className="muted">Pre-filled from your details. Read it through, then sign at the bottom.</p>

        <div className="agreement">
          <Steps current={2} />

          {alreadySigned && (
            <div className="banner">
              This agreement was already signed on {s(cf.gbp_agreement_signed_at).slice(0, 10)}. Check your email for the invoice, or contact {COMPANY.email}.
            </div>
          )}

          <div>
            <h3>Parties</h3>
            <dl className="kv" style={{ marginTop: 10 }}>
              <dt>Provider</dt><dd>{COMPANY.legalName} (ABN {COMPANY.abn})</dd>
              <dt>Client</dt><dd>{s(cf.registered_business_name)} (ABN {s(cf.abn)})</dd>
              <dt>Trading as</dt><dd>{contact.companyName || s(cf.registered_business_name)}</dd>
              <dt>Address</dt><dd>{s(cf.business_address) || contact.address1 || "-"}</dd>
              {contact.website && (<><dt>Website</dt><dd>{contact.website}</dd></>)}
              <dt>Signatory</dt><dd>{contactName}, {s(cf.contact_role) || "Authorised representative"}</dd>
              <dt>Contact</dt><dd>{contact.email} · {contact.phone}</dd>
            </dl>
            <p className="hint" style={{ marginTop: 10 }}>Something wrong? <Link href={stepUrl("/details", c)}>Edit business details</Link>.</p>
          </div>

          <div>
            <h3>Commercial terms</h3>
            <dl className="kv" style={{ marginTop: 10 }}>
              <dt>Service</dt><dd>{OFFER.name} (monthly)</dd>
              <dt>Fee</dt><dd>${OFFER.priceMonthly}.00 per month inc GST</dd>
              <dt>Minimum term</dt><dd>{OFFER.minimumTermMonths} months from the start date (${OFFER.priceMonthly * OFFER.minimumTermMonths} inc GST total)</dd>
              <dt>Billing</dt><dd>Monthly in advance. First payment on signing; services start when it clears.</dd>
              <dt>After minimum term</dt><dd>Month to month, {OFFER.noticeDays} days&apos; written notice either way.</dd>
              <dt>Not included</dt><dd>Website changes, paid advertising, photography (quoted separately).</dd>
            </dl>
          </div>

          <div>
            <h3>Scope of services</h3>
            <ul style={{ marginTop: 10 }}>
              {SERVICE_SCOPE.map((x) => <li key={x}>{x}</li>)}
            </ul>
            {(suburbs || services) && (
              <dl className="kv" style={{ marginTop: 14 }}>
                {suburbs && (<><dt>Priority suburbs</dt><dd>{suburbs}</dd></>)}
                {services && (<><dt>Priority services</dt><dd>{services}</dd></>)}
              </dl>
            )}
          </div>

          <div>
            <h3>Terms and conditions</h3>
            <div className="clauses" style={{ marginTop: 10 }}>
              {AGREEMENT_CLAUSES.map((cl) => (
                <div key={cl.title}><b>{cl.title}</b><p>{cl.body}</p></div>
              ))}
            </div>
          </div>

          {!alreadySigned && <SignForm c={c} t={t} defaultName={contactName} />}
        </div>
      </section>
      <Footer />
    </div>
  );
}
