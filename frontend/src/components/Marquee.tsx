import { FeatureIcon, FeatureIconName } from "./FeatureIcon";

const HIGHLIGHTS = [
  ["dietary", "VEG, JAIN & VEGAN MENUS"],
  ["planning", "AI-POWERED MENU PLANNING"],
  ["chefs", "EXPERT CHEFS & LIVE COUNTERS"],
  ["service", "ON-TIME SETUP & SERVICE"],
  ["quotes", "INSTANT QUOTATIONS"],
  ["planning", "MENUS SHAPED AROUND YOU"],
];

/// Continuously scrolling ticker strip — the list is duplicated for a seamless loop
export function Marquee() {
  const items = [...HIGHLIGHTS, ...HIGHLIGHTS];
  return (
    <div className="marquee">
      <div className="marquee-track">
        {items.map((item, i) => (
          <span className="marquee-item" key={`${item[1]}-${i}`}>
            <span className={`marquee-icon marquee-icon-${i % HIGHLIGHTS.length}`}><FeatureIcon name={item[0] as FeatureIconName} /></span>
            <span>{item[1]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
