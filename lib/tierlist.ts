import * as simpleIcons from "simple-icons";
import type { SimpleIcon } from "simple-icons";

export const DEFAULT_WIDTH = 1200;
export const DEFAULT_LABEL_PADDING = 16;
export const DEFAULT_LABEL_FONT_SIZE = 20;
export const MIN_WIDTH = 320;
export const MAX_WIDTH = 2400;
export const MIN_LABEL_PADDING = 4;
export const MAX_LABEL_PADDING = 32;
export const MIN_LABEL_FONT_SIZE = 10;
export const MAX_LABEL_FONT_SIZE = 32;
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
  labelPadding: number;
  labelFontSize: number;
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
  | "invalid_labels"
  | "invalid_padding"
  | "invalid_font_size";

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

function parseBoundedInteger(
  value: string,
  field: string,
  code: "invalid_width" | "invalid_padding" | "invalid_font_size",
  min: number,
  max: number,
): number {
  if (!/^\d+$/.test(value)) {
    throw new TierlistInputError(code, field, `${field} must be an integer`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new TierlistInputError(
      code,
      field,
      `${field} must be between ${min} and ${max}`,
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
    ? parseBoundedInteger(
        widthValue,
        "width",
        "invalid_width",
        MIN_WIDTH,
        MAX_WIDTH,
      )
    : DEFAULT_WIDTH;

  const labelsValue = searchParams.get("labels") ?? "1";
  if (labelsValue !== "0" && labelsValue !== "1") {
    throw new TierlistInputError(
      "invalid_labels",
      "labels",
      "labels must be either 0 or 1",
    );
  }

  const paddingValue = searchParams.get("padding");
  const labelPadding = paddingValue
    ? parseBoundedInteger(
        paddingValue,
        "padding",
        "invalid_padding",
        MIN_LABEL_PADDING,
        MAX_LABEL_PADDING,
      )
    : DEFAULT_LABEL_PADDING;

  const fontSizeValue = searchParams.get("fontSize");
  const labelFontSize = fontSizeValue
    ? parseBoundedInteger(
        fontSizeValue,
        "fontSize",
        "invalid_font_size",
        MIN_LABEL_FONT_SIZE,
        MAX_LABEL_FONT_SIZE,
      )
    : DEFAULT_LABEL_FONT_SIZE;

  return {
    tiers: rawTiers.map(parseTierSpec),
    theme: themeValue,
    width,
    labels: labelsValue === "1",
    labelPadding,
    labelFontSize,
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

function wrapText(text: string, maxCharacters: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length > maxCharacters) {
      if (current) {
        lines.push(current);
        current = "";
      }

      for (let index = 0; index < word.length; index += maxCharacters) {
        lines.push(word.slice(index, index + maxCharacters));
      }
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharacters) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [text];
}

function renderTierTitle(
  title: string,
  labelSize: number,
  top: number,
  fill: string,
  padding: number,
  fontSize: number,
): string {
  const lineHeight = Math.round(fontSize * 1.15);
  const availableWidth = Math.max(1, labelSize - padding * 2);
  const maxCharacters = Math.max(
    1,
    Math.floor(availableWidth / (fontSize * 0.62)),
  );
  const maxLines = Math.max(
    1,
    Math.floor((labelSize - padding * 2) / lineHeight),
  );
  let lines = wrapText(title, maxCharacters);

  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    const lastLine = lines[maxLines - 1];
    lines[maxLines - 1] = `${lastLine.slice(0, Math.max(1, maxCharacters - 1))}…`;
  }

  const firstLineOffset = -((lines.length - 1) * lineHeight) / 2;

  const tspans = lines
    .map(
      (line, index) =>
        `<tspan x="${labelSize / 2}" dy="${index === 0 ? firstLineOffset : lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  return `<text x="${labelSize / 2}" y="${top + labelSize / 2}" dominant-baseline="middle" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="${fill}">${tspans}</text>`;
}

function contrastText(hex: string): string {
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  return luminance >= 150 ? "#0f172a" : "#ffffff";
}

function calculateLayout(model: TierlistModel) {
  const horizontalPadding = 24;
  const gap = 12;
  const itemWidth = model.labels ? 104 : 72;
  const itemHeight = model.labels ? 76 : 64;

  const tiers = model.tiers.map((tier) => {
    const maxColumns = Math.max(
      1,
      Math.floor(
        (model.width - horizontalPadding * 2 + gap) / (itemWidth + gap),
      ),
    );

    // Choose the most compact valid layout. The label side is the exact
    // height of the icon area, so the colored label and the icon row match.
    for (let columns = maxColumns; columns >= 1; columns -= 1) {
      const rows = Math.ceil(tier.icons.length / columns);
      const height =
        horizontalPadding +
        rows * itemHeight +
        Math.max(0, rows - 1) * gap;
      const availableWidth = model.width - height - horizontalPadding * 2;
      const requiredWidth = columns * itemWidth + (columns - 1) * gap;

      if (availableWidth >= requiredWidth || columns === 1) {
        return { tier, rows, columns, height, labelSize: height };
      }
    }

    throw new Error("unable to calculate tier layout");
  });

  return {
    horizontalPadding,
    gap,
    itemWidth,
    itemHeight,
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
  for (const { tier, height, labelSize, columns } of layout.tiers) {
    const labelColor = `#${tier.color}`;
    const labelText = contrastText(tier.color);
    output.push(
      `<rect x="0" y="${top}" width="${model.width}" height="${height}" fill="${colors.surface}" stroke="${colors.border}"/>`,
      `<rect x="0" y="${top}" width="${labelSize}" height="${labelSize}" fill="${labelColor}"/>`,
      renderTierTitle(
        tier.title,
        labelSize,
        top,
        labelText,
        model.labelPadding,
        model.labelFontSize,
      ),
    );

    tier.icons.forEach((icon, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const x =
        labelSize +
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
          `<text x="${x + layout.itemWidth / 2}" y="${y + 62}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" fill="${colors.muted}">${escapeXml(icon.title)}</text>`,
        );
      }
    });

    top += height;
  }

  output.push("</svg>");
  return output.join("");
}
