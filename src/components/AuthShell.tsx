/** Two-column auth shell (style.md §3.4). */
import type { ReactNode } from "react";
import { ROUTE_PATH, useStore, type Route } from "../lib/store";
import { SimulationBanner } from "./ui";

export function AuthShell({
  kicker,
  title,
  description,
  children,
  footer,
}: {
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { navigate } = useStore();
  const go = (r: Route) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(r);
  };

  return (
    <div className="auth-layout">
      <aside className="auth-visual">
        <a
          href={ROUTE_PATH.landing}
          className="brand"
          onClick={go({ name: "landing" })}
        >
          <span className="brand-mark" style={{ background: "rgba(255,255,255,.16)" }}>
            S
          </span>
          SmartSave
        </a>
        <div className="stack stack--sm" style={{ gap: 14 }}>
          <span className="auth-kicker">{kicker}</span>
          <h1>Prevent food waste. Measure the impact.</h1>
          <p>
            SmartSave records food, calculates automatic expiry from configured
            rules, coordinates donation with Green Communities, and reports
            estimated CO₂e avoided — always as an estimate, never as a direct
            sensor measurement.
          </p>
        </div>
        <div className="auth-art">
          <div className="leaf" />
          <div className="row" style={{ gap: 14 }}>
            <div className="leaf leaf--sm" />
            <span style={{ fontSize: 12, color: "#c9ddd5", maxWidth: 260 }}>
              Three roles: User, Manager and Green Community — each with its own
              dashboard, records and reports.
            </span>
          </div>
        </div>
      </aside>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="stack stack--sm" style={{ gap: 8 }}>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          {children}
          {footer}
          <SimulationBanner>
            Prototype only. Accounts, sessions and passwords are not backed by a
            production authentication service.
          </SimulationBanner>
        </div>
      </div>
    </div>
  );
}
