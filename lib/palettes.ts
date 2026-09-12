import type { Palette } from "./types";

export const PALETTE_GROUPS = [
  "Studio",
  "Print",
  "Neutrals",
  "Classic",
  "Natural",
  "Screen",
  "Brand",
  "Era",
] as const;

export const PALETTES: Palette[] = [
  {
    name: "Ink & Paper",
    group: "Studio",
    colors: ["#1c1916", "#4a4238", "#c45c26", "#d4a054", "#f4efe4", "#8aa39b"],
  },
  {
    name: "Studio night",
    group: "Studio",
    colors: ["#161310", "#2a2622", "#c45c26", "#e8b923", "#f7f1e6", "#7a7268"],
  },
  {
    name: "Print CMYK",
    group: "Print",
    colors: ["#00a3e0", "#ec008c", "#fff200", "#231f20", "#ffffff", "#6d6e71"],
  },
  {
    name: "Process",
    group: "Print",
    colors: ["#0f172a", "#1d4ed8", "#b91c1c", "#fbbf24", "#f8fafc", "#64748b"],
  },
  {
    name: "Riso",
    group: "Print",
    colors: ["#ff48b0", "#00a95c", "#0078bf", "#ffe800", "#ff6c2f", "#000000"],
  },
  {
    name: "Newspaper",
    group: "Print",
    colors: ["#1a1a1a", "#3f3f3f", "#8a8178", "#c2b8a3", "#efe6d4", "#b42318"],
  },
  {
    name: "Gray",
    group: "Neutrals",
    colors: ["#0a0a0a", "#262626", "#525252", "#a3a3a3", "#e5e5e5", "#fafafa"],
  },
  {
    name: "Warm gray",
    group: "Neutrals",
    colors: ["#1c1917", "#44403c", "#78716c", "#a8a29e", "#e7e5e4", "#fafaf9"],
  },
  {
    name: "Cool gray",
    group: "Neutrals",
    colors: ["#0f172a", "#334155", "#64748b", "#94a3b8", "#e2e8f0", "#f8fafc"],
  },
  {
    name: "Ivory",
    group: "Neutrals",
    colors: ["#2b2118", "#6b5344", "#c4a574", "#e8dcc8", "#f7f1e6", "#fffaf0"],
  },
  {
    name: "Bauhaus",
    group: "Classic",
    colors: ["#1d1d1b", "#e30613", "#ffed00", "#0057a8", "#f4f4f0", "#7a7a7a"],
  },
  {
    name: "Swiss",
    group: "Classic",
    colors: ["#e30613", "#000000", "#ffffff", "#1a1a1a", "#d0d0d0", "#4a4a4a"],
  },
  {
    name: "De Stijl",
    group: "Classic",
    colors: ["#e30613", "#0057a8", "#ffed00", "#000000", "#ffffff", "#8c8c8c"],
  },
  {
    name: "Memphis",
    group: "Classic",
    colors: ["#ff3ea5", "#3d5afe", "#ffe14d", "#22c55e", "#111111", "#fff7ed"],
  },
  {
    name: "Earth",
    group: "Natural",
    colors: ["#2c1810", "#6b3f2a", "#c4a574", "#7d8b6a", "#e8dcc8", "#4a5d4e"],
  },
  {
    name: "Forest",
    group: "Natural",
    colors: ["#0f2419", "#1f4d32", "#3f7d52", "#a3c9a8", "#eef4ea", "#c45c26"],
  },
  {
    name: "Ocean",
    group: "Natural",
    colors: ["#042f40", "#0b4f6c", "#1b7f9e", "#7ec8d9", "#e8f4f8", "#d4a054"],
  },
  {
    name: "Desert",
    group: "Natural",
    colors: ["#3b1f12", "#9c4a1a", "#d9894b", "#f0c27b", "#f7ead0", "#5c6b4a"],
  },
  {
    name: "Flora",
    group: "Natural",
    colors: ["#3d1220", "#a61e4d", "#e85d75", "#f6c1c7", "#f8f1e4", "#2f6b4f"],
  },
  {
    name: "Mineral",
    group: "Natural",
    colors: ["#1b2430", "#3d5a80", "#98c1d9", "#e0fbfc", "#ee6c4d", "#293241"],
  },
  {
    name: "Night",
    group: "Screen",
    colors: ["#0b1020", "#1e293b", "#38bdf8", "#a78bfa", "#f472b6", "#e2e8f0"],
  },
  {
    name: "Neon",
    group: "Screen",
    colors: ["#0a0a0a", "#39ff14", "#00f0ff", "#ff2bd6", "#f5ff66", "#ffffff"],
  },
  {
    name: "Pastel",
    group: "Screen",
    colors: ["#ffd6e0", "#c5deff", "#d8f3dc", "#fff3b0", "#e9d5ff", "#2b2b2b"],
  },
  {
    name: "Nord",
    group: "Screen",
    colors: ["#2e3440", "#3b4252", "#88c0d0", "#81a1c1", "#a3be8c", "#eceff4"],
  },
  {
    name: "Dracula",
    group: "Screen",
    colors: ["#282a36", "#44475a", "#ff79c6", "#8be9fd", "#50fa7b", "#f8f8f2"],
  },
  {
    name: "Solarized",
    group: "Screen",
    colors: ["#002b36", "#073642", "#268bd2", "#859900", "#cb4b16", "#fdf6e3"],
  },
  {
    name: "Tokyo night",
    group: "Screen",
    colors: ["#1a1b26", "#24283b", "#7aa2f7", "#9ece6a", "#bb9af7", "#c0caf5"],
  },
  {
    name: "Material",
    group: "Brand",
    colors: ["#212121", "#f44336", "#2196f3", "#4caf50", "#ffeb3b", "#fafafa"],
  },
  {
    name: "Tailwind",
    group: "Brand",
    colors: ["#0f172a", "#2563eb", "#db2777", "#16a34a", "#f59e0b", "#f8fafc"],
  },
  {
    name: "Apple",
    group: "Brand",
    colors: ["#1d1d1f", "#0071e3", "#bf4800", "#6e6e73", "#f5f5f7", "#ffffff"],
  },
  {
    name: "Figma",
    group: "Brand",
    colors: ["#1e1e1e", "#0d99ff", "#ff7262", "#a259ff", "#1abcfe", "#f24e1e"],
  },
  {
    name: "Metro",
    group: "Brand",
    colors: ["#0078d4", "#107c10", "#d83b01", "#8764b8", "#001433", "#f3f2f1"],
  },
  {
    name: "Jewel",
    group: "Brand",
    colors: ["#1a0b2e", "#4c1d95", "#7c3aed", "#db2777", "#f59e0b", "#ecfdf5"],
  },
  {
    name: "Kodak",
    group: "Era",
    colors: ["#1a120b", "#7a3e12", "#d9894b", "#f2c14e", "#6b7f5a", "#efe6d4"],
  },
  {
    name: "Technicolor",
    group: "Era",
    colors: ["#12080c", "#c41e3a", "#1b4d8e", "#f4c430", "#2a7a3a", "#f6efe4"],
  },
  {
    name: "Ukiyo-e",
    group: "Era",
    colors: ["#1c1916", "#1d4e89", "#b42318", "#e8d5b5", "#5c7a5e", "#c45c26"],
  },
  {
    name: "Art deco",
    group: "Era",
    colors: ["#0e0e0e", "#c9a227", "#5c1a1b", "#1f3a5f", "#efe6d4", "#6b7280"],
  },
  {
    name: "Pop",
    group: "Era",
    colors: ["#111111", "#ff3b30", "#007aff", "#ffcc00", "#34c759", "#ffffff"],
  },
  {
    name: "Web safe",
    group: "Classic",
    colors: ["#000000", "#0000ff", "#00ff00", "#ff0000", "#ffff00", "#ffffff"],
  },
];
