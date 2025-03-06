/**
 * Creates a promise that resolves after the specified time
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the specified delay
 */
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
