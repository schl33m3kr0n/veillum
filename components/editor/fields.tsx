"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type FocusEvent } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { beginHistoryGesture, endHistoryGesture } from "@/lib/editor-store";

/** Pause undo on focus and record one history step when the field blurs. */
export function historyFieldProps<T extends HTMLElement>(opts?: {
  commitOnEnter?: boolean;
}) {
  const commitOnEnter = opts?.commitOnEnter !== false;
  return {
    onFocus: () => beginHistoryGesture(),
    onBlur: () => endHistoryGesture(),
    onKeyDown: (e: KeyboardEvent<T>) => {
      if (commitOnEnter && e.key === "Enter" && !e.nativeEvent.isComposing) {
        (e.currentTarget as HTMLElement).blur();
      }
    },
  };
}

function mergeFocus(
  ours: () => void,
  theirs?: (e: FocusEvent<HTMLInputElement>) => void,
) {
  return (e: FocusEvent<HTMLInputElement>) => {
    ours();
    theirs?.(e);
  };
}

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
  const dragging = useRef(false);

  const start = () => {
    if (dragging.current) return;
    dragging.current = true;
    beginHistoryGesture();
  };

  const stop = () => {
    if (!dragging.current) return;
    dragging.current = false;
    endHistoryGesture();
  };

  useEffect(() => {
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      stop();
    };
  }, []);

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
        onValueChange={(v) => {
          start();
          onChange(v[0] ?? value);
        }}
        onValueCommit={stop}
      />
    </div>
  );
}

export function NumberField({
  value,
  onChange,
  onEditStart,
  className,
  step = 1,
  steppers = true,
}: {
  value: number;
  onChange: (v: number) => void;
  onEditStart?: () => void;
  className?: string;
  step?: number;
  steppers?: boolean;
}) {
  const current = Number.isFinite(value) ? value : 0;
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(String(current));
  useEffect(() => {
    if (!focused) setDraft(String(current));
  }, [current, focused]);

  const commit = (raw: string) => {
    if (raw.trim() === "") return;
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    onChange(n);
  };
  const nudge = (dir: 1 | -1) => {
    onEditStart?.();
    onChange(current + dir * step);
  };

  return (
    <div className={cn("relative min-w-0", className)}>
      <Input
        type="number"
        step={step}
        value={focused ? draft : current}
        onChange={(e) => {
          setDraft(e.target.value);
          commit(e.target.value);
        }}
        onFocus={mergeFocus(() => {
          setFocused(true);
          setDraft(String(current));
          onEditStart?.();
          beginHistoryGesture();
        })}
        onBlur={mergeFocus(() => {
          commit(draft);
          setFocused(false);
          endHistoryGesture();
        })}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.currentTarget.blur();
          }
        }}
        className={cn(
          "h-7 text-xs tabular-nums text-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          steppers ? "pr-5" : "px-2.5",
        )}
      />
      {steppers ? (
        <div className="absolute inset-y-px right-px flex w-4 flex-col overflow-hidden rounded-[calc(var(--radius-lg)-2px)] bg-transparent">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Increase"
            className="flex flex-1 items-center justify-center text-foreground hover:bg-foreground/10"
            onClick={() => nudge(1)}
          >
            <ChevronUp className="size-3" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Decrease"
            className="flex flex-1 items-center justify-center text-foreground hover:bg-foreground/10"
            onClick={() => nudge(-1)}
          >
            <ChevronDown className="size-3" strokeWidth={2.5} />
          </button>
        </div>
      ) : null}
    </div>
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
