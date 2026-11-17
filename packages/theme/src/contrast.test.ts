import { describe, expect, it } from "vitest";
import { gdsColorTokens, gdsSemanticColors } from "./gds-tokens";

/**
 * WCAG 2.2 AA contrast of the semantic colour pairs components actually use, in light and dark mode.
 * - SC 1.4.3 (text): 4.5:1
 * - SC 1.4.11 (non-text: field borders, focus ring, button fill against the page): 3:1
 * Values are resolved from the theme itself (semantic token → {colors.…} reference → raw token), so a
 * token sync from Figma that breaks a pair fails here.
 */
type Mode = "_light" | "_dark";
type Node = { value?: unknown; [k: string]: unknown };

const raw = gdsColorTokens as unknown as Record<string, Node>;
const semantic = gdsSemanticColors as unknown as Record<string, Node>;

function lookup(tree: Record<string, Node>, path: string[]): Node | undefined {
  let cur: unknown = tree;
  for (const p of path)
    cur = cur && typeof cur === "object" ? (cur as Record<string, unknown>)[p] : undefined;
  return cur as Node | undefined;
}

function resolveValue(value: unknown, mode: Mode, depth = 0): string {
  if (depth > 10) throw new Error("reference loop");
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    return resolveValue(v[mode] ?? v.base, mode, depth + 1);
  }
  const s = String(value);
  const ref = /^\{colors\.(.+)\}$/.exec(s);
  if (!ref) return s;
  const path = ref[1].split(".");
  const node = lookup(raw, path) ?? lookup(semantic, path); // a semantic token may point at the raw token of the same name
  if (!node) throw new Error(`unresolved reference ${s}`);
  return resolveValue(node.value ?? (node.DEFAULT as Node | undefined)?.value, mode, depth + 1);
}

/** Semantic token by dotted name, e.g. "fg.error", "fg" (DEFAULT), "brand.solid". */
function color(name: string, mode: Mode): string {
  const node = lookup(semantic, name.split("."));
  const leaf = node && "value" in node ? node : (node?.DEFAULT as Node | undefined);
  if (!leaf) throw new Error(`no semantic token ${name}`);
  return resolveValue(leaf.value, mode);
}

function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`not a #rrggbb colour: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const TEXT = 4.5;
const NON_TEXT = 3;
const pairs: [fg: string, bg: string, min: number][] = [
  ["fg", "bg.default", TEXT],
  ["fg", "bg.subtle", TEXT],
  ["fg.muted", "bg.default", TEXT],
  ["fg.muted", "bg.subtle", TEXT],
  ["fg.subtle", "bg.default", TEXT],
  ["fg.error", "bg.default", TEXT],
  ["fg.error", "bg.error", TEXT],
  ["fg.warning", "bg.default", TEXT],
  ["fg.warning", "bg.warning", TEXT],
  ["fg.success", "bg.default", TEXT],
  ["fg.success", "bg.success", TEXT],
  ["fg.info", "bg.default", TEXT],
  ["fg.info", "bg.info", TEXT],
  ["fg.inverted", "bg.inverted", TEXT],
  ["brand.fg", "bg.default", TEXT],
  ["brand.fg", "brand.subtle", TEXT],
  ["brand.contrast", "brand.solid", TEXT],
  ["border.emphasized", "bg.default", NON_TEXT],
  ["focusRing", "bg.default", NON_TEXT],
  ["brand.solid", "bg.default", NON_TEXT],
];

describe("semantic colour contrast (WCAG 2.2 AA)", () => {
  for (const mode of ["_light", "_dark"] as const) {
    it(`all pairs pass in ${mode.slice(1)} mode`, () => {
      const failures = pairs
        .map(([fg, bg, min]) => ({ fg, bg, min, a: color(fg, mode), b: color(bg, mode) }))
        .map((p) => ({ ...p, r: ratio(p.a, p.b) }))
        .filter((p) => p.r < p.min)
        .map((p) => `${p.fg} ${p.a} on ${p.bg} ${p.b}: ${p.r.toFixed(2)} < ${p.min}`);
      expect(failures).toEqual([]);
    });
  }
});
