"use client";

import { useState } from "react";
import { updateFusionLog, deleteFusionLog } from "@/app/actions/fusionLogs";
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
  log: {
    id: number;
    notes: string | null;
    modelName: string;
    componentId: number;
    jobId: number;
  };
}

export function FusionLogActions({ log }: Props) {
  const [open, setOpen] = useState(false);

  async function handleEdit(formData: FormData) {
    await updateFusionLog(log.id, log.componentId, log.jobId, formData);
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
            <DialogTitle>Edit Notes</DialogTitle>
          </DialogHeader>
          <form action={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                name="notes"
                rows={4}
                defaultValue={log.notes ?? ""}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background resize-none"
                placeholder="Add notes..."
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
        title="Delete Fusion Log?"
        description={`This will permanently delete ${log.modelName}.`}
        onConfirm={() => deleteFusionLog(log.id, log.componentId, log.jobId)}
      >
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </ConfirmDialog>
    </div>
  );
}