/**
 * Register Food — 5-step deposit wizard.
 * Flow from the .make prototype: Choose compartment → Register food →
 * Review estimate → Print label → Deposit complete.
 *
 * Rules kept from the requirement DOCX (not from .make):
 *  - Expiry stays auto-calculated from the shelf-life rule and is never
 *    editable (§9). .make let the user type an expiry; we do not.
 *  - CO₂e uses the WRI per-subcategory p90 factor (§6/§19), not .make's
 *    single 0.76 constant.
 *  - Freshness stays a labelled file-name simulation (§14.2).
 */
import { useMemo, useRef, useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  AnalyticsNote,
  Badge,
  CarbonValue,
  EmptyState,
  Field,
  Notice,
  PageHead,
  Panel,
  PolicyBox,
  SafetyNotice,
  SimulationBanner,
  SummaryList,
} from "../components/ui";
import {
  IconCamera,
  IconCheck,
  IconPrint,
  IconRefresh,
  IconX,
} from "../components/icons";
import { Barcode } from "../components/Barcode";
import { CameraCapture } from "../components/Camera";
import {
  CATEGORIES,
  SHELF_LIFE_DISCLAIMER,
  resolveFactor,
  resolveShelfLife,
} from "../data/catalog";
import {
  compartmentBlockReason,
  compartmentOccupancy,
  remainingCapacity,
} from "../data/compartments";
import { useStore } from "../lib/store";
import { computeCarbon, formatMass } from "../lib/carbon";
import { formatDateTime } from "../lib/format";
import type { FoodItem, VirtualCompartment } from "../lib/types";

const STEPS = [
  "Choose compartment",
  "Register food",
  "Review estimate",
  "Print label",
  "Deposit complete",
] as const;

type Freshness = "idle" | "running" | "fit" | "rejected";

/** Deterministic demo barcode so the label preview and record stay identical. */
function previewBarcode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `SS-${n}`;
}

/* ----------------------------- Stepper chrome --------------------------- */

function Stepper({ current }: { current: number }) {
  return (
    <ol className="stepper" aria-label="Deposit progress">
      {STEPS.map((label, i) => {
        const state =
          i + 1 < current ? "done" : i + 1 === current ? "active" : "todo";
        return (
          <li key={label} className={`stepper-item stepper-item--${state}`}>
            <span className="stepper-dot" aria-hidden>
              {state === "done" ? <IconCheck /> : i + 1}
            </span>
            <span className="stepper-label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

/* --------------------------- Step 1 — compartment ----------------------- */

function CompartmentCard({
  c,
  food,
  category,
  massG,
  selected,
  onSelect,
}: {
  c: VirtualCompartment;
  food: FoodItem[];
  category: string | null;
  massG: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const used = compartmentOccupancy(food, c.id);
  const free = remainingCapacity(food, c);
  const reason = compartmentBlockReason(c, food, category, massG);
  const pct = Math.min(100, Math.round((used / c.capacityG) * 100));

  const badge = reason
    ? reason === "Maintenance"
      ? "warning"
      : reason === "Offline" || reason === "Insufficient capacity"
        ? "danger"
        : "neutral"
    : "success";

  return (
    <article
      className={`locker-card${selected ? " locker-card--selected" : ""}`}
    >
      <div className="locker-card-head">
        <span className="locker-card-id">
          {c.hub} / {c.id}
        </span>
        <Badge variant={badge}>
          {reason ?? (category ? "Available · Compatible" : "Available")}
        </Badge>
      </div>

      <div className="locker-meter" aria-hidden>
        <span style={{ width: `${pct}%` }} />
      </div>

      <SummaryList
        rows={[
          { label: "Accepts", value: c.category },
          { label: "Capacity", value: formatMass(c.capacityG) },
          { label: "Occupied", value: formatMass(used) },
          { label: "Available", value: formatMass(free) },
          {
            label: "Temperature",
            value:
              c.temperatureC === null ? (
                "Not monitored"
              ) : (
                <>
                  {c.temperatureC.toFixed(1)} °C{" "}
                  <Badge variant="neutral">Simulated</Badge>
                </>
              ),
          },
        ]}
      />

      <button
        type="button"
        className={`button ${selected ? "button--primary" : "button--secondary"}`}
        disabled={!!reason && !selected}
        onClick={onSelect}
      >
        {selected ? (
          <>
            <IconCheck /> Selected
          </>
        ) : reason ? (
          `Not available — ${reason.toLowerCase()}`
        ) : (
          `Choose ${c.id}`
        )}
      </button>
    </article>
  );
}
/* ------------------------------ The wizard ------------------------------ */

export function RegisterFoodPage() {
  const { food, compartments, registerFood, navigate } = useStore();

  const [step, setStep] = useState(1);
  const [compartmentId, setCompartmentId] = useState<string | null>(null);

  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [subtype, setSubtype] = useState("");
  const [name, setName] = useState("");
  const [mass, setMass] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  /** Data URL of the picked/captured photo (session-only) — shown on the record. */
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [freshness, setFreshness] = useState<Freshness>("idle");

  const [barcode, setBarcode] = useState(previewBarcode);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<FoodItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Inline camera for step 2 — capture instead of picking a file.
  const [camOpen, setCamOpen] = useState(false);

  const cat = CATEGORIES.find((c) => c.name === category);
  const subtypes = cat?.dependentSubtypes?.[subcategory] ?? [];
  const shelf = useMemo(
    () =>
      category ? resolveShelfLife(category, subcategory, subtype || undefined) : null,
    [category, subcategory, subtype],
  );
  const factorRes = useMemo(
    () =>
      category && subcategory
        ? resolveFactor(category, subcategory, subtype || undefined)
        : null,
    [category, subcategory, subtype],
  );

  const massNum = Number(mass);
  const validMass = Number.isFinite(massNum) && massNum > 0;
  const carbon = factorRes && validMass ? computeCarbon(massNum, factorRes) : null;
  const compartment = compartments.find((c) => c.id === compartmentId) ?? null;

  const expiresPreview = shelf
    ? formatDateTime(new Date(Date.now() + shelf.days * 86400000).toISOString())
    : "—";

  const pickPhoto = (file?: File) => {
    if (!file) return;
    setPhoto(file.name);
    setFreshness("running");
    // Real uploads become a session data URL so the record shows the user's
    // own photo (§14.2: this is a website simulation, not camera AI).
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => setPhotoDataUrl(null);
    // Demo files are empty placeholders — reading them yields nothing.
    if (file.size === 0) setPhotoDataUrl(null);
    else reader.readAsDataURL(file);
    // Simulation only — no model is involved (§9, §14.2).
    window.setTimeout(() => {
      const rejected = /expired|basi|rotten|old/i.test(file.name);
      setFreshness(rejected ? "rejected" : "fit");
    }, 900);
  };

  /**
   * Changing the category re-filters the locker grid, so in step 1 a selected
   * compartment that leaves the list is dropped (a hidden selection is
   * confusing). In step 2 the locker stays put and validation explains any
   * mismatch. Clearing the filter (empty category) always keeps the selection.
   */
  const changeCategory = (nextCat: string) => {
    setCategory(nextCat);
    setSubcategory("");
    setSubtype("");
    if (step !== 1 || !nextCat) return;
    setCompartmentId((prevId) => {
      if (!prevId) return prevId;
      const prev = compartments.find((c) => c.id === prevId);
      return prev && prev.category === nextCat ? prevId : null;
    });
  };

  /* ---- per-step validation, mirroring .make's next() gates ---- */

  /** Step 1 gates on the locker only; category and mass are optional filters. */
  const validateStep1 = (): boolean => {
    const next: Record<string, string> = {};
    if (!compartmentId) next.compartment = "Choose a compartment to continue.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep2 = (): boolean => {
    const next: Record<string, string> = {};
    if (!category) next.category = "Select a food category.";
    if (!subcategory) next.subcategory = "Select a food subcategory.";
    if (subtypes.length > 0 && !subtype) next.subtype = "Select the dependent subtype.";
    if (name.trim().length < 2) next.name = "Enter the food name.";
    if (!validMass) next.mass = "Enter a mass greater than 0 grams.";
    if (!photo) next.photo = "Upload a photo before continuing.";
    if (freshness !== "fit") next.photo = "The photo check did not pass.";
    // The locker was chosen in step 1, possibly without a category/mass
    // filter — re-check the real deposit here before Review.
    if (compartment && category) {
      const reason = compartmentBlockReason(
        compartment,
        food,
        category,
        validMass ? massNum : 0,
      );
      if (reason === "Incompatible category") {
        next.category = `Locker ${compartment.id} only accepts ${compartment.category}. Pick a matching category, or go Back to choose another locker.`;
      } else if (reason === "Insufficient capacity") {
        next.mass = `Locker ${compartment.id} does not have enough free capacity. Go Back to choose another locker.`;
      } else if (reason) {
        next.compartment = `Locker ${compartment.id} is ${reason.toLowerCase()}. Go Back to choose another locker.`;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    // Validation errors render at the top of the form — scroll them into
    // view so a failed Continue never looks like a dead button.
    if (step === 1 && !validateStep1()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (step === 2 && !validateStep2()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (step === 3) setBarcode(previewBarcode());
    if (step === 4) {
      // Commit only once the label step is done, as .make does.
      if (!compartmentId) {
        setStep(1);
        return;
      }
      const item = registerFood({
        name: name.trim(),
        category,
        subcategory,
        subtype: subtype || undefined,
        massG: Math.round(massNum),
        photoLabel: photo ?? "photo.jpg",
        photoDataUrl: photoDataUrl ?? undefined,
        freshness: "fit",
        compartmentId,
        barcode,
      });
      if (!item) {
        // Compartment became unusable — send the user back to re-choose.
        setStep(1);
        return;
      }
      setCreated(item);
    }
    setStep((s) => Math.min(5, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetAll = () => {
    setStep(1);
    setCompartmentId(null);
    setCategory("");
    setSubcategory("");
    setSubtype("");
    setName("");
    setMass("");
    setPhoto(null);
    setPhotoDataUrl(null);
    setFreshness("idle");
    setBarcode(previewBarcode());
    setErrors({});
    setCreated(null);
  };

  return (
    <AppShell title="Register Food">
      <PageHead
        eyebrow="Role: User"
        title="Register Food"
        description="Five steps: pick a locker compartment, enter the food, review the estimate, print the label, then confirm the deposit."
      />

      <div className="stack">
        <SimulationBanner>
          Virtual locker compartments, occupancy and temperature are simulated
          website data. No physical locker, sensor or camera hardware is
          accessed (§14).
        </SimulationBanner>

        <Stepper current={step} />

        {/* ------------------------- Step 1 ------------------------- */}
        {step === 1 && (
          <div className="stack">
            <Panel
              title="Choose a compartment"
              description="Pick any available locker. Category and mass are optional filters to narrow the list — only a locker is required to continue."
            >
              <div className="form-grid">
                <Field
                  label="Food Category"
                  hint="Optional filter — narrows the locker list"
                >
                  <select
                    value={category}
                    onChange={(e) => changeCategory(e.target.value)}
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Planned Quantity / Mass"
                  hint="Optional filter — shows lockers with enough free space (g)"
                >
                  <div className="input-wrap">
                    <input
                      value={mass}
                      onChange={(e) => setMass(e.target.value.replace(/\D/g, ""))}
                      placeholder="2000"
                      inputMode="numeric"
                    />
                    <span className="input-suffix">g</span>
                  </div>
                </Field>
              </div>

              {errors.compartment && (
                <div className="scan-error" role="alert">
                  {errors.compartment}
                </div>
              )}

              <p className="tiny" style={{ marginBottom: 10 }}>
                {category
                  ? `Filtered by Food Category — showing ${compartments.filter((c) => c.category === category).length} of ${compartments.length} compartments.`
                  : `Pick any available locker — category and mass above are optional filters to narrow the ${compartments.length} compartments.`}
              </p>

              <div className="locker-grid">
                {compartments
                  .filter((c) => !category || c.category === category)
                  .map((c) => (
                    <CompartmentCard
                      key={c.id}
                      c={c}
                      food={food}
                      category={category || null}
                      massG={validMass ? massNum : 0}
                      selected={compartmentId === c.id}
                      onSelect={() => {
                        setCompartmentId(c.id);
                        setErrors({});
                      }}
                    />
                  ))}
              </div>

              {category &&
                compartments.filter((c) => c.category === category).length === 0 && (
                  <EmptyState
                    title="No compartment for this category"
                    hint="A Manager can add or reconfigure compartments in Virtual Locker Management."
                  />
                )}
            </Panel>
          </div>
        )}

        {/* ------------------------- Step 2 ------------------------- */}
        {step === 2 && (
          <div className="form-layout">
            <Panel
              title="Food details"
              description="Fields marked automatic are read-only. Expiry is derived from the shelf-life rule."
            >
              <div className="stack">
                <div className="form-grid">
                  <Field
                    label="Food Category"
                    error={errors.category}
                    hint={
                      compartment
                        ? `Locker ${compartment.id} accepts ${compartment.category}`
                        : "Chosen in step 1"
                    }
                  >
                    <select
                      value={category}
                      onChange={(e) => changeCategory(e.target.value)}
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Food Subcategory"
                    error={errors.subcategory}
                    hint={cat ? cat.factorNote : "Choose a category first"}
                  >
                    <select
                      value={subcategory}
                      disabled={!category}
                      onChange={(e) => {
                        setSubcategory(e.target.value);
                        setSubtype("");
                      }}
                    >
                      <option value="">
                        {category ? "Select a subcategory" : "Select a category first"}
                      </option>
                      {cat?.subcategories.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {subtypes.length > 0 && (
                    <Field
                      label="Dependent subtype"
                      error={errors.subtype}
                      hint="Required for Prepared and Cooked Food"
                      wide
                    >
                      <select value={subtype} onChange={(e) => setSubtype(e.target.value)}>
                        <option value="">Select the dependent subtype</option>
                        {subtypes.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}

                  <Field label="Food name" error={errors.name}>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Banana batch A"
                    />
                  </Field>

                  <Field label="Quantity / Mass" error={errors.mass} hint="Reporting unit is grams (g)">
                    <div className="input-wrap">
                      <input
                        value={mass}
                        onChange={(e) => setMass(e.target.value.replace(/\D/g, ""))}
                        placeholder="2000"
                        inputMode="numeric"
                      />
                      <span className="input-suffix">g</span>
                    </div>
                  </Field>

                  <div className="control">
                    <label>Compartment</label>
                    <input
                      readOnly
                      value={compartment ? `${compartment.hub} / ${compartment.id}` : "—"}
                    />
                    <span className="control-hint">
                      Chosen in step 1 — use Back to change.
                    </span>
                  </div>

                  <div className="control">
                    <label>Created / Stored At</label>
                    <input readOnly value={formatDateTime(new Date().toISOString())} />
                    <span className="control-hint">Filled automatically.</span>
                  </div>

                  <div className="control">
                    <label>Expiration Date &amp; Time</label>
                    <input readOnly value={expiresPreview} />
                    <span className="control-hint">
                      Auto-calculated from the category rule — not editable.
                    </span>
                  </div>
                </div>

                <PolicyBox>
                  Expiry is calculated automatically from the category rule and
                  cannot be edited or extended. If you change the category, the
                  expiration is recalculated automatically.
                </PolicyBox>

                <div className="stack stack--sm">
                  <label className="eyebrow" htmlFor="wizard-photo">
                    Food photo
                  </label>
                  <PolicyBox>
                    <strong>Photo instruction:</strong> the uploaded photo must
                    show the food placed <strong>on the weighing scale</strong>,
                    with the scale display readable. Managers use this photo to
                    verify the mass you enter — an unclear photo or a mass that
                    does not match the scale reading will be corrected or
                    rejected during review.
                  </PolicyBox>
                  <input
                    id="wizard-photo"
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => pickPhoto(e.target.files?.[0])}
                  />
                  <div className="row">
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={() => fileRef.current?.click()}
                    >
                      <IconCamera />
                      Upload photo
                    </button>
                    <button
                      type="button"
                      className={`button ${camOpen ? "button--primary" : "button--secondary"}`}
                      onClick={() => setCamOpen((open) => !open)}
                    >
                      <IconCamera />
                      {camOpen ? "Close camera" : "Open camera"}
                    </button>
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => pickPhoto(new File([""], "fresh-batch.jpg"))}
                    >
                      <IconRefresh />
                      Use demo photo (fit)
                    </button>
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => pickPhoto(new File([""], "expired-produce.jpg"))}
                    >
                      Use demo photo (expired)
                    </button>
                  </div>

                  {camOpen && (
                    <CameraCapture
                      onCapture={(file) => {
                        setCamOpen(false);
                        pickPhoto(file);
                      }}
                      onClose={() => setCamOpen(false)}
                    />
                  )}

                  {photo && freshness !== "idle" && (
                    <div className="file-status">
                      {freshness === "rejected" ? <IconX /> : <IconCheck />}
                      {photo}
                      {freshness === "running" && " · checking…"}
                      {freshness === "fit" && " · check passed"}
                      {freshness === "rejected" && " · rejected"}
                    </div>
                  )}

                  {freshness === "rejected" && (
                    <div className="scan-error" role="alert">
                      <strong>Food rejected.</strong> This item is detected as
                      stale or expired and cannot be placed into storage. No
                      record was created.
                    </div>
                  )}

                  {errors.photo && !photo && (
                    <div className="scan-error" role="alert">
                      {errors.photo}
                    </div>
                  )}
                </div>
              </div>
            </Panel>

            <div className="stack">
              <div className="estimate-card">
                <span className="eyebrow">Automatic expiry preview</span>
                <span className="estimate-value" style={{ fontSize: 22 }}>
                  {expiresPreview}
                </span>
                <span className="estimate-sub">
                  {shelf
                    ? `Rule: ${shelf.ruleLabel}${shelf.note ? ` · ${shelf.note}` : ""}`
                    : "Select a category to preview"}
                </span>
              </div>
              <SafetyNotice>{SHELF_LIFE_DISCLAIMER}</SafetyNotice>
              <Panel title="Emission factor preview">
                <div className="stack stack--sm">
                  {!factorRes ? (
                    <p className="small">Select a category and subcategory.</p>
                  ) : (
                    <>
                      <SummaryList
                        rows={[
                          {
                            label: "Factor",
                            value: factorRes.factor ? (
                              `${factorRes.factor.factorP90} ${factorRes.factor.unit}`
                            ) : (
                              <Badge variant="warning">Emission factor not configured</Badge>
                            ),
                          },
                          {
                            label: "Estimated CO₂e for this mass",
                            value: carbon ? <CarbonValue value={carbon} /> : "Enter a mass",
                          },
                        ]}
                      />
                      {factorRes.state.kind !== "valid" && (
                        <Notice title="Calculation held">{factorRes.reason}</Notice>
                      )}
                      <AnalyticsNote />
                    </>
                  )}
                </div>
              </Panel>
            </div>
          </div>
        )}

        {/* ------------------------- Step 3 ------------------------- */}
        {step === 3 && (
          <div className="review-layout">
            <div className="stack">
              <div className="estimate-card">
                <span className="eyebrow">Automatic expiry</span>
                <span className="estimate-value" style={{ fontSize: 26 }}>
                  {expiresPreview}
                </span>
                <span className="estimate-sub">
                  Rule snapshot: {shelf?.ruleLabel ?? "—"} · not editable
                </span>
                <div style={{ marginTop: 8 }}>
                  {carbon ? (
                    <CarbonValue value={carbon} />
                  ) : (
                    <Badge variant="warning">
                      {factorRes?.state.kind === "unit-mismatch"
                        ? "Unable to calculate"
                        : "Emission factor not configured"}
                    </Badge>
                  )}
                </div>
              </div>
              <AnalyticsNote />
            </div>

            <Panel title="Review the deposit" description="Confirm the food, locker and expiry before printing the label.">
              <div className="stack">
                <SummaryList
                  rows={[
                    { label: "Food", value: name || "—" },
                    {
                      label: "Category",
                      value: `${category}${subcategory ? ` · ${subcategory}` : ""}${subtype ? ` · ${subtype}` : ""}`,
                    },
                    { label: "Quantity", value: validMass ? formatMass(massNum) : "—" },
                    {
                      label: "Compartment",
                      value: compartment ? `${compartment.hub} / ${compartment.id}` : "—",
                    },
                    { label: "Stored at", value: formatDateTime(new Date().toISOString()) },
                    { label: "Expires", value: expiresPreview },
                  ]}
                />
                <SafetyNotice>
                  The expiration value is calculated from the configured
                  shelf-life rule. It is not a food-safety classification —
                  check the food before consumption.
                </SafetyNotice>
                <div className="button-row">
                  {carbon ? null : (
                    <Notice title="CO₂e not counted">
                      {factorRes?.reason ?? "Select a category and subcategory."}
                    </Notice>
                  )}
                </div>
              </div>
            </Panel>
          </div>
        )}

        {/* ------------------------- Step 4 ------------------------- */}
        {step === 4 && compartment && (
          <div className="review-layout">
            <div className="stack">
              <div className="label-card">
                <div className="stack stack--sm">
                  <span className="brand" style={{ fontSize: 18 }}>
                    <span className="brand-mark" style={{ width: 22, height: 22, fontSize: 11 }}>
                      S
                    </span>
                    SmartSave
                  </span>
                  <div>
                    <div className="label-name">{name || "Untitled deposit"}</div>
                    <div className="label-meta" style={{ marginTop: 8 }}>
                      <span>Barcode: {barcode}</span>
                      <span>Category: {category}</span>
                      <span>Compartment: {compartment.hub} / {compartment.id}</span>
                      <span>Expires: {expiresPreview}</span>
                    </div>
                  </div>
                  <Barcode code={barcode} />
                </div>
              </div>
            </div>

            <Panel title="Attach this label to your food" description="The barcode links this deposit to your record and compartment.">
              <div className="stack">
                <div className="checklist">
                  <div className="checklist-item">
                    <span className="checklist-mark"><IconPrint /></span>
                    Print the deposit label.
                  </div>
                  <div className="checklist-item">
                    <span className="checklist-mark"><IconCheck /></span>
                    Attach it securely to the container.
                  </div>
                  <div className="checklist-item">
                    <span className="checklist-mark"><IconCheck /></span>
                    Place the food in compartment {compartment.id}.
                  </div>
                </div>
                <SimulationBanner>
                  Print preview is simulated — no print dialog is triggered.
                </SimulationBanner>
              </div>
            </Panel>
          </div>
        )}

        {/* ------------------------- Step 5 ------------------------- */}
        {step === 5 && created && (
          <div className="success-panel">
            <div className="success-icon">
              <IconCheck />
            </div>
            <h1>Deposit complete</h1>
            <p>
              {created.name} is now <strong>Stored</strong> in{" "}
              {created.compartmentLabel}. Expiration was calculated automatically
              and cannot be edited.
            </p>
            <div style={{ width: "100%" }}>
              <SummaryList
                rows={[
                  { label: "Deposit ID", value: created.id },
                  { label: "Barcode", value: created.barcode },
                  { label: "Compartment", value: created.compartmentLabel ?? "—" },
                  { label: "Quantity", value: formatMass(created.massG) },
                  { label: "Expires", value: formatDateTime(created.expiresAt) },
                ]}
              />
            </div>
            <PolicyBox>
              Expiry is calculated automatically from the category rule and
              cannot be edited or extended.
            </PolicyBox>
            <div className="button-row">
              <button
                type="button"
                className="button button--primary"
                onClick={() => navigate({ name: "inventory" })}
              >
                View My Food Inventory
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => navigate({ name: "print-label", id: created.id })}
              >
                <IconPrint />
                Print label again
              </button>
              <button type="button" className="button button--ghost" onClick={resetAll}>
                Make another deposit
              </button>
            </div>
          </div>
        )}

        {/* ------------------------- Controls ------------------------- */}
        {step < 5 && Object.keys(errors).length > 0 && (
          <div className="scan-error" role="alert">
            {Object.keys(errors).length === 1
              ? "One field still needs attention before you can continue."
              : `${Object.keys(errors).length} fields still need attention before you can continue.`}
          </div>
        )}
        {step < 5 && (
          <div className="button-row">
            <button
              type="button"
              className="button button--primary"
              onClick={goNext}
            >
              {step === 4 ? "Confirm deposit" : "Continue"}
            </button>
            {step > 1 && (
              <button type="button" className="button button--secondary" onClick={goBack}>
                Back
              </button>
            )}
            <button type="button" className="button button--ghost" onClick={resetAll}>
              Reset
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
