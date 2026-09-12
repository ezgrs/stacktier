import { TierlistForm } from "@/app/tierlist-form";
import "./globals.css";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">TIERLIST GEN</p>
        <h1>Transforme uma URL em uma tierlist de tecnologias.</h1>
        <p className="intro">
          Monte os tiers abaixo ou use diretamente o endpoint SVG em
          <code>/tierlist</code>.
        </p>
      </section>

      <TierlistForm />

      <section className="docs-card">
        <h2>Formato da URL</h2>
        <p>
          Cada parâmetro <code>tier</code> usa
          <code>RRGGBB;Título;slug1,slug2</code>. Os parâmetros podem ser
          repetidos para adicionar mais tiers.
        </p>
        <pre>
          {`/tierlist?tier=FF0000;Pro;python,postgres,java&tier=FFD43B;Good;javascript,typescript&theme=dark&width=1200&labels=1`}
        </pre>
        <p className="fine-print">
          Os ícones são fornecidos pelo pacote local Simple Icons. Consulte as
          licenças individuais antes de publicar imagens em um produto.
        </p>
      </section>
    </main>
  );
}
