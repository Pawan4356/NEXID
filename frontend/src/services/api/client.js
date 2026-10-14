// Thin fetch wrapper for the real Nexid Express backend.
//
// Backend characteristics this layer normalizes (see backend/src/routes):
//  - Many responses are plain text ("Login successful!", "Error: Invalid token"),
//    others are JSON. We parse by content-type.
//  - The auth middleware answers 400 (not 401) with "Error: <reason>" when the
//    cookie is missing/expired. We translate that into an ApiError with
//    `isUnauthorized = true` so the UI can return to the login screen.
//  - Auth is a JWT in a "token" cookie, so every request uses
//    credentials: "include".

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, { status, body, isUnauthorized = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.isUnauthorized = isUnauthorized;
  }
}

const AUTH_FAILURE = /^Error: (Invalid token|User not found|jwt|invalid signature|invalid token)/i;

const unauthorizedListeners = new Set();
export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

async function parseBody(res) {
  const type = res.headers.get("content-type") || "";
  if (res.status === 204) return null;
  if (type.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  const text = await res.text();
  return text;
}

// Turn backend error strings into something readable.
function cleanMessage(body, status) {
  if (typeof body !== "string" || !body.trim()) {
    return status >= 500 ? "The server ran into a problem." : `Request failed (${status}).`;
  }
  if (body.trim().startsWith("<")) return `The server ran into a problem (${status}).`;
  let msg = body.replace(/^Something Went wrong:\s*/i, "").replace(/^Error:\s*/, "");
  if (/E11000/.test(msg) && /email/.test(msg)) msg = "An account with this email already exists.";
  return msg.replace(/\.{2,}$/, ".");
}

/**
 * @param {string} path  e.g. "/user/me"
 * @param {{ method?: string, body?: unknown, signal?: AbortSignal, auth?: boolean }} options
 *   auth: true when the route is protected by userAuth; enables unauthorized detection.
 */
export async function request(path, { method = "GET", body, signal, auth = false } = {}) {
  let res;
  try {
    res = await fetch(BASE_URL + path, {
      method,
      signal,
      credentials: "include",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError("Can't reach the Nexid server. Is the backend running?", { status: 0 });
  }

  const data = await parseBody(res);
  if (res.ok) return data;

  const isUnauthorized = auth && res.status === 400 && typeof data === "string" && AUTH_FAILURE.test(data);
  const error = new ApiError(isUnauthorized ? "Your session has expired. Please log in again." : cleanMessage(data, res.status), {
    status: res.status,
    body: data,
    isUnauthorized,
  });
  if (isUnauthorized) unauthorizedListeners.forEach((fn) => fn(error));
  throw error;
}

export const apiBaseUrl = BASE_URL;
