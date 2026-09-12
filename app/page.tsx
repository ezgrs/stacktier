import { TierlistForm } from "@/app/tierlist-form";
import { getIconOptions } from "@/lib/tierlist";

export default function HomePage() {
  const iconOptions = getIconOptions();

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">stacktier</p>
        <h1>Make a technology tier list from a URL.</h1>
        <p className="intro">
          Use the form below or call the SVG endpoint at <code>/tierlist</code>
          directly.
        </p>
      </section>

      <TierlistForm iconOptions={iconOptions} />

      <section className="docs-card">
        <h2>URL format</h2>
        <p>
          Each <code>tier</code> parameter uses
          <code>RRGGBB;Title;slug1,slug2</code>. Repeat the parameter to add
          more tiers.
        </p>
        <pre>
          {`/tierlist?tier=00A86B;Expert;python,typescript,postgres,java&tier=7CB342;Advanced;javascript,go,rust,cpp&tier=FDD835;Intermediate;c,kotlin,swift,php&tier=FB8C00;Beginner;ruby,dart,scala,lua&tier=E53935;Learning;perl,elixir,haskell,clojure&theme=dark&iconPadding=2&iconSize=72&labels=1`}
        </pre>
        <p className="fine-print">
          Icons come from the local Simple Icons package. Check individual
          licenses before publishing generated images.
        </p>
      </section>
    </main>
  );
}
