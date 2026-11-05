import { ansi, paint } from "./colors.ts";
import { FRAME_LINE, FRAME_WIDTH } from "./constants.ts";

export function center(text: string, width: number = FRAME_WIDTH): string {
  if (text.length >= width) return text;
  const left = Math.floor((width - text.length) / 2);
  return " ".repeat(left) + text;
}

export function frame(title: string): string[] {
  return [
    paint(ansi.cyan, FRAME_LINE),
    paint(ansi.cyan, center(title, FRAME_WIDTH)),
    paint(ansi.cyan, FRAME_LINE),
  ];
}
