export const ansi = {
  reset: "\u001b[0m",
  bold: "\u001b[1m",
  dim: "\u001b[2m",
  cyan: "\u001b[96m",
  green: "\u001b[92m",
  yellow: "\u001b[93m",
  red: "\u001b[91m",
} as const;

export function paint(code: string, text: string): string {
  return `${code}${text}${ansi.reset}`;
}

export function stripAnsi(text: string): string {
  return text.replace(/\u001b\[[0-9;]*m/g, "");
}
