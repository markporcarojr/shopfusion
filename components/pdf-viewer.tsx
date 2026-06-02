"use client";

import { useState } from "react";
import { Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PDFViewer({
  data,
  title,
}: {
  data: string;
  title: string;
}) {
  const [fullscreen, setFullscreen] = useState(false);

  const src = `data:application/pdf;base64,${data}`;

  return (
    <>
      {/* Inline preview */}
      <div className="relative border border-border rounded overflow-hidden group">
        <iframe
          src={src}
          className="w-full h-64 border-0"
          title={title}
        />
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setFullscreen(true)}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Fullscreen modal */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={() => setFullscreen(false)}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-white text-sm font-medium">{title}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:text-white hover:bg-white/10"
              onClick={() => setFullscreen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div
            className="flex-1 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={src}
              className="w-full h-full border-0 rounded"
              title={title}
            />
          </div>
        </div>
      )}
    </>
  );
}