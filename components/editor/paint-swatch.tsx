"use client";

import { cn } from "@/lib/utils";

const CHECKER = {
  backgroundImage:
    "linear-gradient(45deg,#c8c2b6 25%,transparent 25%,transparent 75%,#c8c2b6 75%),linear-gradient(45deg,#c8c2b6 25%,#f7f1e6 25%,#f7f1e6 75%,#c8c2b6 75%)",
  backgroundSize: "8px 8px",
  backgroundPosition: "0 0, 4px 4px",
} as const;

function dimClass(size: "sm" | "md") {
  return size === "sm" ? "size-6" : "size-8";
}

export function NoneSwatchLook({
  selected,
  size = "md",
  className,
}: {
  selected?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-full border",
        dimClass(size),
        selected
          ? "border-primary ring-2 ring-primary/35"
          : "border-border",
        className,
      )}
    >
      <span className="absolute inset-0" style={CHECKER} />
      <span className="absolute inset-[-18%] rotate-45 border-t-2 border-[#c45c26]" />
    </span>
  );
}

export function NoneSwatch({
  selected,
  title = "No fill",
  onClick,
  size = "md",
}: {
  selected?: boolean;
  title?: string;
  onClick?: () => void;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={selected}
      onClick={onClick}
      className="rounded-full hover:opacity-90"
    >
      <NoneSwatchLook selected={selected} size={size} />
    </button>
  );
}

export function ColorCircleLook({
  color,
  selected,
  size = "md",
  className,
}: {
  color: string;
  selected?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-full border border-black/40 shadow-sm",
        dimClass(size),
        selected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
        className,
      )}
      style={{ background: color }}
    />
  );
}

export function ColorCircle({
  color,
  selected,
  title,
  onClick,
  size = "md",
}: {
  color: string;
  selected?: boolean;
  title?: string;
  onClick?: () => void;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      title={title ?? color}
      onClick={onClick}
      className="rounded-full"
    >
      <ColorCircleLook color={color} selected={selected} size={size} />
    </button>
  );
}
