import { createId } from "./ids";
import { createDemoPhoto } from "./raw";
import {
  defaultAdjustments,
  defaultInstantAlpha,
  type BezierLayer,
  type FontFamily,
  type ImageLayer,
  type Layer,
  type LayerBase,
  type Page,
  type PathLayer,
  type ShapeKind,
  type ShapeLayer,
  type TextLayer,
} from "./types";

function base(
  partial: Partial<LayerBase> & Pick<LayerBase, "name" | "width" | "height">,
): LayerBase {
  return {
    id: createId(),
    visible: true,
    locked: false,
    x: 80,
    y: 80,
    lockProportions: false,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    blendMode: "source-over",
    perspective: 0,
    borderEnabled: false,
    borderColor: "#1c1916",
    borderWidth: 1,
    borderDash: "solid",
    maskEnabled: false,
    maskInverted: false,
    maskSrc: null,
    keyframes: [],
    ...partial,
  };
}

export function createTextLayer(
  overrides: Partial<TextLayer> = {},
): TextLayer {
  const layer: TextLayer = {
    ...base({ name: "Text", width: 320, height: 80 }),
    type: "text",
    text: "Write here",
    fontFamily: "Newsreader" as FontFamily,
    fontSize: 28,
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    superscript: false,
    subscript: false,
    color: "#1c1916",
    highlight: null,
    letterSpacing: 0,
    lineHeight: 1.35,
    kerning: 0,
    ligatures: true,
    align: "left",
    listType: "none",
    capitalization: "none",
    orientation: 0,
    anchor: "top-left",
    indent: 0,
    firstLineIndent: 0,
    padding: 8,
    ...overrides,
  };
  return {
    ...layer,
    spans: layer.spans ?? [{ text: layer.text }],
  };
}

export function createImageLayer(
  src: string,
  overrides: Partial<ImageLayer> = {},
): ImageLayer {
  return {
    ...base({ name: "Image", width: 360, height: 240 }),
    type: "image",
    src,
    originalSrc: src,
    isRaw: false,
    adjustments: defaultAdjustments(),
    instantAlpha: defaultInstantAlpha(),
    ...overrides,
  };
}

export function createShapeLayer(
  shape: ShapeKind,
  overrides: Partial<ShapeLayer> = {},
): ShapeLayer {
  return {
    ...base({ name: shape[0].toUpperCase() + shape.slice(1), width: 160, height: 120 }),
    type: "shape",
    shape,
    fill: "#c45c26",
    stroke: "#1c1916",
    strokeWidth: 2,
    dash: "solid",
    cornerRadius: shape === "rect" ? 8 : 0,
    fillEnabled: true,
    fillStyle: "solid",
    fillTo: "#f4d8a8",
    fillAngle: 0,
    fillStops: [
      { color: "#c45c26", pos: 0 },
      { color: "#f4d8a8", pos: 1 },
    ],
    strokeEnabled: true,
    sides: 6,
    starPoints: 5,
    innerRatio: 0.4,
    arrowHead: 16,
    wedge: 0.38,
    trackFill: "#efe6d8",
    svgViewBox: "0 0 64 64",
    svgNodes: [],
    ...overrides,
  };
}

export function createPathLayer(
  tool: PathLayer["tool"],
  points: number[],
  overrides: Partial<PathLayer> = {},
): PathLayer {
  const stroke =
    tool === "highlighter"
      ? "#f5d76e"
      : tool === "pen"
        ? "#1c1916"
        : "#4a4238";
  const strokeWidth = tool === "highlighter" ? 18 : tool === "pen" ? 3 : 2;
  return {
    ...base({ name: tool[0].toUpperCase() + tool.slice(1), width: 100, height: 100 }),
    type: "path",
    points,
    stroke,
    strokeWidth,
    tool,
    tension: tool === "pencil" ? 0.4 : 0.2,
    opacity: tool === "highlighter" ? 0.45 : 1,
    blendMode: tool === "highlighter" ? "multiply" : "source-over",
    ...overrides,
  };
}

export function createBezierLayer(
  overrides: Partial<BezierLayer> = {},
): BezierLayer {
  return {
    ...base({ name: "Curve", width: 200, height: 120 }),
    type: "bezier",
    points: [],
    closed: false,
    stroke: "#1c1916",
    strokeWidth: 2,
    fill: "#d4a054",
    fillEnabled: false,
    fillStyle: "solid",
    fillTo: "#f4d8a8",
    fillAngle: 0,
    fillStops: [
      { color: "#d4a054", pos: 0 },
      { color: "#f4d8a8", pos: 1 },
    ],
    ...overrides,
  };
}

export function createDefaultPage(): Page {
  return {
    width: 960,
    height: 720,
    background: "#f7f1e6",
    margins: { top: 56, right: 56, bottom: 64, left: 56 },
    marginsVisible: true,
    header: {
      enabled: true,
      text: "veillum  ·  Studio",
      fontFamily: "Instrument Sans",
      fontSize: 11,
      color: "#7a7268",
      height: 36,
    },
    footer: {
      enabled: true,
      text: "Draft  ·  Page 1",
      fontFamily: "Instrument Sans",
      fontSize: 11,
      color: "#7a7268",
      height: 36,
    },
    grid: { type: "square", size: 24, visible: false },
    ruler: true,
  };
}

export function createStarterLayers(): Layer[] {
  let photo = "";
  try {
    photo = createDemoPhoto();
  } catch (err) {
    console.error("Demo photo failed", err);
  }
  if (!photo) {
    photo =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="480"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b3a5c"/><stop offset="0.45" stop-color="#d9894b"/><stop offset="1" stop-color="#3d5c3a"/></linearGradient></defs><rect width="720" height="480" fill="url(#g)"/><circle cx="560" cy="128" r="52" fill="#ffe08a"/></svg>`,
      );
  }
  return [
    createShapeLayer("rect", {
      name: "Accent bar",
      x: 56,
      y: 96,
      width: 8,
      height: 168,
      fill: "#c45c26",
      strokeWidth: 0,
      fillEnabled: true,
      locked: false,
    }),
    createTextLayer({
      name: "Kicker",
      x: 84,
      y: 96,
      width: 360,
      height: 28,
      text: "STUDIO NOTES",
      fontFamily: "Syne",
      fontSize: 12,
      letterSpacing: 4.2,
      color: "#c45c26",
      bold: true,
    }),
    createTextLayer({
      name: "Title",
      x: 80,
      y: 124,
      width: 440,
      height: 120,
      text: "Ink, light,\nand paper.",
      fontFamily: "Playfair Display",
      fontSize: 52,
      lineHeight: 1.05,
      color: "#1c1916",
      italic: true,
    }),
    createTextLayer({
      name: "Body",
      x: 80,
      y: 268,
      width: 380,
      height: 220,
      text: "A page is a stage: type sits on a grid, drawings keep their pressure, and photographs remember how the light felt.\n\nEdit the copy, draw over the margin, or pull the sun out of the hills.",
      fontFamily: "Newsreader",
      fontSize: 16,
      lineHeight: 1.45,
      color: "#2c2722",
    }),
    createTextLayer({
      name: "List",
      x: 80,
      y: 500,
      width: 360,
      height: 110,
      text: "Cut, copy, and paste freely\nWatch undo travel through the page\nKeep ligatures on for the title",
      fontFamily: "Instrument Sans",
      fontSize: 14,
      listType: "bullet",
      lineHeight: 1.55,
      color: "#3d3832",
    }),
    createImageLayer(photo, {
      name: "Hills at dusk",
      x: 500,
      y: 96,
      width: 404,
      height: 270,
      borderEnabled: true,
      borderColor: "#1c1916",
      borderWidth: 1,
    }),
    createShapeLayer("ellipse", {
      name: "Seal",
      x: 780,
      y: 400,
      width: 88,
      height: 88,
      fill: "#d4a054",
      stroke: "#1c1916",
      strokeWidth: 1.5,
      opacity: 0.92,
    }),
    createTextLayer({
      name: "Seal type",
      x: 786,
      y: 428,
      width: 76,
      height: 40,
      text: "RAW",
      fontFamily: "Bebas Neue",
      fontSize: 22,
      align: "center",
      color: "#1c1916",
      letterSpacing: 2,
    }),
  ];
}
