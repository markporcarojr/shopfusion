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

export function CreateJobForm() {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await createJob(formData);
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
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Job Number</label>
            <input
              name="jobNumber"
              type="number"
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              placeholder="e.g. 2026047"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Material</label>
            <input
              name="material"
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              placeholder="e.g. 6061-T6 Aluminum, 4140 Steel"
            />
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
