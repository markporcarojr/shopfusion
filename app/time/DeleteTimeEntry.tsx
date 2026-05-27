"use client";

import { deleteTimeEntry } from "@/app/actions/time";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteTimeEntry({ id }: { id: number }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-destructive"
      onClick={() => deleteTimeEntry(id)}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </Button>
  );
}
