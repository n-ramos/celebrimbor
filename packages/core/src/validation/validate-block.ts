import type { AnyBlockDefinition } from "../block/types";
import type { PageBlock } from "../document/types";
import type { ValidationResult } from "./types";
import { validateSchemaValue } from "./validate-schema";

export function validateBlock(definition: AnyBlockDefinition, block: PageBlock): ValidationResult {
  const contentResult = validateSchemaValue(definition.schema, block.content);
  const settingsResult = definition.settingsSchema
    ? validateSchemaValue(definition.settingsSchema, block.settings)
    : { valid: true, issues: [] };
  const customResult = definition.validate?.(block.content, block.settings);

  const issues = [...contentResult.issues, ...settingsResult.issues, ...(customResult?.issues ?? [])];

  return {
    valid: issues.length === 0,
    issues,
  };
}
