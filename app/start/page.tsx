import { Footer, Steps, TopBar } from "@/components/Chrome";
import { LeadForm } from "@/components/LeadForm";

export const metadata = { title: "Start your profile · GBP Management by LSP" };

export default function StartPage() {
  return (
    <div className="wrap narrow">
      <TopBar />
      <section>
        <div className="eyebrow">Start</div>
        <h2>Start your profile.</h2>
        <p className="muted">Four short steps. We use these details to pre-fill your agreement, so check the spelling.</p>
        <div className="order">
          <Steps current={0} />
          <LeadForm />
        </div>
      </section>
      <Footer />
    </div>
  );
}
