"use client";

import { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import type { FoodItem } from "@/lib/types";
import {
  loadProFoods,
  saveProFoods,
  scaleMacro,
  formatServing,
  getLogUnits,
  defaultLogUnit,
  defaultLogAmount,
  toServings,
  autoGramsPerServing,
  loadBuiltinFavorites,
  saveBuiltinFavorites,
  type CustomFood,
  type ServingUnit,
  type LogUnit,
} from "@/lib/proFoods";
import {
  BUILT_IN_FOODS,
  BUILT_IN_CATEGORIES,
  type BuiltInFood,
} from "@/lib/builtInFoods";

// ─── Unit options ─────────────────────────────────────────────────────────────

const UNIT_OPTIONS: Array<{ value: ServingUnit; label: string }> = [
  { value: "g",       label: "g (grams)"   },
  { value: "oz",      label: "oz (ounces)" },
  { value: "cup",     label: "cup"         },
  { value: "tbsp",    label: "tbsp"        },
  { value: "tsp",     label: "tsp"         },
  { value: "piece",   label: "piece"       },
  { value: "slice",   label: "slice"       },
  { value: "serving", label: "serving"     },
  { value: "custom",  label: "custom…"     },
];

// ─── Form state ───────────────────────────────────────────────────────────────

type FoodForm = {
  name:            string;
  brand:           string;
  servingAmount:   string;
  servingUnit:     ServingUnit;
  customUnitName:  string;
  gramsPerServing: string;
  calories:        string;
  protein:         string;
  carbs:           string;
  fat:             string;
};

const EMPTY_FORM: FoodForm = {
  name:            "",
  brand:           "",
  servingAmount:   "100",
  servingUnit:     "g",
  customUnitName:  "",
  gramsPerServing: "",
  calories:        "",
  protein:         "",
  carbs:           "",
  fat:             "",
};

function normalizeFoodForm(f?: CustomFood): FoodForm {
  if (!f) return EMPTY_FORM;
  return {
    name:            f.name            ?? "",
    brand:           f.brand           ?? "",
    servingAmount:   f.servingAmount   != null ? String(f.servingAmount)   : "100",
    servingUnit:     f.servingUnit     ?? "g",
    customUnitName:  f.customUnitName  ?? "",
    gramsPerServing: f.gramsPerServing != null ? String(f.gramsPerServing) : "",
    calories:        f.calories != null ? String(f.calories) : "",
    protein:         f.protein  != null ? String(f.protein)  : "",
    carbs:           f.carbs    != null ? String(f.carbs)    : "",
    fat:             f.fat      != null ? String(f.fat)      : "",
  };
}

// ─── Sheet overlay ────────────────────────────────────────────────────────────

function SheetOverlay({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [expanded,  setExpanded]  = useState(false);
  const dragStartY = useRef<number | null>(null);
  const didDrag    = useRef(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY;
    didDrag.current    = false;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (dragStartY.current === null) return;
    const delta = dragStartY.current - e.changedTouches[0].clientY;
    dragStartY.current = null;
    if (Math.abs(delta) > 50) {
      didDrag.current = true;
      setExpanded(delta > 0);
    }
  }

  function handleHandleClick() {
    if (didDrag.current) { didDrag.current = false; return; }
    setExpanded((v) => !v);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ backgroundColor: "var(--sf-overlay)" }} />
      <div
        className="relative flex w-full flex-col overflow-hidden rounded-t-3xl"
        style={{
          backgroundColor: "var(--sf-bg)",
          maxWidth: 430,
          maxHeight: expanded ? "92dvh" : "55dvh",
          transition: "max-height 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle strip */}
        <div
          className="flex shrink-0 flex-col items-center gap-1 pb-2 pt-3"
          style={{ touchAction: "none", cursor: "pointer" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleHandleClick}
        >
          <div className="h-1 w-10 rounded-full" style={{ backgroundColor: "var(--sf-text7)" }} />
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--sf-text6)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Sheet header ─────────────────────────────────────────────────────────────

function SheetHeader({
  title,
  onClose,
  onBack,
}: {
  title: string;
  onClose: () => void;
  onBack?: () => void;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-between px-5 py-3"
      style={{ borderBottom: "1px solid var(--sf-border)" }}
    >
      {onBack ? (
        <button
          onClick={onBack}
          className="text-sm font-bold"
          style={{ color: "var(--sf-text5)" }}
        >
          ← Back
        </button>
      ) : (
        <div className="w-12" />
      )}
      <p className="text-sm font-bold" style={{ color: "var(--sf-text1)" }}>{title}</p>
      <button
        onClick={onClose}
        className="flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold"
        style={{ backgroundColor: "var(--sf-pill)", color: "var(--sf-text5)" }}
      >
        ×
      </button>
    </div>
  );
}

// ─── Macro form field ─────────────────────────────────────────────────────────

function MacroField({
  label,
  unit,
  color,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  color: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold" style={{ color }}>
        {label}{" "}
        <span style={{ color: "var(--sf-text6)" }}>({unit})</span>
      </p>
      <input
        type="number"
        inputMode="decimal"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-3 py-2.5 text-sm font-bold outline-none"
        style={{
          backgroundColor: "var(--sf-surface)",
          border: "1px solid var(--sf-border2)",
          color: "var(--sf-text1)",
        }}
      />
    </div>
  );
}

// ─── My Foods sheet ───────────────────────────────────────────────────────────

function MyFoodsSheet({
  foods,
  onUpdate,
  onClose,
}: {
  foods: CustomFood[];
  onUpdate: (updated: CustomFood[]) => void;
  onClose: () => void;
}) {
  const [view, setView]       = useState<"list" | "form">("list");
  const [editing, setEditing] = useState<CustomFood | null>(null);
  const [form, setForm]       = useState<FoodForm>(EMPTY_FORM);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setView("form");
  }

  function openEdit(food: CustomFood) {
    setEditing(food);
    setForm(normalizeFoodForm(food));
    setView("form");
  }

  function handleDelete(id: string) {
    onUpdate(foods.filter((f) => f.id !== id));
  }

  function handleSave() {
    const name = (form.name ?? "").trim();
    if (!name) return;

    const servingUnit   = form.servingUnit ?? "g";
    const servingAmount = Math.max(parseFloat(form.servingAmount ?? "1") || 1, 0.001);
    const autoGps       = autoGramsPerServing(servingAmount, servingUnit);
    const gramsPerServing = autoGps
      ?? (form.gramsPerServing ? Math.round(parseFloat(form.gramsPerServing) || 0) || undefined : undefined);

    const food: CustomFood = {
      id:             editing?.id ?? crypto.randomUUID(),
      name,
      brand:          (form.brand          ?? "").trim() || undefined,
      servingAmount,
      servingUnit,
      customUnitName: servingUnit === "custom" ? (form.customUnitName ?? "").trim() || undefined : undefined,
      gramsPerServing,
      calories:       Math.max(parseFloat(form.calories) || 0, 0),
      protein:        Math.max(parseFloat(form.protein)  || 0, 0),
      carbs:          Math.max(parseFloat(form.carbs)    || 0, 0),
      fat:            Math.max(parseFloat(form.fat)      || 0, 0),
      createdAt:      editing?.createdAt ?? new Date().toISOString(),
    };

    if (editing) {
      onUpdate(foods.map((f) => (f.id === editing.id ? food : f)));
    } else {
      onUpdate([...foods, food]);
    }
    setView("list");
  }

  const needsGramsField = (form.servingUnit ?? "g") !== "g" && (form.servingUnit ?? "g") !== "oz";
  const canSave = (form.name ?? "").trim() !== "";

  return (
    <SheetOverlay onClose={onClose}>
      <SheetHeader
        title={view === "list" ? "My Foods" : editing ? "Edit Food" : "New Food"}
        onClose={onClose}
        onBack={view === "form" ? () => setView("list") : undefined}
      />

      {view === "list" ? (
        /* ── List ── */
        <>
          <div className="flex-1 overflow-y-auto">
            {foods.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-8 py-14 text-center">
                <p className="text-sm font-bold" style={{ color: "var(--sf-text1)" }}>
                  No foods saved yet
                </p>
                <p className="mt-1.5 text-xs" style={{ color: "var(--sf-text5)" }}>
                  Add your ingredients once and reuse them every meal.
                  Use exactly what the nutrition label says.
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--sf-border)" }}>
                {foods.map((food) => (
                  <div key={food.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p
                        className="truncate text-sm font-bold"
                        style={{ color: "var(--sf-text1)" }}
                      >
                        {food.name}
                      </p>
                      {food.brand && (
                        <p className="text-[10px]" style={{ color: "var(--sf-text6)" }}>
                          {food.brand}
                        </p>
                      )}
                      <p className="mt-0.5 text-[11px]" style={{ color: "var(--sf-text5)" }}>
                        <span style={{ color: "#00d2ff" }}>{food.calories}</span> cal ·{" "}
                        P <span style={{ color: "#38bdf8" }}>{food.protein}g</span> ·{" "}
                        C <span style={{ color: "#a78bfa" }}>{food.carbs}g</span> ·{" "}
                        F <span style={{ color: "#fb7185" }}>{food.fat}g</span>
                        <span style={{ color: "var(--sf-text7)" }}> per {formatServing(food)}</span>
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        onUpdate(
                          foods.map((f) =>
                            f.id === food.id ? { ...f, isFavorite: !f.isFavorite } : f,
                          ),
                        )
                      }
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base transition-colors"
                      style={{
                        color:           food.isFavorite ? "#fbbf24" : "var(--sf-text7)",
                        backgroundColor: food.isFavorite ? "rgba(251,191,36,0.08)" : "transparent",
                      }}
                      aria-label={food.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      {food.isFavorite ? "★" : "☆"}
                    </button>
                    <button
                      onClick={() => openEdit(food)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm"
                      style={{ backgroundColor: "var(--sf-pill)", color: "var(--sf-text4)" }}
                      aria-label={`Edit ${food.name}`}
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(food.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base font-bold"
                      style={{ backgroundColor: "rgba(244,63,94,0.1)", color: "#f43f5e" }}
                      aria-label={`Delete ${food.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div
            className="shrink-0 px-5 py-4"
            style={{ borderTop: "1px solid var(--sf-border)" }}
          >
            <button
              onClick={openAdd}
              className="w-full rounded-2xl py-3.5 text-sm font-bold transition-all active:scale-95"
              style={{ backgroundColor: "#00d2ff", color: "#0a0a0a" }}
            >
              + New Food
            </button>
          </div>
        </>
      ) : (
        /* ── Form ── */
        <>
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

            {/* Name */}
            <div>
              <p
                className="mb-1.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--sf-text5)" }}
              >
                Food name
              </p>
              <input
                type="text"
                placeholder="e.g. My Rice, My Chicken Breast…"
                value={form.name ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  backgroundColor: "var(--sf-surface)",
                  border: "1px solid var(--sf-border2)",
                  color: "var(--sf-text1)",
                }}
              />
            </div>

            {/* Brand (optional) */}
            <div>
              <p
                className="mb-1.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--sf-text5)" }}
              >
                Brand{" "}
                <span
                  className="normal-case font-normal tracking-normal"
                  style={{ color: "var(--sf-text7)" }}
                >
                  (optional)
                </span>
              </p>
              <input
                type="text"
                placeholder="e.g. Trader Joe's, Generic…"
                value={form.brand ?? ""}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  backgroundColor: "var(--sf-surface)",
                  border: "1px solid var(--sf-border2)",
                  color: "var(--sf-text1)",
                }}
              />
            </div>

            {/* Serving size */}
            <div>
              <p
                className="mb-1.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--sf-text5)" }}
              >
                Serving size
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="100"
                  value={form.servingAmount ?? ""}
                  onChange={(e) => setForm({ ...form, servingAmount: e.target.value })}
                  className="w-24 shrink-0 rounded-xl px-3 py-3 text-center text-sm font-bold outline-none"
                  style={{
                    backgroundColor: "var(--sf-surface)",
                    border: "1px solid var(--sf-border2)",
                    color: "var(--sf-text1)",
                  }}
                />
                <select
                  value={form.servingUnit ?? "g"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      servingUnit:     e.target.value as ServingUnit,
                      gramsPerServing: "",
                      customUnitName:  "",
                    })
                  }
                  className="flex-1 rounded-xl px-3 py-3 text-sm font-bold outline-none"
                  style={{
                    backgroundColor: "var(--sf-surface)",
                    border: "1px solid var(--sf-border2)",
                    color: "var(--sf-text1)",
                  }}
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      style={{ backgroundColor: "var(--sf-surface)" }}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1.5 text-[11px]" style={{ color: "var(--sf-text7)" }}>
                All nutrition values below are per this serving
              </p>
            </div>

            {/* Custom unit name */}
            {form.servingUnit === "custom" && (
              <div>
                <p
                  className="mb-1.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--sf-text5)" }}
                >
                  Unit name
                </p>
                <input
                  type="text"
                  placeholder="e.g. packet, bar, scoop…"
                  value={form.customUnitName ?? ""}
                  onChange={(e) => setForm({ ...form, customUnitName: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{
                    backgroundColor: "var(--sf-surface)",
                    border: "1px solid var(--sf-border2)",
                    color: "var(--sf-text1)",
                  }}
                />
              </div>
            )}

            {/* Grams conversion */}
            {needsGramsField && (
              <div>
                <p
                  className="mb-1.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--sf-text5)" }}
                >
                  Grams per serving{" "}
                  <span
                    className="normal-case font-normal tracking-normal"
                    style={{ color: "var(--sf-text7)" }}
                  >
                    (optional — enables logging by g or oz)
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="e.g. 158"
                    value={form.gramsPerServing ?? ""}
                    onChange={(e) => setForm({ ...form, gramsPerServing: e.target.value })}
                    className="w-28 rounded-xl px-3 py-3 text-center text-sm font-bold outline-none"
                    style={{
                      backgroundColor: "var(--sf-surface)",
                      border: "1px solid var(--sf-border2)",
                      color: "var(--sf-text1)",
                    }}
                  />
                  <span className="text-sm" style={{ color: "var(--sf-text5)" }}>g</span>
                </div>
              </div>
            )}

            {/* Macros */}
            <div>
              <p
                className="mb-2.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--sf-text5)" }}
              >
                Nutrition per serving
              </p>
              <div className="grid grid-cols-2 gap-3">
                <MacroField label="Calories" unit="kcal" color="#00d2ff" value={form.calories ?? ""} onChange={(v) => setForm({ ...form, calories: v })} />
                <MacroField label="Protein"  unit="g"    color="#38bdf8" value={form.protein  ?? ""} onChange={(v) => setForm({ ...form, protein:  v })} />
                <MacroField label="Carbs"    unit="g"    color="#a78bfa" value={form.carbs    ?? ""} onChange={(v) => setForm({ ...form, carbs:    v })} />
                <MacroField label="Fat"      unit="g"    color="#fb7185" value={form.fat      ?? ""} onChange={(v) => setForm({ ...form, fat:      v })} />
              </div>
            </div>

          </div>

          <div
            className="shrink-0 px-5 py-4"
            style={{ borderTop: "1px solid var(--sf-border)" }}
          >
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="w-full rounded-2xl py-3.5 text-sm font-bold transition-all active:scale-95"
              style={{
                backgroundColor: canSave ? "#00d2ff" : "var(--sf-border)",
                color:           canSave ? "#0a0a0a" : "var(--sf-text7)",
              }}
            >
              {editing ? "Save Changes" : "Save Food"}
            </button>
          </div>
        </>
      )}
    </SheetOverlay>
  );
}

// ─── Meal builder sheet ───────────────────────────────────────────────────────

type Tab     = "favorites" | "builtin" | "myfoods" | "all";
type AnyFood = CustomFood | BuiltInFood;

function isBI(f: AnyFood): f is BuiltInFood {
  return "category" in f && (f as BuiltInFood).source === "built_in";
}

// BuiltInFood has all fields the helper functions need — cast is safe at runtime
function asC(f: AnyFood): CustomFood { return f as unknown as CustomFood; }

// Units shown in the quantity picker (friendlier labels than the meal-builder select)
function getPickerUnits(food: AnyFood): Array<{ unit: LogUnit; label: string }> {
  const cf = asC(food);
  const units: Array<{ unit: LogUnit; label: string }> = [];
  if (cf.gramsPerServing || cf.servingUnit === "g") {
    units.push({ unit: "g",  label: "grams" });
    units.push({ unit: "oz", label: "oz"    });
  }
  // Add "serving" only for non-gram foods (avoids showing "100g" twice for built-ins)
  if (cf.servingUnit !== "g") {
    units.push({ unit: "serving", label: formatServing(cf) });
  }
  if (units.length === 0) {
    units.push({ unit: "serving", label: formatServing(cf) });
  }
  return units;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CatHeader({ title }: { title: string }) {
  return (
    <div className="px-5 pt-4 pb-1.5">
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text6)" }}>
        {title}
      </p>
    </div>
  );
}

function FoodRow({
  food, isSelected, isFav, onToggle, onFavToggle,
}: {
  food: AnyFood; isSelected: boolean; isFav: boolean;
  onToggle: () => void; onFavToggle?: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 px-5 py-3"
      style={{
        borderBottom: "1px solid var(--sf-border)",
        backgroundColor: isSelected ? "rgba(0,210,255,0.04)" : "transparent",
      }}
    >
      <button onClick={onToggle} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5">
          {isSelected && <span className="text-[11px]" style={{ color: "#00d2ff" }}>✓</span>}
          <p
            className="text-sm font-bold truncate"
            style={{ color: isSelected ? "#00d2ff" : "var(--sf-text1)" }}
          >
            {food.name}
          </p>
          {isBI(food) && !onFavToggle && (
            <span
              className="shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{ color: "#4ade80", backgroundColor: "rgba(74,222,128,0.08)" }}
            >
              Built-in
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px]" style={{ color: "var(--sf-text5)" }}>
          <span style={{ color: "#00d2ff" }}>{food.calories}</span> cal ·{" "}
          P <span style={{ color: "#38bdf8" }}>{food.protein}g</span>{" · "}
          C <span style={{ color: "#a78bfa" }}>{food.carbs}g</span>{" · "}
          F <span style={{ color: "#fb7185" }}>{food.fat}g</span>
          <span style={{ color: "var(--sf-text7)" }}> / {formatServing(asC(food))}</span>
        </p>
      </button>
      {onFavToggle && (
        <button
          onClick={onFavToggle}
          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
          style={{
            color:           isFav ? "#fbbf24" : "var(--sf-text7)",
            backgroundColor: isFav ? "rgba(251,191,36,0.08)" : "transparent",
          }}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          {isFav ? "★" : "☆"}
        </button>
      )}
    </div>
  );
}

// ─── Quantity picker ─────────────────────────────────────────────────────────

function QuantitySheet({
  food,
  initialAmount,
  initialUnit,
  isEditing,
  onAdd,
  onClose,
}: {
  food: AnyFood;
  initialAmount?: string;
  initialUnit?: LogUnit;
  isEditing?: boolean;
  onAdd: (amount: string, unit: LogUnit) => void;
  onClose: () => void;
}) {
  const cf          = asC(food);
  const pickerUnits = getPickerUnits(food);
  const [unit,   setUnit]   = useState<LogUnit>(() => initialUnit ?? pickerUnits[0]?.unit ?? "serving");
  const [amount, setAmount] = useState<string>(() => {
    if (initialAmount) return initialAmount;
    const u = pickerUnits[0]?.unit ?? "serving";
    return u === "g" ? String(cf.servingAmount) : "1";
  });

  const amountNum = parseFloat(amount) || 0;
  const servings  = amountNum > 0 ? toServings(cf, amountNum, unit) : 0;
  const cal   = scaleMacro(food.calories, servings);
  const pro   = scaleMacro(food.protein,  servings);
  const carbs = scaleMacro(food.carbs,    servings);
  const fat   = scaleMacro(food.fat,      servings);
  const canAdd = amountNum > 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.65)" }} />
      <div
        className="relative w-full max-w-[430px] space-y-5 rounded-t-3xl px-5 pb-10 pt-4"
        style={{ backgroundColor: "var(--sf-bg)", overflowX: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-1 pb-0">
          <div className="h-1 w-10 rounded-full" style={{ backgroundColor: "var(--sf-text7)" }} />
        </div>

        {/* Food name */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text6)" }}>
            How much did you eat?
          </p>
          <p className="mt-1 text-lg font-black leading-tight" style={{ color: "var(--sf-text1)" }}>
            {food.name}
          </p>
          {isBI(food) && (
            <span
              className="mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{ color: "#4ade80", backgroundColor: "rgba(74,222,128,0.08)" }}
            >
              Built-in
            </span>
          )}
        </div>

        {/* Amount + unit — vertical stack, both full-width, no horizontal overflow */}
        <div className="flex flex-col gap-3" style={{ overflow: "hidden" }}>
          <input
            type="number"
            inputMode="decimal"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full rounded-2xl px-4 py-4 text-center text-3xl font-black outline-none"
            style={{
              backgroundColor: "var(--sf-surface)",
              border: "2px solid rgba(0,210,255,0.45)",
              color: "#00d2ff",
              minWidth: 0,
            }}
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as LogUnit)}
            className="w-full rounded-2xl px-4 py-3 text-sm font-bold outline-none"
            style={{
              backgroundColor: "var(--sf-surface)",
              border: "1px solid var(--sf-border2)",
              color: "var(--sf-text1)",
              minWidth: 0,
            }}
          >
            {pickerUnits.map((pu) => (
              <option key={pu.unit} value={pu.unit} style={{ backgroundColor: "var(--sf-surface)" }}>
                {pu.label}
              </option>
            ))}
          </select>
        </div>

        {/* Live macro preview */}
        {amountNum > 0 && (
          <div
            className="rounded-2xl px-4 py-3"
            style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border2)" }}
          >
            <p className="text-xl font-black" style={{ color: "var(--sf-text1)" }}>
              {cal}
              <span className="ml-1 text-sm font-medium" style={{ color: "var(--sf-text6)" }}>cal</span>
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--sf-text5)" }}>
              P{" "}<span className="font-bold" style={{ color: "#38bdf8" }}>{pro}g</span>
              {"  ·  "}
              C{" "}<span className="font-bold" style={{ color: "#a78bfa" }}>{carbs}g</span>
              {"  ·  "}
              F{" "}<span className="font-bold" style={{ color: "#fb7185" }}>{fat}g</span>
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl py-4 text-sm font-bold"
            style={{
              backgroundColor: "var(--sf-surface)",
              border: "1px solid var(--sf-border2)",
              color: "var(--sf-text5)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => { if (canAdd) onAdd(amount, unit); }}
            disabled={!canAdd}
            className="flex-[2] rounded-2xl py-4 text-sm font-black transition-all active:scale-[0.98]"
            style={{
              backgroundColor: canAdd ? "#00d2ff" : "var(--sf-border)",
              color:           canAdd ? "#0a0a0a" : "var(--sf-text7)",
            }}
          >
            {isEditing ? "Update Amount" : "Add to Meal"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Meal builder sheet ───────────────────────────────────────────────────────

function MealBuilderSheet({
  foods,
  onClose,
  onGoToMyFoods,
}: {
  foods: CustomFood[];
  onClose: () => void;
  onGoToMyFoods: () => void;
}) {
  const { dispatch } = useApp();

  const [builtinFavIds, setBuiltinFavIds] = useState<string[]>([]);
  useEffect(() => { setBuiltinFavIds(loadBuiltinFavorites()); }, []);
  const biiFavSet = new Set(builtinFavIds);

  const hasAnyFavs = foods.some((f) => f.isFavorite) || builtinFavIds.length > 0;
  const [tab,         setTab]         = useState<Tab>(hasAnyFavs ? "favorites" : "builtin");
  const [search,      setSearch]      = useState("");
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [amountMap,   setAmountMap]   = useState<Record<string, string>>({});
  const [unitMap,     setUnitMap]     = useState<Record<string, LogUnit>>({});
  const [pendingFood, setPendingFood] = useState<AnyFood | null>(null);
  const [isEditing,   setIsEditing]   = useState(false);

  const sl = search.toLowerCase().trim();
  function matches(f: AnyFood) {
    if (!sl) return true;
    return (
      f.name.toLowerCase().includes(sl) ||
      (!isBI(f) && ((f as CustomFood).brand ?? "").toLowerCase().includes(sl))
    );
  }

  // Tapping a new food opens the quantity picker.
  // Tapping an already-selected food re-opens the picker to edit the amount.
  function handleFoodTap(food: AnyFood) {
    if (selected.has(food.id)) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
    setPendingFood(food);
  }

  function handleQuantityAdd(amount: string, unit: LogUnit) {
    if (!pendingFood) return;
    setSelected((prev) => new Set([...prev, pendingFood.id]));
    setAmountMap((m) => ({ ...m, [pendingFood.id]: amount }));
    setUnitMap((m)   => ({ ...m, [pendingFood.id]: unit   }));
    setPendingFood(null);
    setIsEditing(false);
  }

  function removeFood(foodId: string) {
    setSelected((prev) => { const next = new Set(prev); next.delete(foodId); return next; });
    setAmountMap((m) => { const c = { ...m }; delete c[foodId]; return c; });
    setUnitMap((m)   => { const c = { ...m }; delete c[foodId]; return c; });
  }

  function toggleBIFav(id: string) {
    const next = biiFavSet.has(id)
      ? builtinFavIds.filter((x) => x !== id)
      : [...builtinFavIds, id];
    setBuiltinFavIds(next);
    saveBuiltinFavorites(next);
  }

  const allPool      = [...BUILT_IN_FOODS, ...foods] as AnyFood[];
  const selectedFoods = allPool.filter((f) => selected.has(f.id));

  function getServings(food: AnyFood) {
    const amount = parseFloat(amountMap[food.id] || "0") || 0;
    const unit   = unitMap[food.id] ?? defaultLogUnit(asC(food));
    return toServings(asC(food), amount, unit);
  }

  const totals = selectedFoods.reduce(
    (acc, f) => {
      const s = getServings(f);
      return {
        calories: acc.calories + scaleMacro(f.calories, s),
        protein:  acc.protein  + scaleMacro(f.protein,  s),
        carbs:    acc.carbs    + scaleMacro(f.carbs,    s),
        fat:      acc.fat      + scaleMacro(f.fat,      s),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  function handleLog() {
    if (selectedFoods.length === 0) return;
    const items: FoodItem[] = selectedFoods.map((food) => {
      const amount   = parseFloat(amountMap[food.id] || "0") || 0;
      const unit     = unitMap[food.id] ?? defaultLogUnit(asC(food));
      const servings = toServings(asC(food), amount, unit);
      const grams    = asC(food).gramsPerServing
        ? servings * (asC(food).gramsPerServing as number)
        : null;
      const unitLabel = unit === "serving" ? formatServing(asC(food)) : unit;
      return {
        name:     food.name,
        amount:   `${amount} ${unitLabel}`,
        grams,
        calories: scaleMacro(food.calories, servings),
        protein:  scaleMacro(food.protein,  servings),
        carbs:    scaleMacro(food.carbs,    servings),
        fat:      scaleMacro(food.fat,      servings),
        source:   isBI(food) ? ("built_in" as const) : ("manual" as const),
      };
    });
    dispatch({
      type: "ADD_ENTRY",
      payload: {
        id:       crypto.randomUUID(),
        text:     items.map((i) => `${i.name} ${i.amount}`).join(", "),
        time:     new Date().toISOString(),
        calories: totals.calories,
        protein:  totals.protein,
        carbs:    totals.carbs,
        fat:      totals.fat,
        items,
      },
    });
    onClose();
  }

  // ── Render food list for the active tab ──
  function renderList() {
    if (tab === "builtin" || tab === "all") {
      const biFoods = BUILT_IN_FOODS.filter(matches);
      const groups: Partial<Record<string, BuiltInFood[]>> = {};
      for (const f of biFoods) {
        if (!groups[f.category]) groups[f.category] = [];
        groups[f.category]!.push(f);
      }
      const cats = BUILT_IN_CATEGORIES.filter((c) => groups[c]?.length);
      const myFoodsFiltered = tab === "all" ? foods.filter(matches) : [];

      if (cats.length === 0 && myFoodsFiltered.length === 0) {
        return (
          <div className="py-10 text-center">
            <p className="text-xs" style={{ color: "var(--sf-text5)" }}>
              No foods match &ldquo;{search}&rdquo;
            </p>
          </div>
        );
      }

      return (
        <>
          {cats.map((cat) => (
            <div key={cat}>
              <CatHeader title={cat} />
              {groups[cat]!.map((food) => (
                <FoodRow
                  key={food.id}
                  food={food}
                  isSelected={selected.has(food.id)}
                  isFav={biiFavSet.has(food.id)}
                  onToggle={() => handleFoodTap(food)}
                  onFavToggle={() => toggleBIFav(food.id)}
                />
              ))}
            </div>
          ))}
          {myFoodsFiltered.length > 0 && (
            <>
              <CatHeader title="My Foods" />
              {myFoodsFiltered.map((food) => (
                <FoodRow
                  key={food.id}
                  food={food}
                  isSelected={selected.has(food.id)}
                  isFav={false}
                  onToggle={() => handleFoodTap(food)}
                />
              ))}
            </>
          )}
        </>
      );
    }

    if (tab === "myfoods") {
      const filtered = foods.filter(matches);
      if (foods.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
            <p className="text-sm font-bold" style={{ color: "var(--sf-text1)" }}>No custom foods yet</p>
            <p className="mt-1.5 text-xs" style={{ color: "var(--sf-text5)" }}>
              Add your own foods in My Foods, or use Built-in foods.
            </p>
            <button
              onClick={onGoToMyFoods}
              className="mt-5 rounded-2xl px-6 py-3 text-sm font-bold"
              style={{ backgroundColor: "rgba(0,210,255,0.1)", color: "#00d2ff" }}
            >
              Open My Foods →
            </button>
          </div>
        );
      }
      if (filtered.length === 0) {
        return (
          <div className="py-10 text-center">
            <p className="text-xs" style={{ color: "var(--sf-text5)" }}>
              No foods match &ldquo;{search}&rdquo;
            </p>
          </div>
        );
      }
      return (
        <>
          {filtered.map((food) => (
            <FoodRow
              key={food.id}
              food={food}
              isSelected={selected.has(food.id)}
              isFav={false}
              onToggle={() => handleFoodTap(food)}
            />
          ))}
        </>
      );
    }

    // Favorites tab
    const customFavs  = foods.filter((f) => f.isFavorite).filter(matches);
    const builtinFavs = BUILT_IN_FOODS.filter((f) => biiFavSet.has(f.id)).filter(matches);

    if (customFavs.length === 0 && builtinFavs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
          <p className="text-sm font-bold" style={{ color: "var(--sf-text5)" }}>
            {sl ? `No favorites match "${search}"` : "No favorites yet"}
          </p>
          {!sl && (
            <p className="mt-1.5 text-xs" style={{ color: "var(--sf-text7)" }}>
              Star built-in foods from the Built-in tab, or star your foods in My Foods.
            </p>
          )}
          <button
            onClick={() => setTab("builtin")}
            className="mt-4 rounded-2xl px-5 py-2.5 text-xs font-bold"
            style={{ backgroundColor: "rgba(0,210,255,0.1)", color: "#00d2ff" }}
          >
            Browse Built-in →
          </button>
        </div>
      );
    }
    return (
      <>
        {builtinFavs.length > 0 && (
          <>
            <CatHeader title="Built-in" />
            {builtinFavs.map((food) => (
              <FoodRow
                key={food.id}
                food={food}
                isSelected={selected.has(food.id)}
                isFav={true}
                onToggle={() => handleFoodTap(food)}
                onFavToggle={() => toggleBIFav(food.id)}
              />
            ))}
          </>
        )}
        {customFavs.length > 0 && (
          <>
            <CatHeader title="My Foods" />
            {customFavs.map((food) => (
              <FoodRow
                key={food.id}
                food={food}
                isSelected={selected.has(food.id)}
                isFav={false}
                onToggle={() => handleFoodTap(food)}
              />
            ))}
          </>
        )}
      </>
    );
  }

  // ── Tab definitions ──
  const TABS: Array<{ id: Tab; label: string }> = [
    { id: "favorites", label: "★ Fav"    },
    { id: "builtin",   label: "Built-in" },
    { id: "myfoods",   label: "My Foods" },
    { id: "all",       label: "All"      },
  ];

  const canLog = selectedFoods.length > 0;

  return (
    <>
    <SheetOverlay onClose={onClose}>
      <SheetHeader title="Build Meal" onClose={onClose} />

      {/* Tabs + Search */}
      <div className="shrink-0 px-4 pt-3 pb-2 space-y-2">
        <div
          className="flex overflow-hidden rounded-xl"
          style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-pill)" }}
        >
          {TABS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-2 text-xs font-bold transition-colors"
              style={{
                borderLeft:      i > 0 ? "1px solid var(--sf-pill)" : undefined,
                backgroundColor:
                  tab === t.id
                    ? t.id === "favorites"
                      ? "rgba(251,191,36,0.12)"
                      : "rgba(0,210,255,0.08)"
                    : "transparent",
                color:
                  tab === t.id
                    ? t.id === "favorites" ? "#fbbf24" : "#00d2ff"
                    : "var(--sf-text5)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search foods…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{
            backgroundColor: "var(--sf-surface)",
            border: "1px solid var(--sf-pill)",
            color: "var(--sf-text1)",
          }}
        />
      </div>

      {/* Scrollable food list */}
      <div className="flex-1 overflow-y-auto">
        {renderList()}
      </div>

      {/* Your Meal — sticky section, always above footer when foods are selected */}
      {selectedFoods.length > 0 && (
        <div
          className="shrink-0 overflow-y-auto"
          style={{
            borderTop: "2px solid var(--sf-border2)",
            maxHeight: "30dvh",
          }}
        >
          {/* Header + total */}
          <div
            className="sticky top-0 flex items-center justify-between px-5 py-2"
            style={{ backgroundColor: "var(--sf-bg)", borderBottom: "1px solid var(--sf-border)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text6)" }}>
              Your Meal
            </p>
            <p className="text-xs font-black" style={{ color: "var(--sf-text1)" }}>
              {totals.calories}
              <span className="ml-0.5 text-[10px] font-medium" style={{ color: "var(--sf-text6)" }}>cal</span>
              {"  "}
              <span className="text-[10px] font-medium" style={{ color: "#38bdf8" }}>P {totals.protein}g</span>
            </p>
          </div>

          {/* Selected food rows */}
          {selectedFoods.map((food) => {
            const amt      = amountMap[food.id] ?? "";
            const unit     = unitMap[food.id] ?? defaultLogUnit(asC(food));
            const s        = getServings(food);
            const cal      = scaleMacro(food.calories, s);
            const pro      = scaleMacro(food.protein,  s);
            const unitLabel = unit === "serving" ? formatServing(asC(food)) : unit;
            return (
              <div
                key={food.id}
                className="flex items-center gap-2 px-4 py-2.5"
                style={{ borderBottom: "1px solid var(--sf-border)" }}
              >
                {/* Tap row to re-open quantity picker */}
                <button
                  className="flex-1 min-w-0 text-left"
                  onClick={() => handleFoodTap(food)}
                >
                  <p className="truncate text-sm font-bold" style={{ color: "var(--sf-text1)" }}>
                    {food.name}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--sf-text5)" }}>
                    <span style={{ color: "#00d2ff" }}>{amt} {unitLabel}</span>
                    {" · "}{cal} cal · P {pro}g
                  </p>
                </button>

                {/* Edit button */}
                <button
                  onClick={() => handleFoodTap(food)}
                  className="shrink-0 flex h-7 w-7 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "rgba(0,210,255,0.08)", color: "#00d2ff" }}
                  aria-label="Edit amount"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>

                {/* Remove button */}
                <button
                  onClick={() => removeFood(food.id)}
                  className="shrink-0 flex h-7 w-7 items-center justify-center rounded-xl text-base font-black leading-none"
                  style={{ backgroundColor: "rgba(255,80,80,0.08)", color: "#ff6060" }}
                  aria-label="Remove from meal"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="shrink-0 px-5 py-4" style={{ borderTop: "1px solid var(--sf-border)" }}>
        <button
          onClick={handleLog}
          disabled={!canLog}
          className="w-full rounded-2xl py-3.5 text-sm font-bold transition-all active:scale-95"
          style={{
            backgroundColor: canLog ? "#00d2ff" : "var(--sf-border)",
            color:           canLog ? "#0a0a0a" : "var(--sf-text7)",
          }}
        >
          {canLog ? `Add ${totals.calories} cal to Log` : "Select foods above"}
        </button>
      </div>
    </SheetOverlay>
    {pendingFood && (
      <QuantitySheet
        food={pendingFood}
        initialAmount={isEditing ? amountMap[pendingFood.id] : undefined}
        initialUnit={isEditing   ? unitMap[pendingFood.id]   : undefined}
        isEditing={isEditing}
        onAdd={handleQuantityAdd}
        onClose={() => { setPendingFood(null); setIsEditing(false); }}
      />
    )}
    </>
  );
}

// ─── Pro panel (bottom bar) ───────────────────────────────────────────────────

export default function ProPanel() {
  const [openSheet, setOpenSheet] = useState<null | "foods" | "builder">(null);
  const [proFoods, setProFoods]   = useState<CustomFood[]>([]);

  useEffect(() => {
    setProFoods(loadProFoods());
  }, []);

  function updateFoods(updated: CustomFood[]) {
    setProFoods(updated);
    saveProFoods(updated);
  }

  return (
    <>
      {/* Bottom bar */}
      <div
        className="shrink-0 flex items-center gap-3 px-4"
        style={{
          height: 68,
          backgroundColor: "var(--sf-bg)",
          borderTop: "1px solid var(--sf-border)",
          boxShadow: "0 -8px 32px var(--sf-shadow)",
        }}
      >
        <button
          onClick={() => setOpenSheet("foods")}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 transition-all active:scale-95"
          style={{
            backgroundColor: "var(--sf-surface)",
            border: "1px solid var(--sf-pill)",
            color: "var(--sf-text3)",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span className="text-sm font-bold">My Foods</span>
        </button>

        <button
          onClick={() => setOpenSheet("builder")}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 transition-all active:scale-95"
          style={{ backgroundColor: "#00d2ff", color: "#0a0a0a" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="text-sm font-bold">Add Meal</span>
        </button>
      </div>

      {openSheet === "foods" && (
        <MyFoodsSheet
          foods={proFoods}
          onUpdate={updateFoods}
          onClose={() => setOpenSheet(null)}
        />
      )}

      {openSheet === "builder" && (
        <MealBuilderSheet
          foods={proFoods}
          onClose={() => setOpenSheet(null)}
          onGoToMyFoods={() => setOpenSheet("foods")}
        />
      )}
    </>
  );
}
