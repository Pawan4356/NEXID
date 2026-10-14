import { useState } from "react";
import { Monitor, Moon, Settings, Sun } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Topbar } from "../components/layout/Topbar";
import {
  Avatar,
  Button,
  ConfirmDialog,
  Field,
  Input,
  MockBadge,
  PasswordInput,
  Select,
  Textarea,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { userApi } from "../services/api";
import { resetMockData } from "../services/mock";
import {
  isStrongPassword,
  passwordRules,
  validateProfile,
} from "../lib/validation";
import { cn } from "../lib/utils";

function Section({ title, description, badge, children }) {
  return (
    <section className="border-b border-line py-8 first:pt-0">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex-1">
          <h2 className="font-semibold">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          )}
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

function ProfileForm() {
  const { user, setUser } = useAuth();
  const initial = {
    name: user.name ?? "",
    avatar: user.avatar ?? "",
    bio: user.bio ?? "",
    age: user.age ?? "",
    gender: user.gender ?? "",
  };
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Only send fields that changed; the backend rejects unknown keys.
  const changed = Object.fromEntries(
    Object.entries(form).filter(([k, v]) => String(v) !== String(initial[k])),
  );
  const dirty = Object.keys(changed).length > 0;

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateProfile(form);
    setErrors(errs);
    setServerError(null);
    if (Object.keys(errs).length || !dirty) return;
    const patch = { ...changed };
    if ("name" in patch) patch.name = patch.name.trim();
    if ("age" in patch) patch.age = patch.age === "" ? null : Number(patch.age);
    // The backend's enum validator rejects "" (500) but accepts null to clear the field.
    if ("gender" in patch && patch.gender === "") patch.gender = null;
    setSaving(true);
    try {
      const updated = await userApi.updateMe(patch);
      setUser(updated);
      setForm({
        name: updated.name ?? "",
        avatar: updated.avatar ?? "",
        bio: updated.bio ?? "",
        age: updated.age ?? "",
        gender: updated.gender ?? "",
      });
      toast.success("Profile updated");
    } catch (err) {
      setServerError(
        err.message === "Something went wrong."
          ? "The server rejected the update. Check the values and try again."
          : err.message,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="flex items-center gap-4">
        <Avatar
          user={{ ...user, name: form.name, avatar: form.avatar || null }}
          size="lg"
        />
        <p className="text-xs text-muted">
          Avatar is an image URL. Leave empty to use your initials.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name}>
          {(p) => (
            <Input
              {...p}
              value={form.name}
              onChange={set("name")}
              maxLength={60}
            />
          )}
        </Field>
        <Field
          label="Email"
          hint="Email can't be changed through the current API."
        >
          {(p) => <Input {...p} value={user.email} disabled />}
        </Field>
        <Field
          label="Avatar URL"
          error={errors.avatar}
          className="sm:col-span-2"
        >
          {(p) => (
            <Input
              {...p}
              value={form.avatar}
              onChange={set("avatar")}
              placeholder="https://…"
            />
          )}
        </Field>
        <Field
          label="Bio"
          error={errors.bio}
          hint={`${form.bio.length}/1024`}
          className="sm:col-span-2"
        >
          {(p) => (
            <Textarea
              {...p}
              value={form.bio}
              onChange={set("bio")}
              maxLength={1024}
              placeholder="A sentence about you"
            />
          )}
        </Field>
        <Field label="Age" error={errors.age}>
          {(p) => (
            <Input
              {...p}
              type="number"
              min={5}
              max={120}
              value={form.age}
              onChange={set("age")}
            />
          )}
        </Field>
        <Field label="Gender">
          {(p) => (
            <Select {...p} value={form.gender} onChange={set("gender")}>
              <option value="">Not set</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
          )}
        </Field>
      </div>
      {serverError && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {serverError}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="submit"
          variant="primary"
          loading={saving}
          disabled={!dirty}
        >
          Save changes
        </Button>
        {dirty && (
          <Button variant="ghost" onClick={() => setForm(initial)}>
            Discard
          </Button>
        )}
      </div>
    </form>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.oldPassword) errs.oldPassword = "Enter your current password.";
    if (!isStrongPassword(form.newPassword))
      errs.newPassword = "New password doesn't meet the requirements.";
    if (form.confirm !== form.newPassword)
      errs.confirm = "Passwords don't match.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await userApi.changePassword(form);
      setForm({ oldPassword: "", newPassword: "", confirm: "" });
      toast.success("Password changed");
    } catch (err) {
      setErrors({
        server: /old password/i.test(err.message)
          ? "Current password is incorrect."
          : err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-sm space-y-4" noValidate>
      <Field label="Current password" error={errors.oldPassword}>
        {(p) => (
          <PasswordInput
            {...p}
            value={form.oldPassword}
            onChange={set("oldPassword")}
            autoComplete="current-password"
          />
        )}
      </Field>
      <Field label="New password" error={errors.newPassword}>
        {(p) => (
          <PasswordInput
            {...p}
            value={form.newPassword}
            onChange={set("newPassword")}
            autoComplete="new-password"
          />
        )}
      </Field>
      {form.newPassword && <PasswordChecklist password={form.newPassword} />}
      <Field label="Confirm new password" error={errors.confirm}>
        {(p) => (
          <PasswordInput
            {...p}
            value={form.confirm}
            onChange={set("confirm")}
            autoComplete="new-password"
          />
        )}
      </Field>
      {errors.server && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {errors.server}
        </p>
      )}
      <Button type="submit" variant="primary" loading={saving}>
        Change password
      </Button>
    </form>
  );
}

export function PasswordChecklist({ password }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
      {passwordRules.map((r) => {
        const ok = r.test(password);
        return (
          <li
            key={r.id}
            className={cn(
              "flex items-center gap-1.5",
              ok ? "text-success" : "text-faint",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                ok ? "bg-success" : "bg-line-strong",
              )}
            />
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}

function Appearance() {
  const { preference, setTheme } = useTheme();
  return (
    <div className="grid max-w-md grid-cols-3 gap-2">
      {[
        ["light", "Light", Sun],
        ["dark", "Dark", Moon],
        ["system", "System", Monitor],
      ].map(([v, label, Icon]) => (
        <button
          key={v}
          onClick={() => setTheme(v)}
          aria-pressed={preference === v}
          className={cn(
            "flex flex-col items-center gap-2 rounded-lg border px-3 py-4 text-sm",
            preference === v
              ? "border-accent bg-accent-soft text-accent"
              : "border-line hover:bg-hover",
          )}
        >
          <Icon className="size-5" strokeWidth={1.6} /> {label}
        </button>
      ))}
    </div>
  );
}

function MockDataSection() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  return (
    <>
      <p className="mb-3 text-sm text-muted">
        Notes, todos, diagrams, sharing and comments are stored in this browser
        for your account. Resetting restores the sample workspace.
      </p>
      <Button
        variant="danger-ghost"
        className="border border-line"
        onClick={() => setOpen(true)}
      >
        Reset local sample data
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Reset local sample data?"
        description="All local notes, todos, diagrams, comments and share settings for this account will be replaced with the sample workspace. Your real account, profile and follows are not affected."
        confirmLabel="Reset"
        onConfirm={async () => {
          resetMockData();
          await qc.resetQueries({ queryKey: ["mock"] });
          toast.success("Local sample data restored");
        }}
      />
    </>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col">
      <Topbar
        crumbs={[{ label: "Settings", icon: <Settings className="size-4" /> }]}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 pt-10 pb-24">
          <h1 className="mb-8 text-[32px] font-bold tracking-tight">
            Settings
          </h1>
          <Section
            title="Profile"
            description="Visible on your public profile."
          >
            <ProfileForm />
          </Section>
          <Section title="Password">
            <PasswordForm />
          </Section>
          <Section title="Appearance">
            <Appearance />
          </Section>
          <Section title="Local prototype data" badge={<MockBadge />}>
            <MockDataSection />
          </Section>
        </div>
      </div>
    </div>
  );
}
