import Link from "next/link";
import { FlowShell } from "@/components/FlowShell";
import { InvalidLink } from "@/components/InvalidLink";
import { ServiceError } from "@/components/ServiceError";
import { SignForm } from "@/components/SignForm";
import { AGREEMENT_CLAUSES, COMPANY, OFFER, SERVICE_SCOPE } from "@/lib/config";
import { getContact, readCustomFields } from "@/lib/ghl";
import { stepUrl, verifyContact } from "@/lib/token";
import { existsSync } from "node:fs";
import path from "node:path";

export const metadata = { title: "Sign your agreement · GBP Management by LSP" };
export const dynamic = "force-dynamic";

export default async function ContractPage({ searchParams }: { searchParams: Promise<{ c?: string; t?: string }> }) {
  const { c = "", t = "" } = await searchParams;
  if (!verifyContact(c, t)) return <InvalidLink />;

  let contact, cf;
  try {
    contact = await getContact(c);
    cf = await readCustomFields(contact);
  } catch (e) {
    console.error("contract page load failed", e);
    return <ServiceError detail="contract-load" />;
  }
  const s = (v: unknown) => (v == null ? "" : String(v));
  const contactName = contact.name || `${contact.firstName || ""} ${contact.lastName || ""}`.trim();

  if (!cf.registered_business_name || !cf.abn) {
    return (
      <FlowShell current={2} title="One step missing." intro="We need your business details before the agreement can be prepared.">
        <div className="form-actions" style={{ borderTop: 0, paddingTop: 0 }}>
          <Link className="btn" href={stepUrl("/details", c)}>Add business details</Link>
        </div>
      </FlowShell>
    );
  }

  const alreadySigned = s(cf.gbp_agreement_status) === "Signed";
  const suburbs = s(cf.gbp_priority_suburbs);
  const services = s(cf.gbp_priority_services);
  const role = s(cf.contact_role) || "Authorised representative";
  const providerSig = existsSync(path.join(process.cwd(), "public", COMPANY.signatureFile));
  const today = new Date().toLocaleDateString("en-AU", { timeZone: "Australia/Brisbane", day: "numeric", month: "long", year: "numeric" });

  return (
    <FlowShell current={2} wide title="Your agreement, ready to sign." intro="Pre-filled from your details. Read it through, then sign at the bottom of the document. A signed PDF copy is saved to your file and emailed with the invoice.">
      <article className="paper">
        <header className="letterhead">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/lsp-logo.png" alt="Local Service Pro" />
            <div className="doc-title" style={{ marginTop: 18 }}>Google Business Profile Management Agreement</div>
            <div className="doc-sub">Between {COMPANY.legalName} and {s(cf.registered_business_name)}</div>
          </div>
          <div className="meta">
            <div>{COMPANY.tradingName}</div>
            <div>ABN {COMPANY.abn}</div>
            <div>Prepared {today}</div>
          </div>
        </header>

        {alreadySigned && (
          <div className="signed-note">
            This agreement was signed on {s(cf.gbp_agreement_signed_at).slice(0, 10)}. Your invoice has been emailed; contact {COMPANY.email} if you need another copy.
          </div>
        )}

        <section>
          <h2>Parties</h2>
          <div className="two" style={{ marginTop: 12 }}>
            <div className="party">
              <div className="who">Provider</div>
              <b>{COMPANY.legalName}</b>
              <div>ABN {COMPANY.abn}</div>
              <div>{COMPANY.signatory.name}, {COMPANY.signatory.role}</div>
              <div>{COMPANY.email}</div>
              <div>{COMPANY.address}</div>
            </div>
            <div className="party">
              <div className="who">Client</div>
              <b>{s(cf.registered_business_name)}</b>
              <div>ABN {s(cf.abn)}</div>
              {contact.companyName && contact.companyName !== s(cf.registered_business_name) && <div>Trading as {contact.companyName}</div>}
              <div>{s(cf.business_address) || contact.address1}</div>
              {contact.website && <div>{contact.website}</div>}
            </div>
          </div>
          <dl className="kv">
            <dt>Authorised signatory</dt><dd>{contactName}, {role}</dd>
            <dt>Contact</dt><dd>{contact.email} · {contact.phone}</dd>
          </dl>
          {!alreadySigned && <p className="edit" style={{ marginTop: 10 }}>Something wrong? <Link href={stepUrl("/details", c)}>Edit business details</Link> and come back.</p>}
        </section>

        <section>
          <h2>Commercial terms</h2>
          <dl className="kv">
            <dt>Service</dt><dd>{OFFER.name} (monthly)</dd>
            <dt>Fee</dt><dd>${OFFER.priceMonthly}.00 per month, including GST</dd>
            <dt>Minimum term</dt><dd>{OFFER.minimumTermMonths} months from the start date (${OFFER.priceMonthly * OFFER.minimumTermMonths} inc GST in total)</dd>
            <dt>Billing</dt><dd>Monthly in advance. First invoice on signing; services start when it clears.</dd>
            <dt>After minimum term</dt><dd>Month to month, {OFFER.noticeDays} days&apos; written notice either way</dd>
            <dt>Not included</dt><dd>Website changes, paid advertising, photography (quoted separately)</dd>
          </dl>
        </section>

        <section>
          <h2>Scope of services</h2>
          {[SERVICE_SCOPE.month1, SERVICE_SCOPE.ongoing].map((phase) => (
            <div key={phase.title} className="phase">
              <h3>{phase.title}</h3>
              <p className="phase-note">{phase.note}</p>
              <ul className="scope">
                {phase.items.map((x) => <li key={x}>{x}</li>)}
              </ul>
            </div>
          ))}
          {(suburbs || services) && (
            <dl className="kv">
              {suburbs && (<><dt>Priority suburbs</dt><dd>{suburbs}</dd></>)}
              {services && (<><dt>Priority services</dt><dd>{services}</dd></>)}
            </dl>
          )}
        </section>

        <section>
          <h2>Terms and conditions</h2>
          <div className="clauses">
            {AGREEMENT_CLAUSES.map((cl) => (
              <div className="clause" key={cl.title}><b>{cl.title}</b><p>{cl.body}</p></div>
            ))}
          </div>
        </section>

        <section className="sign-block">
          <h2>Execution</h2>
          {alreadySigned ? (
            <div className="sig-line">
              <div className="sig-col">
                <div className="sig-box static">
                  {providerSig && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/${COMPANY.signatureFile}`} alt="" className="provider-sig" />
                  )}
                </div>
                <div className="slot"><b>{COMPANY.signatory.name}</b>{COMPANY.signatory.role}, {COMPANY.legalName}</div>
              </div>
              <div className="sig-col">
                <div className="sig-box static"><span className="sig-prompt">Signed electronically</span></div>
                <div className="slot"><b>{s(cf.gbp_agreement_signer).replace(/\s*\(GBP-[^)]*\)$/, "") || contactName}</b>{role}, {s(cf.registered_business_name)}</div>
              </div>
            </div>
          ) : (
            <SignForm c={c} t={t} defaultName={contactName} role={role} businessName={s(cf.registered_business_name)} providerSig={providerSig} />
          )}
        </section>

        <footer className="doc-foot">
          <span>{COMPANY.tradingName} · ABN {COMPANY.abn} · {COMPANY.email}</span>
          <span>Electronic signature binding under the Electronic Transactions Act 1999 (Cth)</span>
        </footer>
      </article>
    </FlowShell>
  );
}
