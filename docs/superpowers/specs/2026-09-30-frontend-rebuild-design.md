# NFSINT Frontend Rebuild — Design Spec

**Status:** Approved for implementation
**Date:** 2026-09-30
**Sub-project:** 1 of 5 (NFSINT platform build-out)

## Context

NFSINT (National Firearms Safety Intelligence Group) is an early-stage nonprofit whose current public site (`authority-research-safety.supercoolpreview.com`) is built on SuperCool, a no-code website builder. The client wants to own real, portable source code instead of being locked into a no-code platform.

This sub-project is a **pure visual and content rebuild** — same 9 pages, same look, same copy, no new functionality. The organization's stated mission is explicitly non-investigative: per its own `/mission` and `/about` pages, NFSINT "conducts no investigations and has no enforcement powers" and focuses on aggregate, source-cited public-safety intelligence (bulletins, trend reports, research), not individual dossiers. That scope boundary governs this entire platform build, not just this sub-project.

Later sub-projects (not in this spec) will add: a Safety Intelligence Database, an AI-Powered Research Assistant (same source-verification pattern as the Week 1 Business Research Agent), a bulletin/report CMS, and live contact-form handling.

## Goals

- Every one of the 9 existing pages re-implemented in Astro, visually matching the live site
- Client owns 100% of the code and assets — zero runtime dependency on SuperCool
- Structure that the later backend sub-projects can build on without a rewrite (content stored as data, not hardcoded prose; clear seams for where dynamic data will plug in)

## Non-goals (explicitly out of scope for this sub-project)

- No database, no API, no backend of any kind
- No working contact-form submission (UI only — see "Error handling" below)
- No Safety Intelligence Database, no Research Assistant, no bulletin CMS
- No new pages, sections, or content beyond what's live today

## Page inventory

All 9 pages share one layout (header/nav + footer) and are built from a small set of repeating section patterns:

| Page | Route | Key sections |
|---|---|---|
| Home | `/` | Hero, four core pillars (Intelligence/Education/Research/Technology), problem statement, mission quote, vision ("not advocacy/regulation/enforcement"), six core objectives, planned products grid, audience list, collaboration CTA |
| Mission | `/mission` | Hero, mission statement, four pillars (Information→Intelligence→Safety→Community), vision + "not X" list, long-term vision |
| About | `/about` | Hero, "what NFSINT is / is not", 4-step organizational concept, current-status statement, leadership placeholders, FAQ accordion (7 questions) |
| Intelligence | `/intelligence` | Hero, collection sources list, analysis products list + analytic standards, 5-step intelligence cycle, planned products grid (10 items) |
| Research | `/research` | Hero, research approach (4 principles), 8 research areas |
| Technology | `/technology` | Hero, "infrastructure not gadgets" overview, 7 planned platform capabilities, SaaS positioning (4 points) |
| Programs | `/programs` | Hero, public safety education + audience list, specialized training + audience list |
| Partners | `/partners` | Hero, overview, 7 converging sectors, potential revenue streams |
| Contact | `/contact` | Hero, emergency disclaimer, 4 inquiry categories, crisis resource (988), contact form (UI only) |

Every page also carries the same legal/status disclaimers in the footer and inline ("organizational development stage," "not a government/law enforcement agency," 911/988 crisis notices) — these must be reproduced exactly, not paraphrased, since they're load-bearing for how the org represents itself.

## Architecture

**Framework:** Astro (already scaffolded), TypeScript strict mode, Tailwind CSS v4 (already added via `astro add tailwind`).

**Layout:** One `src/layouts/Layout.astro` holding the header/nav and footer, used by all 9 pages. Nav links and footer link columns (Organization / Intelligence / Programs) are defined once as data, not repeated per page.

**Reusable section components** (`src/components/`), since every page is assembled from the same patterns observed across the live site:
- `Hero.astro` — eyebrow text, heading, intro paragraph, optional background image, optional CTA buttons
- `NumberedList.astro` — the "01, 02, 03..." style list used for pillars, objectives, research areas, capabilities
- `TwoColumnSection.astro` — the repeated "label + heading + paragraph" / "supporting list" layout
- `ProductGrid.astro` — the "In Development" product/bulletin cards (home + intelligence pages)
- `FAQAccordion.astro` — the About page's expandable Q&A (needs client-side JS for expand/collapse; implemented as a small inline script, no framework dependency)
- `ContactForm.astro` — form fields and client-side validation only; see Error handling

**Content model:** Page copy lives in Astro Content Collections (`src/content/pages/*.md` with frontmatter), not hardcoded into `.astro` templates. Each page's `.astro` file is a thin template that reads its own content entry and renders it through the shared components. This is the seam the later CMS sub-project will plug into — replacing a static content collection with a database-backed one shouldn't require touching the templates.

**Assets:** Every image (hero backgrounds, the NFSINT seal) downloaded from the live site and committed into `src/assets/` (processed by Astro's image pipeline) rather than hot-linked. No runtime calls to SuperCool's infrastructure anywhere in the codebase.

## Error handling

The contact form is UI-only in this sub-project — it has no backend to submit to yet. Rather than silently doing nothing on submit (which would look broken), the form's submit handler will show an explicit "Form submission isn't wired up yet — this is a placeholder for the backend sub-project" message. This keeps the gap honest and visible instead of looking like a bug, matching the project's established practice of documenting known limitations rather than hiding them.

## Testing / verification

No automated test framework for this sub-project — it's a static visual rebuild with no logic to unit-test. Verification is manual: each of the 9 pages compared side-by-side against the live SuperCool site (desktop and mobile widths) before the sub-project is considered done. Any content or layout discrepancy found during that comparison gets fixed before sign-off, not deferred.

## Deployment

Cloudflare Pages (free tier, fast, simple static hosting) is the default target, matching Astro's static output mode. Not a hard requirement — easy to change later since there's no backend coupling yet.

## Open items carried to later sub-projects

- Live contact form submission (needs a backend)
- Safety Intelligence Database, Research Assistant, bulletin CMS — each their own sub-project with its own spec
- GitHub repo creation (private, separate from `ai-architect-mastery`) — deferred until this sub-project is complete and the client wants to review it
