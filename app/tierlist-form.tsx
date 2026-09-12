"use client";

import { useMemo, useState } from "react";

const initialTiers =
  "FF0000;Pro;python,postgres,java\nFFD43B;Good;javascript,typescript";

export function TierlistForm() {
  const [tiers, setTiers] = useState(initialTiers);
  const [theme, setTheme] = useState("light");
  const [width, setWidth] = useState("1200");
  const [maxIconsPerRow, setMaxIconsPerRow] = useState("9");
  const [iconPadding, setIconPadding] = useState("0");
  const [iconFontSize, setIconFontSize] = useState("11");
  const [labels, setLabels] = useState(true);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    tiers
      .split("\n")
      .map((tier) => tier.trim())
      .filter(Boolean)
      .forEach((tier) => params.append("tier", tier));
    params.set("theme", theme);
    params.set("width", width || "1200");
    params.set("maxIconsPerRow", maxIconsPerRow || "9");
    params.set("iconPadding", iconPadding || "0");
    params.set("iconFontSize", iconFontSize || "11");
    params.set("labels", labels ? "1" : "0");
    return `/tierlist?${params.toString()}`;
  }, [iconFontSize, iconPadding, labels, maxIconsPerRow, theme, tiers, width]);

  return (
    <section className="builder-card">
      <div className="field-group field-group-wide">
        <label htmlFor="tiers">Um tier por linha</label>
        <textarea
          id="tiers"
          value={tiers}
          onChange={(event) => setTiers(event.target.value)}
          rows={5}
          spellCheck={false}
        />
        <span className="field-help">RRGGBB;Título;slug1,slug2</span>
      </div>

      <div className="controls-grid">
        <div className="field-group">
          <label htmlFor="theme">Tema</label>
          <select id="theme" value={theme} onChange={(event) => setTheme(event.target.value)}>
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="width">Largura</label>
          <input
            id="width"
            type="number"
            min="320"
            max="2400"
            value={width}
            onChange={(event) => setWidth(event.target.value)}
          />
        </div>
        <div className="field-group">
          <label htmlFor="maxIconsPerRow">Ícones por linha</label>
          <input
            id="maxIconsPerRow"
            type="number"
            min="1"
            max="64"
            value={maxIconsPerRow}
            onChange={(event) => setMaxIconsPerRow(event.target.value)}
          />
        </div>
        <div className="field-group">
          <label htmlFor="iconPadding">Padding do viewBox</label>
          <input
            id="iconPadding"
            type="number"
            min="0"
            max="10"
            value={iconPadding}
            onChange={(event) => setIconPadding(event.target.value)}
          />
        </div>
        <div className="field-group">
          <label htmlFor="iconFontSize">Fonte dos nomes</label>
          <input
            id="iconFontSize"
            type="number"
            min="6"
            max="24"
            value={iconFontSize}
            onChange={(event) => setIconFontSize(event.target.value)}
          />
        </div>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={labels}
            onChange={(event) => setLabels(event.target.checked)}
          />
          Mostrar nomes
        </label>
      </div>

      <div className="preview-actions">
        <a className="button button-primary" href={endpoint} target="_blank" rel="noreferrer">
          Abrir SVG
        </a>
        <button
          className="button button-secondary"
          type="button"
          onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${endpoint}`)}
        >
          Copiar URL
        </button>
      </div>

      <div className="preview-frame">
        <img src={endpoint} alt="Preview da tierlist" />
      </div>
    </section>
  );
}
