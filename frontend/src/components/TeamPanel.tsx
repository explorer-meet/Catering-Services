import { useEffect, useState } from "react";
import {
  AuthUser,
  USER_ROLES,
  USER_ROLE_LABELS,
  UserRole,
  changePassword,
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
} from "../api/client";
import type { ConfirmRequest } from "./VendorsPanel";

interface TeamPanelProps {
  currentUser: AuthUser;
  onNotify: (message: string) => void;
  onError: (message: string) => void;
  requestConfirm: (request: ConfirmRequest) => void;
}

interface UserForm {
  id: string | null;
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

function errorMessage(err: unknown) {
  const response = (err as { response?: { data?: { error?: string } } })?.response;
  return response?.data?.error ?? "Something went wrong. Please try again.";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export function TeamPanel({ currentUser, onNotify, onError, requestConfirm }: TeamPanelProps) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [form, setForm] = useState<UserForm | null>(null);
  const [passwordForm, setPasswordForm] = useState<{ current: string; next: string; confirm: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const isOwner = currentUser.role === "OWNER";

  useEffect(() => {
    if (isOwner) loadUsers();
  }, [isOwner]);

  async function loadUsers() {
    try {
      setUsers(await fetchUsers());
    } catch (err) {
      onError(errorMessage(err));
    }
  }

  async function handleSaveUser(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;

    setSaving(true);
    try {
      if (form.id) {
        await updateUser(form.id, {
          name: form.name.trim(),
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        });
        onNotify("Account updated");
      } else {
        await createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          password: form.password,
        });
        onNotify("Account created");
      }
      setForm(null);
      await loadUsers();
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(user: AuthUser) {
    try {
      await updateUser(user.id, { isActive: !user.isActive });
      await loadUsers();
      onNotify(user.isActive ? "Account deactivated" : "Account activated");
    } catch (err) {
      onError(errorMessage(err));
    }
  }

  function askDeleteUser(user: AuthUser) {
    requestConfirm({
      title: "Delete account?",
      body: `"${user.name}" will lose access to the owner console immediately.`,
      note: "This cannot be undone.",
      confirmLabel: "Yes, delete",
      onConfirm: async () => {
        try {
          await deleteUser(user.id);
          await loadUsers();
          onNotify("Account deleted");
        } catch (err) {
          onError(errorMessage(err));
        }
      },
    });
  }

  async function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();
    if (!passwordForm) return;
    if (passwordForm.next !== passwordForm.confirm) {
      onError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      await changePassword(passwordForm.current, passwordForm.next);
      setPasswordForm(null);
      onNotify("Password changed");
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="owner-rates">
      <section className="owner-panel owner-panel-wide">
        <div className="owner-panel-head">
          <h3>Your account</h3>
        </div>
        <div className="owner-vendor-card">
          <span className="owner-avatar">{initials(currentUser.name)}</span>
          <div>
            <h3>{currentUser.name}</h3>
            <p>
              {currentUser.email} · {USER_ROLE_LABELS[currentUser.role]}
            </p>
          </div>
          <button
            className="btn btn-outline btn-small"
            onClick={() => setPasswordForm({ current: "", next: "", confirm: "" })}
          >
            Change password
          </button>
        </div>
      </section>

      {isOwner && (
        <section className="owner-panel owner-panel-wide">
          <div className="owner-panel-head">
            <h3>Team accounts</h3>
            <span className="owner-pill">{users.length} users</span>
            <button
              className="btn btn-primary btn-small"
              onClick={() => setForm({ id: null, name: "", email: "", role: "MANAGER", password: "" })}
            >
              + Add user
            </button>
          </div>

          <p className="owner-hint">
            Managers handle menus, recipes, vendors and B2B orders. Accountants can see vendors and B2B accounts only.
          </p>

          <div className="owner-table-scroll">
            <table className="owner-table owner-table-read">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last sign-in</th>
                  <th className="owner-col-actions" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      {user.id === currentUser.id && <small className="owner-ref"> · you</small>}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className="owner-tag">{USER_ROLE_LABELS[user.role]}</span>
                    </td>
                    <td>
                      <span className={user.isActive ? "owner-tag tag-delivered" : "owner-tag tag-cancelled"}>
                        {user.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("en-IN") : "Never"}</td>
                    <td className="owner-row-actions">
                      <button
                        className="btn btn-outline btn-small"
                        onClick={() =>
                          setForm({ id: user.id, name: user.name, email: user.email, role: user.role, password: "" })
                        }
                      >
                        Edit
                      </button>
                      {user.id !== currentUser.id && (
                        <>
                          <button className="btn btn-outline btn-small" onClick={() => handleToggleActive(user)}>
                            {user.isActive ? "Disable" : "Enable"}
                          </button>
                          <button className="btn btn-danger btn-small" onClick={() => askDeleteUser(user)}>
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {form && (
        <div className="owner-modal-backdrop" onClick={() => setForm(null)}>
          <form className="owner-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSaveUser}>
            <h3>{form.id ? "Edit account" : "New account"}</h3>
            <div className="owner-form-grid">
              <label>
                <span className="field-label">Full name *</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
              </label>
              <label>
                <span className="field-label">Role</span>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {USER_ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </label>
              {!form.id && (
                <label className="owner-form-full">
                  <span className="field-label">Email *</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </label>
              )}
              <label className="owner-form-full">
                <span className="field-label">
                  {form.id ? "New password (leave blank to keep current)" : "Password *"}
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 8 characters"
                />
              </label>
            </div>
            <div className="owner-modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setForm(null)}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || !form.name.trim() || (!form.id && (!form.email.trim() || !form.password))}
              >
                {saving ? "Saving…" : form.id ? "Save changes" : "Create account"}
              </button>
            </div>
          </form>
        </div>
      )}

      {passwordForm && (
        <div className="owner-modal-backdrop" onClick={() => setPasswordForm(null)}>
          <form className="owner-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleChangePassword}>
            <h3>Change password</h3>
            <label className="field-label" htmlFor="pwd-current">
              Current password
            </label>
            <input
              id="pwd-current"
              type="password"
              autoComplete="current-password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              autoFocus
            />
            <label className="field-label" htmlFor="pwd-next">
              New password
            </label>
            <input
              id="pwd-next"
              type="password"
              autoComplete="new-password"
              value={passwordForm.next}
              onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
              placeholder="At least 8 characters"
            />
            <label className="field-label" htmlFor="pwd-confirm">
              Confirm new password
            </label>
            <input
              id="pwd-confirm"
              type="password"
              autoComplete="new-password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
            />
            <div className="owner-modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setPasswordForm(null)}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || !passwordForm.current || passwordForm.next.length < 8}
              >
                {saving ? "Saving…" : "Update password"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
