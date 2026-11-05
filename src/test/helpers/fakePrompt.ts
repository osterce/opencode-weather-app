import type { Prompt } from "../../presentation/input.ts";

export type FakePrompt = Prompt & {
  asked: string[];
  confirmed: string[];
  waits: number;
  closed: boolean;
};

export type FakePromptScript = {
  answers?: string[];
  confirms?: boolean[];
  waitError?: unknown;
};

export function createFakePrompt(script: FakePromptScript = {}): FakePrompt {
  const answers = [...(script.answers ?? [])];
  const confirms = [...(script.confirms ?? [])];
  const asked: string[] = [];
  const confirmed: string[] = [];

  return {
    asked,
    confirmed,
    waits: 0,
    closed: false,
    async ask(question: string): Promise<string> {
      asked.push(question);
      const answer = answers.shift();
      if (answer === undefined) {
        throw new Error(`No hay más respuestas para: ${question}`);
      }
      return answer;
    },
    async confirm(question: string): Promise<boolean> {
      confirmed.push(question);
      const answer = confirms.shift();
      if (answer === undefined) {
        throw new Error(`No hay más confirmaciones para: ${question}`);
      }
      return answer;
    },
    async waitEnter(): Promise<void> {
      this.waits += 1;
      if (script.waitError) throw script.waitError;
    },
    close(): void {
      this.closed = true;
    },
  };
}
