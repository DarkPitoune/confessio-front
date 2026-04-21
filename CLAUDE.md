# Confessio

## Design system

Before making any visual/UI change, read `docs/design.md`. It defines the
color tokens, typography, component patterns, and the rules that keep the
interface coherent (one hero color, tabular numbers, one shadow per element,
opacity variants instead of new grays, etc.).

When in doubt, default to the existing tokens in `src/app/globals.css`
(`--color-deepblue`, `--color-paper`, `--color-hairline`, `--color-ink`,
`--color-lightblue`) rather than introducing new values.

If a UI change contradicts a rule in `docs/design.md`, flag it and either
update the doc (if the rule should evolve) or revise the change.
