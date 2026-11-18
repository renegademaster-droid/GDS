// packages/theme/src/theme.ts
import { defineConfig } from "@chakra-ui/react";
import { fontSizes as figmaFontSizes, fontWeights as figmaFontWeights, fonts as figmaFonts, radii as figmaRadii, spacing as figmaSpacing } from "./figma-tokens";
import { textStyles } from "./textStyles";
import { gdsColorTokens, gdsSemanticColors } from "./gds-tokens";

const fontSizesTokens = Object.fromEntries(
  Object.entries(figmaFontSizes).map(([k, v]) => [k, { value: v }])
);
const fontWeightsTokens = Object.fromEntries(
  Object.entries(figmaFontWeights).map(([k, v]) => [k, { value: v }])
);
const fontsTokens = Object.fromEntries(
  Object.entries(figmaFonts).map(([k, v]) => [k, { value: v }])
);
const radiiTokens = Object.fromEntries(
  Object.entries(figmaRadii).map(([k, v]) => [k, { value: v }])
);
const spacingTokens = Object.fromEntries(
  Object.entries(figmaSpacing).map(([k, v]) => [k, { value: v }])
);

// WCAG 1.4.11 Non-text Contrast: a form field's boundary must have 3:1 against the page. `border`
// (gray/200) is 1.26:1 on white; `border.emphasized` (gray/500) is 4.83:1 light / 4.35:1 dark.
const FIELD_BORDER = "border.emphasized";

// IMPORTANT: This is a config *extension*, not a full replacement.
export const gdsTheme = defineConfig({
  theme: {
    textStyles,
    tokens: {
      colors: gdsColorTokens as never,
      fonts: fontsTokens as never,
      fontSizes: fontSizesTokens as never,
      fontWeights: fontWeightsTokens as never,
      radii: radiiTokens as never,
      spacing: spacingTokens as never,
    },
    semanticTokens: {
      colors: gdsSemanticColors,
    },
    recipes: {
      // WCAG 1.4.3 on hover: Chakra's solid hover (`colorPalette.solid/90`) lightens the fill over a
      // white page, so the label drops below 4.5:1 (brand: 4.40:1). Darken instead (6.61:1).
      button: {
        variants: {
          variant: {
            solid: {
              _hover: {
                bg: "color-mix(in srgb, var(--chakra-colors-color-palette-solid) 85%, black)",
              },
            },
          },
        },
      },
      input: {
        variants: {
          variant: {
            outline: {
              bg: "bg.default",
              borderWidth: "1px",
              borderColor: FIELD_BORDER,
              focusVisibleRing: "inside",
              focusRingColor: "focusRing",
            },
          },
        },
      },
      textarea: {
        variants: {
          variant: {
            outline: {
              bg: "bg.default",
              borderWidth: "1px",
              borderColor: FIELD_BORDER,
              focusVisibleRing: "inside",
              focusRingColor: "focusRing",
            },
          },
        },
      } as never,
    },
    // Slot recipes (multi-part components) must be overridden here: overrides under `recipes` are
    // ignored by Chakra, which is why the nativeSelect/checkboxCard settings had no effect before.
    // Partial overrides are deep-merged by createSystem; the type wants full `slots`, hence the casts.
    slotRecipes: {
      nativeSelect: {
        variants: {
          variant: {
            outline: {
              field: {
                bg: "bg.default",
                borderWidth: "1px",
                borderColor: FIELD_BORDER,
                focusVisibleRing: "inside",
                "--focus-color": "focusRing",
              },
            },
          },
        },
      },
      select: {
        variants: {
          variant: {
            outline: {
              trigger: { borderColor: FIELD_BORDER },
            },
          },
        },
      },
      // WCAG 2.4.7 Focus Visible: RadioCard shows no focus indicator by default (focus is on the hidden
      // input), so the item gets the focus ring when its input has keyboard focus.
      radioCard: {
        base: {
          item: {
            "&:has(input:focus-visible), &[data-focus-visible]": {
              outline: "2px solid",
              outlineColor: "focusRing",
              outlineOffset: "2px",
            },
          },
        },
      },
      checkboxCard: {
        base: {
          root: {
            bg: "bg.default",
          },
        },
        variants: {
          variant: {
            outline: {
              root: {
                bg: "bg.default",
              },
            },
          },
        },
      },
    } as never,
  },
  globalCss: {
    html: {
      // Brand palette on html; semantic text still uses color="fg" (not colorPalette.fg).
      colorPalette: "brand",
      fontFamily: figmaFonts.body ?? "system-ui, sans-serif",
    },
  },
});
