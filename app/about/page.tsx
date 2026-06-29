// app/about/page.tsx
//
// Server component — purely presentational, no interactivity needed.

import Nav from "@/components/store/Nav";
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About",
  description: "We find the makers. You find the pieces that last.",
};

const MAKERS = [
  {
    name: "Clara Osei",
    craft: "Ceramics · Accra & London",
    bio: "Clara trained under a Japanese raku master before returning to Accra to open her own studio. Every pour-over set is thrown and glazed by hand.",
  },
  {
    name: "Tomás Reyes",
    craft: "Leatherwork · Oaxaca",
    bio: "Fourth-generation leather artisan using the same vegetable tanning methods his great-grandmother used. The hides come from a single family farm two hours north.",
  },
  {
    name: "Ines Brandt",
    craft: "Tile & Mirror · Berlin",
    bio: "Ines spent a decade restoring historic zellige façades in Morocco before starting her own tile studio. Each mirror takes three days to set.",
  },
  {
    name: "Ravi Nair",
    craft: "Coastal Painting · Goa",
    bio: "Ravi paints en plein air at dawn, then transfers the studies to linen canvas in his studio. The light in his work is genuinely unrepeatable.",
  },
];

const VALUES = [
  {
    title: "Made to last",
    body: "We only carry things designed to be used for decades, not seasons. If it won't outlast a trend cycle by at least ten years, it doesn't make the cut.",
  },
  {
    title: "Maker-direct",
    body: "Every product comes straight from the person who made it. No middlemen, no mystery factories. You can ask us exactly where anything came from.",
  },
  {
    title: "Slow selection",
    body: "We add new pieces a few times a year, not a few times a week. That's intentional. Finding something worth carrying takes time.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main>
        {/* HERO */}
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Our story</p>
          <h1 className={styles.headline}>
            We find the makers.
            <br />
            You find the pieces
            <br />
            that <em>last.</em>
          </h1>
          <p className={styles.heroSub}>
            pelé. started as a running list of things worth buying once. It
            became a shop when the list got too good to keep to ourselves.
          </p>
        </section>

        {/* DIVIDER IMAGE BAND */}
        <div className={styles.band} aria-hidden="true">
          <div className={styles.bandInner} />
        </div>

        {/* VALUES */}
        <section className={styles.section}>
          <p className={styles.sectionLabel}>What we believe</p>
          <div className={styles.valuesGrid}>
            {VALUES.map((v) => (
              <div key={v.title} className={styles.valueCard}>
                <h2 className={styles.valueTitle}>{v.title}</h2>
                <p className={styles.valueBody}>{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* MAKERS */}
        <section className={styles.section}>
          <p className={styles.sectionLabel}>The makers behind the pieces</p>
          <div className={styles.makersGrid}>
            {MAKERS.map((maker) => (
              <div key={maker.name} className={styles.makerCard}>
                {/* Initials avatar */}
                <div className={styles.avatar} aria-hidden="true">
                  {maker.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <h3 className={styles.makerName}>{maker.name}</h3>
                <p className={styles.makerCraft}>{maker.craft}</p>
                <p className={styles.makerBio}>{maker.bio}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <h2 className={styles.ctaTitle}>Something you'd like us to carry?</h2>
          <p className={styles.ctaSub}>
            We're always looking for makers worth knowing about. Tell us who you
            think we're missing.
          </p>
          <a href="mailto:hello@peleshop.co" className={styles.ctaBtn}>
            Get in touch
          </a>
        </section>
      </main>
    </>
  );
}
