import { DndContext, PointerSensor, type DragEndEvent, useSensor, useSensors } from "@dnd-kit/core";
import type { PageBuilderProps } from "../types";
import { BlocksSidebar } from "./blocks-sidebar";
import { PreviewFrame } from "./preview-frame";
import { usePageBuilder } from "../hooks/use-page-builder";

export function PageBuilder(props: PageBuilderProps) {
  const builder = usePageBuilder(props);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) {
      return;
    }

    if (overId === "blocks-root") {
      builder.move(activeId, props.document.blocks.length);
      return;
    }

    const index = props.document.blocks.findIndex((block) => block.id === overId);
    if (index >= 0) {
      builder.move(activeId, index);
    }
  }

  return (
    <div className="mpb-theme overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_90px_-44px_rgba(15,23,42,0.45)]">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid min-h-[calc(100vh-3rem)] xl:grid-cols-[430px_minmax(0,1fr)]">
          <BlocksSidebar
            document={props.document}
            registry={props.registry}
            selectedBlockId={builder.selectedId}
            assetPicker={props.assetPicker}
            canSave={Boolean(props.onSave)}
            saving={builder.saving}
            onSave={builder.save}
            onSelect={builder.selectBlock}
            onAdd={builder.add}
            onUpdateContent={builder.updateContent}
            onUpdateSettings={builder.updateSettings}
            onDelete={builder.remove}
            onDuplicate={builder.duplicate}
            onToggleVisibility={builder.toggleVisibility}
          />
          <PreviewFrame document={props.document} registry={props.registry} />
        </div>
      </DndContext>
    </div>
  );
}
