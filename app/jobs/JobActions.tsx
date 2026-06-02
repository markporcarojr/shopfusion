"use client";

import { useState } from "react";
import { updateJob, deleteJob } from "@/app/actions/jobs";
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
  job: {
    id: number;
    customerName: string;
    jobNumber: number | null;
    description: string | null;
    hoursWorked: number | null;
  };
}

export function JobActions({ job }: Props) {
  const [open, setOpen] = useState(false);

  async function handleEdit(formData: FormData) {
    await updateJob(job.id, formData);
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
            <DialogTitle>Edit Job</DialogTitle>
          </DialogHeader>
          <form action={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Customer Name *</label>
              <input
                name="customerName"
                required
                defaultValue={job.customerName}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Job Number</label>
              <input
                name="jobNumber"
                type="number"
                defaultValue={job.jobNumber ?? ""}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <input
                name="description"
                defaultValue={job.description ?? ""}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Hours Worked</label>
              <input
                name="hoursWorked"
                type="number"
                step="0.25"
                min="0"
                defaultValue={job.hoursWorked ?? ""}
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
        title="Delete Job?"
        description={`This will permanently delete ${job.customerName} and all associated components, time entries and Fusion logs.`}
        onConfirm={() => deleteJob(job.id)}
      >
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </ConfirmDialog>
    </div>
  );
}