import { useEffect, useMemo, useState } from "react";
import {
  LedgerRow,
  PAYMENT_MODES,
  PAYMENT_MODE_LABELS,
  PaymentMode,
  VENDOR_CATEGORIES,
  VENDOR_CATEGORY_LABELS,
  Vendor,
  VendorCategory,
  VendorEntryType,
  VendorLedger,
  VendorListRow,
  addLedgerEntry,
  createVendor,
  deleteLedgerEntry,
  deleteVendor,
  fetchVendor,
  fetchVendorLedger,
  fetchVendors,
  updateVendor,
} from "../api/client";

export interface ConfirmRequest {
  title: string;
  body: string;
  note?: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
}

interface VendorsPanelProps {
  onNotify: (message: string) => void;
  onError: (message: string) => void;
  requestConfirm: (request: ConfirmRequest) => void;
}

type VendorForm = {
  name: string;
  category: VendorCategory;
  contactPerson: string;
  phone: string;
  email: string;
  gstNumber: string;
  paymentTerms: string;
  address: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  openingBalance: string;
  notes: string;
};

const ENTRY_TYPES: { value: VendorEntryType; label: string }[] = [
  { value: "PURCHASE", label: "Purchase / bill" },
  { value: "PAYMENT", label: "Payment made" },
  { value: "CREDIT_NOTE", label: "Credit note / return" },
];

const ENTRY_TYPE_LABELS: Record<VendorEntryType, string> = {
  PURCHASE: "Purchase",
  PAYMENT: "Payment",
  CREDIT_NOTE: "Credit note",
  OPENING_BALANCE: "Opening balance",
};

function emptyForm(): VendorForm {
  return {
    name: "",
    category: "GROCERY",
    contactPerson: "",
    phone: "",
    email: "",
    gstNumber: "",
    paymentTerms: "",
    address: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    openingBalance: "0",
    notes: "",
  };
}

function toForm(vendor: Vendor): VendorForm {
  return {
    name: vendor.name,
    category: vendor.category,
    contactPerson: vendor.contactPerson ?? "",
    phone: vendor.phone,
    email: vendor.email ?? "",
    gstNumber: vendor.gstNumber ?? "",
    paymentTerms: vendor.paymentTerms ?? "",
    address: vendor.address ?? "",
    bankName: vendor.bankName ?? "",
    accountName: vendor.accountName ?? "",
    accountNumber: vendor.accountNumber ?? "",
    ifscCode: vendor.ifscCode ?? "",
    upiId: vendor.upiId ?? "",
    openingBalance: String(Number(vendor.openingBalance)),
    notes: vendor.notes ?? "",
  };
}

function toPayload(form: VendorForm) {
  return {
    name: form.name.trim(),
    category: form.category,
    contactPerson: form.contactPerson.trim() || null,
    phone: form.phone.trim(),
    email: form.email.trim() || null,
    gstNumber: form.gstNumber.trim() || null,
    paymentTerms: form.paymentTerms.trim() || null,
    address: form.address.trim() || null,
    bankName: form.bankName.trim() || null,
    accountName: form.accountName.trim() || null,
    accountNumber: form.accountNumber.trim() || null,
    ifscCode: form.ifscCode.trim().toUpperCase() || null,
    upiId: form.upiId.trim() || null,
    openingBalance: Number(form.openingBalance || 0),
    notes: form.notes.trim() || null,
  };
}

function money(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function errorMessage(err: unknown) {
  const response = (err as { response?: { data?: { error?: string } } })?.response;
  return response?.data?.error ?? "Something went wrong. Please try again.";
}

export function VendorsPanel({ onNotify, onError, requestConfirm }: VendorsPanelProps) {
  const [vendors, setVendors] = useState<VendorListRow[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<VendorCategory | "ALL">("ALL");

  const [form, setForm] = useState<VendorForm | null>(null);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [ledger, setLedger] = useState<VendorLedger | null>(null);
  const [entryForm, setEntryForm] = useState<{
    type: VendorEntryType;
    entryDate: string;
    amount: string;
    referenceNo: string;
    paymentMode: PaymentMode;
    description: string;
  } | null>(null);

  useEffect(() => {
    loadVendors();
  }, []);

  const totals = useMemo(() => {
    const payable = vendors.filter((v) => v.balance > 0).reduce((sum, v) => sum + v.balance, 0);
    const advance = vendors.filter((v) => v.balance < 0).reduce((sum, v) => sum - v.balance, 0);
    return { payable, advance };
  }, [vendors]);

  const visible = vendors.filter((vendor) => {
    const term = search.trim().toLowerCase();
    const matchesTerm =
      !term || vendor.name.toLowerCase().includes(term) || vendor.phone.toLowerCase().includes(term);
    const matchesCategory = categoryFilter === "ALL" || vendor.category === categoryFilter;
    return matchesTerm && matchesCategory;
  });

  async function loadVendors() {
    try {
      setVendors(await fetchVendors());
    } catch (err) {
      onError(errorMessage(err));
    }
  }

  async function openEdit(vendorId: string) {
    try {
      const vendor = await fetchVendor(vendorId);
      setEditingVendorId(vendorId);
      setForm(toForm(vendor));
    } catch (err) {
      onError(errorMessage(err));
    }
  }

  async function handleSaveVendor(event: React.FormEvent) {
    event.preventDefault();
    if (!form || !form.name.trim() || !form.phone.trim()) return;

    setSaving(true);
    try {
      if (editingVendorId) {
        await updateVendor(editingVendorId, toPayload(form));
        onNotify("Vendor updated");
      } else {
        await createVendor(toPayload(form));
        onNotify("Vendor added");
      }
      setForm(null);
      setEditingVendorId(null);
      await loadVendors();
      if (ledger && editingVendorId === ledger.vendor.id) setLedger(await fetchVendorLedger(editingVendorId));
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function askDeleteVendor(vendor: VendorListRow) {
    requestConfirm({
      title: "Delete vendor?",
      body: `"${vendor.name}" will be removed along with their entire account ledger.`,
      note: "This cannot be undone.",
      confirmLabel: "Yes, delete",
      onConfirm: async () => {
        try {
          await deleteVendor(vendor.id);
          if (ledger?.vendor.id === vendor.id) setLedger(null);
          await loadVendors();
          onNotify("Vendor deleted");
        } catch (err) {
          onError(errorMessage(err));
        }
      },
    });
  }

  async function openLedger(vendorId: string) {
    try {
      setLedger(await fetchVendorLedger(vendorId));
    } catch (err) {
      onError(errorMessage(err));
    }
  }

  async function handleAddEntry(event: React.FormEvent) {
    event.preventDefault();
    if (!entryForm || !ledger) return;

    setSaving(true);
    try {
      const updated = await addLedgerEntry(ledger.vendor.id, {
        type: entryForm.type,
        entryDate: entryForm.entryDate,
        amount: Number(entryForm.amount),
        referenceNo: entryForm.referenceNo.trim() || null,
        paymentMode: entryForm.type === "PAYMENT" ? entryForm.paymentMode : null,
        description: entryForm.description.trim() || null,
      });
      setLedger(updated);
      setEntryForm(null);
      await loadVendors();
      onNotify("Entry recorded");
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function askDeleteEntry(entry: LedgerRow) {
    requestConfirm({
      title: "Delete entry?",
      body: `${ENTRY_TYPE_LABELS[entry.type]} of ${money(entry.amount)} on ${formatDate(entry.entryDate)} will be removed.`,
      note: "The running balance will be recalculated.",
      confirmLabel: "Yes, delete",
      onConfirm: async () => {
        try {
          setLedger(await deleteLedgerEntry(entry.id));
          await loadVendors();
          onNotify("Entry deleted");
        } catch (err) {
          onError(errorMessage(err));
        }
      },
    });
  }

  if (ledger) {
    const v = ledger.vendor;
    return (
      <main className="owner-rates">
        <section className="owner-panel owner-panel-wide">
          <div className="owner-crumbs">
            <button className="owner-back" onClick={() => setLedger(null)}>
              ← All vendors
            </button>
            <span>{v.name} › Account ledger</span>
          </div>

          <div className="owner-ledger-head">
            <div className="owner-vendor-card">
              <span className="owner-avatar">{initials(v.name)}</span>
              <div>
                <h3>{v.name}</h3>
                <p>
                  {VENDOR_CATEGORY_LABELS[v.category]} · {v.phone}
                  {v.contactPerson ? ` · ${v.contactPerson}` : ""}
                </p>
                {v.paymentTerms && <p className="owner-hint">Terms: {v.paymentTerms}</p>}
              </div>
              <button className="btn btn-outline btn-small" onClick={() => openEdit(v.id)}>
                Edit details
              </button>
            </div>

            <div className="owner-payout">
              <h4>Payout details</h4>
              <dl>
                <div>
                  <dt>Bank</dt>
                  <dd>{v.bankName || "—"}</dd>
                </div>
                <div>
                  <dt>Account name</dt>
                  <dd>{v.accountName || "—"}</dd>
                </div>
                <div>
                  <dt>Account no.</dt>
                  <dd>{v.accountNumber || "—"}</dd>
                </div>
                <div>
                  <dt>IFSC</dt>
                  <dd>{v.ifscCode || "—"}</dd>
                </div>
                <div>
                  <dt>UPI</dt>
                  <dd>{v.upiId || "—"}</dd>
                </div>
                <div>
                  <dt>GSTIN</dt>
                  <dd>{v.gstNumber || "—"}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="owner-metrics">
            <div className="owner-metric">
              <small>Opening</small>
              {money(ledger.openingBalance)}
            </div>
            <div className="owner-metric">
              <small>Purchases</small>
              {money(ledger.totalPurchases)}
            </div>
            <div className="owner-metric">
              <small>Paid</small>
              {money(ledger.totalPaid)}
            </div>
            <div className="owner-metric">
              <small>Credit notes</small>
              {money(ledger.totalCredits)}
            </div>
            <div className={ledger.balance > 0 ? "owner-metric due" : "owner-metric settled"}>
              <small>{ledger.balance >= 0 ? "Payable" : "Advance paid"}</small>
              {money(Math.abs(ledger.balance))}
            </div>
          </div>

          <div className="owner-actions">
            <button
              className="btn btn-primary btn-small"
              onClick={() =>
                setEntryForm({
                  type: "PURCHASE",
                  entryDate: today(),
                  amount: "",
                  referenceNo: "",
                  paymentMode: "UPI",
                  description: "",
                })
              }
            >
              + Record entry
            </button>
            <button className="btn btn-outline btn-small" onClick={() => window.print()}>
              Print statement
            </button>
          </div>

          <div className="owner-table-scroll">
            <table className="owner-table owner-table-read">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Balance</th>
                  <th className="owner-col-actions" />
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>—</td>
                  <td>
                    <span className="owner-tag">Opening</span>
                  </td>
                  <td>Balance carried forward</td>
                  <td>—</td>
                  <td>—</td>
                  <td>
                    <strong>{money(ledger.openingBalance)}</strong>
                  </td>
                  <td />
                </tr>
                {ledger.entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.entryDate)}</td>
                    <td>
                      <span className={`owner-tag tag-${entry.type.toLowerCase()}`}>
                        {ENTRY_TYPE_LABELS[entry.type]}
                      </span>
                    </td>
                    <td>
                      {entry.description || "—"}
                      {entry.referenceNo && <small className="owner-ref"> · Ref {entry.referenceNo}</small>}
                      {entry.paymentMode && (
                        <small className="owner-ref"> · {PAYMENT_MODE_LABELS[entry.paymentMode]}</small>
                      )}
                    </td>
                    <td>{entry.debit ? money(entry.debit) : "—"}</td>
                    <td>{entry.credit ? money(entry.credit) : "—"}</td>
                    <td>
                      <strong>{money(entry.balance)}</strong>
                    </td>
                    <td className="owner-row-actions">
                      <button className="btn btn-danger btn-small" onClick={() => askDeleteEntry(entry)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ledger.entries.length === 0 && <p className="owner-empty">No transactions recorded yet.</p>}
        </section>

        {renderVendorModal()}
        {renderEntryModal()}
      </main>
    );
  }

  return (
    <main className="owner-rates">
      <section className="owner-panel owner-panel-wide">
        <div className="owner-panel-head">
          <h3>Vendors</h3>
          <span className="owner-pill">Payable {money(totals.payable)}</span>
          {totals.advance > 0 && <span className="owner-pill">Advance {money(totals.advance)}</span>}
          <input
            className="owner-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or phone…"
            aria-label="Search vendors"
          />
          <button
            className="btn btn-primary btn-small"
            onClick={() => {
              setEditingVendorId(null);
              setForm(emptyForm());
            }}
          >
            + Add vendor
          </button>
        </div>

        <div className="owner-chip-row">
          <button
            className={categoryFilter === "ALL" ? "owner-chip active" : "owner-chip"}
            onClick={() => setCategoryFilter("ALL")}
          >
            All
          </button>
          {VENDOR_CATEGORIES.map((category) => (
            <button
              key={category}
              className={categoryFilter === category ? "owner-chip active" : "owner-chip"}
              onClick={() => setCategoryFilter(category)}
            >
              {VENDOR_CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>

        <div className="owner-tiles">
          {visible.map((vendor) => (
            <article key={vendor.id} className="owner-tile">
              <div className="owner-tile-top">
                <span className="owner-avatar">{initials(vendor.name)}</span>
                <div>
                  <h4>{vendor.name}</h4>
                  <p>
                    {VENDOR_CATEGORY_LABELS[vendor.category]} · {vendor.phone}
                  </p>
                </div>
              </div>
              <p className={vendor.balance > 0 ? "owner-balance due" : "owner-balance settled"}>
                {vendor.balance > 0
                  ? `${money(vendor.balance)} payable`
                  : vendor.balance < 0
                    ? `${money(-vendor.balance)} advance`
                    : "Settled"}
                <small> · {vendor.entryCount} entries</small>
              </p>
              <div className="owner-tile-actions">
                <button className="btn btn-primary btn-small" onClick={() => openLedger(vendor.id)}>
                  Account
                </button>
                <button className="btn btn-outline btn-small" onClick={() => openEdit(vendor.id)}>
                  Update
                </button>
                <button className="btn btn-danger btn-small" onClick={() => askDeleteVendor(vendor)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
          {visible.length === 0 && <p className="owner-empty">No vendors match this filter.</p>}
        </div>
      </section>

      {renderVendorModal()}
    </main>
  );

  function renderVendorModal() {
    if (!form) return null;
    const set = (patch: Partial<VendorForm>) => setForm({ ...form, ...patch });

    return (
      <div className="owner-modal-backdrop" onClick={() => setForm(null)}>
        <form className="owner-modal owner-modal-wide" onClick={(e) => e.stopPropagation()} onSubmit={handleSaveVendor}>
          <h3>{editingVendorId ? "Update vendor" : "New vendor"}</h3>

          <div className="owner-form-grid">
            <label>
              <span className="field-label">Vendor name *</span>
              <input value={form.name} onChange={(e) => set({ name: e.target.value })} autoFocus />
            </label>
            <label>
              <span className="field-label">Category</span>
              <select value={form.category} onChange={(e) => set({ category: e.target.value as VendorCategory })}>
                {VENDOR_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {VENDOR_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Phone *</span>
              <input value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
            </label>
            <label>
              <span className="field-label">Contact person</span>
              <input value={form.contactPerson} onChange={(e) => set({ contactPerson: e.target.value })} />
            </label>
            <label>
              <span className="field-label">Email</span>
              <input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
            </label>
            <label>
              <span className="field-label">GSTIN</span>
              <input value={form.gstNumber} onChange={(e) => set({ gstNumber: e.target.value })} />
            </label>
            <label>
              <span className="field-label">Payment terms</span>
              <input
                value={form.paymentTerms}
                onChange={(e) => set({ paymentTerms: e.target.value })}
                placeholder="e.g. Net 15 days"
              />
            </label>
            <label>
              <span className="field-label">Opening balance (₹)</span>
              <input
                type="number"
                step="0.01"
                value={form.openingBalance}
                onChange={(e) => set({ openingBalance: e.target.value })}
              />
            </label>
            <label className="owner-form-full">
              <span className="field-label">Address</span>
              <input value={form.address} onChange={(e) => set({ address: e.target.value })} />
            </label>
          </div>

          <h4 className="owner-form-section">Payout details</h4>
          <div className="owner-form-grid">
            <label>
              <span className="field-label">Bank name</span>
              <input value={form.bankName} onChange={(e) => set({ bankName: e.target.value })} />
            </label>
            <label>
              <span className="field-label">Account holder</span>
              <input value={form.accountName} onChange={(e) => set({ accountName: e.target.value })} />
            </label>
            <label>
              <span className="field-label">Account number</span>
              <input
                value={form.accountNumber}
                onChange={(e) => set({ accountNumber: e.target.value })}
                autoComplete="off"
              />
            </label>
            <label>
              <span className="field-label">IFSC</span>
              <input value={form.ifscCode} onChange={(e) => set({ ifscCode: e.target.value })} />
            </label>
            <label className="owner-form-full">
              <span className="field-label">UPI ID</span>
              <input value={form.upiId} onChange={(e) => set({ upiId: e.target.value })} />
            </label>
            <label className="owner-form-full">
              <span className="field-label">Notes</span>
              <input value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
            </label>
          </div>

          <div className="owner-modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setForm(null)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !form.name.trim() || !form.phone.trim()}
            >
              {saving ? "Saving…" : editingVendorId ? "Save changes" : "Add vendor"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  function renderEntryModal() {
    if (!entryForm) return null;
    const set = (patch: Partial<typeof entryForm>) => setEntryForm({ ...entryForm, ...patch });

    return (
      <div className="owner-modal-backdrop" onClick={() => setEntryForm(null)}>
        <form className="owner-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleAddEntry}>
          <h3>Record entry</h3>

          <span className="field-label">Entry type</span>
          <div className="owner-chip-row">
            {ENTRY_TYPES.map((option) => (
              <button
                key={option.value}
                type="button"
                className={entryForm.type === option.value ? "owner-chip active" : "owner-chip"}
                onClick={() => set({ type: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="owner-form-grid">
            <label>
              <span className="field-label">Date</span>
              <input type="date" value={entryForm.entryDate} onChange={(e) => set({ entryDate: e.target.value })} />
            </label>
            <label>
              <span className="field-label">Amount (₹)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={entryForm.amount}
                onChange={(e) => set({ amount: e.target.value })}
                autoFocus
              />
            </label>
            <label>
              <span className="field-label">Reference / invoice no.</span>
              <input value={entryForm.referenceNo} onChange={(e) => set({ referenceNo: e.target.value })} />
            </label>
            {entryForm.type === "PAYMENT" && (
              <label>
                <span className="field-label">Payment mode</span>
                <select
                  value={entryForm.paymentMode}
                  onChange={(e) => set({ paymentMode: e.target.value as PaymentMode })}
                >
                  {PAYMENT_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {PAYMENT_MODE_LABELS[mode]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="owner-form-full">
              <span className="field-label">Description</span>
              <input
                value={entryForm.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="e.g. Vegetables for Sharma wedding"
              />
            </label>
          </div>

          <div className="owner-modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setEntryForm(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !(Number(entryForm.amount) > 0)}>
              {saving ? "Saving…" : "Save entry"}
            </button>
          </div>
        </form>
      </div>
    );
  }
}
