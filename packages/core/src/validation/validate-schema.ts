import { z } from "zod";
import { defaultFieldOptions, flattenDataFields, type BlockField, type BlockSchema } from "../schema/types";
import type { ValidationIssue, ValidationResult } from "./types";

export function validateSchemaValue<TValue>(schema: BlockSchema<TValue>, value: unknown): ValidationResult {
  const issues = validateFields(schema.fields, value, "");

  if (schema.zodSchema && schema.zodSchema instanceof z.ZodType) {
    const result = schema.zodSchema.safeParse(value);
    if (!result.success) {
      for (const issue of result.error.issues) {
        issues.push({
          path: issue.path.join("."),
          message: issue.message,
          code: issue.code,
        });
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

function validateFields(fields: BlockField[], value: unknown, prefix: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const source = isRecord(value) ? value : {};

  // Les conteneurs `row`/`tabs` ne portent pas de donnees: on valide leurs
  // enfants a plat au meme niveau.
  for (const field of flattenDataFields(fields)) {
    const fieldPath = prefix ? `${prefix}.${field.name}` : field.name;
    const fieldValue = source[field.name];

    if (field.required && isEmpty(fieldValue)) {
      issues.push({
        path: fieldPath,
        message: `${field.label} is required.`,
        code: "required",
      });
      continue;
    }

    if (fieldValue == null) {
      continue;
    }

    if (field.type === "object") {
      issues.push(...validateFields(field.fields, fieldValue, fieldPath));
      continue;
    }

    if (field.type === "array") {
      if (!Array.isArray(fieldValue)) {
        issues.push({
          path: fieldPath,
          message: `${field.label} must be an array.`,
          code: "invalid_type",
        });
        continue;
      }

      if (field.minItems !== undefined && fieldValue.length < field.minItems) {
        issues.push({
          path: fieldPath,
          message: `${field.label} must contain at least ${field.minItems} item(s).`,
          code: "too_small",
        });
      }

      if (field.maxItems !== undefined && fieldValue.length > field.maxItems) {
        issues.push({
          path: fieldPath,
          message: `${field.label} must contain at most ${field.maxItems} item(s).`,
          code: "too_big",
        });
      }

      if (field.of.type === "object") {
        fieldValue.forEach((entry, index) => {
          issues.push(...validateFields((field.of as typeof field.of & { fields: BlockField[] }).fields, entry, `${fieldPath}.${index}`));
        });
      }
      continue;
    }

    const enumOptions =
      field.type === "select" ||
      field.type === "radio" ||
      field.type === "alignment" ||
      field.type === "textalign"
        ? field.options ?? defaultFieldOptions(field.type)
        : undefined;
    if (enumOptions?.length) {
      const allowedValues = enumOptions.map((option) => option.value);
      if (!allowedValues.includes(fieldValue as string)) {
        issues.push({
          path: fieldPath,
          message: `${field.label} contains an unsupported option.`,
          code: "invalid_enum_value",
        });
      }
    }
  }

  return issues;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}
