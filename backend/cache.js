import { createClient } from 'redis';

let client = null;
let useMock = false;

const mockCache = new Map();

try {
  client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      connectTimeout: 3000,
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          console.warn('[Cache] Redis retries exceeded. Switching to in-memory cache.');
          useMock = true;
          return new Error('Connection failed');
        }
        return Math.min(retries * 500, 2000);
      },
    },
  });

  client.on('error', () => {
    if (!useMock) {
      console.warn('[Cache] Redis unavailable. Falling back to in-memory cache.');
      useMock = true;
    }
  });

  client.on('ready', () => {
    console.log('[Cache] Redis connected.');
    useMock = false;
  });

} catch {
  console.warn('[Cache] Redis client init failed. Using in-memory cache.');
  useMock = true;
}

export async function initCache() {
  if (useMock) return;
  try {
    await client.connect();
  } catch {
    console.warn('[Cache] Redis connection failed. Using in-memory cache.');
    useMock = true;
  }
}

export const cache = {
  get: async (key) => {
    if (!useMock) {
      try {
        return await client.get(key);
      } catch {
        return mockCache.get(key)?.value || null;
      }
    }
    const item = mockCache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      mockCache.delete(key);
      return null;
    }
    return item.value;
  },

  setEx: async (key, seconds, value) => {
    const str = String(value);
    if (!useMock) {
      try {
        await client.setEx(key, seconds, str);
        return;
      } catch {
        
      }
    }
    mockCache.set(key, { value: str, expiry: Date.now() + seconds * 1000 });
  },

  del: async (key) => {
    if (!useMock) {
      try {
        await client.del(key);
        return;
      } catch {
        
      }
    }
    mockCache.delete(key);
  },

  flushAll: async () => {
    if (!useMock) {
      try {
        await client.flushAll();
        return;
      } catch {
        
      }
    }
    mockCache.clear();
  },
};
