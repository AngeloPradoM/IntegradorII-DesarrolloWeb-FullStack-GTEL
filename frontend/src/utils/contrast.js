/**
 * Utilidades para verificación de contraste WCAG 2.2 AA.
 * Especificación W3C: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
 */

function hexToRgb(hex) {
  let cleaned = hex.replace("#", "").trim();
  if (cleaned.length === 3) {
    cleaned = cleaned.split("").map((c) => c + c).join("");
  }
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function getChannelLuminance(channel8Bit) {
  const srgb = channel8Bit / 255;
  return srgb <= 0.04045
    ? srgb / 12.92
    : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(hexColor) {
  const { r, g, b } = hexToRgb(hexColor);
  const R = getChannelLuminance(r);
  const G = getChannelLuminance(g);
  const B = getChannelLuminance(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function getContrastRatio(hexColor1, hexColor2) {
  const l1 = getRelativeLuminance(hexColor1);
  const l2 = getRelativeLuminance(hexColor2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWcagAA(hexFg, hexBg, isLargeText = false) {
  const ratio = getContrastRatio(hexFg, hexBg);
  const minRatio = isLargeText ? 3.0 : 4.5;
  return {
    ratio: Math.round(ratio * 100) / 100,
    passes: ratio >= minRatio,
    minRequired: minRatio,
  };
}
