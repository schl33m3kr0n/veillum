"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCustomFonts,
  importFontFile,
  restoreCustomFonts,
  subscribeCustomFonts,
} from "@/lib/custom-fonts";
import { cssFontFamily } from "@/lib/fonts";
import { FONT_GROUPS, FONT_OPTIONS } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FontSelect({
  value,
  onValueChange,
  disabled,
  className,
}: {
  value: string;
  onValueChange: (family: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const custom = useSyncExternalStore(
    subscribeCustomFonts,
    getCustomFonts,
    getCustomFonts,
  );

  useEffect(() => {
    void restoreCustomFonts();
  }, []);

  const bundled = new Set<string>(FONT_OPTIONS.map((f) => f.family));
  const extras = custom.filter((f) => !bundled.has(f.family));

  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          size="sm"
          className="min-w-0 flex-1"
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
          {extras.length > 0 && (
            <SelectGroup>
              <SelectLabel>Imported</SelectLabel>
              {extras.map((font) => (
                <SelectItem
                  key={font.family}
                  value={font.family}
                  style={{ fontFamily: `"${font.family}", serif` }}
                >
                  {font.family}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
      <Button
        type="button"
        size="icon-xs"
        variant="outline"
        disabled={disabled}
        title="Import a font you own (.ttf, .otf, .woff)"
        aria-label="Import font"
        onClick={() => fileRef.current?.click()}
      >
        <Plus />
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            const family = await importFontFile(file);
            onValueChange(family);
          } catch (err) {
            console.error(err);
          }
        }}
      />
    </div>
  );
}
