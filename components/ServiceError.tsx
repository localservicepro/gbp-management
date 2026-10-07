import { Footer, TopBar } from "./Chrome";
import { COMPANY } from "@/lib/config";

/** Shown when GHL can't be reached or the app isn't configured, instead of a bare 500. */
export function ServiceError({ detail }: { detail?: string }) {
  return (
    <div className="wrap narrow">
      <TopBar />
      <section>
        <div className="eyebrow">Hold on</div>
        <h2>We couldn&apos;t load your details just now.</h2>
        <p className="muted" style={{ marginTop: 12 }}>
          Give it a minute and reload this page. If it keeps happening, email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> and we&apos;ll finish the sign-up with you by hand.
        </p>
        {detail && <p className="hint" style={{ marginTop: 16 }}>Reference: {detail}</p>}
      </section>
      <Footer />
    </div>
  );
}
