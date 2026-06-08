// Standalone embed entry.
//
// Registers the <my-page-builder> custom element together with the basic block
// library, so a non-React host (Laravel/Filament, plain HTML, ...) can drop the
// element on a page. Everything is bundled from source against a single React
// instance (see vite.config.ts aliases + dedupe) to avoid the dual-React issue.
//
// Swap registerBasicBlocks(...) for your own block library to ship custom blocks.

import "@n-ramos/celebrimbor-editor-element/styles.css";
import { createBlockRegistry } from "@n-ramos/celebrimbor-core";
import { registerBasicBlocks } from "@n-ramos/celebrimbor-blocks-basic";
import { definePageBuilderElement } from "@n-ramos/celebrimbor-editor-element";

const registry = registerBasicBlocks(createBlockRegistry());

definePageBuilderElement({ registry });
