// Mirrors backend validation (validator.isEmail / isStrongPassword defaults and
// the User schema) so users see problems before a round trip.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const passwordRules = [
  { id: "len", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "lower", label: "A lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "upper", label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "num", label: "A number", test: (p) => /\d/.test(p) },
  { id: "sym", label: "A symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];
export const isStrongPassword = (p) => passwordRules.every((r) => r.test(p));

export function validateProfile({ name, age, bio, avatar }) {
  const errors = {};
  const n = (name ?? "").trim();
  if (n.length < 2 || n.length > 60) errors.name = "Name must be 2–60 characters.";
  if (age !== "" && age != null) {
    const a = Number(age);
    if (!Number.isInteger(a) || a < 5 || a > 120) errors.age = "Age must be a whole number from 5 to 120.";
  }
  if ((bio ?? "").length > 1024) errors.bio = "Bio can be at most 1024 characters.";
  if (avatar && !/^https?:\/\//i.test(avatar)) errors.avatar = "Avatar must be an http(s) URL.";
  return errors;
}
