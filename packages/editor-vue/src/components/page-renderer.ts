import { computed, defineComponent, h, type PropType } from "vue";
import {
  renderDocumentToHtml,
  type BlockRegistry,
  type HtmlRenderOptions,
  type PageDocument,
} from "@n-ramos/core";

/**
 * Rendu du document en Vue via le renderer HTML headless du core. Comme le
 * core est agnostique, la preview Vue ne depend d'aucun renderer React : elle
 * reutilise `renderDocumentToHtml` et injecte le HTML resultant.
 */
export const PageRenderer = defineComponent({
  name: "PageRenderer",
  props: {
    document: { type: Object as PropType<PageDocument>, required: true },
    registry: { type: Object as PropType<BlockRegistry>, required: true },
    options: { type: Object as PropType<HtmlRenderOptions>, default: undefined },
  },
  setup(props) {
    const html = computed(() => renderDocumentToHtml(props.document, props.registry, props.options ?? {}));
    return () => h("div", { class: "mpb-rendered", innerHTML: html.value });
  },
});
