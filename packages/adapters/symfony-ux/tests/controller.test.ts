import { Application } from "@hotwired/stimulus";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import PageBuilderController from "../src/controller";

const IDENTIFIER = "celebrimbor--page-builder";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

let application: Application;

beforeEach(() => {
  application = Application.start();
  application.register(IDENTIFIER, PageBuilderController);
});

afterEach(() => {
  application.stop();
  document.body.innerHTML = "";
});

describe("page-builder controller", () => {
  it("creates the custom element and applies attributes from values", async () => {
    document.body.innerHTML = `
      <div
        data-controller="${IDENTIFIER}"
        data-${IDENTIFIER}-name-value="page[document]"
        data-${IDENTIFIER}-format-value="document"
        data-${IDENTIFIER}-value-value='{"version":"1.0.0","blocks":[]}'
        data-${IDENTIFIER}-preview-url-value="/admin/pages/1/preview"
      ></div>
    `;
    await tick();

    const element = document.querySelector("my-page-builder");
    expect(element).not.toBeNull();
    expect(element?.getAttribute("name")).toBe("page[document]");
    expect(element?.getAttribute("format")).toBe("document");
    expect(element?.getAttribute("value")).toBe('{"version":"1.0.0","blocks":[]}');
    expect(element?.getAttribute("preview-url")).toBe("/admin/pages/1/preview");
  });

  it("defaults format to portable and omits unset attributes", async () => {
    document.body.innerHTML = `<div data-controller="${IDENTIFIER}"></div>`;
    await tick();

    const element = document.querySelector("my-page-builder");
    expect(element?.getAttribute("format")).toBe("portable");
    expect(element?.hasAttribute("name")).toBe(false);
    expect(element?.hasAttribute("preview-url")).toBe(false);
  });

  it("reuses a nested custom element instead of creating one", async () => {
    document.body.innerHTML = `
      <div data-controller="${IDENTIFIER}" data-${IDENTIFIER}-format-value="document">
        <my-page-builder></my-page-builder>
      </div>
    `;
    await tick();

    const elements = document.querySelectorAll("my-page-builder");
    expect(elements).toHaveLength(1);
    expect(elements[0]?.getAttribute("format")).toBe("document");
  });

  it("relays my-page-builder events as namespaced celebrimbor events", async () => {
    document.body.innerHTML = `<div data-controller="${IDENTIFIER}"></div>`;
    await tick();

    const element = document.querySelector("my-page-builder")!;
    const detail = { document: { version: "1.0.0", blocks: [] } };

    const changes: unknown[] = [];
    const saves: unknown[] = [];
    document.addEventListener("celebrimbor:change", (e) => changes.push((e as CustomEvent).detail));
    document.addEventListener("celebrimbor:save", (e) => saves.push((e as CustomEvent).detail));

    element.dispatchEvent(new CustomEvent("my-page-builder:change", { detail, bubbles: true }));
    element.dispatchEvent(new CustomEvent("my-page-builder:save", { detail, bubbles: true }));

    expect(changes).toEqual([detail]);
    expect(saves).toEqual([detail]);
  });
});
