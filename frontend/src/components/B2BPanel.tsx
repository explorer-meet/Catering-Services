import { useEffect, useMemo, useState } from "react";
import {
  B2BDirection,
  B2BOrder,
  B2BOrderStatus,
  B2B_STATUSES,
  B2B_STATUS_LABELS,
  PAYMENT_MODES,
  PAYMENT_MODE_LABELS,
  PaymentMode,
  VendorListRow,
  addB2BPayment,
  createB2BOrder,
  deleteB2BOrder,
  deleteB2BPayment,
  fetchB2BOrders,
  fetchVendors,
  updateB2BOrder,
  updateB2BStatus,
} from "../api/client";
import type { ConfirmRequest } from "./VendorsPanel";

interface B2BPanelProps {
  onNotify: (message: string) => void;
  onError: (message: string) => void;
  requestConfirm: (request: ConfirmRequest) => void;
}

interface DraftItem {
  key: string;
  description: string;
  quantity: string;
  unit: string;
  rate: string;
}

interface OrderForm {
  id: string | null;
  direction: B2BDirection;
  status: B2BOrderStatus;
  partnerName: string;
  partnerPhone: string;
  partnerGst: string;
  vendorId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  paxCount: string;
  otherCharges: string;
  taxPercent: string;
  notes: string;
  items: DraftItem[];
}

function emptyItem(): DraftItem {
  return { key: Math.random().toString(36).slice(2), description: "", quantity: "", unit: "plates", rate: "" };
}

function emptyForm(direction: B2BDirection): OrderForm {
  return {
    id: null,
    direction,
    status: "CONFIRMED",
    partnerName: "",
    partnerPhone: "",
    partnerGst: "",
    vendorId: "",
    eventName: "",
    eventDate: new Date().toISOString().slice(0, 10),
    eventTime: "",
    venue: "",
    paxCount: "",
    otherCharges: "0",
    taxPercent: "0",
    notes: "",
    items: [emptyItem()],
  };
}

function toForm(order: B2BOrder): OrderForm {
  return {
    id: order.id,
    direction: order.direction,
    status: order.status,
    partnerName: order.partnerName,
    partnerPhone: order.partnerPhone ?? "",
    partnerGst: order.partnerGst ?? "",
    vendorId: order.vendorId ?? "",
    eventName: order.eventName,
    eventDate: order.eventDate.slice(0, 10),
    eventTime: order.eventTime ?? "",
    venue: order.venue ?? "",
    paxCount: String(order.paxCount),
    otherCharges: String(order.otherCharges),
    taxPercent: String(order.taxPercent),
    notes: order.notes ?? "",
    items: order.items.length
      ? order.items.map((item) => ({
          key: item.id,
          description: item.description,
          quantity: String(item.quantity),
          unit: item.unit,
          rate: String(item.rate),
        }))
      : [emptyItem()],
  };
}

function money(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function errorMessage(err: unknown) {
  const response = (err as { response?: { data?: { error?: string } } })?.response;
  return response?.data?.error ?? "Something went wrong. Please try again.";
}

export function B2BPanel({ onNotify, onError, requestConfirm }: B2BPanelProps) {
  const [direction, setDirection] = useState<B2BDirection>("OUTGOING");
  const [statusFilter, setStatusFilter] = useState<B2BOrderStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<B2BOrder[]>([]);
  const [vendors, setVendors] = useState<VendorListRow[]>([]);
  const [openOrder, setOpenOrder] = useState<B2BOrder | null>(null);
  const [form, setForm] = useState<OrderForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [paymentForm, setPaymentForm] = useState<{
    paidOn: string;
    amount: string;
    mode: PaymentMode;
    referenceNo: string;
    notes: string;
  } | null>(null);

  useEffect(() => {
    loadOrders();
    fetchVendors()
      .then(setVendors)
      .catch((err) => onError(errorMessage(err)));
  }, []);

  const visible = orders.filter((order) => {
    const term = search.trim().toLowerCase();
    return (
      order.direction === direction &&
      (statusFilter === "ALL" || order.status === statusFilter) &&
      (!term ||
        order.partnerName.toLowerCase().includes(term) ||
        order.eventName.toLowerCase().includes(term) ||
        order.orderNumber.toLowerCase().includes(term))
    );
  });

  const totals = useMemo(() => {
    const live = orders.filter((order) => order.direction === direction && order.status !== "CANCELLED");
    return {
      count: live.length,
      value: live.reduce((sum, order) => sum + order.totalAmount, 0),
      outstanding: live.reduce((sum, order) => sum + order.balanceAmount, 0),
    };
  }, [orders, direction]);

  const draftTotals = useMemo(() => {
    if (!form) return { subtotal: 0, total: 0 };
    const subtotal = form.items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
      0,
    );
    const taxable = subtotal + (Number(form.otherCharges) || 0);
    const total = taxable + (taxable * (Number(form.taxPercent) || 0)) / 100;
    return { subtotal: Math.round(subtotal * 100) / 100, total: Math.round(total * 100) / 100 };
  }, [form]);

  async function loadOrders() {
    try {
      const rows = await fetchB2BOrders();
      setOrders(rows);
      if (openOrder) setOpenOrder(rows.find((row) => row.id === openOrder.id) ?? null);
    } catch (err) {
      onError(errorMessage(err));
    }
  }

  async function handleSaveOrder(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;

    const items = form.items
      .filter((item) => item.description.trim() && Number(item.quantity) > 0)
      .map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unit: item.unit.trim() || "plates",
        rate: Number(item.rate) || 0,
      }));

    if (items.length === 0) {
      onError("Add at least one line item with a quantity.");
      return;
    }

    const payload = {
      direction: form.direction,
      status: form.status,
      partnerName: form.partnerName.trim(),
      partnerPhone: form.partnerPhone.trim() || null,
      partnerGst: form.partnerGst.trim() || null,
      vendorId: form.vendorId || null,
      eventName: form.eventName.trim(),
      eventDate: form.eventDate,
      eventTime: form.eventTime.trim() || null,
      venue: form.venue.trim() || null,
      paxCount: Number(form.paxCount) || 0,
      otherCharges: Number(form.otherCharges) || 0,
      taxPercent: Number(form.taxPercent) || 0,
      notes: form.notes.trim() || null,
      items,
    };

    setSaving(true);
    try {
      const saved = form.id ? await updateB2BOrder(form.id, payload) : await createB2BOrder(payload);
      setForm(null);
      await loadOrders();
      if (openOrder) setOpenOrder(saved);
      onNotify(form.id ? "Order updated" : `Order ${saved.orderNumber} created`);
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(order: B2BOrder, status: B2BOrderStatus) {
    try {
      const updated = await updateB2BStatus(order.id, status);
      if (openOrder?.id === order.id) setOpenOrder(updated);
      await loadOrders();
      onNotify(`Marked ${B2B_STATUS_LABELS[status].toLowerCase()}`);
    } catch (err) {
      onError(errorMessage(err));
    }
  }

  function askDeleteOrder(order: B2BOrder) {
    requestConfirm({
      title: "Delete B2B order?",
      body: `${order.orderNumber} for "${order.partnerName}" will be removed with its line items and payments.`,
      note: "Linked vendor ledger entries are removed too.",
      confirmLabel: "Yes, delete",
      onConfirm: async () => {
        try {
          await deleteB2BOrder(order.id);
          if (openOrder?.id === order.id) setOpenOrder(null);
          await loadOrders();
          onNotify("Order deleted");
        } catch (err) {
          onError(errorMessage(err));
        }
      },
    });
  }

  async function handleAddPayment(event: React.FormEvent) {
    event.preventDefault();
    if (!paymentForm || !openOrder) return;

    setSaving(true);
    try {
      const updated = await addB2BPayment(openOrder.id, {
        paidOn: paymentForm.paidOn,
        amount: Number(paymentForm.amount),
        mode: paymentForm.mode,
        referenceNo: paymentForm.referenceNo.trim() || null,
        notes: paymentForm.notes.trim() || null,
      });
      setOpenOrder(updated);
      setPaymentForm(null);
      await loadOrders();
      onNotify("Payment recorded");
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function askDeletePayment(paymentId: string, amount: number) {
    requestConfirm({
      title: "Delete payment?",
      body: `This payment of ${money(amount)} will be removed from the order.`,
      note: "Any matching vendor ledger entry is removed as well.",
      confirmLabel: "Yes, delete",
      onConfirm: async () => {
        try {
          setOpenOrder(await deleteB2BPayment(paymentId));
          await loadOrders();
          onNotify("Payment deleted");
        } catch (err) {
          onError(errorMessage(err));
        }
      },
    });
  }

  if (openOrder) {
    const order = openOrder;
    const isOutgoing = order.direction === "OUTGOING";
    return (
      <main className="owner-rates">
        <section className="owner-panel owner-panel-wide">
          <div className="owner-crumbs">
            <button className="owner-back" onClick={() => setOpenOrder(null)}>
              ← All B2B orders
            </button>
            <span>
              {order.orderNumber} › {order.partnerName}
            </span>
          </div>

          <div className="owner-panel-head">
            <h3>{order.eventName}</h3>
            <span className={`owner-tag tag-${order.status.toLowerCase()}`}>{B2B_STATUS_LABELS[order.status]}</span>
            <span className="owner-pill">{isOutgoing ? "Given to partner" : "Received from partner"}</span>
          </div>

          <div className="owner-ledger-head">
            <div className="owner-payout">
              <h4>Event</h4>
              <dl>
                <div>
                  <dt>Date</dt>
                  <dd>
                    {formatDate(order.eventDate)}
                    {order.eventTime ? ` · ${order.eventTime}` : ""}
                  </dd>
                </div>
                <div>
                  <dt>Venue</dt>
                  <dd>{order.venue || "—"}</dd>
                </div>
                <div>
                  <dt>Pax</dt>
                  <dd>{order.paxCount || "—"}</dd>
                </div>
              </dl>
            </div>
            <div className="owner-payout">
              <h4>Partner</h4>
              <dl>
                <div>
                  <dt>Name</dt>
                  <dd>{order.partnerName}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{order.partnerPhone || "—"}</dd>
                </div>
                <div>
                  <dt>GSTIN</dt>
                  <dd>{order.partnerGst || "—"}</dd>
                </div>
                <div>
                  <dt>Vendor account</dt>
                  <dd>{order.vendor ? order.vendor.name : "Not linked"}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="owner-metrics">
            <div className="owner-metric">
              <small>Subtotal</small>
              {money(order.subtotal)}
            </div>
            <div className="owner-metric">
              <small>Other + tax</small>
              {money(order.totalAmount - order.subtotal)}
            </div>
            <div className="owner-metric">
              <small>Order value</small>
              {money(order.totalAmount)}
            </div>
            <div className="owner-metric settled">
              <small>{isOutgoing ? "Paid" : "Received"}</small>
              {money(order.paidAmount)}
            </div>
            <div className={order.balanceAmount > 0 ? "owner-metric due" : "owner-metric settled"}>
              <small>{isOutgoing ? "Payable" : "Receivable"}</small>
              {money(order.balanceAmount)}
            </div>
          </div>

          <div className="owner-actions">
            <label className="owner-field">
              <span>Status</span>
              <select
                value={order.status}
                onChange={(e) => handleStatus(order, e.target.value as B2BOrderStatus)}
                aria-label="Order status"
              >
                {B2B_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {B2B_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-outline btn-small" onClick={() => setForm(toForm(order))}>
              Edit order
            </button>
            <button
              className="btn btn-primary btn-small"
              onClick={() =>
                setPaymentForm({
                  paidOn: new Date().toISOString().slice(0, 10),
                  amount: String(order.balanceAmount > 0 ? order.balanceAmount : ""),
                  mode: "UPI",
                  referenceNo: "",
                  notes: "",
                })
              }
            >
              + Record {isOutgoing ? "payment" : "receipt"}
            </button>
            <button className="btn btn-outline btn-small" onClick={() => window.print()}>
              Print
            </button>
          </div>

          <h4>Line items</h4>
          <div className="owner-table-scroll">
            <table className="owner-table owner-table-read">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit}</td>
                    <td>{money(item.rate)}</td>
                    <td>
                      <strong>{money(item.amount)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="owner-divider" />

          <h4>{isOutgoing ? "Payments made" : "Payments received"}</h4>
          <div className="owner-table-scroll">
            <table className="owner-table owner-table-read">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Reference</th>
                  <th>Note</th>
                  <th className="owner-col-actions" />
                </tr>
              </thead>
              <tbody>
                {order.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.paidOn)}</td>
                    <td>
                      <strong>{money(payment.amount)}</strong>
                    </td>
                    <td>{payment.mode ? PAYMENT_MODE_LABELS[payment.mode] : "—"}</td>
                    <td>{payment.referenceNo || "—"}</td>
                    <td>{payment.notes || "—"}</td>
                    <td className="owner-row-actions">
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => askDeletePayment(payment.id, payment.amount)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {order.payments.length === 0 && <p className="owner-empty">No payments recorded yet.</p>}

          {order.notes && (
            <>
              <div className="owner-divider" />
              <h4>Notes</h4>
              <p className="owner-empty">{order.notes}</p>
            </>
          )}
        </section>

        {renderOrderModal()}
        {renderPaymentModal()}
      </main>
    );
  }

  return (
    <main className="owner-rates">
      <section className="owner-panel owner-panel-wide">
        <div className="owner-panel-head">
          <h3>B2B orders</h3>
          <span className="owner-pill">{totals.count} orders</span>
          <span className="owner-pill">Value {money(totals.value)}</span>
          <span className="owner-pill">
            {direction === "OUTGOING" ? "Payable" : "Receivable"} {money(totals.outstanding)}
          </span>
          <input
            className="owner-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partner, event or order no…"
            aria-label="Search B2B orders"
          />
          <button className="btn btn-primary btn-small" onClick={() => setForm(emptyForm(direction))}>
            + New order
          </button>
        </div>

        <div className="owner-tabs owner-subtabs">
          <button
            className={direction === "OUTGOING" ? "owner-tab active" : "owner-tab"}
            onClick={() => setDirection("OUTGOING")}
          >
            Given to partners
          </button>
          <button
            className={direction === "INCOMING" ? "owner-tab active" : "owner-tab"}
            onClick={() => setDirection("INCOMING")}
          >
            Received from partners
          </button>
        </div>

        <div className="owner-chip-row">
          <button
            className={statusFilter === "ALL" ? "owner-chip active" : "owner-chip"}
            onClick={() => setStatusFilter("ALL")}
          >
            All
          </button>
          {B2B_STATUSES.map((status) => (
            <button
              key={status}
              className={statusFilter === status ? "owner-chip active" : "owner-chip"}
              onClick={() => setStatusFilter(status)}
            >
              {B2B_STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        <div className="owner-tiles">
          {visible.map((order) => (
            <article key={order.id} className="owner-tile">
              <div className="owner-tile-top">
                <div>
                  <h4>{order.partnerName}</h4>
                  <p>
                    {order.orderNumber} · {order.eventName}
                  </p>
                  <p>
                    {formatDate(order.eventDate)}
                    {order.paxCount ? ` · ${order.paxCount} pax` : ""}
                  </p>
                </div>
                <span className={`owner-tag tag-${order.status.toLowerCase()}`}>
                  {B2B_STATUS_LABELS[order.status]}
                </span>
              </div>
              <p className={order.balanceAmount > 0 ? "owner-balance due" : "owner-balance settled"}>
                {money(order.totalAmount)}
                <small>
                  {" "}
                  · {order.balanceAmount > 0
                    ? `${money(order.balanceAmount)} ${order.direction === "OUTGOING" ? "payable" : "receivable"}`
                    : "settled"}
                </small>
              </p>
              <div className="owner-tile-actions">
                <button className="btn btn-primary btn-small" onClick={() => setOpenOrder(order)}>
                  Details
                </button>
                <button className="btn btn-outline btn-small" onClick={() => setForm(toForm(order))}>
                  Update
                </button>
                <button className="btn btn-danger btn-small" onClick={() => askDeleteOrder(order)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
          {visible.length === 0 && <p className="owner-empty">No orders match this filter.</p>}
        </div>
      </section>

      {renderOrderModal()}
    </main>
  );

  function renderOrderModal() {
    if (!form) return null;
    const set = (patch: Partial<OrderForm>) => setForm({ ...form, ...patch });
    const setItem = (key: string, patch: Partial<DraftItem>) =>
      setForm({ ...form, items: form.items.map((item) => (item.key === key ? { ...item, ...patch } : item)) });

    return (
      <div className="owner-modal-backdrop" onClick={() => setForm(null)}>
        <form className="owner-modal owner-modal-wide" onClick={(e) => e.stopPropagation()} onSubmit={handleSaveOrder}>
          <h3>{form.id ? "Update B2B order" : "New B2B order"}</h3>

          <span className="field-label">This order is</span>
          <div className="owner-chip-row">
            <button
              type="button"
              className={form.direction === "OUTGOING" ? "owner-chip active" : "owner-chip"}
              onClick={() => set({ direction: "OUTGOING" })}
            >
              Given to a partner caterer
            </button>
            <button
              type="button"
              className={form.direction === "INCOMING" ? "owner-chip active" : "owner-chip"}
              onClick={() => set({ direction: "INCOMING" })}
            >
              Received from a partner caterer
            </button>
          </div>

          <div className="owner-form-grid">
            <label>
              <span className="field-label">Partner name *</span>
              <input
                value={form.partnerName}
                onChange={(e) => set({ partnerName: e.target.value })}
                placeholder="e.g. Aroma Catering"
              />
            </label>
            <label>
              <span className="field-label">Partner phone</span>
              <input value={form.partnerPhone} onChange={(e) => set({ partnerPhone: e.target.value })} />
            </label>
            <label>
              <span className="field-label">Partner GSTIN</span>
              <input value={form.partnerGst} onChange={(e) => set({ partnerGst: e.target.value })} />
            </label>
            {form.direction === "OUTGOING" && (
              <label>
                <span className="field-label">Link to vendor account</span>
                <select value={form.vendorId} onChange={(e) => set({ vendorId: e.target.value })}>
                  <option value="">Not linked</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              <span className="field-label">Status</span>
              <select value={form.status} onChange={(e) => set({ status: e.target.value as B2BOrderStatus })}>
                {B2B_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {B2B_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Event name *</span>
              <input
                value={form.eventName}
                onChange={(e) => set({ eventName: e.target.value })}
                placeholder="e.g. Sharma wedding reception"
              />
            </label>
            <label>
              <span className="field-label">Event date *</span>
              <input type="date" value={form.eventDate} onChange={(e) => set({ eventDate: e.target.value })} />
            </label>
            <label>
              <span className="field-label">Event time</span>
              <input
                value={form.eventTime}
                onChange={(e) => set({ eventTime: e.target.value })}
                placeholder="e.g. 7:00 PM"
              />
            </label>
            <label>
              <span className="field-label">Venue</span>
              <input value={form.venue} onChange={(e) => set({ venue: e.target.value })} />
            </label>
            <label>
              <span className="field-label">Pax count</span>
              <input
                type="number"
                min="0"
                value={form.paxCount}
                onChange={(e) => set({ paxCount: e.target.value })}
              />
            </label>
          </div>

          <h4 className="owner-form-section">Line items</h4>
          <div className="owner-table-scroll">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="owner-col-qty">Qty</th>
                  <th className="owner-col-unit">Unit</th>
                  <th className="owner-col-rate">Rate (₹)</th>
                  <th className="owner-col-cost">Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {form.items.map((item) => (
                  <tr key={item.key}>
                    <td>
                      <input
                        value={item.description}
                        onChange={(e) => setItem(item.key, { description: e.target.value })}
                        placeholder="e.g. Starters counter"
                        aria-label="Description"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => setItem(item.key, { quantity: e.target.value })}
                        aria-label="Quantity"
                      />
                    </td>
                    <td>
                      <input
                        value={item.unit}
                        onChange={(e) => setItem(item.key, { unit: e.target.value })}
                        aria-label="Unit"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => setItem(item.key, { rate: e.target.value })}
                        aria-label="Rate"
                      />
                    </td>
                    <td className="owner-cost-cell">
                      {money((Number(item.quantity) || 0) * (Number(item.rate) || 0))}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="owner-icon-btn"
                        title="Remove line"
                        onClick={() =>
                          set({
                            items:
                              form.items.length === 1
                                ? [emptyItem()]
                                : form.items.filter((row) => row.key !== item.key),
                          })
                        }
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="owner-actions">
            <button type="button" className="btn btn-outline btn-small" onClick={() => set({ items: [...form.items, emptyItem()] })}>
              + Add line
            </button>
          </div>

          <div className="owner-form-grid">
            <label>
              <span className="field-label">Other charges (₹)</span>
              <input
                type="number"
                step="0.01"
                value={form.otherCharges}
                onChange={(e) => set({ otherCharges: e.target.value })}
              />
            </label>
            <label>
              <span className="field-label">Tax (%)</span>
              <input
                type="number"
                step="0.01"
                value={form.taxPercent}
                onChange={(e) => set({ taxPercent: e.target.value })}
              />
            </label>
            <label className="owner-form-full">
              <span className="field-label">Notes</span>
              <input value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
            </label>
          </div>

          <p className="owner-total">
            Subtotal {money(draftTotals.subtotal)} · Order total {money(draftTotals.total)}
          </p>

          <div className="owner-modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setForm(null)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !form.partnerName.trim() || !form.eventName.trim()}
            >
              {saving ? "Saving…" : form.id ? "Save changes" : "Create order"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  function renderPaymentModal() {
    if (!paymentForm || !openOrder) return null;
    const set = (patch: Partial<typeof paymentForm>) => setPaymentForm({ ...paymentForm, ...patch });

    return (
      <div className="owner-modal-backdrop" onClick={() => setPaymentForm(null)}>
        <form className="owner-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleAddPayment}>
          <h3>Record {openOrder.direction === "OUTGOING" ? "payment" : "receipt"}</h3>
          <div className="owner-form-grid">
            <label>
              <span className="field-label">Date</span>
              <input type="date" value={paymentForm.paidOn} onChange={(e) => set({ paidOn: e.target.value })} />
            </label>
            <label>
              <span className="field-label">Amount (₹)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => set({ amount: e.target.value })}
                autoFocus
              />
            </label>
            <label>
              <span className="field-label">Mode</span>
              <select value={paymentForm.mode} onChange={(e) => set({ mode: e.target.value as PaymentMode })}>
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {PAYMENT_MODE_LABELS[mode]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Reference no.</span>
              <input value={paymentForm.referenceNo} onChange={(e) => set({ referenceNo: e.target.value })} />
            </label>
            <label className="owner-form-full">
              <span className="field-label">Note</span>
              <input value={paymentForm.notes} onChange={(e) => set({ notes: e.target.value })} />
            </label>
          </div>
          <div className="owner-modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setPaymentForm(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !(Number(paymentForm.amount) > 0)}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    );
  }
}
