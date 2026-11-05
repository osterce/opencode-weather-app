import * as readline from "node:readline/promises";
import { ansi, paint } from "../utils/colors.ts";
import { printError } from "./output.ts";

export class EOFError extends Error {
  constructor() {
    super("Fin de la entrada");
    this.name = "EOFError";
  }
}

export type Prompt = {
  ask(question: string): Promise<string>;
  confirm(question: string): Promise<boolean>;
  waitEnter(message?: string): Promise<void>;
  close(): void;
};

export function createPrompt(): Prompt {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });
  const lines = rl[Symbol.asyncIterator]();

  async function nextLine(question: string): Promise<string> {
    process.stdout.write(question);
    const result = await lines.next();
    if (result.done) throw new EOFError();
    return result.value.trim();
  }

  return {
    ask: nextLine,
    async confirm(question: string): Promise<boolean> {
      const answer = await nextLine(
        `${question} ${paint(ansi.dim, "(s/n)")} `,
      );
      return /^[sy]/i.test(answer);
    },
    async waitEnter(
      message = "Presiona Enter para volver al menú",
    ): Promise<void> {
      await nextLine(`\n  ${paint(ansi.dim, `${message}...`)} `);
    },
    close(): void {
      rl.close();
    },
  };
}

export async function askIndex(
  prompt: Prompt,
  max: number,
  label: string,
): Promise<number | null> {
  const answer = await prompt.ask(
    `  ${label} [1-${max}] ${paint(ansi.dim, "(0 para cancelar)")}: `,
  );
  if (answer === "" || answer === "0") return null;

  if (!/^\d+$/.test(answer)) {
    printError("Opción inválida.");
    return null;
  }

  const index = Number.parseInt(answer, 10);
  if (index < 1 || index > max) {
    printError("Opción inválida.");
    return null;
  }

  return index;
}
