"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { FoodItem } from "@/lib/types";
import { loadProfile } from "@/lib/profile";

// ─── Types ────────────────────────────────────────────────

export type FoodEntry = {
  id: string;
  text: string;
  time: string;       // ISO date string
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items?: FoodItem[]; // per-item USDA breakdown; absent for mock-parsed entries
};

type Goals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type State = {
  entries: FoodEntry[];
  goals: Goals;
};

type Action =
  | { type: "ADD_ENTRY";       payload: FoodEntry }
  | { type: "DELETE_ENTRY";    payload: string }     // payload = id
  | { type: "EDIT_ENTRY";      payload: FoodEntry }
  | { type: "HYDRATE_ENTRIES"; payload: FoodEntry[] }
  | { type: "SET_GOALS";       payload: Goals };

// ─── Entry storage helpers ────────────────────────────────

function getTodayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `smartfood_${y}-${m}-${day}`;
}

function loadEntries(key: string): FoodEntry[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FoodEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(key: string, entries: FoodEntry[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(entries));
  } catch (err) {
    console.warn("[storage] Failed to write entries:", err);
  }
}

// ─── Reducer ──────────────────────────────────────────────

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE_ENTRIES":
      return { ...state, entries: action.payload };

    case "SET_GOALS":
      return { ...state, goals: action.payload };

    case "ADD_ENTRY":
      return { ...state, entries: [action.payload, ...state.entries] };

    case "DELETE_ENTRY":
      return {
        ...state,
        entries: state.entries.filter((e) => e.id !== action.payload),
      };

    case "EDIT_ENTRY":
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };

    default:
      return state;
  }
}

// ─── Initial state ────────────────────────────────────────

const initialState: State = {
  entries: [],
  goals: { calories: 1850, protein: 140, carbs: 200, fat: 55 },
};

// ─── Context ──────────────────────────────────────────────

const AppContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  // Load entries + profile goals on mount (client-only)
  useEffect(() => {
    // Entries
    const stored = loadEntries(getTodayKey());
    if (stored.length > 0) {
      dispatch({ type: "HYDRATE_ENTRIES", payload: stored });
    }

    // Goals from saved profile (falls back to defaults if no profile)
    const profile = loadProfile();
    dispatch({
      type: "SET_GOALS",
      payload: {
        calories: profile.calorieGoal,
        protein:  profile.proteinGoalG,
        carbs:    profile.carbsGoalG,
        fat:      profile.fatGoalG,
      },
    });

    setHydrated(true);
  }, []);

  // Persist entries to localStorage whenever they change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    saveEntries(getTodayKey(), state.entries);
  }, [hydrated, state.entries]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}
