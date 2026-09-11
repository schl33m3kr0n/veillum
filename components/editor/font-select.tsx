"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cssFontFamily } from "@/lib/fonts";
import { FONT_GROUPS, FONT_OPTIONS, type FontFamily } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FontSelect({
  value,
  onValueChange,
  disabled,
  className,
}: {
  value: FontFamily;
  onValueChange: (family: FontFamily) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onValueChange(next as FontFamily)}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        className={cn("min-w-40", className)}
        style={{ fontFamily: cssFontFamily(value) }}
      >
        <SelectValue placeholder="Font" />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {FONT_GROUPS.map((group) => (
          <SelectGroup key={group}>
            <SelectLabel>{group}</SelectLabel>
            {FONT_OPTIONS.filter((font) => font.group === group).map((font) => (
              <SelectItem
                key={font.family}
                value={font.family}
                style={{ fontFamily: cssFontFamily(font.family) }}
              >
                {font.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
