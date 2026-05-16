"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { FoodItem } from "@/lib/types";
import { loadProfile, saveProfile } from "@/lib/profile";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTodayEntries,
  insertFoodEntry,
  updateFoodEntry,
  deleteFoodEntry,
} from "@/lib/db/food-entries";
import { fetchProfile } from "@/lib/db/profiles";

// ─── Types ────────────────────────────────────────────────

export type FoodEntry = {
  id: string;
  text: string;
  time: string;       // ISO date string
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items?: FoodItem[];
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
  | { type: "DELETE_ENTRY";    payload: string }
  | { type: "EDIT_ENTRY";      payload: FoodEntry }
  | { type: "HYDRATE_ENTRIES"; payload: FoodEntry[] }
  | { type: "SET_GOALS";       payload: Goals };

// ─── localStorage fallback ────────────────────────────────

function getTodayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `smartfood_${y}-${m}-${day}`;
}

function loadEntriesLocal(key: string): FoodEntry[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FoodEntry[]) : [];
  } catch { return []; }
}

function saveEntriesLocal(key: string, entries: FoodEntry[]): void {
  try { localStorage.setItem(key, JSON.stringify(entries)); } catch {}
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
      return { ...state, entries: state.entries.filter((e) => e.id !== action.payload) };
    case "EDIT_ENTRY":
      return { ...state, entries: state.entries.map((e) => e.id === action.payload.id ? action.payload : e) };
    default:
      return state;
  }
}

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
  const { user, loading: authLoading } = useAuth();

  // Load entries + goals on mount (after auth resolves)
  useEffect(() => {
    if (authLoading) return;

    async function load() {
      // Goals: prefer Supabase profile when signed in; localStorage otherwise
      let profile = loadProfile();
      if (user) {
        try {
          const dbProfile = await fetchProfile(user.id);
          if (dbProfile) {
            profile = dbProfile;
            saveProfile(dbProfile); // keep localStorage in sync for offline
          }
        } catch { /* stay with localStorage fallback */ }
      }
      dispatch({
        type: "SET_GOALS",
        payload: {
          calories: profile.calorieGoal,
          protein:  profile.proteinGoalG,
          carbs:    profile.carbsGoalG,
          fat:      profile.fatGoalG,
        },
      });

      if (user) {
        // Load from Supabase
        try {
          const entries = await fetchTodayEntries(user.id);
          dispatch({ type: "HYDRATE_ENTRIES", payload: entries });
        } catch {
          // Fall back to localStorage
          const stored = loadEntriesLocal(getTodayKey());
          if (stored.length > 0) dispatch({ type: "HYDRATE_ENTRIES", payload: stored });
        }
      } else {
        // No user: use localStorage
        const stored = loadEntriesLocal(getTodayKey());
        if (stored.length > 0) dispatch({ type: "HYDRATE_ENTRIES", payload: stored });
      }

      setHydrated(true);
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  // Persist to localStorage as cache (after hydration, when no user)
  useEffect(() => {
    if (!hydrated || user) return;
    saveEntriesLocal(getTodayKey(), state.entries);
  }, [hydrated, user, state.entries]);

  // Wrapped dispatch that also calls Supabase for data mutations
  const dispatchWithSync = useCallback(
    (action: Action) => {
      dispatch(action);
      if (!user) return;

      if (action.type === "ADD_ENTRY") {
        insertFoodEntry(user.id, action.payload).catch(console.error);
      } else if (action.type === "DELETE_ENTRY") {
        deleteFoodEntry(action.payload).catch(console.error);
      } else if (action.type === "EDIT_ENTRY") {
        updateFoodEntry(action.payload).catch(console.error);
      }
    },
    [user]
  );

  return (
    <AppContext.Provider value={{ state, dispatch: dispatchWithSync }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}
