import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createBlockRegistry, createDocument, defineBlock } from "@n-ramos/core";
import { PageBuilder } from "../src";

describe("@n-ramos/editor-react", () => {
  it("renders the builder shell and block library", () => {
    const registry = createBlockRegistry([
      defineBlock({
        type: "hero",
        label: "Hero",
        defaultContent: { title: "" },
        schema: {
          fields: [{ name: "title", type: "text", label: "Title" }],
        },
      }),
    ]);

    render(
      <PageBuilder
        document={createDocument()}
        registry={registry}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Agnostic Builder")).toBeTruthy();
    expect(screen.getByText("Compose ta page")).toBeTruthy();
    expect(screen.getByText("Ajouter un bloc")).toBeTruthy();
    expect(screen.getByText("Rendu & sortie JSON")).toBeTruthy();
  });
});
