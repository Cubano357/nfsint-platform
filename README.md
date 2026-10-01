# NFSINT Platform — Frontend

Astro + Tailwind CSS rebuild of the NFSINT public website, owned source replacing the original no-code SuperCool build.

## Development

```
npm install
astro dev --background
astro dev status
astro dev logs
astro dev stop
```

## Structure

- `src/pages/` — the 9 site pages
- `src/components/` — shared presentational components (Hero, NumberedList, ProductGrid, FAQAccordion, InquiryForm, Seal, Header, Footer)
- `src/data/nav.ts` — header/footer navigation data
- `src/assets/images/` — self-hosted site imagery (no runtime dependency on the original SuperCool CDN)
- `docs/superpowers/specs/` — design specs
- `docs/superpowers/plans/` — implementation plans

## Status

Sub-project 1 of 5 for the NFSINT platform: pure visual/content rebuild, no backend. See `docs/superpowers/specs/2026-09-30-frontend-rebuild-design.md` for full scope and non-goals.
