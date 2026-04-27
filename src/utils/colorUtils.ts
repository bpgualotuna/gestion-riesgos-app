/**
 * Helper to convert hex color to rgba with opacity
 */
export const hexToRgba = (hex: string, opacity: number): string => {
  if (!hex) return `rgba(0, 0, 0, ${opacity})`;
  
  // If already rgba or rgb, return as is
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;

  // Remove # if exists
  const cleanHex = hex.replace('#', '');
  
  // Handle shorthand hex like #f00
  let r, g, b;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex.substring(0, 1).repeat(2), 16);
    g = parseInt(cleanHex.substring(1, 2).repeat(2), 16);
    b = parseInt(cleanHex.substring(2, 3).repeat(2), 16);
  } else {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
