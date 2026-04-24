import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new Redis(redisUrl);

export const get = async (key: string): Promise<string | null> => {
  return redis.get(key);
};

export const set = async (
  key: string,
  value: string,
  options?: { EX?: number; PX?: number; NX?: boolean; XX?: boolean }
): Promise<string | null> => {
  const args: (string | number)[] = [key, value];
  if (options?.EX) args.push("EX", options.EX);
  if (options?.PX) args.push("PX", options.PX);
  if (options?.NX) args.push("NX");
  if (options?.XX) args.push("XX");
  return redis.set(...args);
};

export const del = async (key: string): Promise<number> => {
  return redis.del(key);
};

export const incr = async (key: string): Promise<number> => {
  return redis.incr(key);
};

export const expire = async (key: string, seconds: number): Promise<number> => {
  return redis.expire(key, seconds);
};

export const ttl = async (key: string): Promise<number> => {
  return redis.ttl(key);
};

export const exists = async (key: string): Promise<number> => {
  return redis.exists(key);
};

export default {
  get,
  set,
  del,
  incr,
  expire,
  ttl,
  exists,
};
