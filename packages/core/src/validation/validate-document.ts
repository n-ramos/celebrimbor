import type { BlockRegistry } from "../registry/create-block-registry";
import type { PageBlock, PageDocument } from "../document/types";
import type { ValidationIssue, ValidationResult } from "./types";
import { validateBlock } from "./validate-block";

export function validateDocument(document: PageDocument, registry: BlockRegistry): ValidationResult {
  const issues: ValidationIssue[] = [];

  traverse(document.blocks, (block, path) => {
    const definition = registry.get(block.type);
    if (!definition) {
      issues.push({
        path,
        message: `Unknown block type "${block.type}".`,
        code: "unknown_block",
        severity: "error",
      });
      return;
    }

    if ((definition as { unknown?: boolean }).unknown === true) {
      // Le type n'est pas reellement enregistre : il est rendu via la fallback
      // factory. On le signale sans invalider le document (le JSON est preserve).
      issues.push({
        path,
        message: `Unknown block type "${block.type}" rendered with the fallback definition.`,
        code: "unknown_block",
        severity: "warning",
      });
      return;
    }

    const result = validateBlock(definition, block);
    for (const issue of result.issues) {
      issues.push({
        ...issue,
        path: issue.path ? `${path}.${issue.path}` : path,
      });
    }
  });

  return {
    valid: !issues.some((issue) => (issue.severity ?? "error") === "error"),
    issues,
  };
}

function traverse(blocks: PageBlock[], callback: (block: PageBlock, path: string) => void, prefix = "blocks"): void {
  blocks.forEach((block, index) => {
    const blockPath = `${prefix}.${index}`;
    callback(block, blockPath);

    if (block.children?.length) {
      traverse(block.children, callback, `${blockPath}.children`);
    }
  });
}
