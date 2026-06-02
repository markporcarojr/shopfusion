"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MATERIALS = [
  { group: "Steel", items: [
    "1018 Cold Roll Steel",
    "1045 Steel",
    "4140 Steel",
    "4340 Steel",
    "A36 Steel",
    "D2 Tool Steel",
    "H13 Tool Steel",
  ]},
  { group: "Stainless", items: [
    "17-4 Stainless Steel",
    "303 Stainless Steel",
    "304 Stainless Steel",
    "316 Stainless Steel",
    "440C Stainless Steel",
  ]},
  { group: "Aluminum", items: [
    "6061-T6 Aluminum",
    "7075-T6 Aluminum",
    "2024 Aluminum",
    "5052 Aluminum",
    "6063 Aluminum",
  ]},
  { group: "Other", items: [
    "Bronze",
    "Brass",
    "Copper",
    "Cast Iron",
    "Titanium Grade 5",
    "Delrin (Acetal)",
    "UHMW Polyethylene",
    "Nylon",
  ]},
];

const ALL_MATERIALS = MATERIALS.flatMap((g) => g.items);

interface Props {
  name: string;
  defaultValue?: string | null;
}

export function MaterialSelect({ name, defaultValue }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue ?? "");
  const [custom, setCustom] = useState(
    defaultValue && !ALL_MATERIALS.includes(defaultValue) ? defaultValue : ""
  );
  const [showCustom, setShowCustom] = useState(
    !!(defaultValue && !ALL_MATERIALS.includes(defaultValue))
  );

  const displayValue = showCustom ? custom : value;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {displayValue || "Select material..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search materials..." />
            <CommandList>
              <CommandEmpty>No material found.</CommandEmpty>
              {MATERIALS.map((group) => (
                <CommandGroup key={group.group} heading={group.group}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={item}
                      value={item}
                      onSelect={(val) => {
                        setValue(val);
                        setShowCustom(false);
                        setCustom("");
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === item && !showCustom
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {item}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
              <CommandGroup heading="Custom">
                <CommandItem
                  value="other"
                  onSelect={() => {
                    setShowCustom(true);
                    setValue("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      showCustom ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Other (type custom)
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {showCustom && (
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Type custom material..."
          className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
        />
      )}

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={displayValue} />
    </div>
  );
}