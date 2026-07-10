"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Plus, X } from "lucide-react";
import { useRef, useState } from "react";

export type ChecklistDraftItem = { id: string; text: string };

export function ChecklistBuilder({
  items,
  onChange,
}: {
  items: ChecklistDraftItem[];
  onChange: (items: ChecklistDraftItem[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function addItem() {
    const text = draft.trim();
    if (!text) return;
    onChange([...items, { id: crypto.randomUUID(), text }]);
    setDraft("");
  }

  function removeItem(id: string) {
    onChange(items.filter((it) => it.id !== id));
  }

  function handleDrop(target: number) {
    const from = dragIndex.current;
    if (from === null || from === target) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(target, 0, moved);
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Checklist</label>

      {items.length > 0 && (
        <div className="border border-border rounded divide-y divide-border">
          {items.map((item, i) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => (dragIndex.current = i)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(i);
              }}
              onDragLeave={() => setOverIndex((v) => (v === i ? null : v))}
              onDrop={() => {
                handleDrop(i);
                dragIndex.current = null;
                setOverIndex(null);
              }}
              onDragEnd={() => {
                dragIndex.current = null;
                setOverIndex(null);
              }}
              className={`flex items-center gap-2 px-2 py-2 transition-colors ${
                overIndex === i ? "bg-accent" : "bg-background"
              }`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
              <span className="text-sm flex-1">{item.text}</span>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder="Add a checklist item..."
        />
        <Button type="button" variant="outline" onClick={addItem}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
