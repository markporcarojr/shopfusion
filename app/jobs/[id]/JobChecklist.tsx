"use client";

import {
  addChecklistItem,
  deleteChecklistItem,
  toggleChecklistItem,
} from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useState, useTransition } from "react";

type Item = {
  id: number;
  text: string;
  checked: boolean;
  order: number;
};

export function JobChecklist({
  jobId,
  items,
}: {
  jobId: number;
  items: Item[];
}) {
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  const done = items.filter((i) => i.checked).length;

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Checklist</h2>
        {items.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {done}/{items.length} done
          </span>
        )}
      </div>

      {items.length > 0 && (
        <div className="border border-border rounded divide-y divide-border">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3 py-2 group"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => handleToggle(item.id, e.target.checked)}
                className="w-4 h-4 shrink-0 accent-orange-500 cursor-pointer"
              />
              <span
                className={`text-sm flex-1 ${
                  item.checked
                    ? "line-through text-muted-foreground"
                    : ""
                }`}
              >
                {item.text}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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