// Step 1: simple form -> upsert the GHL contact, hand back a signed link to step 2.
import { NextResponse } from "next/server";
import { TAGS } from "@/lib/config";
import { upsertContact, GhlError } from "@/lib/ghl";
import { stepUrl } from "@/lib/token";
import { e164, validateLead } from "@/lib/validate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const v = validateLead(body);
  if (!v.ok) return NextResponse.json({ errors: v.errors }, { status: 422 });

  try {
    const { contact } = await upsertContact({
      firstName: v.data.first_name,
      lastName: v.data.last_name,
      email: v.data.email,
      phone: e164(v.data.phone),
      companyName: v.data.company_name,
      tags: [TAGS.lead],
    });
    return NextResponse.json({ next: stepUrl("/details", contact.id) });
  } catch (e) {
    console.error("lead upsert failed", e);
    const status = e instanceof GhlError ? 502 : 500;
    return NextResponse.json({ error: "Couldn't save your details just now." }, { status });
  }
}
