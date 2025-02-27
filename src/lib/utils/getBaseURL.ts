export function getBaseURL(): string {
  if (process.env.VERCEL === "1") {
    return process.env.VERCEL_ENV === "production"
      ? `https://${process.env.VERCEL_URL}`
      : `https://${process.env.VERCEL_BRANCH_DEV}`;
  }
  return "http://localhost:3000";
} 