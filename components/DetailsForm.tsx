"use client";
import { useState } from "react";
import { useSubmit } from "./useSubmit";
import { ROLES, validateDetails, type DetailsInput } from "@/lib/validate";

export function DetailsForm({ c, t, initial }: { c: string; t: string; initial: DetailsInput }) {
  const { submit, busy, errors, error } = useSubmit("/api/details");
  const [f, setF] = useState<DetailsInput>(initial);
  const set = (k: keyof DetailsInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const bad = (k: string) => (errors[k] ? "field bad" : "field");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validateDetails(f);
    await submit({ ...f, c, t }, v.ok ? undefined : v.errors);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="form-section">
        <h2>Legal entity</h2>
        <p className="lede">This is who the agreement is with. Check the ABN record at <a href="https://abr.business.gov.au" target="_blank" rel="noreferrer">abr.business.gov.au</a> if you&apos;re unsure.</p>
        <div className="grid">
          <div className={bad("registered_business_name") + " full"}>
            <label htmlFor="registered_business_name">Legal entity name <em>(the name on your ABN or ACN record)</em></label>
            <input id="registered_business_name" value={f.registered_business_name} onChange={set("registered_business_name")} required />
            {errors.registered_business_name && <span className="err">{errors.registered_business_name}</span>}
          </div>
          <div className={bad("abn")}>
            <label htmlFor="abn">ABN or ACN</label>
            <input id="abn" inputMode="numeric" placeholder="e.g. 12 345 678 901" value={f.abn} onChange={set("abn")} required />
            {errors.abn && <span className="err">{errors.abn}</span>}
          </div>
          <div className={bad("contact_role")}>
            <label htmlFor="contact_role">Your role</label>
            <select id="contact_role" value={f.contact_role} onChange={set("contact_role")} required>
              <option value="">Choose</option>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
            {errors.contact_role && <span className="err">{errors.contact_role}</span>}
          </div>
          <div className={bad("business_address") + " full"}>
            <label htmlFor="business_address">Business address</label>
            <input id="business_address" autoComplete="street-address" value={f.business_address} onChange={set("business_address")} required />
            {errors.business_address && <span className="err">{errors.business_address}</span>}
          </div>
          <div className={bad("website") + " full"}>
            <label htmlFor="website">Website <em>(optional)</em></label>
            <input id="website" type="url" inputMode="url" placeholder="https://" value={f.website} onChange={set("website")} />
            {errors.website && <span className="err">{errors.website}</span>}
          </div>
          <div className={bad("gbp_profile_url") + " full"}>
            <label htmlFor="gbp_profile_url">Link to your Google Business Profile <em>(optional, but saves us a day)</em></label>
            <input id="gbp_profile_url" type="url" inputMode="url" placeholder="e.g. https://g.page/your-business or a maps.app.goo.gl link" value={f.gbp_profile_url} onChange={set("gbp_profile_url")} />
            {errors.gbp_profile_url && <span className="err">{errors.gbp_profile_url}</span>}
            <span className="hint">Search your business name on Google, open the profile, click <b>Share</b> and copy the link. Or in business.google.com use <b>Share profile</b>.</span>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h2>Where you want more work</h2>
        <p className="lede">Optional now, but it goes straight into your agreement and saves a round-trip at onboarding.</p>
        <div className="grid">
          <div className="field full">
            <label htmlFor="suburbs">Suburbs you want more work in <em>(top 3 to 5)</em></label>
            <textarea id="suburbs" value={f.suburbs} onChange={set("suburbs")} placeholder="e.g. Toowoomba, Highfields, Drayton" />
          </div>
          <div className="field full">
            <label htmlFor="services">Services you want more of</label>
            <textarea id="services" value={f.services} onChange={set("services")} placeholder="e.g. lawn mowing, hedge trimming" />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn" type="submit" disabled={busy}>{busy ? "Preparing agreement…" : "Review the agreement"}</button>
        <a className="btn secondary" href="/start">Back</a>
        <span className="hint">Nothing is charged until you sign and pay the first invoice.</span>
      </div>
      {error && <div className="banner">{error}</div>}
    </form>
  );
}
