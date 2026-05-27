"use client";

import { useState } from "react";
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
            <label className="text-sm font-medium">Description</label>
            <input
              name="description"
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              placeholder="e.g. Face mill 6061 blank"
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
