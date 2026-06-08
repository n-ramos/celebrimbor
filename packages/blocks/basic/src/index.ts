import type { BlockDefinition, BlockRegistry } from "@n-ramos/core";
import { columnsBlock } from "./columns";
import { ctaBlock } from "./cta";
import { faqBlock } from "./faq";
import { galleryBlock } from "./gallery";
import { heroBlock } from "./hero";
import { imageTextBlock } from "./image-text";
import { richTextBlock } from "./rich-text";

export const basicBlocks = [
  heroBlock,
  richTextBlock,
  imageTextBlock,
  ctaBlock,
  faqBlock,
  galleryBlock,
  columnsBlock,
] satisfies BlockDefinition[];

export function registerBasicBlocks(registry: BlockRegistry) {
  basicBlocks.forEach((block) => {
    if (!registry.has(block.type)) {
      registry.register(block);
    }
  });

  return registry;
}

export * from "./columns";
export * from "./cta";
export * from "./faq";
export * from "./gallery";
export * from "./hero";
export * from "./image-text";
export * from "./rich-text";
