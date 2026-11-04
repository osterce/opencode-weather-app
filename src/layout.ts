export const FRAME_WIDTH = 40;
export const FRAME_LINE = "═".repeat(FRAME_WIDTH);

export function center(text: string, width: number = FRAME_WIDTH): string {
  if (text.length >= width) return text;
  const left = Math.floor((width - text.length) / 2);
  return " ".repeat(left) + text;
}
