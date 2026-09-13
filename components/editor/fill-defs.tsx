"use client";

import { useMemo } from "react";
import {
  rasterFillDataUrl,
  resolveStops,
  usesRasterFill,
  usesSvgGradient,
  type Fillable,
  gradientId,
} from "@/lib/fill";

export function FillDefs({ layer }: { layer: Fillable }) {
  const style = layer.fillStyle ?? "solid";
  const stops = resolveStops(layer);
  const id = gradientId(layer.id);
  const angle = layer.fillAngle ?? 0;
  const pw = Math.max(8, Math.round(layer.width ?? 96));
  const ph = Math.max(8, Math.round(layer.height ?? 96));
  const raster = useMemo(() => {
    if (!usesRasterFill(style) || typeof document === "undefined") return "";
    return rasterFillDataUrl(style, stops, angle, pw, ph);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, angle, pw, ph, JSON.stringify(stops)]);

  if (!layer.fillEnabled || style === "solid") return null;

  if (usesRasterFill(style) && raster) {
    return (
      <defs>
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          width={pw}
          height={ph}
        >
          <image
            href={raster}
            width={pw}
            height={ph}
            preserveAspectRatio="none"
          />
        </pattern>
      </defs>
    );
  }

  if (!usesSvgGradient(style)) {
    return (
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          {stops.map((s, i) => (
            <stop key={i} offset={s.pos} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>
    );
  }

  const rad = (angle * Math.PI) / 180;
  const span = style === "reflected" ? 0.28 : 0.5;
  const x1 = 0.5 - Math.cos(rad) * span;
  const y1 = 0.5 - Math.sin(rad) * span;
  const x2 = 0.5 + Math.cos(rad) * span;
  const y2 = 0.5 + Math.sin(rad) * span;
  const stopNodes = stops.map((s, i) => (
    <stop key={i} offset={s.pos} stopColor={s.color} />
  ));

  return (
    <defs>
      {style === "radial" ? (
        <radialGradient id={id} cx="0.5" cy="0.5" r="0.75">
          {stopNodes}
        </radialGradient>
      ) : (
        <linearGradient
          id={id}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          spreadMethod={style === "reflected" ? "reflect" : "pad"}
        >
          {stopNodes}
        </linearGradient>
      )}
    </defs>
  );
}
