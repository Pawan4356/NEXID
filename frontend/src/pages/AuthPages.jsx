import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button, Field, Input, PasswordInput, Textarea } from "../components/ui";
import { PasswordChecklist } from "./SettingsPage";
import { EMAIL_RE, isStrongPassword } from "../lib/validation";

export function Logo({ className = "size-7" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <path d="M10 22V10h2.4l7.2 8.2V10H22v12h-2.4l-7.2-8.2V22z" className="fill-bg" />
    </svg>
  );
}

function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-[360px]">
        <Logo className="mb-6 size-9 text-fg" />
        <h1 className="text-[26px] font-bold tracking-tight">{title}</h1>
        <p className="mt-1 mb-7 text-sm text-muted">{subtitle}</p>
        {children}
        <p className="mt-6 text-sm text-muted">{footer}</p>
      </div>
    </div>
  );
}

function FormError({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
      <AlertCircle className="mt-0.5 size-4 shrink-0" /> {message}
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!EMAIL_RE.test(form.email.trim())) errs.email = "Enter a valid email address.";
    if (!form.password) errs.password = "Enter your password.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(location.state?.from ?? "/", { replace: true });
    } catch (err) {
      setErrors({ form: err.status === 401 ? "Incorrect email or password." : err.message });
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Log in to Nexid"
      subtitle="Notes, tasks, diagrams and people — in one place."
      footer={
        <>
          New to Nexid?{" "}
          <Link to="/signup" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormError message={errors.form} />
        <Field label="Email" error={errors.email}>
          {(p) => <Input {...p} type="email" autoComplete="email" autoFocus value={form.email} onChange={set("email")} placeholder="you@example.com" className="h-9" />}
        </Field>
        <Field label="Password" error={errors.password}>
          {(p) => <PasswordInput {...p} autoComplete="current-password" value={form.password} onChange={set("password")} className="h-9" />}
        </Field>
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
          Continue
        </Button>
      </form>
    </AuthLayout>
  );
}

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", bio: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    const name = form.name.trim();
    if (name.length < 2 || name.length > 60) errs.name = "Name must be 2–60 characters.";
    if (!EMAIL_RE.test(form.email.trim())) errs.email = "Enter a valid email address.";
    if (!isStrongPassword(form.password)) errs.password = "Password doesn't meet the requirements below.";
    if (form.bio.length > 1024) errs.bio = "Bio can be at most 1024 characters.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await signup({ name, email: form.email.trim(), password: form.password, bio: form.bio.trim() || undefined });
      navigate("/", { replace: true });
    } catch (err) {
      setErrors({ form: err.message });
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your Nexid workspace."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormError message={errors.form} />
        <Field label="Name" error={errors.name}>
          {(p) => <Input {...p} autoComplete="name" autoFocus value={form.name} onChange={set("name")} placeholder="Ada Lovelace" maxLength={60} className="h-9" />}
        </Field>
        <Field label="Email" error={errors.email}>
          {(p) => <Input {...p} type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className="h-9" />}
        </Field>
        <Field label="Password" error={errors.password}>
          {(p) => <PasswordInput {...p} autoComplete="new-password" value={form.password} onChange={set("password")} className="h-9" />}
        </Field>
        <PasswordChecklist password={form.password} />
        <Field label="Bio (optional)" error={errors.bio}>
          {(p) => <Textarea {...p} value={form.bio} onChange={set("bio")} maxLength={1024} placeholder="What are you working on?" className="min-h-16" />}
        </Field>
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
