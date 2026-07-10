"use client";

import { createJob } from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { MaterialSelect } from "@/components/material-select";
import {
  ChecklistBuilder,
  type ChecklistDraftItem,
} from "./ChecklistBuilder";

export function CreateJobForm() {
  const [open, setOpen] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistDraftItem[]>([]);

  async function handleSubmit(formData: FormData) {
    // Inject checklist texts (in current drag order) as JSON
    formData.set(
      "checklist",
      JSON.stringify(checklist.map((it) => it.text)),
    );
    await createJob(formData);
    setChecklist([]);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Job
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Job</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Customer Name *</label>
            <input
              name="customerName"
              required
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              placeholder="e.g. Bristol"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Job Number</label>
            <input
              name="jobNumber"
              type="number"
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              placeholder="e.g. 33333"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Material</label>
            <MaterialSelect name="material" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Hours Worked</label>
            <input
              name="hoursWorked"
              type="number"
              step="0.25"
              min="0"
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              placeholder="e.g. 4.5 (optional)"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <input
              name="description"
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              placeholder="e.g. Bore fixture"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Operations</label>
            <textarea
              name="operations"
              rows={3}
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background resize-none"
              placeholder="e.g. Center drill, 1/2 end mill, face mill 5-insert"
            />
          </div>

          {/* Checklist */}
          <ChecklistBuilder items={checklist} onChange={setChecklist} />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}