// ClickUp: one task per signed client in Operations > New Project > GBP Optimisation.
// Custom fields are matched by name at runtime so nothing breaks if the list is reshuffled.

const BASE = process.env.CLICKUP_BASE_URL || "https://api.clickup.com/api/v2";
export const DEFAULT_LIST_ID = "1300390000006185"; // Operations > New Project > GBP Optimisation

export function clickupEnv() {
  const token = process.env.CLICKUP_API_TOKEN;
  const listId = process.env.CLICKUP_LIST_ID || DEFAULT_LIST_ID;
  return { token, listId, enabled: !!token };
}

export class ClickUpError extends Error {
  constructor(public status: number, public path: string, public body: string) {
    super(`ClickUp ${status} on ${path}: ${body.slice(0, 300)}`);
  }
}

async function cu<T = unknown>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const { token } = clickupEnv();
  if (!token) throw new Error("CLICKUP_API_TOKEN is not set");
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: token, "Content-Type": "application/json", Accept: "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new ClickUpError(res.status, path, text);
  return (text ? JSON.parse(text) : {}) as T;
}

type CuField = { id: string; name: string; type: string };

let fieldCache: { at: number; listId: string; fields: CuField[] } | null = null;

async function listFields(listId: string): Promise<CuField[]> {
  if (fieldCache && fieldCache.listId === listId && Date.now() - fieldCache.at < 5 * 60_000) return fieldCache.fields;
  const r = await cu<{ fields: CuField[] }>("GET", `/list/${listId}/field`);
  fieldCache = { at: Date.now(), listId, fields: r.fields || [] };
  return fieldCache.fields;
}

export type SignupTaskInput = {
  businessName: string; // trading name as on Google
  legalName: string;
  businessNumber: string; // "ABN …" / "ACN …"
  contactName: string;
  role: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  suburbs?: string;
  services?: string;
  agreementId: string;
  signedAtISO: string;
  pdfUrl?: string;
  ghlContactUrl?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  invoiceScheduleId?: string;
  monthlyFee: number;
};

/** Creates the task and returns its id and URL. Throws on API failure; caller decides whether that's fatal. */
export async function createSignupTask(t: SignupTaskInput): Promise<{ id: string; url: string }> {
  const { listId } = clickupEnv();

  // Map by field name; anything missing on the list is skipped rather than failing the task.
  const fields = await listFields(listId);
  const byName = new Map(fields.map((f) => [f.name.trim().toLowerCase(), f]));
  const custom: { id: string; value: unknown }[] = [];
  const put = (name: string, value: unknown) => {
    const f = byName.get(name.toLowerCase());
    if (f && value !== undefined && value !== null && value !== "") custom.push({ id: f.id, value });
  };
  put("Business Name", t.businessName);
  put("Client Name", t.contactName);
  put("Email", t.email);
  put("Phone", t.phone);
  put("Website", t.website);
  put("Subscription", t.monthlyFee);

  const signedLocal = new Date(t.signedAtISO).toLocaleString("en-AU", { timeZone: "Australia/Brisbane", dateStyle: "medium", timeStyle: "short" });
  const line = (k: string, v?: string) => (v ? `- **${k}:** ${v}\n` : "");
  const description =
    `## New GBP Management client\n\n` +
    `Signed up online on ${signedLocal}. Agreement **${t.agreementId}**.\n\n` +
    `### Business\n` +
    line("Trading name", t.businessName) +
    line("Legal entity", `${t.legalName} (${t.businessNumber})`) +
    line("Address", t.address) +
    line("Website", t.website) +
    `\n### Contact\n` +
    line("Name", `${t.contactName}, ${t.role}`) +
    line("Email", t.email) +
    line("Mobile", t.phone) +
    `\n### Priorities (from sign-up)\n` +
    line("Suburbs", t.suburbs || "(not supplied)") +
    line("Services", t.services || "(not supplied)") +
    `\n### Links\n` +
    line("Signed agreement (PDF)", t.pdfUrl) +
    line("GHL contact", t.ghlContactUrl) +
    line("First invoice", t.invoiceNumber ? (t.invoiceUrl ? `[#${t.invoiceNumber}](${t.invoiceUrl})` : `#${t.invoiceNumber}`) : undefined) +
    line("Recurring invoice schedule", t.invoiceScheduleId) +
    `\n### Next steps\n` +
    `- [ ] Confirm first invoice paid\n` +
    `- [ ] Accept Manager invite on the Google Business Profile\n` +
    `- [ ] Month 1: profile rebuild (categories, service area, services, description, hours)\n` +
    `- [ ] Send changes to client for approval\n` +
    `- [ ] Month 2: start 8 posts/month\n`;

  const r = await cu<{ id: string; url: string }>("POST", `/list/${listId}/task`, {
    name: `GBP Optimisation - ${t.businessName}`,
    markdown_description: description,
    status: "to do",
    priority: 2, // high: a paid client is waiting
    tags: ["gbp-management"],
    custom_fields: custom,
    notify_all: true,
  });
  return { id: r.id, url: r.url };
}

/** Lightweight probe for /api/health. */
export async function probeList(): Promise<void> {
  const { listId } = clickupEnv();
  await cu("GET", `/list/${listId}`);
}
