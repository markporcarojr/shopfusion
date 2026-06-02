"use client";

import { useState } from "react";
import { updateTimeEntry, deleteTimeEntry } from "@/app/actions/time";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  entry: {
    id: number;
    hours: number;
    note: string | null;
    date: Date;
  };
}

export function TimeEntryActions({ entry }: Props) {
  const [open, setOpen] = useState(false);

  async function handleEdit(formData: FormData) {
    await updateTimeEntry(entry.id, formData);
    setOpen(false);
  }

  return (
    <div className="flex items-center gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
          </DialogHeader>
          <form action={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Hours *</label>
              <input
                name="hours"
                type="number"
                step="0.25"
                min="0.25"
                required
                defaultValue={entry.hours}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Note</label>
              <input
                name="note"
                defaultValue={entry.note ?? ""}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Date</label>
              <input
                name="date"
                type="date"
                defaultValue={new Date(entry.date).toISOString().split("T")[0]}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        title="Delete Entry?"
        description="This will permanently delete this time entry."
        onConfirm={() => deleteTimeEntry(entry.id)}
      >
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </ConfirmDialog>
    </div>
  );
}