import Link from "next/link";
import { Footer, TopBar } from "./Chrome";

export function InvalidLink() {
  return (
    <div className="wrap narrow">
      <TopBar />
      <section>
        <div className="eyebrow">Hmm</div>
        <h2>That link isn&apos;t valid.</h2>
        <p className="muted" style={{ marginTop: 12 }}>It may have been copied incompletely. Start again from the sign-up form; it only takes a couple of minutes.</p>
        <div className="actions"><Link className="btn" href="/start">Start again</Link></div>
      </section>
      <Footer />
    </div>
  );
}
