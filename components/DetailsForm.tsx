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
    <form className="grid" onSubmit={onSubmit} noValidate>
      <div className={bad("registered_business_name") + " full"}>
        <label htmlFor="registered_business_name">Legal entity name <em>(the name on your ABN record)</em></label>
        <input id="registered_business_name" value={f.registered_business_name} onChange={set("registered_business_name")} required />
        {errors.registered_business_name && <span className="err">{errors.registered_business_name}</span>}
        <span className="hint">Look it up at <a href="https://abr.business.gov.au" target="_blank" rel="noreferrer">abr.business.gov.au</a> if unsure.</span>
      </div>
      <div className={bad("abn")}>
        <label htmlFor="abn">ABN</label>
        <input id="abn" inputMode="numeric" placeholder="11 digits" value={f.abn} onChange={set("abn")} required />
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
      <div className="field full">
        <label htmlFor="suburbs">Suburbs you want more work in <em>(top 3 to 5)</em></label>
        <textarea id="suburbs" value={f.suburbs} onChange={set("suburbs")} />
      </div>
      <div className="field full">
        <label htmlFor="services">Services you want more of</label>
        <textarea id="services" value={f.services} onChange={set("services")} />
      </div>
      <div className="field full actions">
        <button className="btn" type="submit" disabled={busy}>{busy ? "Saving…" : "Review the agreement"}</button>
        <a className="btn secondary" href="/start">Back</a>
      </div>
      <p className="hint full">Next you&apos;ll see the GBP Management Agreement pre-filled with these details and sign it on screen. Nothing is charged until you sign and pay the first invoice.</p>
      {error && <div className="banner full">{error}</div>}
    </form>
  );
}
