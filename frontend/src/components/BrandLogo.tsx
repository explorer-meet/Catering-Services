interface BrandLogoProps {
  light?: boolean;
}

export function BrandLogo({ light = false }: BrandLogoProps) {
  return (
    <span className={`brand-logo ${light ? "brand-logo-light" : ""}`}>
      <img className="brand-logo-image" src="/vivah-events-logo.png" alt="Vivah Events Catering Services" />
    </span>
  );
}
