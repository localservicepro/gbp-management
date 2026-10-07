import Link from "next/link";
import { Footer, TopBar } from "@/components/Chrome";
import { OFFER } from "@/lib/config";

const POST_DAYS = new Set([2, 6, 9, 12, 16, 20, 23, 27]);

export default function SalesPage() {
  return (
    <div className="wrap">
      <TopBar />

      <section className="hero">
        <div className="stack">
          <div className="eyebrow">GBP Management · ${OFFER.priceMonthly}/month inc GST</div>
          <h1>Be the business Google sends the call to.</h1>
          <p className="lead">
            When someone in your suburb searches &quot;plumber near me&quot; or &quot;lawn mowing Toowoomba&quot;, Google shows three businesses on the map. We get yours into that three, keep it there, and turn the profile visits into enquiries you can actually answer.
          </p>
          <div className="actions" style={{ marginTop: 4 }}>
            <Link className="btn" href="/start">Start my profile</Link>
            <a className="btn secondary" href="#included">See what&apos;s included</a>
          </div>
          <p className="muted" style={{ fontSize: ".95rem" }}>Sign up online in about 4 minutes. You sign the agreement on screen and the first invoice lands in your inbox straight away.</p>
        </div>

        <div className="pack" aria-label="Example of a Google map pack result">
          <div className="pack-head"><span>Google</span><span className="q">lawn mowing near me</span></div>
          <div className="pack-map"><span className="pin a" /><span className="pin you" /><span className="pin b" /></div>
          <div className="row you">
            <div><b>Your Business Name</b><span className="stars">★★★★★ <span className="muted">4.9 (112)</span></span><small>Lawn mowing · Open now · Services your suburb</small></div>
            <span className="tag">Managed by LSP</span>
          </div>
          <div className="row">
            <div><b>Competitor A</b><span className="stars">★★★★☆ <span className="muted">4.3 (41)</span></span><small>Gardener · Closed · Last post 2023</small></div>
            <span className="tag grey">Unmanaged</span>
          </div>
          <div className="row">
            <div><b>Competitor B</b><span className="stars">★★★★☆ <span className="muted">4.1 (18)</span></span><small>Landscaper · Hours unknown</small></div>
            <span className="tag grey">Unmanaged</span>
          </div>
        </div>
      </section>

      <section>
        <div className="eyebrow">Why profiles stall</div>
        <h2>Most tradie profiles are set up once and never touched again.</h2>
        <div className="cols">
          <div className="col"><div className="n">PROBLEM 01</div><h3>Wrong categories</h3><p>A &quot;Gardener&quot; primary category when you want mowing jobs. Google ranks you for the work you told it you do, not the work you want.</p></div>
          <div className="col"><div className="n">PROBLEM 02</div><h3>No suburbs named</h3><p>If your profile doesn&apos;t say which suburbs you service, Google guesses from your home address and shows you in a 3km circle around your garage.</p></div>
          <div className="col"><div className="n">PROBLEM 03</div><h3>Nothing new since 2023</h3><p>No posts, no fresh photos, reviews trickling in once a quarter. Google reads that as a business that might not be trading.</p></div>
        </div>
      </section>

      <section id="included">
        <div className="eyebrow">What you get</div>
        <h2>A full rebuild in month one, then we keep it working every month after.</h2>
        <div className="incl">
          <div><b>Categories restructured</b><p>Primary and secondary categories rebuilt around the services you want more of. Off-topic categories removed.</p></div>
          <div><b>Service area set to your suburbs</b><p>Your priority suburbs set as the service area so you appear for searches in them, not just around your address.</p></div>
          <div><b>Services list rewritten</b><p>Every priority service listed with its own description, in the words your customers search for.</p></div>
          <div><b>Business description rewritten</b><p>Names your services and your suburbs so Google and customers both know what you do and where.</p></div>
          <div><b>Hours and contact details checked</b><p>Reviewed and corrected with you so &quot;Closed&quot; never shows when you&apos;re open.</p></div>
          <div>
            <b>8 posts a month from your real jobs</b>
            <p>Send us a photo and the suburb. We write and post it. Google sees activity; locals see work done near them.</p>
            <div className="cal" aria-label="Example posting calendar: eight posts spread across a month">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="dow">{d}</span>)}
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <span key={d} className={POST_DAYS.has(d) ? "post" : ""}>{d}</span>
              ))}
            </div>
          </div>
          <div><b>Progress report every 6 weeks</b><p>Profile views, searches you showed up for, calls and direction requests, review count. Plain numbers, before and after, so you can see what the ${OFFER.priceMonthly} is doing.</p></div>
        </div>
      </section>

      <section>
        <div className="eyebrow">How it runs</div>
        <h2>Three stages. Nothing changes on your profile until you&apos;ve told us what you want.</h2>
        <div className="cols">
          <div className="col"><div className="n">WEEK 1</div><h3>Onboarding</h3><ul><li>You fill in the onboarding form: priority suburbs, priority services, anything to remove.</li><li>You grant LSP manager access to the profile.</li></ul></div>
          <div className="col"><div className="n">MONTH 1</div><h3>Full optimisation</h3><ul><li>Categories, service area, services, description, hours and contact details all rebuilt.</li><li>Changes sent to you for approval before they go live.</li></ul></div>
          <div className="col"><div className="n">ONGOING</div><h3>Monthly management</h3><ul><li>8 posts a month from your jobs.</li><li>Profile kept accurate as things change.</li><li>Progress report every 6 weeks.</li></ul></div>
        </div>
      </section>

      <section id="pricing">
        <div className="eyebrow">Pricing</div>
        <h2>One flat fee. No setup charge, no ad spend.</h2>
        <div className="price-box">
          <div className="stack">
            <div className="price">${OFFER.priceMonthly}<small> /month inc GST</small></div>
            <dl className="terms">
              <div><dt>Minimum term</dt><dd>{OFFER.minimumTermMonths} months from sign-up (${(OFFER.priceMonthly * OFFER.minimumTermMonths).toLocaleString("en-AU")} inc GST total)</dd></div>
              <div><dt>Billing</dt><dd>Monthly in advance, first invoice on sign-up</dd></div>
              <div><dt>After {OFFER.minimumTermMonths} months</dt><dd>Month to month, {OFFER.noticeDays} days&apos; written notice either way</dd></div>
              <div><dt>Not included</dt><dd>Website changes, paid ads, photography (quoted separately)</dd></div>
            </dl>
          </div>
          <div className="stack">
            <div className="own"><b>You own the profile. Always.</b><br />The Google Business Profile and its reviews stay yours. We work as a manager on your profile, never with your login. If you ever leave, we remove our access and that&apos;s it.</div>
            <p className="muted" style={{ fontSize: ".95rem" }}>We don&apos;t guarantee rankings; nobody honestly can, because Google decides and it changes with where the searcher is standing. What we guarantee is the work in the agreement, done every month.</p>
            <Link className="btn" href="/start">Start my profile</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="eyebrow">Sign-up</div>
        <h2>What happens after you hit the button.</h2>
        <div className="flow">
          <div><b>Your details</b>Name, business, mobile and email.</div>
          <div><b>Business details</b>Legal name, ABN and your role, so the agreement is right first time.</div>
          <div><b>Sign on screen</b>The agreement is pre-filled. Read it and sign with your finger or mouse.</div>
          <div><b>First payment</b>Your first invoice arrives by email. Pay it from the link.</div>
          <div><b>Add us to your GBP</b>Invite our two emails as Managers on your profile. We start.</div>
        </div>
        <div className="actions" style={{ marginTop: 28 }}>
          <Link className="btn" href="/start">Start my profile</Link>
          <span className="hint">Takes about 4 minutes.</span>
        </div>
      </section>

      <section>
        <div className="eyebrow">Questions</div>
        <h2>Before you sign.</h2>
        <div className="faq">
          <details><summary>Do I need to give you my Google login?</summary><p>No. You add Local Service Pro as a manager on your profile from your own account. You can remove us at any time.</p></details>
          <details><summary>What do you need from me each month?</summary><p>Photos from jobs with the suburb and the service. A text from the ute is enough.</p></details>
          <details><summary>Do I need to install an app or give you access to anything else?</summary><p>No. The only access we need is manager access to your Google Business Profile, which you grant from your own Google account. No apps, no software, no access to your customer data.</p></details>
          <details><summary>Can I stop after three months?</summary><p>Yes. After the minimum term it runs month to month and either side can end it with 30 days&apos; written notice. The profile and its reviews stay yours.</p></details>
          <details><summary>Is this the same as Google Ads?</summary><p>No. This is your free Google listing done properly. No ad spend, and the results don&apos;t switch off when a budget runs out.</p></details>
        </div>
      </section>

      <Footer />
    </div>
  );
}
