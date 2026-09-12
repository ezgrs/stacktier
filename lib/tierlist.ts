import * as simpleIcons from "simple-icons";
import type { SimpleIcon } from "simple-icons";

export const DEFAULT_WIDTH = 1200;
export const MIN_WIDTH = 320;
export const MAX_WIDTH = 2400;
export const MAX_TIERS = 20;
export const MAX_ICONS_PER_TIER = 64;
export const MAX_TITLE_LENGTH = 48;

export type Theme = "light" | "dark";

export type Tier = {
  color: string;
  title: string;
  icons: SimpleIcon[];
};

export type TierlistModel = {
  tiers: Tier[];
  theme: Theme;
  width: number;
  labels: boolean;
};

export type InputErrorCode =
  | "missing_tier"
  | "invalid_tier_spec"
  | "invalid_color"
  | "invalid_title"
  | "invalid_icon_list"
  | "invalid_icon_slug"
  | "unknown_icon"
  | "too_many_tiers"
  | "too_many_icons"
  | "invalid_theme"
  | "invalid_width"
  | "invalid_labels";

export class TierlistInputError extends Error {
  readonly status = 400;

  constructor(
    readonly code: InputErrorCode,
    readonly field: string,
    message: string,
  ) {
    super(message);
    this.name = "TierlistInputError";
  }
}

const aliases: Record<string, string> = {
  postgres: "postgresql",
  js: "javascript",
  ts: "typescript",
  py: "python",
  java: "openjdk",
  golang: "go",
  csharp: "csharp",
  cpp: "cplusplus",
};

function isSimpleIcon(value: unknown): value is SimpleIcon {
  if (!value || typeof value !== "object") {
    return false;
  }

  const icon = value as Partial<SimpleIcon>;
  return (
    typeof icon.slug === "string" &&
    typeof icon.title === "string" &&
    typeof icon.hex === "string" &&
    typeof icon.path === "string"
  );
}

function createIconMap(): Map<string, SimpleIcon> {
  const map = new Map<string, SimpleIcon>();

  for (const value of Object.values(simpleIcons)) {
    if (isSimpleIcon(value)) {
      map.set(value.slug, value);
    }
  }

  return map;
}

const iconMap = createIconMap();

function normalizeIconSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  return aliases[normalized] ?? normalized;
}

function parsePositiveInteger(value: string, field: string): number {
  if (!/^\d+$/.test(value)) {
    throw new TierlistInputError("invalid_width", field, "width must be an integer");
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < MIN_WIDTH || parsed > MAX_WIDTH) {
    throw new TierlistInputError(
      "invalid_width",
      field,
      `width must be between ${MIN_WIDTH} and ${MAX_WIDTH}`,
    );
  }

  return parsed;
}

function parseTierSpec(rawSpec: string, index: number): Tier {
  const field = `tier[${index}]`;
  const parts = rawSpec.split(";");

  if (parts.length !== 3) {
    throw new TierlistInputError(
      "invalid_tier_spec",
      field,
      "tier must use the format RRGGBB;Title;slug1,slug2",
    );
  }

  const [rawColor, rawTitle, rawIconList] = parts;
  const color = rawColor.trim().toUpperCase();
  const title = rawTitle.trim();

  if (!/^[0-9A-F]{6}$/.test(color)) {
    throw new TierlistInputError(
      "invalid_color",
      `${field}.color`,
      "color must contain exactly six hexadecimal digits",
    );
  }

  if (
    title.length === 0 ||
    title.length > MAX_TITLE_LENGTH ||
    title.includes(",")
  ) {
    throw new TierlistInputError(
      "invalid_title",
      `${field}.title`,
      `title must be between 1 and ${MAX_TITLE_LENGTH} characters and cannot contain commas`,
    );
  }

  const rawSlugs = rawIconList.split(",").map((slug) => slug.trim());
  if (rawSlugs.length === 0 || rawSlugs.some((slug) => slug.length === 0)) {
    throw new TierlistInputError(
      "invalid_icon_list",
      `${field}.icons`,
      "icons must contain at least one comma-separated slug",
    );
  }

  if (rawSlugs.length > MAX_ICONS_PER_TIER) {
    throw new TierlistInputError(
      "too_many_icons",
      `${field}.icons`,
      `a tier can contain at most ${MAX_ICONS_PER_TIER} icons`,
    );
  }

  const icons = rawSlugs.map((rawSlug, iconIndex) => {
    const slug = normalizeIconSlug(rawSlug);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
      throw new TierlistInputError(
        "invalid_icon_slug",
        `${field}.icons[${iconIndex}]`,
        "icon slugs may contain lowercase letters, numbers and hyphens",
      );
    }

    const icon = iconMap.get(slug);
    if (!icon) {
      throw new TierlistInputError(
        "unknown_icon",
        `${field}.icons[${iconIndex}]`,
        `unknown Simple Icons slug: ${rawSlug}`,
      );
    }

    return icon;
  });

  return { color, title, icons };
}

export function parseTierlistSearchParams(
  searchParams: URLSearchParams,
): TierlistModel {
  const rawTiers = searchParams.getAll("tier");

  if (rawTiers.length === 0) {
    throw new TierlistInputError(
      "missing_tier",
      "tier",
      "at least one tier parameter is required",
    );
  }

  if (rawTiers.length > MAX_TIERS) {
    throw new TierlistInputError(
      "too_many_tiers",
      "tier",
      `a tierlist can contain at most ${MAX_TIERS} tiers`,
    );
  }

  const themeValue = searchParams.get("theme") ?? "light";
  if (themeValue !== "light" && themeValue !== "dark") {
    throw new TierlistInputError(
      "invalid_theme",
      "theme",
      "theme must be either light or dark",
    );
  }

  const widthValue = searchParams.get("width");
  const width = widthValue
    ? parsePositiveInteger(widthValue, "width")
    : DEFAULT_WIDTH;

  const labelsValue = searchParams.get("labels") ?? "1";
  if (labelsValue !== "0" && labelsValue !== "1") {
    throw new TierlistInputError(
      "invalid_labels",
      "labels",
      "labels must be either 0 or 1",
    );
  }

  return {
    tiers: rawTiers.map(parseTierSpec),
    theme: themeValue,
    width,
    labels: labelsValue === "1",
  };
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function contrastText(hex: string): string {
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  return luminance >= 150 ? "#0f172a" : "#ffffff";
}

function calculateLayout(model: TierlistModel) {
  const labelWidth = Math.max(132, Math.min(220, Math.round(model.width * 0.18)));
  const horizontalPadding = 24;
  const gap = 12;
  const itemWidth = model.labels ? 104 : 72;
  const itemHeight = model.labels ? 76 : 64;
  const contentWidth = model.width - labelWidth - horizontalPadding * 2;
  const columns = Math.max(
    1,
    Math.floor((contentWidth + gap) / (itemWidth + gap)),
  );

  const tiers = model.tiers.map((tier) => {
    const rows = Math.ceil(tier.icons.length / columns);
    const height = Math.max(
      96,
      horizontalPadding + rows * itemHeight + Math.max(0, rows - 1) * gap,
    );
    return { tier, rows, height };
  });

  return {
    labelWidth,
    horizontalPadding,
    gap,
    itemWidth,
    itemHeight,
    columns,
    tiers,
    height: tiers.reduce((total, item) => total + item.height, 0),
  };
}

export function renderTierlist(model: TierlistModel): string {
  const layout = calculateLayout(model);
  const colors =
    model.theme === "dark"
      ? {
          background: "#0f172a",
          surface: "#111827",
          tile: "#1e293b",
          border: "#334155",
          text: "#f8fafc",
          muted: "#cbd5e1",
        }
      : {
          background: "#f8fafc",
          surface: "#ffffff",
          tile: "#f8fafc",
          border: "#e2e8f0",
          text: "#0f172a",
          muted: "#475569",
        };

  const title = model.tiers.map((tier) => tier.title).join(" · ");
  const output: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${model.width}" height="${layout.height}" viewBox="0 0 ${model.width} ${layout.height}" role="img" aria-labelledby="tierlist-title">`,
    `<title id="tierlist-title">${escapeXml(title)}</title>`,
    `<rect width="${model.width}" height="${layout.height}" fill="${colors.background}"/>`,
  ];

  let top = 0;
  for (const { tier, height } of layout.tiers) {
    const labelColor = `#${tier.color}`;
    const labelText = contrastText(tier.color);
    output.push(
      `<rect x="0" y="${top}" width="${model.width}" height="${height}" fill="${colors.surface}" stroke="${colors.border}"/>`,
      `<rect x="0" y="${top}" width="${layout.labelWidth}" height="${height}" fill="${labelColor}"/>`,
      `<text x="${layout.labelWidth / 2}" y="${top + height / 2 + 7}" text-anchor="middle" textLength="${Math.max(40, layout.labelWidth - 28)}" lengthAdjust="spacingAndGlyphs" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700" fill="${labelText}">${escapeXml(tier.title)}</text>`,
    );

    tier.icons.forEach((icon, index) => {
      const row = Math.floor(index / layout.columns);
      const column = index % layout.columns;
      const x =
        layout.labelWidth +
        layout.horizontalPadding +
        column * (layout.itemWidth + layout.gap);
      const y =
        top +
        layout.horizontalPadding / 2 +
        row * (layout.itemHeight + layout.gap);
      const iconSize = model.labels ? 36 : 42;
      const iconX = x + (layout.itemWidth - iconSize) / 2;
      const iconY = y + (model.labels ? 8 : 11);

      output.push(
        `<rect x="${x}" y="${y}" width="${layout.itemWidth}" height="${layout.itemHeight}" rx="12" fill="${colors.tile}" stroke="${colors.border}"/>`,
        `<svg x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" role="img" aria-label="${escapeXml(icon.title)}"><path fill="#${icon.hex}" d="${icon.path}"/></svg>`,
      );

      if (model.labels) {
        output.push(
          `<text x="${x + layout.itemWidth / 2}" y="${y + 62}" text-anchor="middle" textLength="${layout.itemWidth - 12}" lengthAdjust="spacingAndGlyphs" font-family="Inter, Arial, sans-serif" font-size="12" fill="${colors.muted}">${escapeXml(icon.title)}</text>`,
        );
      }
    });

    top += height;
  }

  output.push("</svg>");
  return output.join("");
}
