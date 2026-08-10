"use client";

import {
  addChecklistItem,
  deleteChecklistItem,
  toggleChecklistItem,
  reorderChecklist,
} from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Plus, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Item = {
  id: number;
  text: string;
  checked: boolean;
  order: number;
};

function SortableRow({
  item,
  onToggle,
  onDelete,
}: {
  item: Item;
  onToggle: (id: number, checked: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-2 group bg-background"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <input
        type="checkbox"
        checked={item.checked}
        onChange={(e) => onToggle(item.id, e.target.checked)}
        className="w-4 h-4 shrink-0 accent-orange-500 cursor-pointer"
      />
      <span
        className={`text-sm flex-1 ${
          item.checked ? "line-through text-muted-foreground" : ""
        }`}
      >
        {item.text}
      </span>
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function JobChecklist({
  jobId,
  items,
}: {
  jobId: number;
  items: Item[];
}) {
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  // Local copy so drag reordering is optimistic and instant.
  const [list, setList] = useState<Item[]>(items);

  // Keep local list in sync when server data changes (add/delete/toggle).
  useEffect(() => {
    setList(items);
  }, [items]);

  const done = list.filter((i) => i.checked).length;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  function handleToggle(id: number, checked: boolean) {
    startTransition(() => toggleChecklistItem(id, checked));
  }

  function handleAdd() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    startTransition(() => addChecklistItem(jobId, text));
  }

  function handleDelete(id: number) {
    startTransition(() => deleteChecklistItem(id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = list.findIndex((i) => i.id === active.id);
    const newIndex = list.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(list, oldIndex, newIndex);

    setList(reordered); // optimistic
    startTransition(() =>
      reorderChecklist(
        jobId,
        reordered.map((i) => i.id),
      ),
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Checklist</h2>
        {list.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {done}/{list.length} done
          </span>
        )}
      </div>

      {list.length > 0 && (
        <div className="border border-border rounded divide-y divide-border">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={list.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {list.map((item) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Add an item..."
          disabled={isPending}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          disabled={isPending}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
