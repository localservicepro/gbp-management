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
    suburbs: (b.suburbs || "").trim(),
    services: (b.services || "").trim(),
  };
  if (!data.registered_business_name) errors.registered_business_name = "Enter the legal entity name.";
  if (!validABN(data.abn)) errors.abn = "That ABN doesn't check out. It should be 11 digits.";
  if (!ROLES.includes(data.contact_role)) errors.contact_role = "Choose your role.";
  if (!data.business_address) errors.business_address = "Enter the business address.";
  if (data.website && !/^https?:\/\/\S+$/i.test(data.website)) {
    if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(data.website)) data.website = "https://" + data.website;
    else errors.website = "Enter a full website address or leave it blank.";
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data };
}
