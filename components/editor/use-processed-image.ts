"use client";

import { useEffect, useState } from "react";
import { applyAdjustments } from "@/lib/filters";
import type { ImageLayer } from "@/lib/types";

export function useProcessedImage(layer: ImageLayer) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  const adj = layer.adjustments;
  const alpha = layer.instantAlpha;
  const key = [
    layer.src,
    layer.maskSrc,
    layer.maskEnabled,
    layer.maskInverted,
    layer.perspective,
    adj.exposure,
    adj.brightness,
    adj.contrast,
    adj.shadows,
    adj.highlights,
    adj.saturation,
    adj.temperature,
    adj.tint,
    adj.sepia,
    adj.sharpness,
    adj.blur,
    adj.warmth,
    adj.raw,
    alpha.enabled,
    alpha.r,
    alpha.g,
    alpha.b,
    alpha.tolerance,
  ].join("|");

  useEffect(() => {
    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      applyAdjustments(data, adj, alpha.enabled ? alpha : null, layer.perspective);
      ctx.putImageData(data, 0, 0);

      if (layer.maskEnabled && layer.maskSrc) {
        const mask = new window.Image();
        mask.onload = () => {
          ctx.globalCompositeOperation = layer.maskInverted
            ? "destination-out"
            : "destination-in";
          ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
          const out = new window.Image();
          out.onload = () => {
            if (!cancelled) setImage(out);
          };
          out.src = canvas.toDataURL("image/png");
        };
        mask.src = layer.maskSrc;
        return;
      }

      const out = new window.Image();
      out.onload = () => {
        if (!cancelled) setImage(out);
      };
      out.src = canvas.toDataURL("image/png");
    };
    img.src = layer.src;
    return () => {
      cancelled = true;
    };
  }, [key, adj, alpha, layer.maskEnabled, layer.maskInverted, layer.maskSrc, layer.perspective, layer.src]);

  return image;
}
