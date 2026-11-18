import { describe, expect, it } from "vitest";
import { system } from "./system";

/**
 * Accessibility overrides must reach the created system. Checks the merged recipes, not the config:
 * an override placed under the wrong key (e.g. a slot recipe under `recipes`) is silently ignored.
 */
const recipe = (key: string) => system.getRecipe(key) as any;
const slotRecipe = (key: string) => system.getSlotRecipe(key) as any;

describe("accessibility recipe overrides (merged system)", () => {
  it("form fields use border.emphasized for a 3:1 boundary (WCAG 1.4.11)", () => {
    expect(recipe("input")?.variants?.variant?.outline?.borderColor).toBe("border.emphasized");
    expect(recipe("textarea")?.variants?.variant?.outline?.borderColor).toBe("border.emphasized");
    expect(slotRecipe("nativeSelect")?.variants?.variant?.outline?.field?.borderColor).toBe(
      "border.emphasized",
    );
    expect(slotRecipe("select")?.variants?.variant?.outline?.trigger?.borderColor).toBe(
      "border.emphasized",
    );
  });

  it("solid buttons darken on hover instead of lightening (WCAG 1.4.3)", () => {
    expect(recipe("button")?.variants?.variant?.solid?._hover?.bg).toContain("black");
  });

  it("radio cards show a focus ring when their input has keyboard focus (WCAG 2.4.7)", () => {
    const item = slotRecipe("radioCard")?.base?.item ?? {};
    expect(item["&:has(input:focus-visible), &[data-focus-visible]"]).toMatchObject({
      outlineColor: "focusRing",
    });
  });

  it("checkbox cards get the page background", () => {
    expect(slotRecipe("checkboxCard")?.base?.root?.bg).toBe("bg.default");
  });
});
