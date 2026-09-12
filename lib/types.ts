export const FONT_OPTIONS = [
  { label: "Newsreader", family: "Newsreader", group: "Editorial" },
  { label: "Fraunces", family: "Fraunces", group: "Editorial" },
  { label: "Libre Baskerville", family: "Libre Baskerville", group: "Editorial" },
  { label: "Cormorant Garamond", family: "Cormorant Garamond", group: "Editorial" },
  { label: "Spectral", family: "Spectral", group: "Editorial" },
  { label: "Young Serif", family: "Young Serif", group: "Editorial" },
  { label: "Instrument Serif", family: "Instrument Serif", group: "Editorial" },
  { label: "Playfair Display", family: "Playfair Display", group: "Editorial" },
  { label: "DM Serif Display", family: "DM Serif Display", group: "Editorial" },
  { label: "Calisto", family: "Calisto", group: "Editorial" },
  { label: "Bodoni", family: "Bodoni", group: "Editorial" },
  { label: "Instrument Sans", family: "Instrument Sans", group: "Sans" },
  { label: "Avenir Book", family: "Avenir Book", group: "Sans" },
  { label: "Avenir Medium", family: "Avenir Medium", group: "Sans" },
  { label: "Avenir Heavy", family: "Avenir Heavy", group: "Sans" },
  { label: "Avenir Next", family: "Avenir Next", group: "Sans" },
  { label: "Futura Light", family: "Futura Light", group: "Sans" },
  { label: "Futura Medium", family: "Futura Medium", group: "Sans" },
  { label: "Futura Bold", family: "Futura Bold", group: "Sans" },
  { label: "Outfit", family: "Outfit", group: "Sans" },
  { label: "Figtree", family: "Figtree", group: "Sans" },
  { label: "Space Grotesk", family: "Space Grotesk", group: "Sans" },
  { label: "Bricolage Grotesque", family: "Bricolage Grotesque", group: "Sans" },
  { label: "Syne", family: "Syne", group: "Sans" },
  { label: "Century Gothic", family: "Century Gothic", group: "Sans" },
  { label: "Montserrat", family: "Montserrat", group: "Sans" },
  { label: "Bebas Neue", family: "Bebas Neue", group: "Display" },
  { label: "Archivo Black", family: "Archivo Black", group: "Display" },
  { label: "Unbounded", family: "Unbounded", group: "Display" },
  { label: "Cinzel", family: "Cinzel", group: "Display" },
  { label: "Cinzel Decorative", family: "Cinzel Decorative", group: "Display" },
  { label: "Campfire", family: "Campfire", group: "Display" },
  { label: "Cooper Black", family: "Cooper Black", group: "Display" },
  { label: "Oswald", family: "Oswald", group: "Display" },
  { label: "Barlow Condensed", family: "Barlow Condensed", group: "Display" },
  { label: "Impact", family: "Impact", group: "Display" },
  { label: "Great Vibes", family: "Great Vibes", group: "Script" },
  { label: "Rubik Glitch", family: "Rubik Glitch", group: "Experimental" },
  { label: "Monoton", family: "Monoton", group: "Experimental" },
  { label: "Orbitron", family: "Orbitron", group: "Experimental" },
  { label: "Silkscreen", family: "Silkscreen", group: "Experimental" },
  { label: "Press Start 2P", family: "Press Start 2P", group: "Experimental" },
  { label: "Bungee Spice", family: "Bungee Spice", group: "Experimental" },
  { label: "Kablammo", family: "Kablammo", group: "Experimental" },
  { label: "Honk", family: "Honk", group: "Experimental" },
  { label: "Foldit", family: "Foldit", group: "Experimental" },
  { label: "Megrim", family: "Megrim", group: "Experimental" },
  { label: "Shrikhand", family: "Shrikhand", group: "Experimental" },
  { label: "Pixelify Sans", family: "Pixelify Sans", group: "Experimental" },
  { label: "Audiowide", family: "Audiowide", group: "Experimental" },
  { label: "Creepster", family: "Creepster", group: "Experimental" },
  { label: "Flames", family: "Flames", group: "Experimental" },
  { label: "JetBrains Mono", family: "JetBrains Mono", group: "Mono" },
] as const;

export const FONT_GROUPS = [
  "Editorial",
  "Sans",
  "Display",
  "Script",
  "Experimental",
  "Mono",
] as const;

export type BundledFont = (typeof FONT_OPTIONS)[number]["family"];
export type FontFamily = BundledFont | (string & {});

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
  | "arrow"
  | "pie"
  | "svg";

export type SvgPaint = "fill" | "stroke" | "none" | "accent";

export type SvgNode =
  | {
      tag: "path";
      d: string;
      fill?: SvgPaint;
      stroke?: SvgPaint;
      strokeWidth?: number;
      strokeLinecap?: "butt" | "round" | "square";
      strokeLinejoin?: "miter" | "round" | "bevel";
    }
  | {
      tag: "circle";
      cx: number;
      cy: number;
      r: number;
      fill?: SvgPaint;
      stroke?: SvgPaint;
      strokeWidth?: number;
    };

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
export type GridType = "none" | "square" | "triangle" | "radial";
export type DashStyle = "solid" | "dash" | "dot" | "dashdot";
export type FillStyle =
  | "solid"
  | "linear"
  | "radial"
  | "diamond"
  | "conic"
  | "reflected";

export type FillStop = { color: string; pos: number };

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
  fillStyle: FillStyle;
  fillTo: string;
  fillAngle: number;
  fillStops: FillStop[];
  strokeEnabled: boolean;
  sides: number;
  starPoints: number;
  innerRatio: number;
  arrowHead: number;
  wedge: number;
  trackFill: string;
  svgViewBox?: string;
  svgNodes?: SvgNode[];
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
  fillStyle: FillStyle;
  fillTo: string;
  fillAngle: number;
  fillStops: FillStop[];
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
  group?: string;
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

export function defaultAdjustments(): ImageAdjustments {
  return { ...DEFAULT_ADJUSTMENTS };
}

export function defaultInstantAlpha(): InstantAlpha {
  return { ...DEFAULT_INSTANT_ALPHA };
}
