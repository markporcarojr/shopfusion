"use client";

import { useState } from "react";
import { createComponent } from "@/app/actions/components";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { MaterialSelect } from "@/components/material-select";

export function CreateComponentForm({ jobId }: { jobId: number }) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await createComponent(jobId, formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Component
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Component</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name *</label>
            <input
              name="name"
              required
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              placeholder="e.g. Shaft, Plate, Cap"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Material</label>
            <MaterialSelect name="material" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Operations</label>
            <textarea
              name="operations"
              rows={3}
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background resize-none"
              placeholder="e.g. Turn OD, bore ID, face ends"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              name="notes"
              rows={2}
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background resize-none"
              placeholder="Optional notes"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
