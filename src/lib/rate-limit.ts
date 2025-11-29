import { NextRequest } from "next/server";

type RateLimitConfig = {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in the interval
};

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

// In-memory store for rate limiting
// In production, consider using Redis for distributed systems
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple rate limiter for API routes
 * Uses IP address and optional identifier to track requests
 *
 * @param request - NextRequest object
 * @param config - Rate limit configuration
 * @param identifier - Optional additional identifier (e.g., email for login)
 * @returns boolean - true if rate limit exceeded, false otherwise
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  identifier?: string
): Promise<{ limited: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();

  // Get IP address from request headers
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown";

  // Create unique key for this client
  const key = identifier ? `${ip}:${identifier}` : ip;

  // Clean up expired entries periodically (every 100 requests)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries(now);
  }

  // Get or create entry for this key
  let entry = rateLimitStore.get(key);

  // If no entry or entry expired, create new one
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.interval,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment request count
  entry.count++;

  // Check if limit exceeded
  const limited = entry.count > config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    limited,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Remove expired entries from the store
 */
function cleanupExpiredEntries(now: number) {
  const keysToDelete: string[] = [];

  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => rateLimitStore.delete(key));
}

/**
 * Clear all rate limit entries (useful for testing)
 */
export function clearRateLimits() {
  rateLimitStore.clear();
}

/**
 * Preset configurations for common use cases
 */
export const RateLimitPresets = {
  // 5 requests per minute for auth endpoints
  AUTH: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 5,
  },
  // 10 requests per minute for API mutations
  API_WRITE: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  // 100 requests per minute for API reads
  API_READ: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  // 30 requests per minute for general API
  API_GENERAL: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
} as const;
