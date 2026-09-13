"use client";

import { cssFontFamily } from "@/lib/fonts";
import type { Layer, Page } from "@/lib/types";
import { cn } from "@/lib/utils";
import { HtmlLayer } from "./html-layer";

export function PagePreview({
  page,
  layers,
  maxWidth,
  maxHeight,
  className,
}: {
  page: Page;
  layers: Layer[];
  maxWidth: number;
  maxHeight: number;
  className?: string;
}) {
  const scale = Math.min(maxWidth / page.width, maxHeight / page.height);
  const width = page.width * scale;
  const height = page.height * scale;
  const visible = layers.filter((layer) => layer.visible);

  return (
    <div
      className={cn("pointer-events-none select-none shadow-lg", className)}
      style={{ width, height }}
      aria-hidden
    >
      <div
        data-template-preview
        style={{
          position: "relative",
          width: page.width,
          height: page.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          background: page.background,
          overflow: "hidden",
        }}
      >
        {page.header.enabled && (
          <div
            className="absolute"
            style={{
              left: page.margins.left,
              top: 14,
              width: page.width - page.margins.left - page.margins.right,
              color: page.header.color,
              fontFamily: cssFontFamily(page.header.fontFamily),
              fontSize: page.header.fontSize,
            }}
          >
            {page.header.text}
          </div>
        )}
        {page.footer.enabled && (
          <div
            className="absolute"
            style={{
              left: page.margins.left,
              bottom: 12,
              width: page.width - page.margins.left - page.margins.right,
              color: page.footer.color,
              fontFamily: cssFontFamily(page.footer.fontFamily),
              fontSize: page.footer.fontSize,
            }}
          >
            {page.footer.text}
          </div>
        )}
        {visible.map((layer) => (
          <HtmlLayer
            key={layer.id}
            layer={layer}
            selected={false}
            tool="pan"
            onPointerDown={(e) => e.preventDefault()}
          />
        ))}
      </div>
    </div>
  );
}
