import { atom } from "jotai";
import type { components } from "../types";

// Type for the selected church (can be null when no church is selected)
export type SelectedChurch =
  | components["schemas"]["SearchResult"]["churches"][number]
  | null;

// Atom for the currently selected church
export const selectedChurchAtom = atom<SelectedChurch>(null);

export const dateFilterAtom = atom<string>('')

// Derived atom for checking if a church is selected
export const hasSelectedChurchAtom = atom(
  (get) => get(selectedChurchAtom) !== null,
);

// Derived atom for getting the selected church UUID
export const selectedChurchUuidAtom = atom(
  (get) => get(selectedChurchAtom)?.uuid ?? null,
);

// Helper function to set the selected church
export const setSelectedChurchAtom = atom(
  null,
  (_get, set, church: SelectedChurch) => {
    set(selectedChurchAtom, church);
  },
);

// Helper function to clear the selected church
export const clearSelectedChurchAtom = atom(null, (_get, set) => {
  set(selectedChurchAtom, null);
});
