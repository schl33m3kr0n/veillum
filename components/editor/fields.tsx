"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/lib/editor-store";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-1 py-1", className)}>
      <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="space-y-1 py-1">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
        <span className="text-[10px] tabular-nums text-foreground/80">
          {format ? format(value) : value.toFixed(2)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0] ?? value)}
        onPointerDown={() => useEditorStore.temporal.getState().pause()}
        onPointerUp={() => useEditorStore.temporal.getState().resume()}
      />
    </div>
  );
}

export function NumberField({
  value,
  onChange,
  className,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  step?: number;
}) {
  return (
    <Input
      type="number"
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn("h-7 text-xs tabular-nums", className)}
    />
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-border/60 px-3 py-3">
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}
