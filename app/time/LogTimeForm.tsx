"use client";

import { useState } from "react";
import { createTimeEntry } from "@/app/actions/time";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface Job {
  id: number;
  customerName: string;
  jobNumber: number | null;
}

export function LogTimeForm({ jobs }: { jobs: Job[] }) {
  const [open, setOpen] = useState(false);
  const [jobId, setJobId] = useState("");

  async function handleSubmit(formData: FormData) {
    formData.set("jobId", jobId);
    await createTimeEntry(formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Log Time
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Time</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Job *</label>
            <Select onValueChange={setJobId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={String(job.id)}>
                    {job.customerName}
                    {job.jobNumber ? ` #${job.jobNumber}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Hours *</label>
            <input
              name="hours"
              type="number"
              step="0.25"
              min="0.25"
              required
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              placeholder="e.g. 2.5"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Note</label>
            <input
              name="note"
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              placeholder="e.g. Face milling, 5-insert"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Date</label>
            <input
              name="date"
              type="date"
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              defaultValue={new Date().toISOString().split("T")[0]}
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
            <Button type="submit" disabled={!jobId}>
              Log Time
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
