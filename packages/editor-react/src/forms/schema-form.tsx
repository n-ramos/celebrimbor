import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Boxes,
  CalendarDays,
  Check,
  Code2,
  Heading1,
  ImageIcon,
  Italic,
  Link2,
  List,
  Palette,
  Plus,
  Rows3,
  SlidersHorizontal,
  TextCursorInput,
  Trash2,
  Type,
} from "lucide-react";
import {
  defaultFieldOptions,
  flattenDataFields,
  type ArrayField,
  type Asset,
  type BlockField,
  type CustomField,
  type DataField,
  type ObjectField,
  type PrimitiveField,
  type RowField,
  type TabsField,
  type ValidationIssue,
} from "@n-ramos/celebrimbor-core";
import type { SchemaFormProps } from "../types";

export function SchemaForm<TValue extends Record<string, unknown>>({
  schema,
  value,
  onChange,
  assetPicker,
  customFields,
  issues,
}: SchemaFormProps<TValue>) {
  return (
    <div className="space-y-4">
      {schema.fields.map((field, index) => (
        <FieldRenderer
          key={fieldKey(field, index)}
          field={field}
          value={value}
          onChange={onChange}
          assetPicker={assetPicker}
          customFields={customFields}
          issues={issues}
        />
      ))}
    </div>
  );
}

type RendererProps<TValue extends Record<string, unknown>> = {
  field: BlockField;
  value: TValue;
  onChange: (value: TValue) => void;
  assetPicker?: SchemaFormProps["assetPicker"];
  customFields?: SchemaFormProps["customFields"];
  issues?: ValidationIssue[] | undefined;
};

function FieldRenderer<TValue extends Record<string, unknown>>({
  field,
  value,
  onChange,
  assetPicker,
  customFields,
  issues,
}: RendererProps<TValue>) {
  // Conteneurs de presentation: leurs enfants ecrivent a plat dans `value`.
  if (field.type === "row") {
    return (
      <RowLayout
        field={field}
        value={value}
        onChange={onChange}
        assetPicker={assetPicker}
        customFields={customFields}
        issues={issues}
      />
    );
  }

  if (field.type === "tabs") {
    return (
      <TabsLayout
        field={field}
        value={value}
        onChange={onChange}
        assetPicker={assetPicker}
        customFields={customFields}
        issues={issues}
      />
    );
  }

  const fieldValue = value[field.name];
  const directError = findDirectError(issues, field.name);

  if (field.type === "custom") {
    return (
      <FieldSection field={field} icon={<Boxes className="h-4 w-4" />} error={directError}>
        <CustomFieldEditor
          field={field}
          value={fieldValue}
          onChange={(nextValue) => onChange(setValue(value, field.name, nextValue))}
          customFields={customFields}
        />
      </FieldSection>
    );
  }

  if (field.type === "object") {
    return (
      <FieldSection field={field} icon={<Rows3 className="h-4 w-4" />} error={directError}>
        <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/70 p-3">
          <SchemaForm
            schema={{ fields: field.fields }}
            value={asRecord(fieldValue)}
            onChange={(nextValue) => onChange(setValue(value, field.name, nextValue))}
            assetPicker={assetPicker}
            customFields={customFields}
            issues={scopeIssues(issues, field.name)}
          />
        </div>
      </FieldSection>
    );
  }

  if (field.type === "array") {
    return (
      <ArrayFieldEditor
        field={field}
        value={Array.isArray(fieldValue) ? fieldValue : []}
        onChange={(nextValue) => onChange(setValue(value, field.name, nextValue))}
        assetPicker={assetPicker}
        customFields={customFields}
        issues={scopeIssues(issues, field.name)}
        error={directError}
      />
    );
  }

  return (
    <FieldSection field={field} icon={iconForField(field.type)} error={directError}>
      <PrimitiveFieldEditor
        field={field}
        value={fieldValue}
        onChange={(nextValue) => onChange(setValue(value, field.name, nextValue))}
        assetPicker={assetPicker}
      />
    </FieldSection>
  );
}

type LayoutProps<TValue extends Record<string, unknown>> = {
  value: TValue;
  onChange: (value: TValue) => void;
  assetPicker?: SchemaFormProps["assetPicker"];
  customFields?: SchemaFormProps["customFields"];
  issues?: ValidationIssue[] | undefined;
};

function RowLayout<TValue extends Record<string, unknown>>({
  field,
  value,
  onChange,
  assetPicker,
  customFields,
  issues,
}: LayoutProps<TValue> & { field: RowField }) {
  const columns = field.columns ?? `repeat(${Math.max(field.fields.length, 1)}, minmax(0, 1fr))`;
  return (
    <div className="space-y-2">
      {field.label ? (
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{field.label}</div>
      ) : null}
      <div className="grid items-start gap-3" style={{ gridTemplateColumns: columns }}>
        {field.fields.map((child, index) => (
          <div key={fieldKey(child, index)} className="min-w-0">
            <FieldRenderer
              field={child}
              value={value}
              onChange={onChange}
              assetPicker={assetPicker}
              customFields={customFields}
              issues={issues}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TabsLayout<TValue extends Record<string, unknown>>({
  field,
  value,
  onChange,
  assetPicker,
  customFields,
  issues,
}: LayoutProps<TValue> & { field: TabsField }) {
  const [active, setActive] = useState(0);
  const activeIndex = active < field.tabs.length ? active : 0;
  const tab = field.tabs[activeIndex];

  return (
    <div className="space-y-3">
      {field.label ? (
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{field.label}</div>
      ) : null}
      <div role="tablist" className="flex flex-wrap gap-2 rounded-[1rem] border border-slate-200 bg-slate-50 p-1">
        {field.tabs.map((entry, index) => {
          const selected = index === activeIndex;
          return (
            <button
              key={`${entry.label}-${index}`}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`rounded-[0.75rem] px-4 py-2 text-sm font-medium transition ${
                selected ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setActive(index)}
            >
              {entry.label}
            </button>
          );
        })}
      </div>
      <div className="space-y-4">
        {tab?.fields.map((child, index) => (
          <FieldRenderer
            key={fieldKey(child, index)}
            field={child}
            value={value}
            onChange={onChange}
            assetPicker={assetPicker}
            customFields={customFields}
            issues={issues}
          />
        ))}
      </div>
    </div>
  );
}

type CustomFieldEditorProps = {
  field: CustomField;
  value: unknown;
  onChange: (value: unknown) => void;
  customFields?: SchemaFormProps["customFields"];
};

function CustomFieldEditor({ field, value, onChange, customFields }: CustomFieldEditorProps) {
  const Component = customFields?.[field.component];
  if (!Component) {
    return (
      <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Champ custom <code>{field.component}</code> non enregistre. Fournis-le via <code>customFields</code>.
      </div>
    );
  }
  return <Component field={field} value={value} onChange={onChange} />;
}

type FieldSectionProps = {
  field: { label: string; description?: string | undefined; required?: boolean | undefined };
  icon?: ReactNode;
  error?: string | undefined;
  children: ReactNode;
};

function FieldSection({ field, icon, error, children }: FieldSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        {icon ? <div className="mt-0.5 text-slate-400">{icon}</div> : null}
        <div className="min-w-0">
          <label className="block text-sm font-semibold text-slate-800">
            {field.label}
            {field.required ? <span className="ml-1 text-rose-500">*</span> : null}
          </label>
          {field.description ? <p className="mt-1 text-xs text-slate-500">{field.description}</p> : null}
        </div>
      </div>
      {children}
      {error ? <p role="alert" className="text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}

function findDirectError(issues: ValidationIssue[] | undefined, name: string): string | undefined {
  return issues?.find((issue) => issue.path === name)?.message;
}

function scopeIssues(issues: ValidationIssue[] | undefined, prefix: string): ValidationIssue[] | undefined {
  if (!issues?.length) {
    return undefined;
  }

  const scoped = issues
    .filter((issue) => issue.path.startsWith(`${prefix}.`))
    .map((issue) => ({ ...issue, path: issue.path.slice(prefix.length + 1) }));

  return scoped.length ? scoped : undefined;
}

type PrimitiveEditorProps = {
  field: PrimitiveField;
  value: unknown;
  onChange: (value: unknown) => void;
  assetPicker?: SchemaFormProps["assetPicker"];
};

function PrimitiveFieldEditor({ field, value, onChange, assetPicker }: PrimitiveEditorProps) {
  if (field.type === "boolean") {
    return (
      <button
        type="button"
        className={`flex w-full items-center justify-between rounded-[1rem] border px-4 py-3 text-left transition ${
          value
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-slate-200 bg-white text-slate-600"
        }`}
        onClick={() => onChange(!Boolean(value))}
      >
        <span className="text-sm font-medium">{field.label}</span>
        <span
          className={`grid h-6 w-6 place-items-center rounded-full ${
            value ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
          }`}
        >
          <Check className="h-4 w-4" />
        </span>
      </button>
    );
  }

  if (field.type === "asset") {
    return <AssetFieldEditor value={value} onChange={onChange} assetPicker={assetPicker} />;
  }

  if (field.type === "richtext") {
    return <RichTextFieldEditor value={String(value ?? "")} onChange={onChange} />;
  }

  if (field.type === "markdown") {
    return <MarkdownFieldEditor value={String(value ?? "")} onChange={onChange} />;
  }

  if (field.type === "textarea") {
    return (
      <textarea
        rows={5}
        className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (field.type === "radio" && field.options?.length) {
    return (
      <div className="flex flex-wrap gap-2">
        {field.options.map((option) => {
          const active = String(value ?? "") === String(option.value);
          return (
            <button
              key={String(option.value)}
              type="button"
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-blue-600 bg-blue-600 text-white shadow-[0_14px_35px_-20px_rgba(37,99,235,0.75)]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.type === "select" && field.options?.length) {
    return (
      <select
        className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
      >
        {field.options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "color") {
    return (
      <div className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-white p-2">
        <input
          type="color"
          className="h-11 w-14 rounded-xl border border-slate-200 bg-white"
          value={String(value ?? "#000000")}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          type="text"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    );
  }

  if (field.type === "range") {
    const min = field.min ?? 0;
    const max = field.max ?? 100;
    const step = field.step ?? 1;
    const current = typeof value === "number" ? value : Number(value ?? min);
    return (
      <div className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-white px-4 py-3">
        <input
          type="range"
          className="h-2 flex-1 cursor-pointer accent-cyan-500"
          min={min}
          max={max}
          step={step}
          value={Number.isNaN(current) ? min : current}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-700">
          {Number.isNaN(current) ? min : current}
        </span>
      </div>
    );
  }

  if (field.type === "date") {
    return (
      <input
        type="date"
        className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (field.type === "alignment" || field.type === "textalign") {
    const options = field.options ?? defaultFieldOptions(field.type) ?? [];
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = String(value ?? "") === String(option.value);
          return (
            <button
              key={String(option.value)}
              type="button"
              title={option.label}
              aria-label={option.label}
              aria-pressed={active}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-blue-600 bg-blue-600 text-white shadow-[0_14px_35px_-20px_rgba(37,99,235,0.75)]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
              onClick={() => onChange(option.value)}
            >
              {alignmentIcon(String(option.value))}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <input
      type={inputTypeForField(field.type)}
      className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
      value={stringifyValue(value)}
      onChange={(event) => onChange(normalizePrimitiveValue(field.type, event.target.value))}
    />
  );
}

type ArrayFieldEditorProps = {
  field: ArrayField;
  value: unknown[];
  onChange: (value: unknown[]) => void;
  assetPicker?: SchemaFormProps["assetPicker"];
  customFields?: SchemaFormProps["customFields"];
  issues?: ValidationIssue[] | undefined;
  error?: string | undefined;
};

function ArrayFieldEditor({ field, value, onChange, assetPicker, customFields, issues, error }: ArrayFieldEditorProps) {
  const canAdd = field.maxItems === undefined || value.length < field.maxItems;
  const minItems = field.minItems ?? 0;

  return (
    <FieldSection field={field} icon={<Rows3 className="h-4 w-4" />} error={error}>
      <div className="space-y-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-3">
        {value.map((entry, index) => (
          <div key={index} className="overflow-hidden rounded-[1rem] border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {resolveArrayItemTitle(field, entry, index)}
                </div>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  {field.itemLabel ?? field.of.label}
                </div>
              </div>
              <button
                type="button"
                disabled={value.length <= minItems}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => onChange(removeAt(value, index))}
              >
                <span className="inline-flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Retirer
                </span>
              </button>
            </div>

            <div className="p-4">
              {field.of.type === "object" ? (
                <SchemaForm
                  schema={{ fields: field.of.fields }}
                  value={asRecord(entry)}
                  onChange={(nextValue) => onChange(replaceAt(value, index, nextValue))}
                  assetPicker={assetPicker}
                  customFields={customFields}
                  issues={scopeIssues(issues, String(index))}
                />
              ) : (
                <PrimitiveFieldEditor
                  field={field.of}
                  value={entry}
                  onChange={(nextValue) => onChange(replaceAt(value, index, nextValue))}
                  assetPicker={assetPicker}
                />
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          disabled={!canAdd}
          className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onChange([...value, createDefaultValueForField(field.of)])}
        >
          <Plus className="h-4 w-4" />
          Ajouter un item
        </button>
      </div>
    </FieldSection>
  );
}

type AssetFieldEditorProps = {
  value: unknown;
  onChange: (value: unknown) => void;
  assetPicker?: SchemaFormProps["assetPicker"];
};

function AssetFieldEditor({ value, onChange, assetPicker }: AssetFieldEditorProps) {
  const asset = asAsset(value);

  function updateAsset(patch: Partial<Asset>) {
    const nextAsset = compactAsset({
      id: asset?.id ?? "manual-asset",
      url: asset?.url ?? "",
      alt: asset?.alt,
      width: asset?.width,
      height: asset?.height,
      meta: asset?.meta,
      ...patch,
    });
    onChange(nextAsset);
  }

  return (
    <div className="space-y-3 rounded-[1.25rem] border border-slate-200 bg-white p-3">
      <div className="overflow-hidden rounded-[1rem] border border-slate-200 bg-slate-50">
        {asset?.url ? (
          <img className="h-44 w-full object-cover" src={asset.url} alt={asset.alt ?? ""} />
        ) : (
          <div className="grid h-44 place-items-center text-slate-400">
            <div className="text-center">
              <ImageIcon className="mx-auto h-8 w-8" />
              <div className="mt-2 text-sm font-medium">Aucune image selectionnee</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          onClick={async () => {
            const picked = await assetPicker?.pickAsset();
            if (picked) {
              onChange(picked);
            }
          }}
        >
          <ImageIcon className="h-4 w-4" />
          {asset ? "Remplacer l'image" : "Choisir une image"}
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          onClick={() => onChange(null)}
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </button>
      </div>

      <div className="space-y-2">
        <input
          type="url"
          placeholder="https://..."
          className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
          value={asset?.url ?? ""}
          onChange={(event) => updateAsset({ url: event.target.value })}
        />
        <input
          type="text"
          placeholder="Texte alternatif"
          className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
          value={asset?.alt ?? ""}
          onChange={(event) => updateAsset({ alt: event.target.value })}
        />
      </div>
    </div>
  );
}

type RichTextFieldEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

function RichTextFieldEditor({ value, onChange }: RichTextFieldEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  function runCommand(command: string, commandValue?: string) {
    if (!editorRef.current) {
      return;
    }

    editorRef.current.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current.innerHTML);
  }

  return (
    <div className="space-y-3">
      <EditorToolbar
        actions={[
          {
            label: "Titre",
            icon: <Heading1 className="h-4 w-4" />,
            onClick: () => runCommand("formatBlock", "h2"),
          },
          {
            label: "Gras",
            icon: <Bold className="h-4 w-4" />,
            onClick: () => runCommand("bold"),
          },
          {
            label: "Italique",
            icon: <Italic className="h-4 w-4" />,
            onClick: () => runCommand("italic"),
          },
          {
            label: "Lien",
            icon: <Link2 className="h-4 w-4" />,
            onClick: () => {
              const href = window.prompt("URL du lien", "https://");
              if (href) {
                runCommand("createLink", href);
              }
            },
          },
          {
            label: "Liste",
            icon: <List className="h-4 w-4" />,
            onClick: () => runCommand("insertUnorderedList"),
          },
        ]}
      />

      <div className="overflow-hidden rounded-[1rem] border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          WYSIWYG
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="prose prose-slate min-h-[240px] max-w-none px-4 py-3 outline-none"
          onInput={(event) => onChange(event.currentTarget.innerHTML)}
        />
      </div>

      <div className="overflow-hidden rounded-[1rem] border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Source HTML
        </div>
        <textarea
          rows={8}
          className="w-full border-0 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}

type MarkdownFieldEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

function MarkdownFieldEditor({ value, onChange }: MarkdownFieldEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <div className="space-y-3">
      <EditorToolbar
        actions={[
          {
            label: "Titre",
            icon: <Heading1 className="h-4 w-4" />,
            onClick: () => insertSnippet(textareaRef.current, value, onChange, "## Titre"),
          },
          {
            label: "Gras",
            icon: <Bold className="h-4 w-4" />,
            onClick: () => insertAroundSelection(textareaRef.current, value, onChange, "**", "**", "Texte"),
          },
          {
            label: "Italique",
            icon: <Italic className="h-4 w-4" />,
            onClick: () => insertAroundSelection(textareaRef.current, value, onChange, "_", "_", "Texte"),
          },
          {
            label: "Code",
            icon: <Code2 className="h-4 w-4" />,
            onClick: () => insertAroundSelection(textareaRef.current, value, onChange, "`", "`", "code"),
          },
          {
            label: "Liste",
            icon: <List className="h-4 w-4" />,
            onClick: () => insertSnippet(textareaRef.current, value, onChange, "- Element 1\n- Element 2"),
          },
        ]}
      />

      <textarea
        ref={textareaRef}
        rows={10}
        className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-cyan-400"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />

      <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Ce champ stocke du Markdown brut. Son rendu final dependra du renderer que tu utilises dans ton framework
        cible.
      </div>
    </div>
  );
}

type EditorToolbarProps = {
  actions: Array<{
    label: string;
    icon: ReactNode;
    onClick: () => void;
  }>;
};

function EditorToolbar({ actions }: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-[1rem] border border-slate-200 bg-slate-50 p-2">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
          onClick={action.onClick}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
}

function insertAroundSelection(
  textarea: HTMLTextAreaElement | null,
  currentValue: string,
  onChange: (value: string) => void,
  before: string,
  after: string,
  fallback = "",
) {
  if (!textarea) {
    onChange(`${currentValue}${before}${fallback}${after}`);
    return;
  }

  const selectionStart = textarea.selectionStart ?? currentValue.length;
  const selectionEnd = textarea.selectionEnd ?? selectionStart;
  const selected = currentValue.slice(selectionStart, selectionEnd) || fallback;
  const nextValue =
    currentValue.slice(0, selectionStart) + before + selected + after + currentValue.slice(selectionEnd);
  onChange(nextValue);
}

function insertSnippet(
  textarea: HTMLTextAreaElement | null,
  currentValue: string,
  onChange: (value: string) => void,
  snippet: string,
) {
  if (!textarea) {
    onChange(`${currentValue}${currentValue ? "\n" : ""}${snippet}`);
    return;
  }

  const selectionStart = textarea.selectionStart ?? currentValue.length;
  const selectionEnd = textarea.selectionEnd ?? selectionStart;
  const nextValue = currentValue.slice(0, selectionStart) + snippet + currentValue.slice(selectionEnd);
  onChange(nextValue);
}

function createDefaultValueForField(field: DataField): unknown {
  if (field.defaultValue !== undefined) {
    return structuredClone(field.defaultValue);
  }

  if (field.type === "object") {
    // Les enfants `row`/`tabs` sont aplatis: leurs cles vivent au meme niveau.
    return flattenDataFields(field.fields).reduce<Record<string, unknown>>((accumulator, childField) => {
      accumulator[childField.name] = createDefaultValueForAnyField(childField);
      return accumulator;
    }, {});
  }

  if (field.type === "custom") {
    return undefined;
  }

  if (field.type === "boolean") {
    return false;
  }

  if (field.type === "number") {
    return 0;
  }

  if (field.type === "range") {
    return field.min ?? 0;
  }

  if (field.type === "alignment" || field.type === "textalign") {
    const options = field.options ?? defaultFieldOptions(field.type) ?? [];
    return options[0]?.value ?? "";
  }

  if (field.type === "asset") {
    return null;
  }

  return "";
}

function createDefaultValueForAnyField(field: DataField): unknown {
  if (field.type === "array") {
    return field.defaultValue !== undefined ? structuredClone(field.defaultValue) : [];
  }

  return createDefaultValueForField(field);
}

function fieldKey(field: BlockField, index: number): string {
  if (field.type === "row" || field.type === "tabs") {
    return `${field.type}-${index}`;
  }
  return field.name;
}

function setValue<TValue extends Record<string, unknown>>(value: TValue, path: string, nextValue: unknown): TValue {
  return {
    ...value,
    [path]: nextValue,
  };
}

function replaceAt<TItem>(items: TItem[], index: number, value: TItem): TItem[] {
  return items.map((item, currentIndex) => (currentIndex === index ? value : item));
}

function removeAt<TItem>(items: TItem[], index: number): TItem[] {
  return items.filter((_, currentIndex) => currentIndex !== index);
}

function resolveArrayItemTitle(field: ArrayField, entry: unknown, index: number) {
  if (field.of.type !== "object") {
    return `${field.itemLabel ?? field.of.label} ${index + 1}`;
  }

  const objectEntry = asRecord(entry);
  return (
    stringifyValue(objectEntry.title) ||
    stringifyValue(objectEntry.label) ||
    stringifyValue(objectEntry.caption) ||
    stringifyValue(objectEntry.question) ||
    `${field.itemLabel ?? field.of.label} ${index + 1}`
  );
}

function normalizePrimitiveValue(type: PrimitiveField["type"], value: string): unknown {
  if (type === "number") {
    return value === "" ? undefined : Number(value);
  }

  return value;
}

function inputTypeForField(type: PrimitiveField["type"]) {
  if (type === "number") {
    return "number";
  }

  if (type === "url") {
    return "url";
  }

  return "text";
}

function stringifyValue(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function compactAsset(asset: Partial<Asset> | null): Asset | null {
  if (!asset || (!asset.url && !asset.alt && !asset.meta && !asset.width && !asset.height)) {
    return null;
  }

  return {
    id: asset.id ?? "manual-asset",
    url: asset.url ?? "",
    alt: asset.alt,
    width: asset.width,
    height: asset.height,
    meta: asset.meta,
  };
}

function asAsset(value: unknown): Asset | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Asset) : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function iconForField(type: PrimitiveField["type"]) {
  switch (type) {
    case "text":
      return <Type className="h-4 w-4" />;
    case "textarea":
      return <TextCursorInput className="h-4 w-4" />;
    case "richtext":
      return <Type className="h-4 w-4" />;
    case "markdown":
      return <Code2 className="h-4 w-4" />;
    case "url":
      return <Link2 className="h-4 w-4" />;
    case "asset":
      return <ImageIcon className="h-4 w-4" />;
    case "color":
      return <Palette className="h-4 w-4" />;
    case "range":
      return <SlidersHorizontal className="h-4 w-4" />;
    case "date":
      return <CalendarDays className="h-4 w-4" />;
    case "alignment":
    case "textalign":
      return <AlignLeft className="h-4 w-4" />;
    default:
      return null;
  }
}

function alignmentIcon(value: string): ReactNode {
  switch (value) {
    case "center":
      return <AlignCenter className="h-4 w-4" />;
    case "right":
      return <AlignRight className="h-4 w-4" />;
    case "justify":
      return <AlignJustify className="h-4 w-4" />;
    default:
      return <AlignLeft className="h-4 w-4" />;
  }
}
