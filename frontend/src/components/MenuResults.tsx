import { useEffect, useState } from "react";
import {
  api,
  createQuotation,
  customizeMenuPackage,
  estimateTentativePrice,
  selectMenuPackage,
  TentativeEstimate,
} from "../api/client";
import { BrandLogo } from "./BrandLogo";

interface MenuResultsProps {
  enquiryId: string;
  whatsappLink: string | null;
  guestCount: number;
  packages: any[];
  onBack: () => void;
}

export function MenuResults({ enquiryId, whatsappLink, guestCount, packages: initialPackages, onBack }: MenuResultsProps) {
  const [packages, setPackages] = useState(initialPackages);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [customizeText, setCustomizeText] = useState("");
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [estimates, setEstimates] = useState<Record<string, TentativeEstimate>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadEstimates() {
      const results = await Promise.all(
        packages.map(async (pkg) => {
          const categories = Array.from(
            new Set<string>(pkg.items.map((item: any) => item.menuItem.category.name)),
          );
          return [pkg.id, await estimateTentativePrice({ guestCount, categories })] as const;
        }),
      );
      if (!cancelled) setEstimates(Object.fromEntries(results));
    }

    loadEstimates().catch((error) => console.error("Unable to load package estimates", error));
    return () => { cancelled = true; };
  }, [packages, guestCount]);

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

  if (quotation) {
    const apiOrigin = api.defaults.baseURL?.startsWith("http")
      ? api.defaults.baseURL
      : window.location.origin;
    const downloadUrl = quotation.pdfUrl?.startsWith("http")
      ? quotation.pdfUrl
      : new URL(quotation.pdfUrl, apiOrigin).toString();

    return (
      <div className="results-page">
        <div className="results-topbar">
          <button className="icon-button" onClick={onBack} aria-label="Go to main landing page" title="Home">
            ⌂
          </button>
          <BrandLogo />
        </div>
        <div className="completion-panel">
          <span className="completion-mark" aria-hidden="true">✓</span>
          <p className="completion-kicker">Your menu is ready</p>
          <h1>Thank you for planning with us.</h1>
          <p>
            Your curated menu reference has been prepared. Download it to review the dishes
            and share it with your family or event team.
          </p>
          {quotation.pdfUrl && (
            <a className="btn btn-primary btn-large" href={downloadUrl} target="_blank" rel="noreferrer">
              Download Menu
            </a>
          )}
          {whatsappLink && (
            <a className="btn btn-outline" href={whatsappLink} target="_blank" rel="noreferrer">
              Continue on WhatsApp
            </a>
          )}
          <button className="completion-home" onClick={onBack}>Return to main page</button>
        </div>
      </div>
    );
  }

  return (
    <div className="results-page">
      <div className="results-header">
        <button className="btn btn-outline" onClick={onBack}>
          ← Back to Home
        </button>
        <h1>Your Recommended Menu Packages</h1>
        <p>Choose a package below, customize it if you like, then generate your quotation.</p>
        {whatsappLink && (
          <a className="btn btn-primary" href={whatsappLink} target="_blank" rel="noreferrer">
            Continue on WhatsApp
          </a>
        )}
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

    </div>
  );
}
