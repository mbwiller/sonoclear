/** Resolves after `ms`. Mocks use it so loading states are seen, briefly. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
