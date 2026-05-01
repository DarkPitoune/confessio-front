// Empty loading state for the children slot at /church/[uuid].
// The slot only emits a JSON-LD <script> for SEO — there is nothing visible
// to the user. Without a loading.tsx here, Next blocks the soft navigation
// on the children slot's `await fetchApi`, which defeats the @modal slot's
// own loading.tsx and the optimistic cache seed.
export default function Loading() {
  return null;
}
