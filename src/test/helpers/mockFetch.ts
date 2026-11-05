export type FetchHandler = (url: string) => Response | Promise<Response>;

export function mockFetch(handler: FetchHandler): void {
  globalThis.fetch = ((input: unknown) =>
    Promise.resolve(handler(String(input)))) as unknown as typeof fetch;
}
