"use client";

import { useState } from "react";
import { updateComponent, deleteComponent } from "@/app/actions/components";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  component: {
    id: number;
    name: string;
    material: string | null;
    operations: string | null;
    notes: string | null;
    jobId: number;
  };
}

export function ComponentActions({ component }: Props) {
  const [open, setOpen] = useState(false);

  async function handleEdit(formData: FormData) {
    await updateComponent(component.id, component.jobId, formData);
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
            <DialogTitle>Edit Component</DialogTitle>
          </DialogHeader>
          <form action={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name *</label>
              <input
                name="name"
                required
                defaultValue={component.name}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Material</label>
              <input
                name="material"
                defaultValue={component.material ?? ""}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
                placeholder="e.g. 4140 Steel"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Operations</label>
              <textarea
                name="operations"
                rows={3}
                defaultValue={component.operations ?? ""}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background resize-none"
                placeholder="e.g. Turn OD, bore ID"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={component.notes ?? ""}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Component?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {component.name} and all its Fusion logs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteComponent(component.id, component.jobId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}