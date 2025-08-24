# Jotai Store for Confessio App

This directory contains the Jotai atoms for managing global state in the Confessio app.

## Atoms

### `selectedChurchAtom`

The main atom that stores the currently selected church. Can be `null` when no church is selected.

**Type:** `components['schemas']['SearchResult']['churches'][number] | null`

### `hasSelectedChurchAtom`

A derived atom that returns `true` if a church is currently selected, `false` otherwise.

**Type:** `boolean`

### `selectedChurchUuidAtom`

A derived atom that returns the UUID of the selected church, or `null` if no church is selected.

**Type:** `string | null`

### `setSelectedChurchAtom`

An action atom to set the selected church.

**Usage:**

```tsx
const [, setSelectedChurch] = useAtom(setSelectedChurchAtom);
setSelectedChurch(churchData);
```

### `clearSelectedChurchAtom`

An action atom to clear the selected church (set to `null`).

**Usage:**

```tsx
const [, clearSelectedChurch] = useAtom(clearSelectedChurchAtom);
clearSelectedChurch();
```

## Usage Examples

### Reading the selected church

```tsx
import { useAtom } from "jotai";
import { selectedChurchAtom } from "@/store/atoms";

function MyComponent() {
  const [selectedChurch] = useAtom(selectedChurchAtom);

  if (!selectedChurch) {
    return <div>Aucune église sélectionnée</div>;
  }

  return <div>Église sélectionnée: {selectedChurch.name}</div>;
}
```

### Checking if a church is selected

```tsx
import { useAtom } from "jotai";
import { hasSelectedChurchAtom } from "@/store/atoms";

function MyComponent() {
  const [hasSelectedChurch] = useAtom(hasSelectedChurchAtom);

  return (
    <div>
      {hasSelectedChurch
        ? "Une église est sélectionnée"
        : "Aucune église sélectionnée"}
    </div>
  );
}
```

### Setting a selected church

```tsx
import { useAtom } from "jotai";
import { setSelectedChurchAtom } from "@/store/atoms";

function MyComponent() {
  const [, setSelectedChurch] = useAtom(setSelectedChurchAtom);

  const handleChurchSelect = (church) => {
    setSelectedChurch(church);
  };

  return (
    <button onClick={() => handleChurchSelect(churchData)}>Sélectionner</button>
  );
}
```

### Clearing the selected church

```tsx
import { useAtom } from "jotai";
import { clearSelectedChurchAtom } from "@/store/atoms";

function MyComponent() {
  const [, clearSelectedChurch] = useAtom(clearSelectedChurchAtom);

  return <button onClick={clearSelectedChurch}>Fermer</button>;
}
```

## Benefits of Jotai over Context

1. **No Provider Wrapping**: No need to wrap your app with context providers
2. **Better Performance**: Only components that use the atoms re-render
3. **TypeScript Friendly**: Better type inference and less boilerplate
4. **Atomic Updates**: Update specific pieces of state without affecting others
5. **DevTools Support**: Better debugging experience
6. **Bundle Size**: Smaller bundle size compared to Redux

## Migration from Local State

The app has been migrated from using local state in `MapView` to using Jotai atoms. This means:

- The selected church state is now globally accessible
- Any component can read or modify the selected church
- State persists across component unmounts/remounts
- Better separation of concerns
