import { spyOn } from "bun:test";
import { stripAnsi } from "../../utils/colors.ts";

export type ConsoleCapture = {
  logs: string[];
  output(): string;
  restore(): void;
};

export function captureConsole(): ConsoleCapture {
  const logs: string[] = [];
  const spy = spyOn(console, "log").mockImplementation(
    (...args: unknown[]): void => {
      logs.push(stripAnsi(args.map((arg) => String(arg)).join(" ")));
    },
  );

  return {
    logs,
    output: (): string => logs.join("\n"),
    restore: (): void => {
      spy.mockRestore();
    },
  };
}
