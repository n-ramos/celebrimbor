import { defineBlock } from "@n-ramos/celebrimbor-core";
import { Section } from "../shared/render-helpers";

export const galleryBlock = defineBlock({
  type: "gallery",
  label: "Gallery",
  category: "Media",
  defaultContent: {
    items: [],
  },
  schema: {
    fields: [
      {
        name: "items",
        type: "array",
        label: "Images",
        of: {
          name: "galleryItem",
          type: "object",
          label: "Gallery item",
          fields: [
            { name: "image", type: "asset", label: "Image" },
            { name: "caption", type: "text", label: "Caption" },
          ],
        },
      },
    ],
  },
  render: ({ block }) => {
    const content = block.content as {
      items?: Array<{ image?: { url?: string } | null; caption?: string }>;
    };
    return (
      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(content.items ?? []).map((item, index) => (
            <figure key={index} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              {item.image?.url ? (
                <img className="aspect-[4/3] w-full object-cover" src={item.image.url} alt={item.caption ?? ""} />
              ) : (
                <div className="aspect-[4/3] bg-slate-100" />
              )}
              {item.caption ? <figcaption className="p-4 text-sm text-slate-600">{item.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
      </Section>
    );
  },
});
