/**
 * Creates a promise that resolves after the specified time
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the specified delay
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Rate limiter using token bucket algorithm
 * This helps control the rate of API calls to external services like BGG
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private maxTokens: number;
  private refillRate: number; // tokens per millisecond
  private backoffFactor: number = 2; // Exponential backoff multiplier
  private maxRetries: number = 5; // Maximum number of retry attempts
  private maxBackoffTime: number = 30000; // Maximum backoff time in ms (30 seconds)

  /**
   * Create a new rate limiter
   * @param maxTokens The maximum number of tokens (requests) allowed
   * @param refillTimeMs How often the bucket refills completely (in milliseconds)
   */
  constructor(maxTokens: number, refillTimeMs: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.refillRate = maxTokens / refillTimeMs;
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;

    // Calculate how many tokens to add based on time elapsed
    const tokensToAdd = elapsed * this.refillRate;

    // Add tokens, but don't exceed max capacity
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Take a token, waiting if necessary
   * @param cost The cost in tokens for this operation
   * @returns Promise that resolves when a token is available
   */
  async getToken(cost: number = 1): Promise<void> {
    // Refill tokens first
    this.refill();

    // If we have enough tokens, consume them immediately
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return;
    }

    // Otherwise, calculate how long to wait
    const tokensNeeded = cost - this.tokens;
    const waitTime = Math.ceil(tokensNeeded / this.refillRate);

    // Wait and then try again
    await delay(waitTime);
    return this.getToken(cost);
  }

  /**
   * Retry a function with exponential backoff on failure
   * @param fn Function to retry
   * @param args Arguments to pass to the function
   * @returns Result of the function
   */
  async withRetry<T>(
    fn: (...args: any[]) => Promise<T>,
    ...args: any[]
  ): Promise<T> {
    let retries = 0;
    let lastError: any;
    let backoffTime = 1000; // Start with 1 second backoff

    while (retries <= this.maxRetries) {
      try {
        // Wait for a token before executing
        await this.getToken();

        const result = await fn(...args);
        return result;
      } catch (error: any) {
        lastError = error;
        retries++;

        // Check if it's a 429 Too Many Requests error
        const is429 =
          error.status === 429 ||
          (error.message && error.message.includes("429")) ||
          (error.message && error.message.includes("Too Many Requests"));

        if (!is429 && retries > this.maxRetries) {
          // If it's not a rate limit issue and we've exceeded retries, throw the error
          throw error;
        }

        // Calculate backoff time with jitter
        const jitter = Math.random() * 0.3 + 0.85; // Random factor between 0.85 and 1.15
        backoffTime = Math.min(
          this.maxBackoffTime,
          backoffTime * this.backoffFactor * jitter
        );

        console.warn(
          `Request failed (attempt ${retries}/${this.maxRetries}), ` +
            `backing off for ${Math.round(backoffTime)}ms: ${error.message || "Unknown error"}`
        );

        // Drain tokens to force a slowdown
        this.tokens = 0;

        // Wait for the backoff period
        await delay(backoffTime);
      }
    }

    // If we get here, we've exceeded max retries
    throw new Error(
      `Max retries (${this.maxRetries}) exceeded: ${lastError?.message || "Unknown error"}`
    );
  }
}

// Create a shared rate limiter for BGG API
// BGG accepts about 2 requests per second, so we use a slightly conservative limit
export const bggRateLimiter = new RateLimiter(3, 3000); // 3 tokens every 3 seconds (reduced from 5 tokens)
