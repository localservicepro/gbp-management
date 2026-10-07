"use client";
import { useState } from "react";
import { useSubmit } from "./useSubmit";
import { validateLead } from "@/lib/validate";

export function LeadForm() {
  const { submit, busy, errors, error } = useSubmit("/api/lead");
  const [f, setF] = useState({ first_name: "", last_name: "", company_name: "", email: "", phone: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const bad = (k: string) => (errors[k] ? "field bad" : "field");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validateLead(f);
    await submit(f, v.ok ? undefined : v.errors);
  }

  return (
    <form className="grid" onSubmit={onSubmit} noValidate>
      <div className={bad("first_name")}><label htmlFor="first_name">First name</label><input id="first_name" autoComplete="given-name" value={f.first_name} onChange={set("first_name")} required />{errors.first_name && <span className="err">{errors.first_name}</span>}</div>
      <div className={bad("last_name")}><label htmlFor="last_name">Last name</label><input id="last_name" autoComplete="family-name" value={f.last_name} onChange={set("last_name")} required />{errors.last_name && <span className="err">{errors.last_name}</span>}</div>
      <div className={bad("company_name") + " full"}><label htmlFor="company_name">Business name <em>(as it shows on Google)</em></label><input id="company_name" autoComplete="organization" value={f.company_name} onChange={set("company_name")} required />{errors.company_name && <span className="err">{errors.company_name}</span>}</div>
      <div className={bad("email")}><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" value={f.email} onChange={set("email")} required />{errors.email && <span className="err">{errors.email}</span>}</div>
      <div className={bad("phone")}><label htmlFor="phone">Mobile</label><input id="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="04xx xxx xxx" value={f.phone} onChange={set("phone")} required />{errors.phone && <span className="err">{errors.phone}</span>}</div>
      <div className="field full actions">
        <button className="btn" type="submit" disabled={busy}>{busy ? "Saving…" : "Continue"}</button>
        <span className="hint">Takes about 2 minutes.</span>
      </div>
      {error && <div className="banner full">{error}</div>}
    </form>
  );
}
