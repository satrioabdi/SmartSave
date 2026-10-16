/** Public shell — no sidebar, no personal data (§3.3 of style.md). */
import { useState, type ReactNode } from "react";
import { ROUTE_PATH, useStore, type Route } from "../lib/store";
import { IconMenu, IconX } from "./icons";

function Link({
  to,
  children,
  className,
  onClick,
}: {
  to: Route;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { navigate } = useStore();
  return (
    <a
      href={ROUTE_PATH[to.name]}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

export function PublicShell({
  children,
  current,
}: {
  children: ReactNode;
  current?: Route["name"];
}) {
  const [open, setOpen] = useState(false);
  const { session, navigate } = useStore();

  const links: { label: string; to: Route }[] = [
    { label: "Home", to: { name: "landing" } },
    { label: "About SmartSave", to: { name: "about" } },
    { label: "Public Barcode Lookup", to: { name: "public-lookup" } },
    { label: "Public Carbon Footprint", to: { name: "public-carbon" } },
  ];

  return (
    <div>
      <header className="public-topbar">
        <div className="row" style={{ gap: 22 }}>
          <Link to={{ name: "landing" }} className="brand">
            <span className="brand-mark">S</span>
            SmartSave
          </Link>
          <nav className="row no-print" style={{ gap: 16 }}>
            {links.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className="small"
              >
                <span
                  style={
                    current === l.to.name
                      ? {
                          color: "var(--green)",
                          fontWeight: 600,
                          borderBottom: "2px solid var(--green)",
                          paddingBottom: 2,
                        }
                      : undefined
                  }
                >
                  {l.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="topbar-actions no-print">
          {session ? (
            <button
              type="button"
              className="button button--primary"
              onClick={() =>
                navigate(
                  session.role === "Manager"
                    ? { name: "manager-dashboard" }
                    : session.role === "Green Community"
                      ? { name: "gc-dashboard" }
                      : { name: "user-dashboard" },
                )
              }
            >
              Open dashboard
            </button>
          ) : (
            <>
              <Link to={{ name: "signin" }} className="button button--secondary">
                Sign In
              </Link>
              <Link to={{ name: "signup" }} className="button button--primary">
                Sign Up
              </Link>
            </>
          )}
          <button
            type="button"
            className="icon-button menu-toggle"
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <IconX /> : <IconMenu />}
          </button>
        </div>
      </header>

      {open && (
        <div className="stack" style={{ background: "var(--white)", borderBottom: "1px solid var(--line)", padding: 14 }}>
          {links.map((l) => (
            <Link key={l.label} to={l.to} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </div>
      )}

      <main className="reveal">{children}</main>

      <footer
        style={{
          borderTop: "1px solid var(--line)",
          padding: "22px 32px",
          background: "var(--white)",
        }}
      >
        <div
          className="row row--between"
          style={{ maxWidth: 1440, margin: "0 auto" }}
        >
          <span className="tiny">
            SmartSave prototype · UI language: English · All CO₂e values are
            estimates based on configured emission factors, not direct
            measurements.
          </span>
          <span className="tiny">
            Requirement v1.5 — Revisi · Interactive prototype
          </span>
        </div>
      </footer>
    </div>
  );
}
