// Local mock persistence for features the backend does not implement yet
// (notes, todos, diagrams, sharing, comments). Data lives in localStorage,
// namespaced by the real logged-in user's id, so it survives reloads and
// different accounts get separate sandboxes.
//
// Nothing in this folder talks to the network.

import { createSeed } from "./seed";

const VERSION = 1;
const LATENCY = Number(import.meta.env.VITE_MOCK_LATENCY_MS ?? 150);

let currentUser = null;
let cache = null;

const storageKey = (userId) => `nexid.mock.v${VERSION}.${userId}`;

export function bindMockUser(user) {
  if (currentUser?.id === user?.id) return;
  currentUser = user;
  cache = null;
}

export function getMockUser() {
  return currentUser;
}

export function db() {
  if (!currentUser) throw new Error("Mock data accessed before login.");
  if (cache) return cache;
  const raw = localStorage.getItem(storageKey(currentUser.id));
  if (raw) {
    try {
      cache = JSON.parse(raw);
      return cache;
    } catch {
      // Corrupt data: fall through and reseed.
    }
  }
  cache = createSeed(currentUser);
  persist();
  return cache;
}

export function persist() {
  if (!currentUser || !cache) return;
  try {
    localStorage.setItem(storageKey(currentUser.id), JSON.stringify(cache));
  } catch (err) {
    throw new MockError("Browser storage is full; the change was not saved.", {
      cause: err,
    });
  }
}

export function resetMockData() {
  if (!currentUser) return;
  localStorage.removeItem(storageKey(currentUser.id));
  cache = null;
}

export class MockError extends Error {
  constructor(message, opts) {
    super(message, opts);
    this.name = "MockError";
  }
}

export const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const now = () => new Date().toISOString();

export const clone = (v) => (v === undefined ? v : structuredClone(v));

/** Run `fn` against the db after a small artificial delay and return a clone. */
export function mockCall(fn) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(clone(fn(db())));
      } catch (err) {
        reject(err);
      }
    }, LATENCY);
  });
}
