// Step 2: contract data -> custom fields on the GHL contact, then on to the agreement.
import { NextResponse } from "next/server";
import { TAGS } from "@/lib/config";
import { addTags, GhlError, setCustomFields, updateContact } from "@/lib/ghl";
import { stepUrl, verifyContact } from "@/lib/token";
import { formatBusinessNumber, validateDetails } from "@/lib/validate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const contactId = body.c;
  if (!verifyContact(contactId, body.t)) return NextResponse.json({ error: "This link isn't valid. Start again from the sign-up form." }, { status: 403 });

  const v = validateDetails(body);
  if (!v.ok) return NextResponse.json({ errors: v.errors }, { status: 422 });

  try {
    const d = v.data;
    await updateContact(contactId, {
      address1: d.business_address,
      ...(d.website ? { website: d.website } : {}),
    });
    await setCustomFields(contactId, {
      registered_business_name: d.registered_business_name,
      abn: formatBusinessNumber(d.abn),
      contact_role: d.contact_role,
      business_address: d.business_address,
      gbp_profile_url: d.gbp_profile_url,
      gbp_priority_suburbs: d.suburbs,
      gbp_priority_services: d.services,
      gbp_agreement_status: "Awaiting signature",
    });
    await addTags(contactId, [TAGS.details]);
    return NextResponse.json({ next: stepUrl("/contract", contactId) });
  } catch (e) {
    console.error("details save failed", e);
    const status = e instanceof GhlError ? 502 : 500;
    return NextResponse.json({ error: "Couldn't save your business details just now." }, { status });
  }
}
