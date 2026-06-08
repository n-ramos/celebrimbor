import { z } from "zod";
import {
  defaultFieldOptions,
  flattenDataFields,
  type BlockField,
  type BlockSchema,
  type DataField,
} from "./types";

/**
 * Genere un schema Zod a partir de la description declarative des `fields`.
 *
 * Objectif: faire des `fields` la **source unique de verite**. Plutot que de
 * declarer deux fois la forme du contenu (une fois en `fields`, une fois en
 * `zodSchema`), on derive le `zodSchema` automatiquement.
 *
 * ```ts
 * const schema: BlockSchema = { fields };
 * schema.zodSchema = schemaToZod(fields);
 * ```
 *
 * Regles de mapping:
 * - `text`/`textarea`/`richtext`/`markdown`/`url`/`color`/`date` -> `string`
 *   (`.min(1)` si le champ est `required`)
 * - `number`/`range` -> `number` (avec `.min`/`.max` issus de `min`/`max`)
 * - `select`/`radio`/`alignment`/`textalign` avec options -> `enum` des valeurs autorisees
 * - `asset` -> objet asset nullable
 * - `object` -> objet imbrique recursif
 * - `array` -> tableau (avec `.min`/`.max` issus de `minItems`/`maxItems`)
 * - `custom` -> `unknown` (le composant gere sa propre valeur)
 * - `row`/`tabs` -> aplatis: leurs enfants sont remontes au niveau parent
 * - un champ non `required` est rendu optionnel
 */
export function schemaToZod(fields: BlockField[]): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = {};
  // Les conteneurs `row`/`tabs` sont aplatis: ils n'ajoutent pas de cle, seuls
  // leurs champs enfants porteurs de donnees comptent.
  for (const field of flattenDataFields(fields)) {
    shape[field.name] = fieldToZod(field);
  }
  return z.object(shape);
}

/** Variante pratique a partir d'un `BlockSchema` complet. */
export function blockSchemaToZod(schema: BlockSchema): z.ZodObject<z.ZodRawShape> {
  return schemaToZod(schema.fields);
}

/**
 * Renvoie une copie du `BlockSchema` avec un `zodSchema` derive des `fields`
 * (sans ecraser un `zodSchema` deja fourni).
 */
export function withGeneratedZodSchema<TValue>(schema: BlockSchema<TValue>): BlockSchema<TValue> {
  if (schema.zodSchema) {
    return schema;
  }
  return { ...schema, zodSchema: schemaToZod(schema.fields) };
}

function fieldToZod(field: DataField): z.ZodTypeAny {
  const base = baseFieldToZod(field);
  return field.required ? base : base.optional();
}

function baseFieldToZod(field: DataField): z.ZodTypeAny {
  switch (field.type) {
    case "custom":
      // Le composant custom controle sa propre valeur: on ne contraint pas la forme.
      return z.unknown();
    case "object":
      return schemaToZod(field.fields);
    case "array": {
      let array = z.array(baseFieldToZod(field.of));
      if (field.minItems !== undefined) {
        array = array.min(field.minItems);
      }
      if (field.maxItems !== undefined) {
        array = array.max(field.maxItems);
      }
      return array;
    }
    case "number":
    case "range": {
      let number = z.number();
      if (field.min !== undefined) {
        number = number.min(field.min);
      }
      if (field.max !== undefined) {
        number = number.max(field.max);
      }
      return number;
    }
    case "boolean":
      return z.boolean();
    case "asset":
      return z
        .object({
          id: z.string(),
          url: z.string(),
          alt: z.string().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
          meta: z.record(z.unknown()).optional(),
        })
        .nullable();
    case "select":
    case "radio":
    case "alignment":
    case "textalign": {
      const options = field.options ?? defaultFieldOptions(field.type);
      const values = options?.map((option) => String(option.value)) ?? [];
      if (values.length > 0) {
        return z.enum(values as [string, ...string[]]);
      }
      return z.string();
    }
    default: {
      const text = z.string();
      return field.required ? text.min(1) : text;
    }
  }
}
