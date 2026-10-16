/** Sign Up, Sign In, Forgot / Reset Password (requirement §12, §13, §17.1). */
import { useState, type ReactNode } from "react";
import { AuthShell } from "../components/AuthShell";
import { AuthError, Field, SuccessStrip } from "../components/ui";
import { useStore, type Route } from "../lib/store";
import { ACCOUNTS } from "../data/seed";

type RoleOption = "User" | "Manager" | "Green Community";

const ROLE_COPY: Record<RoleOption, string> = {
  User: "Register food, donate, collect and track impact",
  Manager: "Configure rules, review requests, report",
  "Green Community": "Find donations, submit requests, history",
};

function AuthFooter({ children }: { children: ReactNode }) {
  return <div className="auth-link-row">{children}</div>;
}

function LinkButton({
  to,
  children,
}: {
  to: Route;
  children: ReactNode;
}) {
  const { navigate } = useStore();
  return (
    <button
      type="button"
      className="auth-link"
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
      onClick={() => navigate(to)}
    >
      {children}
    </button>
  );
}

/* ------------------------------- Sign Up ------------------------------ */

export function SignUpPage() {
  const { navigate, setToast } = useStore();
  const [role, setRole] = useState<RoleOption>("User");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
    if (pw.length < 8) next.pw = "Use at least 8 characters.";
    if (pw !== pw2) next.pw2 = "Passwords do not match.";
    if (!consent) next.consent = "Please confirm to continue.";
    if (role !== "User" && org.trim().length < 2) next.org = "Organization is required for this role.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setDone(true);
    setToast("Account created in the prototype. Sign in to continue.");
  };

  if (done) {
    return (
      <AuthShell
        kicker="Create your account"
        title="Account created"
        description="The prototype stored this registration in memory only."
      >
        <SuccessStrip>
          Your {role} account is ready. Continue to Sign In to open the{" "}
          {role} dashboard.
        </SuccessStrip>
        <button
          type="button"
          className="button button--primary button--block"
          onClick={() => navigate({ name: "signin" })}
        >
          Continue to Sign In
        </button>
        <AuthFooter>
          <span className="small">Already registered?</span>
          <LinkButton to={{ name: "signin" }}>Sign In</LinkButton>
        </AuthFooter>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker="Create your account"
      title="Sign Up"
      description="Role-aware registration with password confirmation."
      footer={
        <AuthFooter>
          <span className="small">Already have an account?</span>
          <LinkButton to={{ name: "signin" }}>Sign In</LinkButton>
        </AuthFooter>
      }
    >
      <form className="stack stack--sm" onSubmit={submit} noValidate>
        <div className="control">
          <label>Role</label>
          <div className="role-options" role="radiogroup" aria-label="Role">
            {(Object.keys(ROLE_COPY) as RoleOption[]).map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={role === r}
                className={`role-option${role === r ? " is-active" : ""}`}
                onClick={() => setRole(r)}
              >
                <strong>{r}</strong>
                <span>{ROLE_COPY[r]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-grid">
          <Field label="Full name" error={errors.name}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </Field>
          <Field label="Email address" error={errors.email}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              type="email"
            />
          </Field>
          <Field
            label="Organization"
            hint={role === "User" ? "Optional for the User role" : "Shown in reports for this role"}
            error={errors.org}
            wide={role !== "User"}
          >
            <input
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="Organization name"
            />
          </Field>
          <Field label="Password" error={errors.pw}>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm password" error={errors.pw2}>
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="Repeat the password"
              autoComplete="new-password"
            />
          </Field>
        </div>

        <label className="check">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            I agree to the terms of use and consent to SmartSave processing my
            food records for tracking, donation and impact reporting.
          </span>
        </label>
        {errors.consent && <span className="control-error">{errors.consent}</span>}

        <button type="submit" className="button button--primary button--block">
          Create account
        </button>
      </form>
    </AuthShell>
  );
}

/* ------------------------------- Sign In ------------------------------ */

export function SignInPage() {
  const { signIn, navigate, setToast } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = "Email is required.";
    if (!password) next.password = "Password is required.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const res = signIn(email, password);
    if (!res.ok) {
      setError(res.error ?? "Sign in failed.");
      return;
    }
    setError(null);
    setToast("Signed in.");
  };

  const fill = (addr: string) => {
    setEmail(addr);
    setPassword("prototype");
    setErrors({});
    setError(null);
  };

  return (
    <AuthShell
      kicker="Welcome back"
      title="Sign In"
      description="Use your email address and password. The dashboard you land on depends on your role."
      footer={
        <AuthFooter>
          <LinkButton to={{ name: "forgot" }}>Forgot password</LinkButton>
          <LinkButton to={{ name: "signup" }}>Create an account</LinkButton>
        </AuthFooter>
      }
    >
      <form className="stack stack--sm" onSubmit={submit} noValidate>
        {error && <AuthError>{error}</AuthError>}
        <Field label="Email address" error={errors.email}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            type="email"
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
          />
        </Field>
        <button type="submit" className="button button--primary button--block">
          Sign In
        </button>
      </form>

      <div className="stack stack--sm">
        <span className="eyebrow" style={{ color: "var(--muted)" }}>
          Prototype demo accounts
        </span>
        <p className="tiny">
          No production authentication is configured. Any password of 6 or more
          characters works for these seeded accounts — select one to fill the
          form.
        </p>
        <div className="stack stack--sm">
          {ACCOUNTS.slice(0, 3).map((a) => (
            <button
              key={a.id}
              type="button"
              className="button button--secondary button--sm"
              style={{ justifyContent: "space-between" }}
              onClick={() => fill(a.email)}
            >
              <span>
                <strong>{a.role}</strong> — {a.name}
              </span>
              <span className="muted">{a.email}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="auth-link"
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
          onClick={() => {
            navigate({ name: "public-lookup" });
            setToast("Public pages are open without signing in.");
          }}
        >
          Or open the public barcode lookup without an account →
        </button>
      </div>
    </AuthShell>
  );
}

/* ------------------------ Forgot / Reset ----------------------------- */

export function ForgotPasswordPage() {
  const { navigate, setToast } = useStore();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setSent(true);
    setToast("Reset request recorded in the prototype.");
  };

  return (
    <AuthShell
      kicker="Account recovery"
      title="Forgot Password"
      description="Request a reset link for your SmartSave account."
      footer={
        <AuthFooter>
          <LinkButton to={{ name: "signin" }}>Back to Sign In</LinkButton>
        </AuthFooter>
      }
    >
      {sent ? (
        <div className="stack stack--sm">
          <SuccessStrip>
            If an account exists for {email}, a reset request has been recorded.
            In a production deployment this would be delivered through the
            configured channel — this prototype sends nothing.
          </SuccessStrip>
          <button
            type="button"
            className="button button--primary button--block"
            onClick={() => navigate({ name: "reset" })}
          >
            Continue to Reset Password
          </button>
        </div>
      ) : (
        <form className="stack stack--sm" onSubmit={submit} noValidate>
          {error && <AuthError>{error}</AuthError>}
          <Field label="Email address">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />
          </Field>
          <button type="submit" className="button button--primary button--block">
            Request reset link
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const { navigate, setToast } = useStore();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (pw.length < 8) next.pw = "Use at least 8 characters.";
    if (pw !== pw2) next.pw2 = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setDone(true);
    setToast("Password updated in the prototype.");
  };

  if (done) {
    return (
      <AuthShell
        kicker="Account recovery"
        title="Password updated"
        description="Your new password is active for this prototype session."
      >
        <SuccessStrip>Your password has been reset successfully.</SuccessStrip>
        <button
          type="button"
          className="button button--primary button--block"
          onClick={() => navigate({ name: "signin" })}
        >
          Back to Sign In
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker="Account recovery"
      title="Reset Password"
      description="Set a new password for your account."
      footer={
        <AuthFooter>
          <LinkButton to={{ name: "signin" }}>Back to Sign In</LinkButton>
        </AuthFooter>
      }
    >
      <form className="stack stack--sm" onSubmit={submit} noValidate>
        <Field label="New password" error={errors.pw}>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm new password" error={errors.pw2}>
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="Repeat the password"
            autoComplete="new-password"
          />
        </Field>
        <button type="submit" className="button button--primary button--block">
          Set new password
        </button>
      </form>
    </AuthShell>
  );
}
