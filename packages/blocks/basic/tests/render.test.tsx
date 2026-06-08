import type { ReactElement, ReactNode } from "react";
import { isValidElement } from "react";
import { describe, expect, it } from "vitest";
import { createBlockFromDefinition } from "@n-ramos/celebrimbor-core";
import { basicBlocks } from "../src";

/**
 * Extrait recursivement le texte d'un arbre d'elements React **sans le monter
 * dans un DOM**. Les composants (ex. `Section`) ne sont pas executes, mais
 * leurs enfants passes en props le sont, ce qui suffit a verifier que le
 * contenu par defaut est bien projete dans le rendu.
 */
function collectText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(collectText).join(" ");
  }
  if (isValidElement(node)) {
    return collectText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

describe("basic blocks rendering", () => {
  it.each(basicBlocks.filter((b) => b.render).map((b) => [b.type, b] as const))(
    "block %s renders a valid React element from its default content",
    (_type, definition) => {
      const block = createBlockFromDefinition(definition);
      const element = definition.render!({ block, children: [] }) as ReactElement;

      // Every block must produce a renderable element without throwing. Text
      // projection is asserted separately (some blocks render HTML or images
      // rather than child text nodes).
      expect(isValidElement(element)).toBe(true);
    },
  );

  it.each(
    basicBlocks
      .filter((b) => b.render && typeof (b.defaultContent as { title?: unknown }).title === "string")
      .map((b) => [b.type, b] as const),
  )("block %s projects its default title into the output", (_type, definition) => {
    const block = createBlockFromDefinition(definition);
    const element = definition.render!({ block, children: [] }) as ReactElement;
    const title = (definition.defaultContent as { title: string }).title;

    expect(collectText(element)).toContain(title);
  });

  it("renders nested array content (columns)", () => {
    const columns = basicBlocks.find((b) => b.type === "columns")!;
    const block = createBlockFromDefinition(columns);
    const text = collectText(columns.render!({ block, children: [] }) as ReactElement);

    expect(text).toContain("Composable");
    expect(text).toContain("Portable");
  });
});
