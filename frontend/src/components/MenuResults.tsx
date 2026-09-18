import { useEffect, useState } from "react";
import {
  confirmBooking,
  createQuotation,
  customizeMenuPackage,
  estimateTentativePrice,
  selectMenuPackage,
  TentativeEstimate,
} from "../api/client";

interface MenuResultsProps {
  enquiryId: string;
  guestCount: number;
  packages: any[];
  onBack: () => void;
}

export function MenuResults({ enquiryId, guestCount, packages: initialPackages, onBack }: MenuResultsProps) {
  const [packages, setPackages] = useState(initialPackages);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [customizeText, setCustomizeText] = useState("");
  const [quotation, setQuotation] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [estimates, setEstimates] = useState<Record<string, TentativeEstimate>>({});

  useEffect(() => {
    packages.forEach((pkg) => {
      const categories = Array.from(
        new Set<string>(pkg.items.map((i: any) => i.menuItem.category.name)),
      );
      estimateTentativePrice({ guestCount, categories }).then((result) => {
        setEstimates((prev) => ({ ...prev, [pkg.id]: result }));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packages.length]);

  async function handleSelectPackage(packageId: string) {
    setLoading(true);
    try {
      await selectMenuPackage(packageId);
      setSelectedPackageId(packageId);
    } finally {
      setLoading(false);
    }
  }

  async function handleCustomize() {
    if (!selectedPackageId || !customizeText.trim()) return;
    setLoading(true);
    try {
      const result = await customizeMenuPackage(selectedPackageId, customizeText);
      setPackages((prev) => prev.map((p) => (p.id === selectedPackageId ? result.package : p)));
      setCustomizeText("");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateQuotation() {
    if (!selectedPackageId) return;
    setLoading(true);
    try {
      const result = await createQuotation({ enquiryId, menuPackageId: selectedPackageId });
      setQuotation(result);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmBooking() {
    if (!quotation || !contactPerson || !contactPhone) return;
    setLoading(true);
    try {
      const result = await confirmBooking({ quotationId: quotation.id, contactPerson, contactPhone });
      setBooking(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="results-page">
      <div className="results-header">
        <button className="btn btn-outline" onClick={onBack}>
          ← Back to Home
        </button>
        <h1>Your Recommended Menu Packages</h1>
        <p>Choose a package below, customize it if you like, then generate your quotation.</p>
      </div>

      <div className="grid packages-grid">
        {packages.map((pkg) => (
          <div key={pkg.id} className={`card package-card ${pkg.id === selectedPackageId ? "selected" : ""}`}>
            <h3>{pkg.name}</h3>
            <p className="package-price">₹{pkg.pricePerPlate} / plate</p>
            {estimates[pkg.id] && (
              <p className="tentative-price">
                Tentative: ₹{estimates[pkg.id].totalMinPricePerPerson}–₹
                {estimates[pkg.id].totalMaxPricePerPerson} per person
              </p>
            )}
            <p className="package-desc">{pkg.description}</p>
            <ul className="package-items">
              {pkg.items.map((i: any) => (
                <li key={i.id}>
                  <span className="item-category">{i.menuItem.category.name}</span> {i.menuItem.name}
                </li>
              ))}
            </ul>
            <button
              className={`btn ${pkg.id === selectedPackageId ? "btn-primary" : "btn-outline"}`}
              onClick={() => handleSelectPackage(pkg.id)}
              disabled={loading}
            >
              {pkg.id === selectedPackageId ? "Selected ✓" : "Select this package"}
            </button>
          </div>
        ))}
      </div>

      {selectedPackageId && !quotation && (
        <div className="card action-panel">
          <h3>Customize your menu</h3>
          <p className="field-hint">e.g. "Remove Paneer Tikka and add Dahi Puri" or "no onion and garlic"</p>
          <div className="inline-form">
            <input
              placeholder="Tell us what to change..."
              value={customizeText}
              onChange={(e) => setCustomizeText(e.target.value)}
            />
            <button className="btn btn-outline" onClick={handleCustomize} disabled={loading}>
              Update Menu
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleCreateQuotation} disabled={loading}>
            Generate Quotation
          </button>
        </div>
      )}

      {quotation && (
        <div className="card action-panel">
          <h3>Quotation {quotation.quotationNumber}</h3>
          <p>Total amount: ₹{quotation.totalAmount}</p>
          <p>Advance payable: ₹{quotation.advanceAmount}</p>
          {quotation.pdfUrl && (
            <a className="btn btn-outline" href={quotation.pdfUrl} target="_blank" rel="noreferrer">
              Download PDF
            </a>
          )}

          {!booking && (
            <div className="inline-form">
              <input
                placeholder="Contact person"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
              <input
                placeholder="Contact phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
              <button className="btn btn-primary" onClick={handleConfirmBooking} disabled={loading}>
                Confirm Booking
              </button>
            </div>
          )}
        </div>
      )}

      {booking && (
        <div className="card action-panel booking-confirmed">
          <h3>🎉 Booking Confirmed: {booking.eventId}</h3>
          <p>Total: ₹{booking.totalAmount}</p>
          <p>Balance due: ₹{booking.balanceDue}</p>
        </div>
      )}
    </div>
  );
}
