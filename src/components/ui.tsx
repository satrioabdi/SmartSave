/** Shared UI primitives — badges, notices, metric cards, tables, charts. */
import type { ReactNode } from "react";
import { ANALYTICS_NOTE, carbonLabel, formatCo2e } from "../lib/carbon";
import type { BadgeVariant } from "../lib/format";
import type { CarbonValue as CarbonValueType, Period } from "../lib/types";
import {
  IconAlert,
  IconBox,
  IconCheck,
  IconInfo,
  IconPhoto,
  IconSearch,
} from "./icons";

/* ------------------------------ Badge ------------------------------ */

export function Badge({
  variant = "neutral",
  children,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
}) {
  return <span className={`badge badge--${variant}`}>{children}</span>;
}

export function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: BadgeVariant;
}) {
  return <Badge variant={variant}>{label}</Badge>;
}

/* ------------------------------ Notices ---------------------------- */

export function Notice({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="notice">
      <span className="notice-icon">
        <IconInfo />
      </span>
      {title && <strong>{title}</strong>}
      <span>{children}</span>
    </div>
  );
}

/** Demo / simulation label — required whenever a feature is not real (§5, §14.2). */
export function SimulationBanner({ children }: { children: ReactNode }) {
  return (
    <div className="simulation-banner">
      <span className="notice-icon">
        <IconInfo />
      </span>
      <strong>Simulation / demo</strong>
      <span>{children}</span>
    </div>
  );
}

export function SafetyNotice({ children }: { children: ReactNode }) {
  return (
    <div className="safety-notice">
      <span className="notice-icon">
        <IconAlert />
      </span>
      <span>{children}</span>
    </div>
  );
}

export function PolicyBox({ children }: { children: ReactNode }) {
  return (
    <div className="policy-box">
      <span className="notice-icon">
        <IconAlert />
      </span>
      <span>{children}</span>
    </div>
  );
}

/** Mandatory CO₂e disclosure (§7 / style.md §5.5). */
export function AnalyticsNote({ extra }: { extra?: string }) {
  return (
    <div className="analytics-note">
      <span className="notice-icon">
        <IconInfo />
      </span>
      <span>
        {ANALYTICS_NOTE}
        {extra ? ` ${extra}` : ""}
      </span>
    </div>
  );
}

export function SuccessStrip({ children }: { children: ReactNode }) {
  return (
    <div className="success-strip">
      <span className="notice-icon">
        <IconCheck />
      </span>
      <span>{children}</span>
    </div>
  );
}

export function AuthError({ children }: { children: ReactNode }) {
  return (
    <div className="auth-error" role="alert">
      <span className="notice-icon">
        <IconAlert />
      </span>
      <span>{children}</span>
    </div>
  );
}

export function ScanError({ children }: { children: ReactNode }) {
  return (
    <div className="scan-error" role="alert">
      <span className="notice-icon">
        <IconAlert />
      </span>
      <span>{children}</span>
    </div>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="empty-state">
      <IconSearch />
      <strong>{title}</strong>
      {hint && <span>{hint}</span>}
    </div>
  );
}

/* ---------------------------- CarbonValue -------------------------- */

/**
 * Single component for every CO₂e cell (style.md §5.4).
 * Unusable factors render an explicit status — never 0 or a blank dash.
 */
export function CarbonValue({
  value,
  plain = false,
}: {
  value: CarbonValueType;
  plain?: boolean;
}) {
  if (value.kind === "value") {
    return (
      <span className={plain ? "" : "cell-strong num"}>{formatCo2e(value.kg)}</span>
    );
  }
  const label = carbonLabel(value);
  return (
    <Badge variant="warning">{label}</Badge>
  );
}

/* --------------------------- Metric card --------------------------- */

export function MetricCard({
  icon,
  tone = "green",
  label,
  value,
  unit,
  foot,
}: {
  icon: ReactNode;
  tone?: "green" | "amber" | "blue" | "red";
  label: string;
  value: string;
  unit?: string;
  foot?: string;
}) {
  return (
    <div className="metric-card">
      <div className={`metric-icon${tone === "green" ? "" : ` metric-icon--${tone}`}`}>
        {icon}
      </div>
      <div>
        <div className="metric-label">{label}</div>
        <div className="metric-value">
          {value}
          {unit && <small>{unit}</small>}
        </div>
      </div>
      {foot && <div className="metric-foot">{foot}</div>}
    </div>
  );
}

/* ------------------------------ Panel ------------------------------ */

export function Panel({
  title,
  description,
  action,
  children,
  wide = false,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section className={`panel${wide ? " panel--lg" : ""}`}>
      {(title || action) && (
        <div className="panel-head">
          <div>
            {title && <h2 className="h2">{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* --------------------------- Page header --------------------------- */

export function PageHead({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div className="page-head-text">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="h1">{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="button-row no-print">{actions}</div>}
    </header>
  );
}

/* ----------------------------- Summary ----------------------------- */

export function SummaryList({
  rows,
}: {
  rows: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="summary-list">
      {rows.map((r, i) => (
        <div className="summary-row" key={`${r.label}-${i}`}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------ Chart ------------------------------ */

export interface ChartDatum {
  label: string;
  value: number;
}

/**
 * Single-series vertical bar chart with hover values (style.md .mini-chart).
 * Value labels appear on hover only — no number printed on every point.
 */
export function BarChart({
  data,
  unit,
  small = false,
  emptyLabel = "No data in this period",
}: {
  data: ChartDatum[];
  unit: string;
  small?: boolean;
  emptyLabel?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 0);
  if (max <= 0) {
    return <EmptyState title={emptyLabel} hint="Change the period filter to see data." />;
  }
  return (
    <div className="mini-chart">
      <div className={`chart-plot${small ? " chart-plot--sm" : ""}`}>
        {data.map((d, i) => (
          <div
            key={`${d.label}-${i}`}
            className="bar"
            style={{ height: `${Math.max((d.value / max) * 100, 2)}%` }}
            title={`${d.label}: ${d.value.toLocaleString("en-US")} ${unit}`}
          >
            <span className="bar-label">
              {d.value.toLocaleString("en-US")} {unit}
            </span>
          </div>
        ))}
      </div>
      <div className="chart-axis">
        {data.map((d, i) => (
          <span key={`axis-${d.label}-${i}`}>{d.label}</span>
        ))}
      </div>
      <div className="chart-legend">
        <span>
          <i className="legend-dot" style={{ background: "#0f7a52" }} />
          {unit}
        </span>
        <span>Hover a bar for the exact value.</span>
      </div>
    </div>
  );
}

export interface MultiSeriesDatum {
  label: string;
  values: number[];
}

const SERIES_COLORS = ["#0f7a52", "#c07a10", "#2f6fd6"];

/**
 * Multi-series grouped bars. A legend is always present, and values are
 * available on hover (tooltip) rather than printed on every mark.
 */
export function GroupedBarChart({
  data,
  series,
  unit,
  small = false,
}: {
  data: MultiSeriesDatum[];
  series: string[];
  unit: string;
  small?: boolean;
}) {
  const max = Math.max(
    ...data.flatMap((d) => d.values),
    0,
  );
  if (max <= 0) {
    return <EmptyState title="No data in this period" />;
  }
  return (
    <div className="mini-chart">
      <div className={`chart-plot${small ? " chart-plot--sm" : ""}`}>
        {data.map((d, di) => {
          const total = d.values.reduce((a, b) => a + b, 0);
          const tip = d.values
            .map((v, i) => `${series[i]}: ${v.toLocaleString("en-US")} ${unit}`)
            .join(" · ");
          return (
            <div
              key={`${d.label}-${di}`}
              className="bar"
              style={{ height: `${Math.max((total / max) * 100, 2)}%`, background: "transparent", cursor: "default" }}
              title={`${d.label} — ${tip}`}
            >
              <span className="bar-label">
                {total.toLocaleString("en-US")} {unit}
              </span>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column-reverse",
                  gap: 2,
                }}
              >
                {d.values.map((v, i) => (
                  <div
                    key={i}
                    style={{
                      height: `${total > 0 ? (v / total) * 100 : 0}%`,
                      background: SERIES_COLORS[i % SERIES_COLORS.length],
                      borderRadius: i === 0 ? "0 0 3px 3px" : i === d.values.length - 1 ? "4px 4px 0 0" : 2,
                      minHeight: v > 0 ? 3 : 0,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="chart-axis">
        {data.map((d, i) => (
          <span key={`axis-${d.label}-${i}`}>{d.label}</span>
        ))}
      </div>
      <div className="chart-legend">
        {series.map((s, i) => (
          <span key={s}>
            <i
              className="legend-dot"
              style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }}
            />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- Segmented ----------------------------- */

export function PeriodFilter({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const options: Period[] = ["Daily", "Monthly", "Yearly"];
  return (
    <div className="segmented" role="group" aria-label="Period filter">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className={value === o ? "is-active" : ""}
          aria-pressed={value === o}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------- Toolbar ------------------------------ */

export function Toolbar({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="toolbar no-print">{children}</div>;
}

/* ---------------------------- Table wrap --------------------------- */

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="table-wrap">
      <table className="data-table">{children}</table>
    </div>
  );
}

export function TableEmpty({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr className="table-empty">
      <td colSpan={colSpan}>{text}</td>
    </tr>
  );
}

/* --------------------------- Countdown ----------------------------- */

export function Countdown({ ms }: { ms: number }) {
  const clamped = Math.max(ms, 0);
  const h = Math.floor(clamped / 3600000);
  const m = Math.floor((clamped % 3600000) / 60000);
  const s = Math.floor((clamped % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="countdown">
      <div className="countdown-box">
        <strong>{pad(h)}</strong>
        <span>Hours</span>
      </div>
      <div className="countdown-box">
        <strong>{pad(m)}</strong>
        <span>Minutes</span>
      </div>
      <div className="countdown-box">
        <strong>{pad(s)}</strong>
        <span>Seconds</span>
      </div>
    </div>
  );
}

/* ---------------------------- Modal -------------------------------- */

export function Modal({
  title,
  children,
  onClose,
  actions,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal${wide ? " modal--wide" : ""}`}>
        <div>
          <h2 className="h2">{title}</h2>
        </div>
        <div className="stack stack--sm">{children}</div>
        <div className="modal-actions">{actions}</div>
      </div>
    </div>
  );
}

/* ---------------------------- Field -------------------------------- */

export function Field({
  label,
  hint,
  error,
  wide = false,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`control${wide ? " control--wide" : ""}${error ? " control--invalid" : ""}`}>
      <label>{label}</label>
      {children}
      {error ? (
        <span className="control-error">{error}</span>
      ) : hint ? (
        <span className="control-hint">{hint}</span>
      ) : null}
    </div>
  );
}

/* -------------------------- Checklist ------------------------------ */

export function CheckItem({ children }: { children: ReactNode }) {
  return (
    <div className="checklist-item">
      <span className="checklist-mark">
        <IconCheck />
      </span>
      <span>{children}</span>
    </div>
  );
}

/* ------------------------ PhotoThumb / PhotoModal -------------------- */

/**
 * Deterministic pastel from a string so demo "photos" (file names) get a
 * stable, recognizable tile without shipping real images.
 */
function photoTone(seed: string): { bg: string; fg: string } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  const bg = `hsl(${h} 32% 90%)`;
  const fg = `hsl(${h} 34% 32%)`;
  return { bg, fg };
}

/**
 * Clickable food-photo tile (prototype demo). The seed dataset stores file
 * names only, so tiles render a deterministic placeholder with the file name;
 * clicking either opens the photo in a modal — the same interaction a real
 * uploaded image would use.
 */
export function PhotoThumb({
  name,
  label,
  size = 44,
  onOpen,
}: {
  name: string;
  /** Accessible title, e.g. the food record ID. */
  label: string;
  size?: number;
  onOpen: () => void;
}) {
  const { bg, fg } = photoTone(name);
  return (
    <button
      type="button"
      className="photo-thumb"
      style={{ width: size, height: size, background: bg, color: fg }}
      title={`Open food photo — ${name}`}
      aria-label={`Open food photo for ${label}`}
      onClick={onOpen}
    >
      <IconPhoto />
      <span>{name.replace(/\.[a-z0-9]+$/i, "").slice(0, 3).toUpperCase()}</span>
    </button>
  );
}

/** Photo detail dialog shown when a thumb (or photo row) is clicked. */
export function PhotoModal({
  name,
  label,
  onClose,
}: {
  name: string;
  label: string;
  onClose: () => void;
}) {
  const { bg, fg } = photoTone(name);
  return (
    <Modal title="Food photo" onClose={onClose} wide>
      <div
        className="photo-view"
        style={{ background: bg, color: fg }}
        aria-label={`Food photo preview: ${name}`}
      >
        <IconPhoto />
        <div className="photo-view-name">{name}</div>
        <div className="photo-view-sub">{label}</div>
      </div>
      <Notice title="Prototype demo">
        The demo dataset stores file names only — tiles and this dialog render a
        placeholder, not the actual image. A production build shows the uploaded
        photo taken on the weighing scale.
      </Notice>
    </Modal>
  );
}

/* ------------------------ Quantity + CO₂e cells --------------------- */

/**
 * §8: a table that shows Quantity must show Estimated CO₂e Avoided next to it.
 * The pair is rendered together so the rule cannot be broken by accident.
 */
export function QuantityHeader() {
  return (
    <>
      <th scope="col">Quantity (g)</th>
      <th scope="col">Estimated CO₂e Avoided (kg CO₂e)</th>
    </>
  );
}

export function ItemIcon() {
  return <IconBox />;
}
