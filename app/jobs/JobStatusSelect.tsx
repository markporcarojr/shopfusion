"use client";

import { updateJobStatus } from "@/app/actions/jobs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  jobId: number;
  currentStatus: "ACTIVE" | "PAUSED" | "DONE";
}

export function JobStatusSelect({ jobId, currentStatus }: Props) {
  return (
    <Select
      defaultValue={currentStatus}
      onValueChange={(value) =>
        updateJobStatus(jobId, value as "ACTIVE" | "PAUSED" | "DONE")
      }
    >
      <SelectTrigger className="w-25 h-7 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ACTIVE">Active</SelectItem>
        <SelectItem value="PAUSED">Paused</SelectItem>
        <SelectItem value="DONE">Done</SelectItem>
      </SelectContent>
    </Select>
  );
}
