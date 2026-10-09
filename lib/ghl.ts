// Thin GoHighLevel (LeadConnector) API v2 client. Auth is a Private
// Integration Token scoped to one sub-account (location).
import { CUSTOM_FIELDS, type CustomFieldKey } from "./config";

const BASE = process.env.GHL_BASE_URL || "https://services.leadconnectorhq.com";
const VERSION = "2021-07-28";

export function ghlEnv() {
  const token = process.env.GHL_PIT_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!token || !locationId) throw new Error("App not configured: set GHL_PIT_TOKEN and GHL_LOCATION_ID in the Vercel project environment variables and redeploy");
  return { token, locationId, userId: process.env.GHL_USER_ID || "" };
}

export class GhlError extends Error {
  constructor(public status: number, public path: string, public body: string) {
    super(`LSP system ${status} on ${path}: ${body.slice(0, 300)}`);
  }
}

export async function ghl<T = unknown>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  opts: { form?: FormData } = {},
): Promise<T> {
  const { token } = ghlEnv();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Version: VERSION,
    Accept: "application/json",
  };
  let payload: BodyInit | undefined;
  if (opts.form) payload = opts.form;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload, cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new GhlError(res.status, path, text);
  return (text ? JSON.parse(text) : {}) as T;
}

// ---------- Contacts ----------

export type GhlContact = {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  website?: string;
  address1?: string;
  tags?: string[];
  customFields?: { id: string; value: unknown }[];
};

export async function upsertContact(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  tags?: string[];
  source?: string;
}): Promise<{ contact: GhlContact; isNew: boolean }> {
  const { locationId } = ghlEnv();
  const r = await ghl<{ contact: GhlContact; new: boolean }>("POST", "/contacts/upsert", {
    locationId,
    firstName: input.firstName,
    lastName: input.lastName,
    name: `${input.firstName} ${input.lastName}`.trim(),
    email: input.email,
    phone: input.phone,
    companyName: input.companyName,
    source: input.source || "GBP sales page",
    country: "AU",
  });
  // Upsert overwrites tags, so add them separately to keep anything already on the contact.
  if (input.tags?.length) await addTags(r.contact.id, input.tags);
  return { contact: r.contact, isNew: r.new };
}

export async function getContact(id: string): Promise<GhlContact> {
  const r = await ghl<{ contact: GhlContact }>("GET", `/contacts/${encodeURIComponent(id)}`);
  return r.contact;
}

export async function updateContact(id: string, body: Record<string, unknown>): Promise<GhlContact> {
  const r = await ghl<{ contact: GhlContact }>("PUT", `/contacts/${encodeURIComponent(id)}`, body);
  return r.contact;
}

export async function addTags(id: string, tags: string[]) {
  await ghl("POST", `/contacts/${encodeURIComponent(id)}/tags`, { tags });
}

export async function removeTags(id: string, tags: string[]) {
  await ghl("DELETE", `/contacts/${encodeURIComponent(id)}/tags`, { tags });
}

// ---------- Custom fields (auto-created when missing) ----------

type GhlCustomField = { id: string; name: string; fieldKey: string; dataType: string; model?: string };

let fieldCache: { at: number; byKey: Map<string, GhlCustomField> } | null = null;

async function loadFields(force = false): Promise<Map<string, GhlCustomField>> {
  if (!force && fieldCache && Date.now() - fieldCache.at < 5 * 60_000) return fieldCache.byKey;
  const { locationId } = ghlEnv();
  const r = await ghl<{ customFields: GhlCustomField[] }>("GET", `/locations/${locationId}/customFields?model=contact`);
  const byKey = new Map<string, GhlCustomField>();
  for (const f of r.customFields || []) {
    const key = (f.fieldKey || "").replace(/^contact\./, "");
    byKey.set(key, f);
    // Also index by a slug of the display name so a field someone made by hand in GHL
    // ("Registered Business Name") is picked up instead of duplicated.
    byKey.set(slug(f.name), f);
  }
  fieldCache = { at: Date.now(), byKey };
  return byKey;
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

/** Returns the GHL field id for each of our keys, creating any that don't exist. */
export async function ensureCustomFields(keys: CustomFieldKey[]): Promise<Record<CustomFieldKey, GhlCustomField>> {
  let fields = await loadFields();
  const out = {} as Record<CustomFieldKey, GhlCustomField>;
  for (const key of keys) {
    const def = CUSTOM_FIELDS[key];
    let f = fields.get(key) || fields.get(slug(def.name));
    if (!f) {
      const { locationId } = ghlEnv();
      const body: Record<string, unknown> = { name: def.name, dataType: def.dataType, model: "contact" };
      if (def.dataType === "FILE_UPLOAD") {
        body.acceptedFormat = [".pdf"];
        body.isMultipleFile = false;
        body.maxNumberOfFiles = 1;
      }
      try {
        const r = await ghl<{ customField: GhlCustomField }>("POST", `/locations/${locationId}/customFields`, body);
        f = r.customField;
      } catch (e) {
        // Someone else may have created it between our list and our create: reload and retry the lookup.
        fields = await loadFields(true);
        f = fields.get(key) || fields.get(slug(def.name));
        if (!f) throw e;
      }
      fields = await loadFields(true);
    }
    out[key] = f;
  }
  return out;
}

/** Writes custom field values (by our keys) onto a contact. */
export async function setCustomFields(contactId: string, values: Partial<Record<CustomFieldKey, unknown>>) {
  const keys = Object.keys(values) as CustomFieldKey[];
  if (!keys.length) return;
  const fields = await ensureCustomFields(keys);
  const customFields = keys.map((k) => ({ id: fields[k].id, field_value: values[k] }));
  await updateContact(contactId, { customFields });
}

export async function readCustomFields(contact: GhlContact): Promise<Partial<Record<CustomFieldKey, unknown>>> {
  const fields = await loadFields();
  const idToKey = new Map<string, CustomFieldKey>();
  for (const key of Object.keys(CUSTOM_FIELDS) as CustomFieldKey[]) {
    const f = fields.get(key) || fields.get(slug(CUSTOM_FIELDS[key].name));
    if (f) idToKey.set(f.id, key);
  }
  const out: Partial<Record<CustomFieldKey, unknown>> = {};
  for (const cf of contact.customFields || []) {
    const key = idToKey.get(cf.id);
    if (key) out[key] = cf.value;
  }
  return out;
}

/**
 * Uploads a file into a FILE_UPLOAD custom field and returns the hosted URL.
 * GHL: POST /locations/{locationId}/customFields/upload (multipart: id, maxFiles, <fieldId>=file)
 */
export async function uploadToFileField(fieldId: string, filename: string, bytes: Uint8Array, mime = "application/pdf"): Promise<{ url: string; map: Record<string, string> }> {
  const { locationId } = ghlEnv();
  const form = new FormData();
  form.append("id", fieldId);
  form.append("maxFiles", "1");
  form.append(fieldId, new Blob([bytes as BlobPart], { type: mime }), filename);
  const r = await ghl<{ uploadedFiles?: Record<string, string>; meta?: { url?: string }[] }>(
    "POST",
    `/locations/${locationId}/customFields/upload`,
    undefined,
    { form },
  );
  const map = r.uploadedFiles || {};
  const url = Object.values(map)[0] || r.meta?.[0]?.url || "";
  if (!url) throw new Error("LSP system file upload returned no URL");
  return { url, map };
}

// ---------- Invoices ----------

export async function resolveUserId(): Promise<string> {
  const { userId, locationId } = ghlEnv();
  if (userId) return userId;
  const r = await ghl<{ users: { id: string }[] }>("GET", `/users/?locationId=${locationId}`);
  const id = r.users?.[0]?.id;
  if (!id) throw new Error("No GHL user found for the location; set GHL_USER_ID");
  return id;
}

/**
 * Public "view & pay" page for an invoice: <invoice domain>/invoice/<id>.
 * Override with GHL_INVOICE_BASE_URL if the domain ever changes.
 */
export function ghlAppBase(): string {
  return (process.env.GHL_APP_BASE_URL || "https://login.localservicepro.com.au").replace(/\/+$/, "");
}

export function invoicePublicUrl(invoiceId: string): string {
  // Invoices are served from the brand domain, not the login domain.
  const base = (process.env.GHL_INVOICE_BASE_URL || "https://brand.localservicepro.com.au").replace(/\/+$/, "");
  return `${base}/invoice/${encodeURIComponent(invoiceId)}`;
}

/** Deep link to a contact in the (white-labelled) GHL app, for the ops team. */
export function contactAppUrl(contactId: string): string {
  const { locationId } = ghlEnv();
  return `${ghlAppBase()}/v2/location/${locationId}/contacts/detail/${encodeURIComponent(contactId)}`;
}

export async function createInvoice(body: Record<string, unknown>): Promise<{ _id: string; invoiceNumber?: string | number; total?: number }> {
  return ghl("POST", "/invoices/", body);
}

/** Recurring invoice: create the schedule, then start it (GHL emails the first invoice on the start date). */
export async function createInvoiceSchedule(body: Record<string, unknown>): Promise<{ _id: string; invoices?: { _id: string; invoiceNumber?: string | number }[] }> {
  return ghl("POST", "/invoices/schedule", body);
}

export async function startInvoiceSchedule(scheduleId: string): Promise<{ _id: string; invoices?: { _id: string; invoiceNumber?: string | number }[] }> {
  const { locationId } = ghlEnv();
  return ghl("POST", `/invoices/schedule/${encodeURIComponent(scheduleId)}/schedule`, { altId: locationId, altType: "location", liveMode: true });
}

export async function sendInvoice(invoiceId: string, action: "email" | "sms_and_email" | "sms" = "email") {
  const { locationId } = ghlEnv();
  const userId = await resolveUserId();
  return ghl<{ invoice?: unknown; emailData?: unknown }>("POST", `/invoices/${encodeURIComponent(invoiceId)}/send`, {
    altId: locationId,
    altType: "location",
    userId,
    action,
    liveMode: true,
  });
}
