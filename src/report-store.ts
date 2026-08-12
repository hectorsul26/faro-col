import { Redis } from "@upstash/redis";

const SESSION_TTL_SECONDS = 30 * 60;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REPORTS = 3;
const RATE_LIMIT_TTL_SECONDS = 60 * 60;
const SUBMISSION_LOCK_TTL_SECONDS = 2 * 60;
const SESSION_KEY_PREFIX = "faro:session:";
const RATE_KEY_PREFIX = "faro:rate:";
const SUBMISSION_LOCK_KEY_PREFIX = "faro:submit:";
const REF_COUNTER_KEY = "faro:ref:counter";

export type ReportSession = {
  tipo: string;
  paso: number;
  datos: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  submission?: {
    status: "publishing" | "sent";
    reference: string;
  };
};

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryHint: string };

type StoredSession = {
  value: ReportSession;
  expiresAt: number;
};

type StoredRateLimit = {
  timestamps: number[];
  expiresAt: number;
};

type StoredSubmissionLock = {
  expiresAt: number;
};

type ReportStoreMode = "upstash" | "memory";

type ReportStore = {
  readonly mode: ReportStoreMode;
  getSession(userId: string | number): Promise<ReportSession | null>;
  setSession(userId: string | number, session: ReportSession, ttlSeconds?: number): Promise<void>;
  deleteSession(userId: string | number): Promise<void>;
  checkRateLimit(userId: string | number): Promise<RateLimitResult>;
  recordReportSubmission(userId: string | number): Promise<void>;
  acquireSubmissionLock(userId: string | number): Promise<boolean>;
  releaseSubmissionLock(userId: string | number): Promise<void>;
  nextRef(): Promise<string>;
};

function sessionKey(userId: string | number): string {
  return `${SESSION_KEY_PREFIX}${String(userId)}`;
}

function rateKey(userId: string | number): string {
  return `${RATE_KEY_PREFIX}${String(userId)}`;
}

function submissionLockKey(userId: string | number): string {
  return `${SUBMISSION_LOCK_KEY_PREFIX}${String(userId)}`;
}

function cloneSession(session: ReportSession): ReportSession {
  return JSON.parse(JSON.stringify(session)) as ReportSession;
}

function formatRef(value: number): string {
  return `#FCOL-${String(value).padStart(5, "0")}`;
}

function formatRetryHint(milliseconds: number): string {
  const minutes = Math.max(1, Math.ceil(milliseconds / 60_000));
  return minutes === 1 ? "en 1 minuto" : `en ${minutes} minutos`;
}

function activeTimestamps(timestamps: number[], now = Date.now()): number[] {
  const since = now - RATE_LIMIT_WINDOW_MS;
  return timestamps.filter((timestamp) => timestamp > since);
}

class MemoryReportStore implements ReportStore {
  readonly mode = "memory" as const;
  private sessions = new Map<string, StoredSession>();
  private rateLimits = new Map<string, StoredRateLimit>();
  private submissionLocks = new Map<string, StoredSubmissionLock>();
  private refCounter = 0;

  async getSession(userId: string | number): Promise<ReportSession | null> {
    const key = sessionKey(userId);
    const stored = this.sessions.get(key);

    if (!stored) {
      return null;
    }

    if (stored.expiresAt <= Date.now()) {
      this.sessions.delete(key);
      return null;
    }

    return cloneSession(stored.value);
  }

  async setSession(
    userId: string | number,
    session: ReportSession,
    ttlSeconds = SESSION_TTL_SECONDS
  ): Promise<void> {
    this.sessions.set(sessionKey(userId), {
      value: cloneSession(session),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async deleteSession(userId: string | number): Promise<void> {
    this.sessions.delete(sessionKey(userId));
  }

  async checkRateLimit(userId: string | number): Promise<RateLimitResult> {
    const key = rateKey(userId);
    const now = Date.now();
    const stored = this.rateLimits.get(key);
    const timestamps =
      stored && stored.expiresAt > now ? activeTimestamps(stored.timestamps, now) : [];

    if (timestamps.length >= RATE_LIMIT_MAX_REPORTS) {
      const retryAt = Math.min(...timestamps) + RATE_LIMIT_WINDOW_MS;
      return { allowed: false, retryHint: formatRetryHint(retryAt - now) };
    }

    return { allowed: true };
  }

  async recordReportSubmission(userId: string | number): Promise<void> {
    const key = rateKey(userId);
    const now = Date.now();
    const stored = this.rateLimits.get(key);
    const timestamps =
      stored && stored.expiresAt > now ? activeTimestamps(stored.timestamps, now) : [];

    timestamps.push(now);
    this.rateLimits.set(key, {
      timestamps,
      expiresAt: now + RATE_LIMIT_TTL_SECONDS * 1000,
    });
  }

  async acquireSubmissionLock(userId: string | number): Promise<boolean> {
    const key = submissionLockKey(userId);
    const now = Date.now();
    const stored = this.submissionLocks.get(key);

    if (stored && stored.expiresAt > now) {
      return false;
    }

    this.submissionLocks.set(key, {
      expiresAt: now + SUBMISSION_LOCK_TTL_SECONDS * 1000,
    });
    return true;
  }

  async releaseSubmissionLock(userId: string | number): Promise<void> {
    this.submissionLocks.delete(submissionLockKey(userId));
  }

  async nextRef(): Promise<string> {
    this.refCounter += 1;
    return formatRef(this.refCounter);
  }
}

class UpstashReportStore implements ReportStore {
  readonly mode = "upstash" as const;

  constructor(private readonly redis: Redis) {}

  async getSession(userId: string | number): Promise<ReportSession | null> {
    return this.redis.get<ReportSession>(sessionKey(userId));
  }

  async setSession(
    userId: string | number,
    session: ReportSession,
    ttlSeconds = SESSION_TTL_SECONDS
  ): Promise<void> {
    await this.redis.set(sessionKey(userId), session, { ex: ttlSeconds });
  }

  async deleteSession(userId: string | number): Promise<void> {
    await this.redis.del(sessionKey(userId));
  }

  async checkRateLimit(userId: string | number): Promise<RateLimitResult> {
    const key = rateKey(userId);
    const now = Date.now();
    const stored = await this.redis.get<number[]>(key);
    const timestamps = activeTimestamps(Array.isArray(stored) ? stored : [], now);

    if (timestamps.length >= RATE_LIMIT_MAX_REPORTS) {
      const retryAt = Math.min(...timestamps) + RATE_LIMIT_WINDOW_MS;
      return { allowed: false, retryHint: formatRetryHint(retryAt - now) };
    }

    return { allowed: true };
  }

  async recordReportSubmission(userId: string | number): Promise<void> {
    const key = rateKey(userId);
    const now = Date.now();
    const stored = await this.redis.get<number[]>(key);
    const timestamps = activeTimestamps(Array.isArray(stored) ? stored : [], now);

    timestamps.push(now);
    await this.redis.set(key, timestamps, { ex: RATE_LIMIT_TTL_SECONDS });
  }

  async acquireSubmissionLock(userId: string | number): Promise<boolean> {
    const result = await this.redis.set(submissionLockKey(userId), "1", {
      ex: SUBMISSION_LOCK_TTL_SECONDS,
      nx: true,
    });

    return result === "OK";
  }

  async releaseSubmissionLock(userId: string | number): Promise<void> {
    await this.redis.del(submissionLockKey(userId));
  }

  async nextRef(): Promise<string> {
    const value = await this.redis.incr(REF_COUNTER_KEY);
    return formatRef(value);
  }
}

function createReportStore(): ReportStore {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    return new UpstashReportStore(new Redis({ url, token }));
  }

  if (isProductionRuntime()) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production."
    );
  }

  console.warn(
    "UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN missing. Using in-memory report store."
  );

  return new MemoryReportStore();
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

const reportStore = createReportStore();

export function getReportStoreMode(): ReportStoreMode {
  return reportStore.mode;
}

export function getSession(userId: string | number): Promise<ReportSession | null> {
  return reportStore.getSession(userId);
}

export function setSession(
  userId: string | number,
  session: ReportSession,
  ttlSeconds = SESSION_TTL_SECONDS
): Promise<void> {
  return reportStore.setSession(userId, session, ttlSeconds);
}

export function deleteSession(userId: string | number): Promise<void> {
  return reportStore.deleteSession(userId);
}

export function checkRateLimit(userId: string | number): Promise<RateLimitResult> {
  return reportStore.checkRateLimit(userId);
}

export function recordReportSubmission(userId: string | number): Promise<void> {
  return reportStore.recordReportSubmission(userId);
}

export function acquireSubmissionLock(userId: string | number): Promise<boolean> {
  return reportStore.acquireSubmissionLock(userId);
}

export function releaseSubmissionLock(userId: string | number): Promise<void> {
  return reportStore.releaseSubmissionLock(userId);
}

export function nextRef(): Promise<string> {
  return reportStore.nextRef();
}
