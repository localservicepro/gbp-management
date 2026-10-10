// Shared validators: the browser uses them for inline errors, the API uses
// them again so a hand-crafted POST can't skip them.

export function validABN(v: string): boolean {
  const d = (v || "").replace(/\D/g, "");
  if (d.length !== 11) return false;
  const w = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  let s = 0;
  for (let i = 0; i < 11; i++) s += (i === 0 ? +d[i] - 1 : +d[i]) * w[i];
  return s % 89 === 0;
}

export function validMobile(v: string): boolean {
  const d = (v || "").replace(/\D/g, "");
  return /^(04\d{8}|614\d{8})$/.test(d);
}

export function validEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
}

/** 04xx xxx xxx -> +614xxxxxxxx */
export function e164(v: string): string {
  const d = (v || "").replace(/\D/g, "");
  if (d.startsWith("0")) return "+61" + d.slice(1);
  if (d.startsWith("61")) return "+" + d;
  return "+" + d;
}

/** ACN: 9 digits, weighted 8..1 over the first eight, check digit = (10 - sum mod 10) mod 10. */
export function validACN(v: string): boolean {
  const d = (v || "").replace(/\D/g, "");
  if (d.length !== 9) return false;
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += +d[i] * (8 - i);
  return (10 - (sum % 10)) % 10 === +d[8];
}

/** Accepts an ABN (11 digits) or ACN (9 digits), with or without spaces/dashes. */
export function validBusinessNumber(v: string): "ABN" | "ACN" | null {
  const d = (v || "").replace(/\D/g, "");
  if (d.length === 11 && validABN(d)) return "ABN";
  if (d.length === 9 && validACN(d)) return "ACN";
  return null;
}

/** "ABN 12 345 678 901" or "ACN 123 456 789"; already-labelled values pass through. */
export function formatBusinessNumber(v: string): string {
  const raw = (v || "").trim();
  if (/^(ABN|ACN)\s/i.test(raw)) return raw.toUpperCase().replace(/\s+/g, " ");
  const d = raw.replace(/\D/g, "");
  if (d.length === 11) return "ABN " + d.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4");
  if (d.length === 9) return "ACN " + d.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3");
  return raw;
}

/** For display: a stored value that has no label is a legacy ABN. */
export function labelBusinessNumber(v: string): string {
  const raw = (v || "").trim();
  if (!raw) return "";
  return /^(ABN|ACN)\b/i.test(raw) ? raw : `ABN ${raw}`;
}

// kept for callers that only want the digits grouped
export function formatABN(v: string): string {
  const d = (v || "").replace(/\D/g, "");
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4");
}

export type LeadInput = {
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  phone: string;
};

export function validateLead(b: Partial<LeadInput>): { ok: true; data: LeadInput } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const data = {
    first_name: (b.first_name || "").trim(),
    last_name: (b.last_name || "").trim(),
    company_name: (b.company_name || "").trim(),
    email: (b.email || "").trim().toLowerCase(),
    phone: (b.phone || "").trim(),
  };
  if (!data.first_name) errors.first_name = "Enter your first name.";
  if (!data.last_name) errors.last_name = "Enter your last name.";
  if (!data.company_name) errors.company_name = "Enter your business name.";
  if (!validEmail(data.email)) errors.email = "Enter a valid email address.";
  if (!validMobile(data.phone)) errors.phone = "Enter an Australian mobile number.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data };
}

export type DetailsInput = {
  registered_business_name: string;
  abn: string;
  contact_role: string;
  business_address: string;
  website: string;
  gbp_profile_url: string;
  suburbs: string;
  services: string;
};

export const ROLES = ["Owner", "Director", "Partner", "Manager", "Other"];

export function validateDetails(b: Partial<DetailsInput>): { ok: true; data: DetailsInput } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const data = {
    registered_business_name: (b.registered_business_name || "").trim(),
    abn: (b.abn || "").replace(/\D/g, ""),
    contact_role: (b.contact_role || "").trim(),
    business_address: (b.business_address || "").trim(),
    website: (b.website || "").trim(),
    gbp_profile_url: (b.gbp_profile_url || "").trim(),
    suburbs: (b.suburbs || "").trim(),
    services: (b.services || "").trim(),
  };
  if (!data.registered_business_name) errors.registered_business_name = "Enter the legal entity name.";
  if (!validBusinessNumber(data.abn)) {
    const n = data.abn.length;
    errors.abn = n === 11 || n === 9
      ? `That ${n === 11 ? "ABN" : "ACN"} doesn't check out. Double-check the digits against abr.business.gov.au.`
      : "Enter your 11-digit ABN or 9-digit ACN. Spaces are fine.";
  }
  if (!ROLES.includes(data.contact_role)) errors.contact_role = "Choose your role.";
  if (!data.business_address) errors.business_address = "Enter the business address.";
  if (data.website && !/^https?:\/\/\S+$/i.test(data.website)) {
    if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(data.website)) data.website = "https://" + data.website;
    else errors.website = "Enter a full website address or leave it blank.";
  }
  if (data.gbp_profile_url && !/^https?:\/\/\S+$/i.test(data.gbp_profile_url)) {
    // g.page/xyz, maps.app.goo.gl/abc, google.com/maps/... pasted without a scheme
    if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(data.gbp_profile_url)) data.gbp_profile_url = "https://" + data.gbp_profile_url;
    else errors.gbp_profile_url = "Paste the link to your Google Business Profile, or leave it blank.";
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data };
}
