import { useState } from "react";
import { AuthUser, login, setAuthToken } from "../api/client";
import { BrandLogo } from "./BrandLogo";

interface OwnerLoginProps {
  onSignedIn: (user: AuthUser) => void;
  onExit: () => void;
}

function errorMessage(err: unknown) {
  const response = (err as { response?: { data?: { error?: string } } })?.response;
  return response?.data?.error ?? "Unable to sign in. Please try again.";
}

export function OwnerLogin({ onSignedIn, onExit }: OwnerLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await login(email.trim(), password);
      setAuthToken(result.token);
      onSignedIn(result.user);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="owner-login">
      <form className="owner-login-card" onSubmit={handleSubmit}>
        <BrandLogo />
        <span className="owner-badge">Owner Console</span>
        <h2>Sign in</h2>
        <p className="owner-hint">Only authorised staff can manage menus, vendors and accounts.</p>

        {error && <div className="owner-alert owner-alert-error owner-login-alert">{error}</div>}

        <label className="field-label" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <label className="field-label" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="btn btn-primary btn-large owner-login-submit" type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        <button type="button" className="owner-linkish" onClick={onExit}>
          Back to website
        </button>
      </form>
    </div>
  );
}
