import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BlockField } from "@n-ramos/celebrimbor-core";
import { SchemaForm } from "../src";

afterEach(cleanup);

const fields: BlockField[] = [
  { name: "title", type: "text", label: "Title", required: true },
  {
    name: "cta",
    type: "object",
    label: "CTA",
    fields: [{ name: "label", type: "text", label: "Label", required: true }],
  },
  {
    name: "items",
    type: "array",
    label: "Items",
    of: {
      name: "item",
      type: "object",
      label: "Item",
      fields: [{ name: "question", type: "text", label: "Question", required: true }],
    },
  },
];

describe("SchemaForm validation display", () => {
  it("shows a direct error under a primitive field", () => {
    render(
      <SchemaForm
        schema={{ fields }}
        value={{ title: "" }}
        onChange={vi.fn()}
        issues={[{ path: "title", message: "Title is required." }]}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("Title is required.");
  });

  it("scopes nested object errors to the child field", () => {
    render(
      <SchemaForm
        schema={{ fields }}
        value={{ title: "ok", cta: { label: "" } }}
        onChange={vi.fn()}
        issues={[{ path: "cta.label", message: "Label is required." }]}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("Label is required.");
  });

  it("scopes array item errors to the right entry", () => {
    render(
      <SchemaForm
        schema={{ fields }}
        value={{ title: "ok", items: [{ question: "" }] }}
        onChange={vi.fn()}
        issues={[{ path: "items.0.question", message: "Question is required." }]}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("Question is required.");
  });

  it("renders no alert when there are no issues", () => {
    render(<SchemaForm schema={{ fields }} value={{ title: "ok" }} onChange={vi.fn()} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("emits onChange when a text field changes", () => {
    const onChange = vi.fn();
    render(<SchemaForm schema={{ fields: [fields[0]!] }} value={{ title: "a" }} onChange={onChange} />);

    const input = screen.getByDisplayValue("a");
    fireEvent.change(input, { target: { value: "ab" } });
    expect(onChange).toHaveBeenCalledWith({ title: "ab" });
  });
});
