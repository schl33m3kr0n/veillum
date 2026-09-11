export const FONT_OPTIONS = [
  { label: "Instrument Sans", family: "Instrument Sans" },
  { label: "Fraunces", family: "Fraunces" },
  { label: "Newsreader", family: "Newsreader" },
  { label: "Libre Baskerville", family: "Libre Baskerville" },
  { label: "Cormorant Garamond", family: "Cormorant Garamond" },
  { label: "Outfit", family: "Outfit" },
  { label: "Bebas Neue", family: "Bebas Neue" },
  { label: "JetBrains Mono", family: "JetBrains Mono" },
] as const;

export type FontFamily = (typeof FONT_OPTIONS)[number]["family"];

export type Tool =
  | "select"
  | "text"
  | "pencil"
  | "pen"
  | "highlighter"
  | "shape"
  | "bezier"
  | "eyedropper"
  | "instant-alpha"
  | "mask"
  | "pan";

export type ShapeKind =
  | "rect"
  | "ellipse"
  | "triangle"
  | "line"
  | "hexagon"
  | "star"
  | "arrow";

export type BlendMode =
  | "source-over"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

export type TextAlign = "left" | "center" | "right" | "justify";
export type ListType = "none" | "bullet" | "number";
export type Capitalization =
  | "none"
  | "uppercase"
  | "lowercase"
  | "title"
  | "small-caps";
export type Orientation = 0 | 90 | 180 | 270 | "vertical";
export type Anchor =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
export type GridType = "none" | "square" | "triangle";
export type DashStyle = "solid" | "dash" | "dot" | "dashdot";

export interface ImageAdjustments {
  exposure: number;
  brightness: number;
  contrast: number;
  shadows: number;
  highlights: number;
  saturation: number;
  temperature: number;
  tint: number;
  sepia: number;
  sharpness: number;
  blur: number;
  warmth: number;
  raw: boolean;
}

export interface InstantAlpha {
  r: number;
  g: number;
  b: number;
  tolerance: number;
  enabled: boolean;
}

export interface Keyframe {
  time: number;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  scaleX: number;
  scaleY: number;
}

export interface BezierPoint {
  x: number;
  y: number;
  inX: number;
  inY: number;
  outX: number;
  outY: number;
}

export interface LayerBase {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  blendMode: BlendMode;
  perspective: number;
  borderEnabled: boolean;
  borderColor: string;
  borderWidth: number;
  borderDash: DashStyle;
  maskEnabled: boolean;
  maskInverted: boolean;
  maskSrc: string | null;
  keyframes: Keyframe[];
}

export interface TextLayer extends LayerBase {
  type: "text";
  text: string;
  fontFamily: FontFamily;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  superscript: boolean;
  subscript: boolean;
  color: string;
  highlight: string | null;
  letterSpacing: number;
  lineHeight: number;
  kerning: number;
  ligatures: boolean;
  align: TextAlign;
  listType: ListType;
  capitalization: Capitalization;
  orientation: Orientation;
  anchor: Anchor;
  indent: number;
  firstLineIndent: number;
  padding: number;
}

export interface ImageLayer extends LayerBase {
  type: "image";
  src: string;
  originalSrc: string;
  isRaw: boolean;
  adjustments: ImageAdjustments;
  instantAlpha: InstantAlpha;
}

export interface ShapeLayer extends LayerBase {
  type: "shape";
  shape: ShapeKind;
  fill: string;
  stroke: string;
  strokeWidth: number;
  dash: DashStyle;
  cornerRadius: number;
  fillEnabled: boolean;
  sides: number;
  starPoints: number;
  innerRatio: number;
  arrowHead: number;
}

export interface PathLayer extends LayerBase {
  type: "path";
  points: number[];
  stroke: string;
  strokeWidth: number;
  tool: "pencil" | "pen" | "highlighter";
  tension: number;
}

export interface BezierLayer extends LayerBase {
  type: "bezier";
  points: BezierPoint[];
  closed: boolean;
  stroke: string;
  strokeWidth: number;
  fill: string;
  fillEnabled: boolean;
}

export type Layer =
  | TextLayer
  | ImageLayer
  | ShapeLayer
  | PathLayer
  | BezierLayer;

export interface HeaderFooter {
  enabled: boolean;
  text: string;
  fontFamily: FontFamily;
  fontSize: number;
  color: string;
  height: number;
}

export interface Page {
  width: number;
  height: number;
  background: string;
  margins: { top: number; right: number; bottom: number; left: number };
  header: HeaderFooter;
  footer: HeaderFooter;
  grid: { type: GridType; size: number; visible: boolean };
  ruler: boolean;
}

export interface Palette {
  name: string;
  colors: string[];
}

export const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: "source-over", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" },
  { value: "color-dodge", label: "Color Dodge" },
  { value: "color-burn", label: "Color Burn" },
  { value: "hard-light", label: "Hard Light" },
  { value: "soft-light", label: "Soft Light" },
  { value: "difference", label: "Difference" },
  { value: "exclusion", label: "Exclusion" },
  { value: "hue", label: "Hue" },
  { value: "saturation", label: "Saturation" },
  { value: "color", label: "Color" },
  { value: "luminosity", label: "Luminosity" },
];

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  shadows: 0,
  highlights: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  sepia: 0,
  sharpness: 0,
  blur: 0,
  warmth: 0,
  raw: false,
};

export const DEFAULT_INSTANT_ALPHA: InstantAlpha = {
  r: 0,
  g: 255,
  b: 0,
  tolerance: 40,
  enabled: false,
};

export const PALETTES: Palette[] = [
  {
    name: "Ink & Paper",
    colors: ["#1c1916", "#4a4238", "#c45c26", "#d4a054", "#f4efe4", "#8aa39b"],
  },
  {
    name: "Print",
    colors: ["#0f172a", "#1d4ed8", "#b91c1c", "#fbbf24", "#f8fafc", "#64748b"],
  },
  {
    name: "Night",
    colors: ["#0b1020", "#1e293b", "#38bdf8", "#a78bfa", "#f472b6", "#e2e8f0"],
  },
  {
    name: "Earth",
    colors: ["#2c1810", "#6b3f2a", "#c4a574", "#7d8b6a", "#e8dcc8", "#4a5d4e"],
  },
];

export function defaultAdjustments(): ImageAdjustments {
  return { ...DEFAULT_ADJUSTMENTS };
}

export function defaultInstantAlpha(): InstantAlpha {
  return { ...DEFAULT_INSTANT_ALPHA };
}
