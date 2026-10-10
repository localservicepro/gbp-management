import { DetailsForm } from "@/components/DetailsForm";
import { FlowShell } from "@/components/FlowShell";
import { InvalidLink } from "@/components/InvalidLink";
import { getContact, readCustomFields } from "@/lib/ghl";
import { verifyContact } from "@/lib/token";

export const metadata = { title: "Business details · GBP Management by LSP" };
export const dynamic = "force-dynamic";

export default async function DetailsPage({ searchParams }: { searchParams: Promise<{ c?: string; t?: string }> }) {
  const { c = "", t = "" } = await searchParams;
  if (!verifyContact(c, t)) return <InvalidLink />;

  // Pre-fill from GHL so a returning visitor (back button, refreshed link) doesn't retype.
  let initial = { registered_business_name: "", abn: "", contact_role: "", business_address: "", website: "", gbp_profile_url: "", suburbs: "", services: "" };
  try {
    const contact = await getContact(c);
    const cf = await readCustomFields(contact);
    const s = (v: unknown) => (v == null ? "" : String(v));
    initial = {
      registered_business_name: s(cf.registered_business_name) || contact.companyName || "",
      abn: s(cf.abn),
      contact_role: s(cf.contact_role),
      business_address: s(cf.business_address) || contact.address1 || "",
      website: contact.website || "",
      gbp_profile_url: s(cf.gbp_profile_url),
      suburbs: s(cf.gbp_priority_suburbs),
      services: s(cf.gbp_priority_services),
    };
  } catch (e) {
    console.error("details prefill failed", e);
  }

  return (
    <FlowShell current={1} title="The details that go on the agreement." intro="Legal entity, ABN or ACN, and your role, so the agreement is right first time. Then a couple of questions about where you want more work.">
      <DetailsForm c={c} t={t} initial={initial} />
    </FlowShell>
  );
}
