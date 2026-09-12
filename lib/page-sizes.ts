import { createDefaultPage } from "./document";
import type { Page } from "./types";

export const PAGE_SIZE_GROUPS = ["Print", "Screen", "Social"] as const;
export type PageSizeGroup = (typeof PAGE_SIZE_GROUPS)[number];

export type PageSizePreset = {
  id: string;
  label: string;
  group: PageSizeGroup;
  width: number;
  height: number;
  hint: string;
};

export const PAGE_SIZES: PageSizePreset[] = [
  { id: "letter", label: "US Letter", group: "Print", width: 816, height: 1056, hint: "8.5 × 11 in" },
  { id: "letter-land", label: "Letter landscape", group: "Print", width: 1056, height: 816, hint: "11 × 8.5 in" },
  { id: "legal", label: "US Legal", group: "Print", width: 816, height: 1344, hint: "8.5 × 14 in" },
  { id: "tabloid", label: "Tabloid", group: "Print", width: 1056, height: 1632, hint: "11 × 17 in" },
  { id: "a4", label: "A4", group: "Print", width: 794, height: 1123, hint: "210 × 297 mm" },
  { id: "a4-land", label: "A4 landscape", group: "Print", width: 1123, height: 794, hint: "297 × 210 mm" },
  { id: "studio", label: "Studio", group: "Screen", width: 960, height: 720, hint: "4:3 spread" },
  { id: "hd", label: "HD 720p", group: "Screen", width: 1280, height: 720, hint: "16:9" },
  { id: "wxga", label: "Laptop", group: "Screen", width: 1366, height: 768, hint: "16:9" },
  { id: "fhd", label: "1080p / 16:9", group: "Screen", width: 1920, height: 1080, hint: "Display or slide" },
  { id: "slide-43", label: "Slide 4:3", group: "Screen", width: 1024, height: 768, hint: "Presentation" },
  { id: "ig-square", label: "Feed square", group: "Social", width: 1080, height: 1080, hint: "Instagram / X" },
  { id: "ig-portrait", label: "Feed portrait", group: "Social", width: 1080, height: 1350, hint: "4:5 post" },
  { id: "story", label: "Story / Reel", group: "Social", width: 1080, height: 1920, hint: "9:16" },
  { id: "yt-thumb", label: "YouTube thumb", group: "Social", width: 1280, height: 720, hint: "16:9" },
  { id: "linkedin", label: "LinkedIn banner", group: "Social", width: 1584, height: 396, hint: "Cover photo" },
  { id: "wide-post", label: "Wide post", group: "Social", width: 1600, height: 900, hint: "16:9 share" },
];

export function pageFromSize(preset: PageSizePreset): Page {
  const base = createDefaultPage();
  const print = preset.group === "Print";
  const dark = preset.group === "Social" && preset.id !== "ig-portrait";
  return {
    ...base,
    width: preset.width,
    height: preset.height,
    background: dark ? "#11100e" : "#f7f1e6",
    header: { ...base.header, enabled: print, text: "veillum" },
    footer: { ...base.footer, enabled: print, text: "Page 1" },
    margins: print
      ? { top: 56, right: 56, bottom: 64, left: 56 }
      : { top: 40, right: 40, bottom: 40, left: 40 },
  };
}
