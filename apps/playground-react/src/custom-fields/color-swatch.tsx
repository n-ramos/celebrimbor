import type { CustomFieldComponent } from "@n-ramos/celebrimbor-editor-react";

const DEFAULT_SWATCHES = ["#0ea5e9", "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#0f172a"];

/**
 * Exemple de champ `custom`: une palette de pastilles de couleur.
 * Branche cote editeur via `customFields={{ "color-swatch": ColorSwatchField }}`.
 * Lit ses presets dans `field.options.presets`.
 */
export const ColorSwatchField: CustomFieldComponent = ({ field, value, onChange }) => {
  const swatches = (field.options?.presets as string[] | undefined) ?? DEFAULT_SWATCHES;
  const current = typeof value === "string" ? value : "";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {swatches.map((color) => {
        const active = current.toLowerCase() === color.toLowerCase();
        return (
          <button
            key={color}
            type="button"
            aria-label={color}
            aria-pressed={active}
            onClick={() => onChange(color)}
            style={{
              width: "2rem",
              height: "2rem",
              borderRadius: "9999px",
              background: color,
              cursor: "pointer",
              border: active ? "3px solid #0f172a" : "3px solid transparent",
              boxShadow: active ? "0 0 0 2px #fff inset" : "none",
            }}
          />
        );
      })}
    </div>
  );
};
