import { FlowShell } from "@/components/FlowShell";
import { LeadForm } from "@/components/LeadForm";

export const metadata = { title: "Start your profile · GBP Management by LSP" };

export default function StartPage() {
  return (
    <FlowShell current={0} title="Let's get your profile started." intro="A few details so we know who the agreement is for. The whole sign-up takes about four minutes and nothing is charged until you've signed and paid the first invoice.">
      <LeadForm />
      <div className="trust">
        <div><b>You own the profile</b>We manage it as a named manager. You can remove us any time.</div>
        <div><b>No lock-in beyond 3 months</b>Then month to month, 30 days&apos; notice either way.</div>
        <div><b>Sign on screen</b>No printing, no DocuSign account. The agreement is pre-filled from these details.</div>
      </div>
    </FlowShell>
  );
}
