import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { describe, expect, it } from "vitest";
import {
  createBlockRegistry,
  createDocument,
  defineBlock,
  type PageDocument,
} from "@n-ramos/celebrimbor-core";
import { PageBuilder, SchemaForm, usePageBuilder } from "../src";

const heroDef = defineBlock({
  type: "hero",
  label: "Hero",
  category: "Marketing",
  defaultContent: { title: "" },
  schema: { fields: [{ name: "title", type: "text", label: "Title", required: true }] },
});

function registry() {
  return createBlockRegistry([heroDef]);
}

describe("usePageBuilder (Vue composable)", () => {
  it("adds a block, emits the new document and selects it", () => {
    const doc = ref<PageDocument>(createDocument());
    const builder = usePageBuilder(doc, (next) => {
      doc.value = next;
    });

    builder.add(heroDef);

    expect(doc.value.blocks).toHaveLength(1);
    expect(builder.selectedId.value).toBe(doc.value.blocks[0]?.id);
    expect(builder.selectedBlock.value?.type).toBe("hero");
  });

  it("removes a block and clears the selection", () => {
    const doc = ref<PageDocument>(createDocument());
    const builder = usePageBuilder(doc, (next) => {
      doc.value = next;
    });
    builder.add(heroDef);
    const id = doc.value.blocks[0]!.id;

    builder.remove(id);
    expect(doc.value.blocks).toHaveLength(0);
    expect(builder.selectedId.value).toBeUndefined();
  });

  it("updates content immutably", () => {
    const doc = ref<PageDocument>(createDocument());
    const builder = usePageBuilder(doc, (next) => {
      doc.value = next;
    });
    builder.add(heroDef);
    const id = doc.value.blocks[0]!.id;

    builder.updateContent(id, { title: "Hello" });
    expect(doc.value.blocks[0]?.content).toEqual({ title: "Hello" });
  });
});

describe("SchemaForm (Vue)", () => {
  it("emits update:value when a field changes", async () => {
    const wrapper = mount(SchemaForm, {
      props: { fields: heroDef.schema.fields, value: { title: "a" } },
    });
    await wrapper.get("input").setValue("ab");
    const events = wrapper.emitted("update:value");
    expect(events?.[0]?.[0]).toEqual({ title: "ab" });
  });

  it("renders a validation error for a field", () => {
    const wrapper = mount(SchemaForm, {
      props: {
        fields: heroDef.schema.fields,
        value: { title: "" },
        issues: [{ path: "title", message: "Title is required." }],
      },
    });
    expect(wrapper.get('[role="alert"]').text()).toBe("Title is required.");
  });
});

describe("PageBuilder (Vue)", () => {
  it("renders the block library from the registry", () => {
    const wrapper = mount(PageBuilder, {
      props: { document: createDocument(), registry: registry() },
    });
    expect(wrapper.get(".mpb-add-block").text()).toBe("Hero");
  });

  it("emits update:document with a new block when adding", async () => {
    const wrapper = mount(PageBuilder, {
      props: { document: createDocument(), registry: registry() },
    });
    await wrapper.get(".mpb-add-block").trigger("click");

    const events = wrapper.emitted("update:document");
    expect(events).toHaveLength(1);
    expect((events![0]![0] as PageDocument).blocks[0]?.type).toBe("hero");
  });

  it("emits save with the current document", async () => {
    const document = createDocument({ id: "page" });
    const wrapper = mount(PageBuilder, { props: { document, registry: registry() } });
    await wrapper.get(".mpb-save").trigger("click");

    const events = wrapper.emitted("save");
    expect((events![0]![0] as PageDocument).id).toBe("page");
  });

  it("renders an empty-state when there is no block", () => {
    const wrapper = mount(PageBuilder, {
      props: { document: createDocument(), registry: registry() },
    });
    expect(wrapper.find(".mpb-canvas-empty").exists()).toBe(true);
  });
});
