import { request } from "./client";

// POST /auth/signup -> 201 text, sets "token" cookie
export const signup = ({ name, email, password, bio }) =>
  request("/auth/signup", {
    method: "POST",
    body: { name, email, password, ...(bio ? { bio } : {}) },
  });

// POST /auth/login -> 200 "Login successful!", sets "token" cookie
export const login = ({ email, password }) =>
  request("/auth/login", { method: "POST", body: { email, password } });

// POST /auth/logout -> 200 empty, expires the cookie
export const logout = () => request("/auth/logout", { method: "POST" });

// POST /auth/refresh exists but is an empty handler that never responds, so it is
// intentionally not called anywhere.
