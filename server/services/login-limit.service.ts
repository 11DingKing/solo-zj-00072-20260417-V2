import RedisService from "@services/redis.service";
import dayjs from "dayjs";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const FAILED_ATTEMPT_WINDOW_MINUTES = 60;

const getFailedAttemptsKey = (ip: string): string => `login:failed:${ip}`;
const getLockKey = (ip: string): string => `login:lock:${ip}`;

export interface LoginLimitStatus {
  isLocked: boolean;
  failedAttempts: number;
  remainingAttempts: number;
  lockExpiresAt?: Date;
  lockExpiresInSeconds?: number;
}

export const getLoginLimitStatus = async (ip: string): Promise<LoginLimitStatus> => {
  const lockKey = getLockKey(ip);
  const lockExists = await RedisService.exists(lockKey);

  if (lockExists) {
    const ttl = await RedisService.ttl(lockKey);
    const lockExpiresAt = dayjs().add(ttl, "seconds").toDate();
    return {
      isLocked: true,
      failedAttempts: MAX_FAILED_ATTEMPTS,
      remainingAttempts: 0,
      lockExpiresAt,
      lockExpiresInSeconds: ttl > 0 ? ttl : LOCK_DURATION_MINUTES * 60,
    };
  }

  const failedAttemptsKey = getFailedAttemptsKey(ip);
  const failedAttemptsStr = await RedisService.get(failedAttemptsKey);
  const failedAttempts = failedAttemptsStr ? parseInt(failedAttemptsStr, 10) : 0;

  return {
    isLocked: false,
    failedAttempts,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts),
  };
};

export const incrementFailedAttempts = async (ip: string): Promise<LoginLimitStatus> => {
  const failedAttemptsKey = getFailedAttemptsKey(ip);
  const newCount = await RedisService.incr(failedAttemptsKey);

  if (newCount === 1) {
    await RedisService.expire(failedAttemptsKey, FAILED_ATTEMPT_WINDOW_MINUTES * 60);
  }

  if (newCount >= MAX_FAILED_ATTEMPTS) {
    const lockKey = getLockKey(ip);
    await RedisService.set(lockKey, "1", { EX: LOCK_DURATION_MINUTES * 60 });
    await RedisService.del(failedAttemptsKey);

    return {
      isLocked: true,
      failedAttempts: MAX_FAILED_ATTEMPTS,
      remainingAttempts: 0,
      lockExpiresAt: dayjs().add(LOCK_DURATION_MINUTES, "minutes").toDate(),
      lockExpiresInSeconds: LOCK_DURATION_MINUTES * 60,
    };
  }

  return {
    isLocked: false,
    failedAttempts: newCount,
    remainingAttempts: MAX_FAILED_ATTEMPTS - newCount,
  };
};

export const clearFailedAttempts = async (ip: string): Promise<void> => {
  const failedAttemptsKey = getFailedAttemptsKey(ip);
  const lockKey = getLockKey(ip);
  await RedisService.del(failedAttemptsKey);
  await RedisService.del(lockKey);
};

export const isIpLocked = async (ip: string): Promise<boolean> => {
  const lockKey = getLockKey(ip);
  const exists = await RedisService.exists(lockKey);
  return exists > 0;
};

export default {
  getLoginLimitStatus,
  incrementFailedAttempts,
  clearFailedAttempts,
  isIpLocked,
};
