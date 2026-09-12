"use client";

import { useMemo, useRef, useState } from "react";
import type { IconOption } from "@/lib/tierlist";

type TierDraft = {
  id: string;
  color: string;
  title: string;
  icons: string[];
  search: string;
};

type TierlistFormProps = {
  iconOptions: IconOption[];
};

const initialTiers: TierDraft[] = [
  {
    id: "tier-1",
    color: "#00A86B",
    title: "Expert",
    icons: ["python", "typescript", "postgres", "java"],
    search: "",
  },
  {
    id: "tier-2",
    color: "#7CB342",
    title: "Advanced",
    icons: ["javascript", "go", "rust", "cpp"],
    search: "",
  },
  {
    id: "tier-3",
    color: "#FDD835",
    title: "Intermediate",
    icons: ["c", "kotlin", "swift", "php"],
    search: "",
  },
  {
    id: "tier-4",
    color: "#FB8C00",
    title: "Beginner",
    icons: ["ruby", "dart", "scala", "lua"],
    search: "",
  },
  {
    id: "tier-5",
    color: "#E53935",
    title: "Learning",
    icons: ["perl", "elixir", "haskell", "clojure"],
    search: "",
  },
];

function updateTier(
  tiers: TierDraft[],
  tierId: string,
  update: Partial<TierDraft>,
): TierDraft[] {
  return tiers.map((tier) =>
    tier.id === tierId ? { ...tier, ...update } : tier,
  );
}

export function TierlistForm({ iconOptions }: TierlistFormProps) {
  const [tiers, setTiers] = useState(initialTiers);
  const [theme, setTheme] = useState("light");
  const [width, setWidth] = useState("1200");
  const [maxIconsPerRow, setMaxIconsPerRow] = useState("9");
  const [iconPadding, setIconPadding] = useState("2");
  const [iconSize, setIconSize] = useState("72");
  const [iconFontSize, setIconFontSize] = useState("11");
  const [labels, setLabels] = useState(true);
  const nextTierId = useRef(initialTiers.length + 1);

  const iconTitles = useMemo(
    () => new Map(iconOptions.map((option) => [option.slug, option.title])),
    [iconOptions],
  );

  const canRender = tiers.every(
    (tier) =>
      /^#[0-9A-Fa-f]{6}$/.test(tier.color) &&
      tier.title.trim().length > 0 &&
      tier.icons.length > 0,
  );

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    tiers.forEach((tier) => {
      params.append(
        "tier",
        `${tier.color.slice(1).toUpperCase()};${tier.title};${tier.icons.join(",")}`,
      );
    });
    params.set("theme", theme);
    params.set("width", width || "1200");
    params.set("maxIconsPerRow", maxIconsPerRow || "9");
    params.set("iconPadding", iconPadding || "2");
    params.set("iconSize", iconSize || "72");
    params.set("iconFontSize", iconFontSize || "11");
    params.set("labels", labels ? "1" : "0");
    return `/tierlist?${params.toString()}`;
  }, [
    iconFontSize,
    iconPadding,
    iconSize,
    labels,
    maxIconsPerRow,
    theme,
    tiers,
    width,
  ]);

  function setTierValue(tierId: string, update: Partial<TierDraft>) {
    setTiers((current) => updateTier(current, tierId, update));
  }

  function addTier() {
    const id = `tier-${nextTierId.current}`;
    nextTierId.current += 1;
    setTiers((current) => [
      ...current,
      {
        id,
        color: "#CBD5E1",
        title: "New tier",
        icons: ["python"],
        search: "",
      },
    ]);
  }

  function removeTier(tierId: string) {
    setTiers((current) =>
      current.length > 1 ? current.filter((tier) => tier.id !== tierId) : current,
    );
  }

  function addIcon(tier: TierDraft, slug: string) {
    if (tier.icons.length >= 64 || tier.icons.includes(slug)) {
      return;
    }

    setTierValue(tier.id, {
      icons: [...tier.icons, slug],
      search: "",
    });
  }

  function removeIcon(tier: TierDraft, slug: string) {
    setTierValue(tier.id, {
      icons: tier.icons.filter((icon) => icon !== slug),
    });
  }

  return (
    <section className="builder-card">
      <div className="tier-editor">
        {tiers.map((tier, index) => {
          const query = tier.search.trim().toLowerCase();
          const suggestions = query
            ? iconOptions
                .filter(
                  (option) =>
                    !tier.icons.includes(option.slug) &&
                    (option.slug.includes(query) ||
                      option.title.toLowerCase().includes(query)),
                )
                .slice(0, 8)
            : [];

          return (
            <article className="tier-card" key={tier.id}>
              <div className="tier-card-header">
                <span className="tier-card-number">Tier {index + 1}</span>
                <button
                  className="text-button text-button-danger"
                  type="button"
                  onClick={() => removeTier(tier.id)}
                  disabled={tiers.length === 1}
                >
                  Remove
                </button>
              </div>

              <div className="tier-card-fields">
                <div className="field-group color-field">
                  <label htmlFor={`${tier.id}-color`}>Color</label>
                  <div className="color-control">
                    <input
                      id={`${tier.id}-color`}
                      type="color"
                      value={tier.color}
                      onChange={(event) =>
                        setTierValue(tier.id, { color: event.target.value })
                      }
                    />
                    <code>{tier.color.toUpperCase()}</code>
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor={`${tier.id}-title`}>Label</label>
                  <input
                    id={`${tier.id}-title`}
                    type="text"
                    value={tier.title}
                    maxLength={48}
                    onChange={(event) =>
                      setTierValue(tier.id, { title: event.target.value })
                    }
                  />
                </div>
              </div>

              <div className="field-group icon-picker">
                <label htmlFor={`${tier.id}-icons`}>Icons</label>
                <div className="chip-list">
                  {tier.icons.map((slug) => (
                    <button
                      className="icon-chip"
                      key={slug}
                      type="button"
                      title={`Remove ${iconTitles.get(slug) ?? slug}`}
                      onClick={() => removeIcon(tier, slug)}
                    >
                      <span>{iconTitles.get(slug) ?? slug}</span>
                      <span className="icon-chip-remove" aria-hidden="true">
                        ×
                      </span>
                    </button>
                  ))}
                </div>
                <input
                  id={`${tier.id}-icons`}
                  type="search"
                  value={tier.search}
                  placeholder="Search icons to add..."
                  autoComplete="off"
                  onChange={(event) =>
                    setTierValue(tier.id, { search: event.target.value })
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && suggestions[0]) {
                      event.preventDefault();
                      addIcon(tier, suggestions[0].slug);
                    }
                  }}
                />
                {query && (
                  <div className="icon-suggestions" role="listbox">
                    {suggestions.length > 0 ? (
                      suggestions.map((option) => (
                        <button
                          className="suggestion-button"
                          key={option.slug}
                          type="button"
                          onClick={() => addIcon(tier, option.slug)}
                        >
                          {option.title}
                        </button>
                      ))
                    ) : (
                      <span className="field-help">No matching icons.</span>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <button className="button button-secondary add-tier-button" type="button" onClick={addTier}>
        + Add tier
      </button>

      <div className="controls-grid">
        <div className="field-group">
          <label htmlFor="theme">Theme</label>
          <select id="theme" value={theme} onChange={(event) => setTheme(event.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="width">Width</label>
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
          <label htmlFor="maxIconsPerRow">Icons per row</label>
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
          <label htmlFor="iconPadding">ViewBox padding</label>
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
          <label htmlFor="iconFontSize">Icon label font</label>
          <input
            id="iconFontSize"
            type="number"
            min="6"
            max="24"
            value={iconFontSize}
            onChange={(event) => setIconFontSize(event.target.value)}
          />
        </div>
        <div className="field-group">
          <label htmlFor="iconSize">Icon size</label>
          <input
            id="iconSize"
            type="number"
            min="16"
            max="128"
            value={iconSize}
            onChange={(event) => setIconSize(event.target.value)}
          />
        </div>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={labels}
            onChange={(event) => setLabels(event.target.checked)}
          />
          Show icon names
        </label>
      </div>

      <div className="preview-actions">
        <a
          className={`button button-primary${canRender ? "" : " button-disabled"}`}
          href={canRender ? endpoint : undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!canRender}
        >
          Open SVG
        </a>
        <button
          className="button button-secondary"
          type="button"
          disabled={!canRender}
          onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${endpoint}`)}
        >
          Copy URL
        </button>
      </div>

      <div className="preview-frame">
        {canRender ? (
          <img src={endpoint} alt="Tier list preview" />
        ) : (
          <p className="preview-help">Add a label and at least one icon to each tier.</p>
        )}
      </div>
    </section>
  );
}
