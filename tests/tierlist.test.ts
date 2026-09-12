import { describe, expect, it } from "vitest";
import {
  parseTierlistSearchParams,
  renderTierlist,
  TierlistInputError,
} from "../lib/tierlist";

function params(query: string): URLSearchParams {
  return new URLSearchParams(query);
}

describe("parseTierlistSearchParams", () => {
  it("parses repeated tiers in order and resolves aliases", () => {
    const model = parseTierlistSearchParams(
      params(
        "tier=FF0000;Pro;python,postgres,java&tier=FFD43B;Good;javascript,typescript&theme=dark&width=800&labels=0",
      ),
    );

    expect(model.theme).toBe("dark");
    expect(model.width).toBe(800);
    expect(model.labels).toBe(false);
    expect(model.labelPadding).toBe(16);
    expect(model.labelFontSize).toBe(20);
    expect(model.maxIconsPerRow).toBe(9);
    expect(model.tiers.map((tier) => tier.title)).toEqual(["Pro", "Good"]);
    expect(model.tiers[0].icons.map((icon) => icon.slug)).toEqual([
      "python",
      "postgresql",
      "openjdk",
    ]);
  });

  it("uses defaults", () => {
    const model = parseTierlistSearchParams(
      params("tier=FF0000;Pro;python"),
    );

    expect(model.theme).toBe("light");
    expect(model.width).toBe(1200);
    expect(model.labels).toBe(true);
    expect(model.labelPadding).toBe(16);
    expect(model.labelFontSize).toBe(20);
    expect(model.maxIconsPerRow).toBe(9);
  });

  it("accepts encoded Unicode titles", () => {
    const model = parseTierlistSearchParams(
      params("tier=00AAFF;Muito%20bom%20%E2%9C%A8;python"),
    );

    expect(model.tiers[0].title).toBe("Muito bom ✨");
  });

  it.each([
    ["missing tier", "", "missing_tier"],
    ["bad color", "tier=GG0000;Pro;python", "invalid_color"],
    ["bad theme", "tier=FF0000;Pro;python&theme=blue", "invalid_theme"],
    ["bad labels", "tier=FF0000;Pro;python&labels=2", "invalid_labels"],
    ["bad padding", "tier=FF0000;Pro;python&padding=40", "invalid_padding"],
    ["bad font size", "tier=FF0000;Pro;python&fontSize=40", "invalid_font_size"],
    [
      "bad max icons per row",
      "tier=FF0000;Pro;python&maxIconsPerRow=0",
      "invalid_max_icons_per_row",
    ],
    ["unknown icon", "tier=FF0000;Pro;does-not-exist", "unknown_icon"],
    ["bad width", "tier=FF0000;Pro;python&width=100", "invalid_width"],
  ])("rejects %s", (_label, query, code) => {
    try {
      parseTierlistSearchParams(params(query));
      throw new Error("expected parser to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(TierlistInputError);
      expect((error as TierlistInputError).code).toBe(code);
    }
  });
});

describe("renderTierlist", () => {
  it("produces a self-contained SVG", () => {
    const model = parseTierlistSearchParams(
      params("tier=FF0000;Pro;python,postgres&labels=1&width=500"),
    );
    const svg = renderTierlist(model);

    expect(svg).toMatch(/^<\?xml/);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('width="496"');
    expect(svg).toContain("Python");
    expect(svg).toContain("PostgreSQL");
    expect(svg).toContain("<title>Python</title>");
    expect(svg).toContain("<title>PostgreSQL</title>");
    expect(svg).toContain("<path");
    expect(svg).not.toContain("https://");
    expect(svg).not.toContain('rx="12"');
    expect(svg).not.toContain("textLength");
    expect(svg).not.toContain("lengthAdjust");
    expect(svg).toContain('dominant-baseline="middle"');
    expect(svg).toContain('font-size="20"');
    expect(svg).toMatch(/width="64" height="64" fill="#FF0000"/);
    expect(svg).toContain('<svg x="64" y="0" width="48" height="48"');
  });

  it("wraps long tier titles without distorting glyphs", () => {
    const model = parseTierlistSearchParams(
      params("tier=FF0000;Especialista%20S%C3%AAnior;python&width=500"),
    );
    const svg = renderTierlist(model);

    expect(svg).toContain("<tspan");
    expect(svg).not.toContain("textLength");
    expect(svg).not.toContain("lengthAdjust");
  });

  it("uses the requested font size consistently", () => {
    const model = parseTierlistSearchParams(
      params("tier=FF0000;Pro;python&tier=00AAFF;Good;typescript&fontSize=24"),
    );
    const svg = renderTierlist(model);

    expect(model.labelFontSize).toBe(24);
    expect(svg.match(/font-size="24"/g)).toHaveLength(2);
  });

  it("grows icon squares with padding without adding a gap", () => {
    const model = parseTierlistSearchParams(
      params("tier=FF0000;Pro;python,typescript&padding=24"),
    );
    const svg = renderTierlist(model);

    expect(svg).toContain('<svg x="72" y="0" width="56" height="56"');
    expect(svg).toMatch(/width="72" height="72" fill="#FF0000"/);
  });

  it("wraps according to maxIconsPerRow", () => {
    const model = parseTierlistSearchParams(
      params("tier=FF0000;Pro;python,typescript&maxIconsPerRow=1"),
    );
    const svg = renderTierlist(model);

    expect(model.maxIconsPerRow).toBe(1);
    expect(svg).toMatch(/width="128" height="128" fill="#FF0000"/);
  });

  it("uses maxIconsPerRow as the final width basis", () => {
    const model = parseTierlistSearchParams(
      params("tier=FF0000;Pro;python,typescript,postgres&width=1200&maxIconsPerRow=2"),
    );
    const svg = renderTierlist(model);

    expect(svg).toContain('width="224"');
  });

  it("wraps icons and calculates a taller row when width is narrow", () => {
    const narrow = parseTierlistSearchParams(
      params(
        "tier=FF0000;Pro;python,postgres,java,javascript,typescript,python,postgres,java,javascript,typescript&width=320",
      ),
    );
    const wide = parseTierlistSearchParams(
      params(
        "tier=FF0000;Pro;python,postgres,java,javascript,typescript,python,postgres,java,javascript,typescript&width=1200",
      ),
    );

    const narrowHeight = Number(
      renderTierlist(narrow).match(/height="(\d+)"/)?.[1],
    );
    const wideHeight = Number(
      renderTierlist(wide).match(/height="(\d+)"/)?.[1],
    );

    expect(narrowHeight).toBeGreaterThan(wideHeight);

    const narrowLabel = renderTierlist(narrow).match(
      /<rect x="0" y="0" width="(\d+)" height="(\d+)" fill="#FF0000"\/>/,
    );
    expect(narrowLabel?.[1]).toBe(narrowLabel?.[2]);
    expect(Number(narrowLabel?.[1])).toBe(narrowHeight);
  });
});
