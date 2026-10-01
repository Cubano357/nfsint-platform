# NFSINT Frontend Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-implement all 9 pages of the live NFSINT site (currently built on the no-code SuperCool platform) as real, owned Astro + TypeScript + Tailwind code, visually and textually identical to the live site, with zero runtime dependency on SuperCool.

**Architecture:** One shared `Layout.astro` (Header + Footer) wraps 9 page templates. Page copy lives in Astro Content Collections (`src/content/pages/*.md`) so later sub-projects can swap the content source without touching templates. A small set of components (`Hero`, `NumberedList`, `ProductGrid`, `FAQAccordion`, `InquiryForm`) cover every pattern that repeats 2+ times across the site; sections that only appear once are written directly into their page rather than forced into an over-general shared component.

**Tech Stack:** Astro (already scaffolded), TypeScript strict, Tailwind CSS v4 (already added via `astro add tailwind`), `@fontsource/source-serif-4` and `@fontsource/inter` for self-hosted fonts.

**Spec:** `docs/superpowers/specs/2026-09-30-frontend-rebuild-design.md`

## Global Constraints

- Astro + TypeScript strict mode, Tailwind CSS v4 — already scaffolded, do not add a different framework.
- No backend, no database, no API route, no `fetch()` call to any external service anywhere in this sub-project.
- No automated test framework is introduced. Verification is the dev server (`astro dev --background`) plus a Playwright visual comparison against `https://authority-research-safety.supercoolpreview.com` for every page — per the approved spec's Testing section.
- All page copy is reproduced **exactly** as captured from the live site in this plan — no paraphrasing, no summarizing, including the legal/safety disclaimer text (911, 988, "organizational development stage").
- Every image and the NFSINT seal is self-hosted in this repo. Zero runtime requests to `supercoolpreview.com` or its `d38kszyerljeoa.cloudfront.net` CDN anywhere in the shipped site.
- Fonts (Source Serif 4 for headings, Inter for body) are self-hosted via `@fontsource`, not loaded from Google Fonts' CDN at runtime — consistent with the "owns the code" goal driving this whole rebuild.
- Brand colors, pulled from the live site's computed styles: `navy` = `#0B1D33`, `navy2` = `#10243D`, `gold` = `#B8863B`.
- The contact form (Contact page) and the request-materials form (Partners page) have no backend yet. On submit, each shows an explicit "This form isn't connected to a backend yet — it's a placeholder for a later sub-project" message instead of silently doing nothing.

## Review Focus

- **Duplicate nav hrefs look like bugs but aren't.** The footer's "Intelligence Cycle" and "Intelligence Products" links both point to `/intelligence`; "Public Safety Education," "Professional Development," and "Certifications" all point to `/programs`. A reasonable engineer might "fix" this by de-duplicating — don't. It's copied exactly from the live site's actual footer markup.
- **Several images are reused across pages, not unique per page.** `22f2889e719644ca.webp` is Mission's hero photo *and* a low-opacity background texture on Home, About, and Programs. Downloading it twice, or missing one of its placements, both break fidelity with the live site.
- **The two inquiry forms are not the same form.** Contact's form has a Phone field (optional) and 6 inquiry-type options including "General Inquiry." Partners' form has no Phone field and 5 interest-type options, no "General Inquiry." A shared `InquiryForm` component that silently collapses these to one shape is wrong.
- **The FAQ accordion must allow only one answer open at a time**, matching the live site's Radix-based behavior (confirmed by inspecting `aria-expanded` state during capture). An implementation that allows all 7 open simultaneously, or that requires a page reload to switch answers, doesn't match.
- **The legal/safety disclaimer text is compliance-sensitive, not marketing copy** — "NFSINT is an independent organization in the organizational development stage. It is not a government agency, regulatory body, or law enforcement organization..." and the 911/988 notices must be reproduced byte-exact everywhere they appear (every page footer, plus Contact and Research's crisis-resource callouts). Don't let a page task shorten or reword these because they look like filler.

---

## File Structure

```
nfsint-platform/
  src/
    content.config.ts              # Content collection schema (Task 2)
    content/pages/
      home.md, mission.md, about.md, intelligence.md,
      research.md, technology.md, programs.md, partners.md, contact.md
    data/
      nav.ts                       # Header nav + footer columns (Task 2)
    components/
      Seal.astro                   # Inline SVG seal, sized by prop (Task 2)
      Header.astro                 # Site header (Task 2)
      Footer.astro                 # Site footer (Task 2)
      Hero.astro                   # Secondary-page hero (Task 3)
      NumberedList.astro           # "01/02/03..." pattern (Task 3)
      ProductGrid.astro            # "In Development" card grid (Task 3)
      FAQAccordion.astro           # Expand/collapse Q&A (Task 5)
      InquiryForm.astro            # Configurable contact/partner form (Task 6)
    layouts/
      Layout.astro                 # Wraps Header + <slot /> + Footer (Task 2)
    pages/
      index.astro (Task 4), about.astro (Task 5), contact.astro (Task 6),
      partners.astro (Task 7), mission.astro (Task 8), intelligence.astro (Task 9),
      research.astro (Task 10), technology.astro (Task 11), programs.astro (Task 12)
    styles/
      global.css                   # Modified: font-face + theme tokens (Task 1)
  src/assets/images/
    texture-navy-a.webp            # 475375341ddb468a — home hero + intelligence/partners texture
    mission-hero.webp              # 22f2889e719644ca — mission hero + home/about/programs texture
    contact-hero.webp              # d457d50248074a04 — contact hero + home texture
    about-hero.webp                # 8a08457b19d84312
    intelligence-hero.webp         # fb6012d0de654c3f
    research-hero.webp             # ae31253a9b9a4a83
    technology-hero.webp           # 687b4c8000e64eb1
    programs-hero.webp             # 5cf180d6e65e4fec
    partners-hero.webp             # 79cafdd0ddfb47f2
```

---

### Task 1: Fonts, color tokens, and image assets

**Files:**
- Modify: `src/styles/global.css`
- Create: `src/assets/images/texture-navy-a.webp`, `mission-hero.webp`, `contact-hero.webp`, `about-hero.webp`, `intelligence-hero.webp`, `research-hero.webp`, `technology-hero.webp`, `programs-hero.webp`, `partners-hero.webp`

**Interfaces:**
- Produces: Tailwind theme tokens `--color-navy` (#0B1D33), `--color-navy2` (#10243D), `--color-gold` (#B8863B), usable as `bg-navy`, `text-gold`, etc. Image files importable from `src/assets/images/*.webp` as Astro image assets.

- [ ] **Step 1: Install self-hosted font packages**

Run: `npm install @fontsource/source-serif-4 @fontsource/inter`

- [ ] **Step 2: Download the 9 image assets from the live site's CDN**

```bash
cd src/assets/images
curl -o texture-navy-a.webp "https://d38kszyerljeoa.cloudfront.net/posts/scb_9315c88e6a94c554484f234b/475375341ddb468a.webp"
curl -o mission-hero.webp "https://d38kszyerljeoa.cloudfront.net/posts/scb_9315c88e6a94c554484f234b/22f2889e719644ca.webp"
curl -o contact-hero.webp "https://d38kszyerljeoa.cloudfront.net/posts/scb_9315c88e6a94c554484f234b/d457d50248074a04.webp"
curl -o about-hero.webp "https://d38kszyerljeoa.cloudfront.net/posts/scb_9315c88e6a94c554484f234b/8a08457b19d84312.webp"
curl -o intelligence-hero.webp "https://d38kszyerljeoa.cloudfront.net/posts/scb_9315c88e6a94c554484f234b/fb6012d0de654c3f.webp"
curl -o research-hero.webp "https://d38kszyerljeoa.cloudfront.net/posts/scb_9315c88e6a94c554484f234b/ae31253a9b9a4a83.webp"
curl -o technology-hero.webp "https://d38kszyerljeoa.cloudfront.net/posts/scb_9315c88e6a94c554484f234b/687b4c8000e64eb1.webp"
curl -o programs-hero.webp "https://d38kszyerljeoa.cloudfront.net/posts/scb_9315c88e6a94c554484f234b/5cf180d6e65e4fec.webp"
curl -o partners-hero.webp "https://d38kszyerljeoa.cloudfront.net/posts/scb_9315c88e6a94c554484f234b/79cafdd0ddfb47f2.webp"
```

- [ ] **Step 3: Verify all 9 files downloaded and are valid webp images**

Run: `file src/assets/images/*.webp`
Expected: all 9 lines report `RIFF (little-endian) data, Web/P image`

- [ ] **Step 4: Add theme tokens and font imports to global.css**

Replace the full contents of `src/styles/global.css` with:

```css
@import "tailwindcss";
@import "@fontsource/source-serif-4/400.css";
@import "@fontsource/source-serif-4/700.css";
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/500.css";
@import "@fontsource/inter/600.css";

@theme {
  --color-navy: #0B1D33;
  --color-navy2: #10243D;
  --color-gold: #B8863B;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-serif: "Source Serif 4", Georgia, serif;
}

body {
  font-family: var(--font-sans);
}

h1, h2, h3 {
  font-family: var(--font-serif);
}
```

- [ ] **Step 5: Verify the dev server starts with no errors**

Run: `astro dev --background`
Then: `astro dev status`
Expected: server running, no build errors in `astro dev logs`

- [ ] **Step 6: Commit**

```bash
git add src/styles/global.css src/assets/images package.json package-lock.json
git commit -m "Add brand fonts, color tokens, and self-hosted site images"
```

---

### Task 2: Shared nav data, Seal, Header, Footer, and Layout

**Files:**
- Create: `src/data/nav.ts`
- Create: `src/components/Seal.astro`
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`
- Create: `src/layouts/Layout.astro`
- Modify: `src/pages/index.astro` (temporary placeholder content, replaced fully in Task 4)

**Interfaces:**
- Consumes: `--color-navy`, `--color-gold` theme tokens from Task 1.
- Produces: `Layout.astro` with props `{ title: string; description: string }` and a default slot — every later page task wraps its content in `<Layout title="..." description="...">...</Layout>`.

- [ ] **Step 1: Create the nav data file**

Create `src/data/nav.ts`:

```ts
export interface NavLink {
  label: string;
  href: string;
}

export const headerNav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Mission", href: "/mission" },
  { label: "Intelligence", href: "/intelligence" },
  { label: "Programs", href: "/programs" },
  { label: "Research", href: "/research" },
  { label: "Technology", href: "/technology" },
  { label: "Partners", href: "/partners" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export interface FooterColumn {
  heading: string;
  links: NavLink[];
}

// Duplicate hrefs within a column (e.g. two links both pointing to
// /intelligence) are copied exactly from the live site's footer. Do not
// de-duplicate - see Review Focus in the plan header.
export const footerColumns: FooterColumn[] = [
  {
    heading: "Organization",
    links: [
      { label: "Mission & Vision", href: "/mission" },
      { label: "About NFSINT", href: "/about" },
      { label: "Partners & Investment", href: "/partners" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Intelligence",
    links: [
      { label: "Intelligence Cycle", href: "/intelligence" },
      { label: "Intelligence Products", href: "/intelligence" },
      { label: "Research Program", href: "/research" },
      { label: "Technology Platform", href: "/technology" },
    ],
  },
  {
    heading: "Programs",
    links: [
      { label: "Public Safety Education", href: "/programs" },
      { label: "Professional Development", href: "/programs" },
      { label: "Certifications", href: "/programs" },
      { label: "Research Collaboration", href: "/research" },
    ],
  },
];

export const footerQuickLinks: NavLink[] = [
  { label: "Contact NFSINT", href: "/contact" },
  { label: "Intelligence products and bulletins", href: "/intelligence" },
  { label: "Partner with NFSINT", href: "/partners" },
  { label: "Education programs", href: "/programs" },
];
```

- [ ] **Step 2: Create the Seal component**

Create `src/components/Seal.astro`:

```astro
---
interface Props {
  size?: number;
}
const { size = 48 } = Astro.props;
---
<svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="NFSINT seal: National Firearms Safety Intelligence Group" class="shrink-0">
  <circle cx="100" cy="100" r="96" fill="none" stroke="#B8863B" stroke-width="1.6"></circle>
  <circle cx="100" cy="100" r="88" fill="none" stroke="#0B1D33" stroke-width="2.8" opacity="0.9"></circle>
  <circle cx="100" cy="100" r="74" fill="none" stroke="#B8863B" stroke-width="1.4" opacity="0.85"></circle>
  <path d="M100 32 L152 50 V106 C152 134 129 154 100 166 C71 154 48 134 48 106 V50 Z" fill="none" stroke="#0B1D33" stroke-width="6" opacity="0.92"></path>
  <line x1="60" y1="76" x2="140" y2="76" stroke="#B8863B" stroke-width="5"></line>
  <line x1="60" y1="126" x2="140" y2="126" stroke="#B8863B" stroke-width="5"></line>
  <text x="100" y="115" text-anchor="middle" font-size="36" font-weight="700" letter-spacing="-1.2" fill="#0B1D33" font-family="'Source Serif 4', Georgia, serif">NFSINT</text>
</svg>
```

- [ ] **Step 3: Create the Header component**

Create `src/components/Header.astro`:

```astro
---
import Seal from "./Seal.astro";
import { headerNav } from "../data/nav";
---
<header class="relative z-20 border-b border-slate-200 bg-white">
  <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
    <a href="/" class="flex items-center gap-3" aria-label="NFSINT home">
      <Seal size={48} />
      <span class="leading-tight">
        <span class="block font-serif text-lg font-bold text-navy">NFSINT</span>
        <span class="block text-xs text-slate-500">National Firearms Safety Intelligence Group</span>
      </span>
    </a>
    <button
      id="menu-toggle"
      type="button"
      class="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-navy"
      aria-expanded="false"
      aria-controls="main-menu"
    >
      Menu
    </button>
  </div>
  <nav id="main-menu" class="hidden border-t border-slate-200 bg-white" aria-label="Primary">
    <ul class="mx-auto max-w-6xl flex-col gap-1 px-6 py-4">
      {headerNav.map((link) => (
        <li><a href={link.href} class="block py-2 text-sm font-semibold uppercase tracking-wide text-navy hover:text-gold">{link.label}</a></li>
      ))}
    </ul>
  </nav>
</header>
<script>
  const toggle = document.getElementById("menu-toggle");
  const menu = document.getElementById("main-menu");
  toggle?.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    menu?.classList.toggle("hidden");
  });
</script>
```

- [ ] **Step 4: Create the Footer component**

Create `src/components/Footer.astro`:

```astro
---
import Seal from "./Seal.astro";
import { footerColumns, footerQuickLinks } from "../data/nav";
---
<footer class="bg-navy text-slate-300">
  <div class="mx-auto max-w-6xl px-6 py-16">
    <div class="grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
      <div>
        <div class="flex items-center gap-3">
          <Seal size={104} />
          <div>
            <p class="font-serif text-lg font-bold text-white">NFSINT</p>
            <p class="text-sm text-slate-400">National Firearms Safety Intelligence Group</p>
          </div>
        </div>
        <p class="mt-4 text-sm text-gold">Information. Intelligence. Safety. Community.</p>
        <ul class="mt-6 space-y-2 text-sm">
          {footerQuickLinks.map((link) => (
            <li><a href={link.href} class="hover:text-gold">{link.label}</a></li>
          ))}
        </ul>
      </div>
      {footerColumns.map((column) => (
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-slate-400">{column.heading}</p>
          <ul class="mt-4 space-y-2 text-sm">
            {column.links.map((link) => (
              <li><a href={link.href} class="hover:text-gold">{link.label}</a></li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div class="mt-12 border-t border-white/10 pt-8 text-xs leading-relaxed text-slate-400">
      <p>NFSINT is an independent organization in the organizational development stage. It is not a government agency, regulatory body, or law enforcement organization. Content on this site is provided for educational and informational purposes only.</p>
      <p class="mt-2">NFSINT does not accept emergency reports and is not a law enforcement agency. If you are facing an emergency or an immediate threat to safety, call 911.</p>
      <p class="mt-4">&copy; 2026 National Firearms Safety Intelligence Group. All rights reserved.</p>
      <p>Information &middot; Intelligence &middot; Safety &middot; Community</p>
    </div>
  </div>
</footer>
```

- [ ] **Step 5: Create the Layout**

Create `src/layouts/Layout.astro`:

```astro
---
import "../styles/global.css";
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";

interface Props {
  title: string;
  description: string;
}
const { title, description } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} | NFSINT</title>
    <meta name="description" content={description} />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  </head>
  <body class="flex min-h-screen flex-col bg-white font-sans antialiased">
    <Header />
    <main class="flex-1">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 6: Replace index.astro with a temporary placeholder to verify the layout renders**

Replace `src/pages/index.astro` entirely with:

```astro
---
import Layout from "../layouts/Layout.astro";
---
<Layout title="Home" description="NFSINT placeholder - replaced in Task 4">
  <p class="p-12">Placeholder - Task 4 replaces this with the real Home page.</p>
</Layout>
```

- [ ] **Step 7: Verify in the browser**

Run: `astro dev --background`, then navigate to `http://localhost:4321/` with the Playwright browser tool.
Expected: Header shows the seal + "NFSINT" + "Menu" button; clicking Menu reveals the 9-item nav list in the exact order (Home, Mission, Intelligence, Programs, Research, Technology, Partners, About, Contact); footer shows the 3 columns and legal text.

- [ ] **Step 8: Commit**

```bash
git add src/data src/components/Seal.astro src/components/Header.astro src/components/Footer.astro src/layouts src/pages/index.astro
git commit -m "Add shared nav data, Seal/Header/Footer components, and site Layout"
```

---

### Task 3: Hero, NumberedList, and ProductGrid components

**Files:**
- Create: `src/components/Hero.astro`
- Create: `src/components/NumberedList.astro`
- Create: `src/components/ProductGrid.astro`

**Interfaces:**
- Consumes: `Layout.astro` from Task 2 (components are used inside page `<main>` content, not standalone).
- Produces:
  - `Hero.astro` props: `{ eyebrow: string; heading: string; description: string; image: ImageMetadata; imageAlt: string }`
  - `NumberedList.astro` props: `{ items: { number: string; heading: string; description?: string; href?: string; linkLabel?: string }[]; columns?: 2 | 3 | 4 }` (default `columns = 2`)
  - `ProductGrid.astro` props: `{ items: { title: string; description: string }[]; badge?: string }` (default `badge = "In Development"`)

- [ ] **Step 1: Create Hero.astro**

```astro
---
import { Image } from "astro:assets";

interface Props {
  eyebrow: string;
  heading: string;
  description: string;
  image: ImageMetadata;
  imageAlt: string;
}
const { eyebrow, heading, description, image, imageAlt } = Astro.props;
---
<section class="relative isolate overflow-hidden bg-navy py-24 sm:py-32">
  <Image src={image} alt={imageAlt} class="absolute inset-0 h-full w-full object-cover opacity-25" />
  <div class="absolute inset-0 bg-navy/70"></div>
  <div class="relative mx-auto max-w-3xl px-6 text-center text-white">
    <p class="text-sm font-semibold uppercase tracking-widest text-gold">{eyebrow}</p>
    <h1 class="mt-3 font-serif text-4xl font-bold sm:text-5xl">{heading}</h1>
    <p class="mt-6 text-lg text-slate-200">{description}</p>
  </div>
</section>
```

- [ ] **Step 2: Create NumberedList.astro**

```astro
---
interface Item {
  number: string;
  heading: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}
interface Props {
  items: Item[];
  columns?: 2 | 3 | 4;
}
const { items, columns = 2 } = Astro.props;
const gridClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[columns];
---
<div class={`grid gap-8 ${gridClass}`}>
  {items.map((item) => (
    <article>
      <p class="font-serif text-2xl font-bold text-gold">{item.number}</p>
      <h3 class="mt-2 font-serif text-lg font-bold text-navy">{item.heading}</h3>
      {item.description && <p class="mt-2 text-sm text-slate-600">{item.description}</p>}
      {item.href && (
        <a href={item.href} class="mt-3 inline-block text-sm font-semibold text-gold hover:underline">
          {item.linkLabel ?? "Learn more"}
        </a>
      )}
    </article>
  ))}
</div>
```

- [ ] **Step 3: Create ProductGrid.astro**

```astro
---
interface Item {
  title: string;
  description: string;
}
interface Props {
  items: Item[];
  badge?: string;
}
const { items, badge = "In Development" } = Astro.props;
---
<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {items.map((item) => (
    <article class="rounded-lg border border-slate-200 p-6">
      <span class="inline-block rounded-full bg-navy2/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-navy">{badge}</span>
      <h3 class="mt-3 font-serif text-lg font-bold text-navy">{item.title}</h3>
      <p class="mt-2 text-sm text-slate-600">{item.description}</p>
    </article>
  ))}
</div>
```

- [ ] **Step 4: Verify components compile with no TypeScript errors**

Run: `npx astro check`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero.astro src/components/NumberedList.astro src/components/ProductGrid.astro
git commit -m "Add Hero, NumberedList, and ProductGrid shared components"
```

---

### Task 4: Home page

**Files:**
- Modify: `src/pages/index.astro` (replacing the Task 2 placeholder)

**Interfaces:**
- Consumes: `Layout` (Task 2), `NumberedList`, `ProductGrid` (Task 3), and all three of `texture-navy-a.webp`, `mission-hero.webp`, `contact-hero.webp` (Task 1) — reused here as the hero texture and two more section-background textures, per Review Focus.
- Produces: the `/` route. No exports consumed by later tasks.

Home's hero is unique (text + CTAs, no distinct photo) and is written directly in this file rather than using the shared `Hero` component, which is built for the 8 secondary pages' photo+eyebrow+heading pattern.

- [ ] **Step 1: Replace `src/pages/index.astro` with the full Home page**

```astro
---
import Layout from "../layouts/Layout.astro";
import NumberedList from "../components/NumberedList.astro";
import ProductGrid from "../components/ProductGrid.astro";
import { Image } from "astro:assets";
import texture from "../assets/images/texture-navy-a.webp";
// The live Home page reuses two more images from the shared pool as faint
// (opacity ~20%) background textures on its two other dark sections -
// confirmed by inspecting each <img>'s DOM path on the live site, not a
// guess. See Review Focus: reused images.
import visionTexture from "../assets/images/mission-hero.webp";
import collaborationTexture from "../assets/images/contact-hero.webp";

const pillars = [
  { title: "Intelligence", description: "Centralized collection and analysis of firearm safety information from credible public sources." },
  { title: "Education", description: "Practical safety education for owners, families, institutions, and community organizations." },
  { title: "Research", description: "Independent, evidence-based study of prevention, human factors, and training effectiveness." },
  { title: "Technology", description: "A platform layer for reporting, analysis, knowledge management, and information sharing." },
];

const consequences = [
  { number: "01", heading: "Safety information is inconsistent." },
  { number: "02", heading: "Lessons learned from incidents are rarely centralized." },
  { number: "03", heading: "Emerging threats are identified too slowly." },
  { number: "04", heading: "Training standards vary widely." },
  { number: "05", heading: "Communities often receive reactive rather than preventive guidance." },
];

const notList = [
  "Independent of advocacy campaigns and political positioning.",
  "Separate from regulatory authority and rulemaking.",
  "Distinct from law enforcement operations and investigations.",
  "Focused on turning credible information into practical knowledge.",
];

const objectives = [
  { number: "01", heading: "Intelligence Collection", description: "Gather firearm safety information from public safety reports, court decisions, investigations, research, and practitioners.", href: "/intelligence" },
  { number: "02", heading: "Intelligence Analysis", description: "Transform raw information into bulletins, trend reports, risk analyses, and best-practice recommendations.", href: "/intelligence" },
  { number: "03", heading: "Public Safety Education", description: "Develop educational programs for owners, families, schools, faith organizations, businesses, and community leaders.", href: "/programs" },
  { number: "04", heading: "Professional Development", description: "Provide specialized training for instructors, range safety officers, security personnel, and safety teams.", href: "/programs" },
  { number: "05", heading: "Research", description: "Conduct independent, evidence-based research on storage, prevention, human factors, and communication.", href: "/research" },
  { number: "06", heading: "Technology", description: "Build the software and analytics layer that makes safety intelligence usable at scale.", href: "/technology" },
];

const products = [
  { title: "National Firearm Safety Bulletins", description: "Periodic bulletins summarizing current safety issues, recalls, and prevention guidance." },
  { title: "Threat Awareness Reports", description: "Assessments of emerging risks relevant to institutions, ranges, and community organizations." },
  { title: "Annual Firearm Safety Index", description: "A yearly synthesis of publicly available indicators of firearm safety and prevention." },
  { title: "Safety Intelligence Database", description: "A searchable, citation-backed repository of safety findings and lessons learned." },
  { title: "AI-Powered Research Assistant", description: "A guided research tool to help practitioners locate relevant safety literature quickly." },
  { title: "Instructor Resource Center", description: "Curriculum support, updates, and reference material for firearms instructors." },
];

const audiences = [
  "Responsible firearm owners", "Firearms instructors", "Shooting ranges", "Schools and universities",
  "Community organizations", "Houses of worship", "Security companies", "Corporate safety departments",
  "Healthcare organizations", "Researchers", "Policymakers", "Nonprofit organizations",
];
---
<Layout title="Home" description="NFSINT - National Firearms Safety Intelligence Group. Information. Intelligence. Safety. Community.">
  <section class="relative isolate overflow-hidden bg-navy py-24 sm:py-32">
    <Image src={texture} alt="" class="absolute inset-0 h-full w-full object-cover opacity-[0.28]" />
    <div class="relative mx-auto max-w-3xl px-6 text-center text-white">
      <p class="text-sm font-semibold uppercase tracking-widest text-gold">National Firearms Safety Intelligence Group</p>
      <h1 class="mt-3 font-serif text-5xl font-bold">NFSINT</h1>
      <p class="mt-4 text-lg text-gold">Information. Intelligence. Safety. Community.</p>
      <p class="mt-6 text-lg text-slate-200">A national intelligence, research, training, and public safety organization dedicated to reducing firearm-related injuries, violence, and preventable tragedies through actionable safety intelligence.</p>
      <div class="mt-8 flex justify-center gap-4">
        <a href="/mission" class="rounded bg-gold px-6 py-3 text-sm font-semibold text-navy">Explore Our Mission</a>
        <a href="/partners" class="rounded border border-white px-6 py-3 text-sm font-semibold text-white">Partner With Us</a>
      </div>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-6 py-20">
    <div class="grid gap-8 sm:grid-cols-4">
      {pillars.map((p) => (
        <div>
          <h3 class="font-serif text-lg font-bold text-navy">{p.title}</h3>
          <p class="mt-2 text-sm text-slate-600">{p.description}</p>
        </div>
      ))}
    </div>
  </section>

  <section class="bg-slate-50 py-20">
    <div class="mx-auto grid max-w-6xl gap-12 px-6 sm:grid-cols-2">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-gold">The Problem</p>
        <h2 class="mt-2 font-serif text-3xl font-bold text-navy">Fragmented Information Costs Lives</h2>
        <p class="mt-4 text-slate-600">Across the United States, information related to firearm safety is fragmented among numerous organizations, agencies, researchers, instructors, insurers, manufacturers, healthcare providers, and community groups.</p>
        <p class="mt-4 text-slate-600">NFSINT seeks to bridge these gaps by creating a centralized intelligence framework focused on firearm safety and prevention.</p>
      </div>
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-gold">Consequences</p>
        <p class="mt-2 font-serif text-xl font-bold text-navy">What fragmentation produces in practice</p>
        <div class="mt-6"><NumberedList items={consequences} columns={2} /></div>
      </div>
    </div>
  </section>

  <section class="mx-auto max-w-3xl px-6 py-20 text-center">
    <p class="text-sm font-semibold uppercase tracking-wide text-gold">Mission</p>
    <blockquote class="mt-4 font-serif text-2xl text-navy">To collect, analyze, develop, and share firearm safety intelligence that strengthens communities, supports professionals, informs decision-makers, and promotes responsible firearm ownership through education, research, technology, and collaboration.</blockquote>
  </section>

  <section class="relative isolate overflow-hidden bg-navy2 py-20 text-white">
    <Image src={visionTexture} alt="" class="absolute inset-0 h-full w-full object-cover opacity-20" />
    <div class="relative mx-auto grid max-w-6xl gap-12 px-6 sm:grid-cols-2">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-gold">Vision</p>
        <h2 class="mt-2 font-serif text-3xl font-bold">Not Advocacy. Not Regulation. Not Enforcement.</h2>
        <p class="mt-4 text-slate-300">Unlike organizations whose primary mission is advocacy, regulation, or law enforcement, NFSINT focuses on transforming information into practical knowledge that empowers individuals, professionals, communities, and institutions to make informed decisions that enhance public safety.</p>
      </div>
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-gold">A Neutral Center for Knowledge</p>
        <ul class="mt-4 space-y-3 text-slate-300">
          {notList.map((item) => <li>{item}</li>)}
        </ul>
        <a href="/about" class="mt-4 inline-block text-sm font-semibold text-gold hover:underline">What we are, and are not</a>
      </div>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-6 py-20">
    <p class="text-sm font-semibold uppercase tracking-wide text-gold">Core Objectives</p>
    <h2 class="mt-2 font-serif text-3xl font-bold text-navy">Six Functions of a National Safety Intelligence Framework</h2>
    <p class="mt-4 max-w-2xl text-slate-600">Each objective is a distinct discipline, and each depends on the others. Together they form a repeatable path from raw information to practical prevention.</p>
    <div class="mt-10"><NumberedList items={objectives} columns={3} /></div>
  </section>

  <section class="bg-slate-50 py-20">
    <div class="mx-auto max-w-6xl px-6">
      <div class="flex items-end justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-gold">Intelligence Products</p>
          <h2 class="mt-2 font-serif text-3xl font-bold text-navy">Planned Products and Publications</h2>
          <p class="mt-4 max-w-2xl text-slate-600">The following products are envisioned as the core output of the NFSINT intelligence cycle. All are in development and none are yet operational.</p>
        </div>
        <a href="/intelligence" class="hidden shrink-0 text-sm font-semibold text-gold hover:underline sm:block">View All Products</a>
      </div>
      <div class="mt-10"><ProductGrid items={products} /></div>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-6 py-20">
    <p class="text-sm font-semibold uppercase tracking-wide text-gold">Who We Serve</p>
    <h2 class="mt-2 font-serif text-3xl font-bold text-navy">A National Audience for Practical Safety Intelligence</h2>
    <p class="mt-4 max-w-2xl text-slate-600">NFSINT products are designed for the people and institutions who make daily decisions about firearm safety.</p>
    <ul class="mt-8 grid gap-3 sm:grid-cols-3">
      {audiences.map((a) => <li class="text-sm text-slate-600">{a}</li>)}
    </ul>
  </section>

  <section class="relative isolate overflow-hidden bg-navy py-20 text-center text-white">
    <Image src={collaborationTexture} alt="" class="absolute inset-0 h-full w-full object-cover opacity-20" />
    <div class="relative mx-auto max-w-2xl px-6">
      <p class="text-sm font-semibold uppercase tracking-wide text-gold">Collaboration</p>
      <h2 class="mt-2 font-serif text-3xl font-bold">Join the National Safety Intelligence Network</h2>
      <p class="mt-4 text-slate-300">NFSINT is being built in collaboration with instructors, institutions, researchers, and community organizations. If your work touches firearm safety, there is a place for your experience in this framework.</p>
      <div class="mt-8 flex justify-center gap-4">
        <a href="/contact" class="rounded bg-gold px-6 py-3 text-sm font-semibold text-navy">Contact NFSINT</a>
        <a href="/partners" class="rounded border border-white px-6 py-3 text-sm font-semibold text-white">Partnership and Investment</a>
      </div>
    </div>
  </section>
</Layout>
```

- [ ] **Step 2: Verify visually against the live site**

Navigate to `http://localhost:4321/` with Playwright and compare section-by-section against `https://authority-research-safety.supercoolpreview.com/`: hero text and CTAs, four pillars, problem/consequences, mission quote, vision/not-list, six objectives, six products, audience list, collaboration CTA.
Expected: every heading, paragraph, and list item matches; layout and colors are visually equivalent (exact pixel match is not required, structural and content fidelity is).

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "Build Home page"
```

---

### Task 5: FAQAccordion component + About page

**Files:**
- Create: `src/components/FAQAccordion.astro`
- Create: `src/pages/about.astro`

**Interfaces:**
- Consumes: `Layout`, `Hero` (Task 3).
- Produces: `FAQAccordion.astro` props `{ items: { question: string; answer: string }[] }`. The `/about` route.

- [ ] **Step 1: Create FAQAccordion.astro**

```astro
---
interface Item {
  question: string;
  answer: string;
}
interface Props {
  items: Item[];
}
const { items } = Astro.props;
---
<div class="divide-y divide-slate-200 border-y border-slate-200">
  {items.map((item, i) => (
    <div>
      <h3>
        <button
          type="button"
          class="faq-toggle flex w-full items-center justify-between py-5 text-left font-serif text-lg font-bold text-navy"
          aria-expanded="false"
          aria-controls={`faq-panel-${i}`}
        >
          <span>{item.question}</span>
          <span class="faq-icon ml-4 shrink-0 text-gold">+</span>
        </button>
      </h3>
      <div id={`faq-panel-${i}`} class="faq-panel hidden pb-5 text-sm text-slate-600">
        {item.answer}
      </div>
    </div>
  ))}
</div>
<script>
  // Single-open-at-a-time accordion, matching the live site's behavior.
  const toggles = document.querySelectorAll<HTMLButtonElement>(".faq-toggle");
  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const panelId = toggle.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;
      const isOpen = toggle.getAttribute("aria-expanded") === "true";

      toggles.forEach((other) => {
        other.setAttribute("aria-expanded", "false");
        other.querySelector(".faq-icon")!.textContent = "+";
        const otherPanelId = other.getAttribute("aria-controls");
        const otherPanel = otherPanelId ? document.getElementById(otherPanelId) : null;
        otherPanel?.classList.add("hidden");
      });

      if (!isOpen) {
        toggle.setAttribute("aria-expanded", "true");
        toggle.querySelector(".faq-icon")!.textContent = "−";
        panel?.classList.remove("hidden");
      }
    });
  });
</script>
```

- [ ] **Step 2: Create the About page**

```astro
---
import Layout from "../layouts/Layout.astro";
import Hero from "../components/Hero.astro";
import FAQAccordion from "../components/FAQAccordion.astro";
import heroImage from "../assets/images/about-hero.webp";

const faqs = [
  {
    question: "01 What is NFSINT, and what stage is it in?",
    answer: "NFSINT — the National Firearms Safety Intelligence Group — is an independent intelligence, research, training, and public safety organization concerned with reducing firearm-related injuries, violence, and preventable tragedies. It is presently in the organizational development stage. The framework, product set, research agenda, and analytic method are being documented before the organization operates. No bulletins have been published, no certifications are active, and no membership program is open.",
  },
  {
    question: "02 Is NFSINT a government or law enforcement agency?",
    answer: "No. NFSINT is not a government agency, a regulatory body, or a law enforcement organization. It holds no enforcement authority, issues no licenses or permits, and has no investigative jurisdiction. It also does not accept emergency reports. If you are facing an emergency or an immediate threat to safety, call 911.",
  },
  {
    question: "03 Is NFSINT an advocacy organization?",
    answer: "No. NFSINT is not an advocacy organization and not a political organization. It does not campaign for or against legislation, candidates, or ballot measures. Its intended role is narrower: to collect credible, publicly available information, analyze it, and publish practical safety findings alongside their sources so that readers can evaluate the evidence themselves.",
  },
  {
    question: "04 How does NFSINT decide what to research?",
    answer: "Priorities are intended to follow the intelligence cycle described on this site. What is collected from credible public sources and practitioner reporting shapes what is analyzed, and feedback from the field shapes what is collected next. Within that cycle, preference is given to questions where preventable factors can be identified and where practical guidance could realistically change an outcome. The published research agenda covers areas such as safe storage, human factors, training effectiveness, and public safety communication.",
  },
  {
    question: "05 Who can partner with or join NFSINT?",
    answer: "Partnership and membership pathways are being developed for firearm owners, instructors, ranges, schools and universities, community and faith organizations, employers, security providers, healthcare organizations, researchers, and policymakers. Nothing is open for enrollment at this stage. Individuals and organizations interested in collaboration, research, investment, or an advisory role may make contact through the inquiry form; correspondence is answered by email.",
  },
  {
    question: "06 How will intelligence products be distributed?",
    answer: "Distribution is planned along two lines: public safety material intended for open access, and controlled products released to verified partner organizations through the platform now in development. Each product is intended to carry its sources and its date of issue. Nothing is in circulation at present. When products are released, this site will state what is available and how it can be obtained.",
  },
  {
    question: "07 Does NFSINT accept incident or emergency reports?",
    answer: "No. NFSINT is not a reporting channel for emergencies, crimes, or threats, and it cannot dispatch assistance. Call 911 in an emergency. If you or someone you know is in crisis, call or text 988 (Suicide & Crisis Lifeline) in the United States. Structured, non-emergency safety and near-miss reporting from participating organizations is a planned capability of the technology platform and is not yet available.",
  },
];

const steps = [
  { number: "01", heading: "Define the framework", description: "Document the intelligence cycle, product set, research agenda, and program structure in full before operating." },
  { number: "02", heading: "Build the collection base", description: "Establish sourcing relationships with instructors, ranges, institutions, and public data holders." },
  { number: "03", heading: "Develop the platform", description: "Build the reporting, knowledge management, and analysis systems that make the work repeatable." },
  { number: "04", heading: "Publish and iterate", description: "Release initial bulletins and research openly, then refine products against field feedback." },
];
---
<Layout title="About" description="Who NFSINT is, and what it is not. An independent organization in the organizational development stage.">
  <Hero
    eyebrow="About"
    heading="Who We Are, and What We Are Not"
    description="NFSINT is an independent organization in the organizational development stage. This page states plainly where the organization stands today."
    image={heroImage}
    imageAlt="Civic building facade with limestone columns under an overcast sky"
  />

  <section class="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:grid-cols-2">
    <div>
      <p class="text-sm font-semibold uppercase tracking-wide text-gold">What NFSINT Is</p>
      <ul class="mt-4 space-y-3 text-slate-600">
        <li>An independent intelligence, research, and education organization focused on firearm safety.</li>
        <li>A neutral center for collecting knowledge, identifying trends, and developing practical solutions.</li>
        <li>A convener of owners, instructors, institutions, researchers, and community organizations.</li>
      </ul>
    </div>
    <div>
      <p class="text-sm font-semibold uppercase tracking-wide text-gold">What NFSINT Is Not</p>
      <ul class="mt-4 space-y-3 text-slate-600">
        <li>Not an advocacy organization and not a political organization.</li>
        <li>Not a regulatory body and not a standards-setting authority of government.</li>
        <li>Not a law enforcement agency, and not a channel for emergency reporting.</li>
      </ul>
    </div>
  </section>

  <section class="bg-slate-50 py-20">
    <div class="mx-auto max-w-6xl px-6">
      <p class="text-sm font-semibold uppercase tracking-wide text-gold">Organizational Concept</p>
      <h2 class="mt-2 font-serif text-3xl font-bold text-navy">Framework First, Operations Second</h2>
      <p class="mt-4 max-w-2xl text-slate-600">NFSINT is being designed as an institution rather than assembled as a campaign. That means the framework, standards, and analytic method are documented before any product is published.</p>
      <div class="mt-10 grid gap-8 sm:grid-cols-4">
        {steps.map((s) => (
          <article>
            <p class="font-serif text-2xl font-bold text-gold">{s.number}</p>
            <h3 class="mt-2 font-serif text-lg font-bold text-navy">{s.heading}</h3>
            <p class="mt-2 text-sm text-slate-600">{s.description}</p>
          </article>
        ))}
      </div>
    </div>
  </section>

  <section class="mx-auto max-w-3xl px-6 py-20">
    <p class="text-sm font-semibold uppercase tracking-wide text-gold">Current Status</p>
    <h2 class="mt-2 font-serif text-2xl font-bold text-navy">NFSINT is in the organizational development stage.</h2>
    <p class="mt-4 text-slate-600">The organization is not yet operational. It has no published bulletins, no active certifications, no membership program, and no research findings in circulation. Everything described across this site is planned, in development, or envisioned, and is labeled as such.</p>
    <p class="mt-4 text-slate-600">No operating history, statistics, partnerships, endorsements, or member counts are claimed anywhere on this website. When those things exist, they will be published with their sources.</p>
    <p class="mt-4 text-slate-600">NFSINT is an independent organization in the organizational development stage. It is not a government agency, regulatory body, or law enforcement organization. Content on this site is provided for educational and informational purposes only.</p>
  </section>

  <section class="bg-slate-50 py-20">
    <div class="mx-auto max-w-3xl px-6">
      <p class="text-sm font-semibold uppercase tracking-wide text-gold">Leadership</p>
      <h2 class="mt-2 font-serif text-2xl font-bold text-navy">Leadership and Advisory Bios</h2>
      <p class="mt-4 text-slate-600">This section is intentionally left as a marked placeholder. NFSINT will publish leadership and advisory biographies once individuals are formally appointed — no names or credentials are listed before then.</p>
      <div class="mt-8 grid gap-6 sm:grid-cols-3">
        {["Executive Leadership", "Research Advisory", "Program Advisory"].map((role) => (
          <div class="rounded-lg border border-slate-200 p-6">
            <span class="inline-block rounded-full bg-navy2/10 px-3 py-1 text-xs font-semibold uppercase text-navy">Placeholder</span>
            <h3 class="mt-3 font-serif text-lg font-bold text-navy">{role}</h3>
            <p class="mt-2 text-sm text-slate-600">Biography to be published upon formal appointment. No individual is currently represented as holding this role.</p>
          </div>
        ))}
      </div>
      <p class="mt-6 text-sm text-slate-600">Professionals interested in an advisory or leadership role may make contact through the general inquiry form.</p>
      <a href="/contact" class="mt-2 inline-block text-sm font-semibold text-gold hover:underline">Contact NFSINT</a>
    </div>
  </section>

  <section class="mx-auto max-w-3xl px-6 py-20">
    <p class="text-sm font-semibold uppercase tracking-wide text-gold">Frequently Asked Questions</p>
    <h2 class="mt-2 font-serif text-2xl font-bold text-navy">Common Questions About Scope and Status</h2>
    <p class="mt-4 text-slate-600">The answers below describe the organization as it stands today. Where a capability is planned rather than operational, it is identified as such.</p>
    <div class="mt-8"><FAQAccordion items={faqs} /></div>
    <p class="mt-8 text-xs text-slate-500">NFSINT is an independent organization in the organizational development stage. It is not a government agency, regulatory body, or law enforcement organization. Content on this site is provided for educational and informational purposes only.</p>
  </section>
</Layout>
```

- [ ] **Step 3: Verify the FAQ accordion behavior**

Navigate to `http://localhost:4321/about` with Playwright. Click question 1, confirm its answer shows. Click question 3, confirm question 1's answer hides and question 3's shows (single-open-at-a-time, per Review Focus).
Expected: exactly one answer visible at a time, matching the live site.

- [ ] **Step 4: Commit**

```bash
git add src/components/FAQAccordion.astro src/pages/about.astro
git commit -m "Build About page with FAQ accordion"
```

---

### Task 6: InquiryForm component + Contact page

**Files:**
- Create: `src/components/InquiryForm.astro`
- Create: `src/pages/contact.astro`

**Interfaces:**
- Consumes: `Layout`, `Hero` (Task 3).
- Produces: `InquiryForm.astro` props `{ formTitle: string; formNote: string; showPhone: boolean; typeLabel: string; typeOptions: string[]; submitLabel: string }`. The `/contact` route.

- [ ] **Step 1: Create InquiryForm.astro**

```astro
---
interface Props {
  formTitle: string;
  formNote: string;
  showPhone: boolean;
  typeLabel: string;
  typeOptions: string[];
  submitLabel: string;
}
const { formTitle, formNote, showPhone, typeLabel, typeOptions, submitLabel } = Astro.props;
---
<div>
  <p class="font-serif text-lg font-bold text-navy">{formTitle}</p>
  <p class="mt-2 text-sm text-slate-600">{formNote}</p>
  <form id="inquiry-form" class="mt-6 space-y-4">
    <div>
      <label class="block text-sm font-semibold text-navy" for="name">Name <span class="text-gold">*</span></label>
      <input id="name" name="name" type="text" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
    </div>
    <div>
      <label class="block text-sm font-semibold text-navy" for="organization">Organization</label>
      <input id="organization" name="organization" type="text" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
    </div>
    <div>
      <label class="block text-sm font-semibold text-navy" for="email">Email <span class="text-gold">*</span></label>
      <input id="email" name="email" type="email" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
    </div>
    {showPhone && (
      <div>
        <label class="block text-sm font-semibold text-navy" for="phone">Phone (optional)</label>
        <input id="phone" name="phone" type="tel" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
    )}
    <div>
      <label class="block text-sm font-semibold text-navy" for="type">{typeLabel} <span class="text-gold">*</span></label>
      <select id="type" name="type" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
        {typeOptions.map((opt) => <option value={opt}>{opt}</option>)}
      </select>
    </div>
    <div>
      <label class="block text-sm font-semibold text-navy" for="message">Message <span class="text-gold">*</span></label>
      <textarea id="message" name="message" required rows="5" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"></textarea>
    </div>
    <p id="form-placeholder-notice" class="hidden rounded border border-gold bg-gold/10 px-4 py-3 text-sm text-navy" role="alert">
      This form isn't connected to a backend yet — it's a placeholder for a later sub-project. Your message was not sent.
    </p>
    <button type="submit" class="rounded bg-navy px-6 py-3 text-sm font-semibold text-white">{submitLabel}</button>
  </form>
</div>
<script>
  const form = document.getElementById("inquiry-form");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    document.getElementById("form-placeholder-notice")?.classList.remove("hidden");
  });
</script>
```

- [ ] **Step 2: Create the Contact page**

```astro
---
import Layout from "../layouts/Layout.astro";
import Hero from "../components/Hero.astro";
import InquiryForm from "../components/InquiryForm.astro";
import heroImage from "../assets/images/contact-hero.webp";

const categories = [
  { title: "General Inquiry", description: "Questions about NFSINT, its intelligence products, or its stage of development." },
  { title: "Partnership", description: "Organizations, ranges, employers, and institutions exploring collaboration or membership." },
  { title: "Media", description: "Press and editorial requests, background briefings, and factual verification." },
  { title: "Research", description: "Academics and institutions proposing joint study, data sharing, or peer review." },
];
---
<Layout title="Contact" description="Contact NFSINT for general inquiries, partnership discussions, media requests, and research collaboration.">
  <Hero
    eyebrow="Contact"
    heading="Contact NFSINT"
    description="Use the form below for general inquiries, partnership discussions, media requests, and research collaboration. Every submission is recorded and routed to the correspondence queue."
    image={heroImage}
    imageAlt="Abstract cartographic view of the United States rendered in luminous data lines"
  />

  <div class="mx-auto max-w-6xl px-6 py-12">
    <div class="rounded border border-gold bg-gold/10 px-6 py-4 text-sm text-navy">
      <p class="font-semibold">Important</p>
      <p class="mt-1">NFSINT does not accept emergency reports and is not a law enforcement agency. If you are facing an emergency or an immediate threat to safety, call 911.</p>
    </div>
  </div>

  <section class="mx-auto grid max-w-6xl gap-12 px-6 pb-20 sm:grid-cols-2">
    <div>
      <p class="text-sm font-semibold uppercase tracking-wide text-gold">Correspondence</p>
      <h2 class="mt-2 font-serif text-2xl font-bold text-navy">How Inquiries Are Handled</h2>
      <div class="mt-6 space-y-6">
        {categories.map((c) => (
          <div>
            <h3 class="font-serif text-lg font-bold text-navy">{c.title}</h3>
            <p class="mt-1 text-sm text-slate-600">{c.description}</p>
          </div>
        ))}
      </div>
      <div class="mt-8 rounded border border-slate-200 p-4">
        <p class="text-sm font-semibold text-navy">Crisis Resources</p>
        <p class="mt-1 text-sm text-slate-600">If you or someone you know is in crisis, call or text 988 (Suicide &amp; Crisis Lifeline) in the United States.</p>
      </div>
    </div>
    <InquiryForm
      formTitle="Send an Inquiry"
      formNote="Fields marked with a gold asterisk are required. Responses are sent by email; NFSINT does not use submissions for marketing or share them with third parties."
      showPhone={true}
      typeLabel="Inquiry Type"
      typeOptions={["General Inquiry", "Partnership", "Investment", "Institutional Membership", "Research Collaboration", "Media"]}
      submitLabel="Send Inquiry"
    />
  </section>
</Layout>
```

- [ ] **Step 3: Verify the placeholder submit behavior**

Navigate to `http://localhost:4321/contact`, fill required fields, click "Send Inquiry" with Playwright.
Expected: the gold placeholder-notice banner appears; no network request is made (confirm via `browser_network_requests`); page does not navigate away.

- [ ] **Step 4: Commit**

```bash
git add src/components/InquiryForm.astro src/pages/contact.astro
git commit -m "Build Contact page with reusable InquiryForm component"
```

---

### Task 7: Partners page

**Files:**
- Create: `src/pages/partners.astro`

**Interfaces:**
- Consumes: `Layout`, `Hero`, `NumberedList` (Task 3), `InquiryForm` (Task 6, reused with different props per Review Focus).

- [ ] **Step 1: Create the Partners page**

```astro
---
import Layout from "../layouts/Layout.astro";
import Hero from "../components/Hero.astro";
import NumberedList from "../components/NumberedList.astro";
import InquiryForm from "../components/InquiryForm.astro";
import heroImage from "../assets/images/partners-hero.webp";

const sectors = [
  { number: "01", heading: "Public safety technology" },
  { number: "02", heading: "Artificial intelligence" },
  { number: "03", heading: "Professional education and certification" },
  { number: "04", heading: "Data analytics" },
  { number: "05", heading: "Risk intelligence" },
  { number: "06", heading: "Software as a service" },
  { number: "07", heading: "Research and consulting" },
];

const revenueStreams = [
  { number: "01", heading: "Membership subscriptions" },
  { number: "02", heading: "Professional certifications" },
  { number: "03", heading: "Instructor credentialing" },
  { number: "04", heading: "Training courses" },
  { number: "05", heading: "Conferences and symposiums" },
  { number: "06", heading: "Research publications" },
  { number: "07", heading: "Consulting services" },
  { number: "08", heading: "Organizational memberships" },
  { number: "09", heading: "Grants" },
  { number: "10", heading: "Sponsorships" },
  { number: "11", heading: "Technology licensing" },
  { number: "12", heading: "Enterprise software subscriptions" },
];

const whoThisIsFor = [
  "Investors evaluating early-stage public safety and SaaS ventures.",
  "Institutions considering organizational membership or pilot participation.",
  "Universities and research bodies exploring collaboration.",
  "Journalists seeking accurate background on the concept.",
];
---
<Layout title="Partners" description="NFSINT is seeking founding partners, institutional collaborators, and mission-aligned investors.">
  <Hero
    eyebrow="Partners"
    heading="Partnership and Investment"
    description="NFSINT is seeking founding partners, institutional collaborators, and mission-aligned investors to build a national safety intelligence capability that does not currently exist."
    image={heroImage}
    imageAlt="Empty modern institutional conference room with long table and daylight"
  />

  <section class="mx-auto max-w-3xl px-6 py-20">
    <p class="text-sm font-semibold uppercase tracking-wide text-gold">Overview</p>
    <h2 class="mt-2 font-serif text-3xl font-bold text-navy">A Measured Proposition, Honestly Stated</h2>
    <p class="mt-4 text-slate-600">NFSINT is in the organizational development stage. There is no operating history, no revenue, and no membership base to present. What exists is a defined problem, a structured concept, and a plan of record — offered for review by parties who evaluate early-stage institutional ventures.</p>
    <p class="mt-4 text-slate-600">Its value proposition lies in creating a scalable platform that delivers actionable safety intelligence, educational resources, and analytical tools to individuals, organizations, and institutions seeking to improve firearm safety and risk awareness.</p>
  </section>

  <section class="bg-slate-50 py-20">
    <div class="mx-auto max-w-6xl px-6">
      <p class="text-sm font-semibold uppercase tracking-wide text-gold">Why NFSINT</p>
      <h2 class="mt-2 font-serif text-3xl font-bold text-navy">A Convergence of Growing Sectors</h2>
      <p class="mt-4 max-w-2xl text-slate-600">The concept sits at the intersection of several established and expanding fields. Each one already has mature demand; none currently serves firearm safety intelligence as an integrated discipline.</p>
      <div class="mt-10"><NumberedList items={sectors} columns={4} /></div>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-6 py-20">
    <p class="text-sm font-semibold uppercase tracking-wide text-gold">Sustainability Model</p>
    <h2 class="mt-2 font-serif text-3xl font-bold text-navy">Potential Revenue Streams</h2>
    <p class="mt-4 max-w-2xl text-slate-600">A durable institution needs diversified support. The streams listed are potential, not active, and are published for evaluation rather than as projections.</p>
    <div class="mt-10"><NumberedList items={revenueStreams} columns={4} /></div>
    <p class="mt-8 text-sm text-slate-500">No revenue figures, valuations, timelines, or financial projections are presented on this website. Detailed materials are shared directly with reviewing parties on request.</p>
  </section>

  <section class="bg-slate-50 py-20">
    <div class="mx-auto grid max-w-6xl gap-12 px-6 sm:grid-cols-2">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-gold">Who This Is For</p>
        <ul class="mt-4 space-y-3 text-slate-600">
          {whoThisIsFor.map((w) => <li>{w}</li>)}
        </ul>
        <a href="/about" class="mt-4 inline-block text-sm font-semibold text-gold hover:underline">Read the Current Status</a>
      </div>
      <InquiryForm
        formTitle="Request the Concept Overview"
        formNote="Tell us who you are and what you are evaluating. NFSINT will respond with the concept overview appropriate to your interest. Submissions are used only to respond to your inquiry. Do not send emergency reports."
        showPhone={false}
        typeLabel="Interest Type"
        typeOptions={["Investment", "Partnership", "Institutional Membership", "Research Collaboration", "Media"]}
        submitLabel="Request Overview"
      />
    </div>
  </section>
</Layout>
```

- [ ] **Step 2: Verify the Partners form differs correctly from Contact's**

Navigate to `http://localhost:4321/partners` with Playwright. Confirm: no Phone field present; the type dropdown shows exactly 5 options with no "General Inquiry"; submit shows the same placeholder-notice pattern as Contact.

- [ ] **Step 3: Commit**

```bash
git add src/pages/partners.astro
git commit -m "Build Partners page"
```

---

### Task 8: Mission page

**Files:**
- Create: `src/pages/mission.astro`

**Interfaces:**
- Consumes: `Layout`, `Hero`, `NumberedList` (Task 3).

- [ ] **Step 1: Create the Mission page**

```astro
---
import Layout from "../layouts/Layout.astro";
import Hero from "../components/Hero.astro";
import NumberedList from "../components/NumberedList.astro";
import heroImage from "../assets/images/mission-hero.webp";

const pillars = [
  { number: "01", heading: "Information", description: "Credible, sourced, and organized. NFSINT gathers what is publicly known about firearm safety and makes it findable in one place." },
  { number: "02", heading: "Intelligence", description: "Information becomes intelligence when it is analyzed, contextualized, and turned into something a person or organization can act on." },
  { number: "03", heading: "Safety", description: "Every product exists to reduce preventable injury. Prevention, not reaction, is the measure of success." },
  { number: "04", heading: "Community", description: "Safety improves through collaboration among owners, instructors, institutions, researchers, and community organizations." },
];

const notList = [
  { title: "Not Advocacy", body: "NFSINT does not campaign for or against legislation, candidates, or policy positions. Its output is analysis, not persuasion." },
  { title: "Not Regulation", body: "NFSINT holds no rulemaking authority. Standards it develops are voluntary, published openly, and adopted by choice." },
  { title: "Not Enforcement", body: "NFSINT conducts no investigations and has no enforcement powers. It is not a reporting channel for crimes or emergencies." },
];
---
<Layout title="Mission" description="NFSINT exists to convert credible, publicly available information into practical safety knowledge.">
  <Hero
    eyebrow="Mission"
    heading="Mission, Vision, and Position"
    description="NFSINT exists to convert credible, publicly available information into practical safety knowledge — and to be clear about the role it does not occupy."
    image={heroImage}
    imageAlt="Abstract layered topographic contour lines in navy and slate"
  />

  <section class="mx-auto max-w-3xl px-6 py-20 text-center">
    <p class="text-sm font-semibold uppercase tracking-wide text-gold">Mission Statement</p>
    <blockquote class="mt-4 font-serif text-2xl text-navy">To collect, analyze, develop, and share firearm safety intelligence that strengthens communities, supports professionals, informs decision-makers, and promotes responsible firearm ownership through education, research, technology, and collaboration.</blockquote>
  </section>

  <section class="bg-slate-50 py-20">
    <div class="mx-auto max-w-6xl px-6">
      <p class="text-sm font-semibold uppercase tracking-wide text-gold">The Four Pillars</p>
      <h2 class="mt-2 font-serif text-3xl font-bold text-navy">Information. Intelligence. Safety. Community.</h2>
      <p class="mt-4 max-w-2xl text-slate-600">The NFSINT motto is not decoration — it is the operating sequence of the organization. Each pillar depends on the one before it.</p>
      <div class="mt-10"><NumberedList items={pillars} columns={4} /></div>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-6 py-20">
    <p class="text-sm font-semibold uppercase tracking-wide text-gold">Vision</p>
    <h2 class="mt-2 font-serif text-3xl font-bold text-navy">A Neutral Center for Firearm Safety Knowledge</h2>
    <p class="mt-4 max-w-2xl text-slate-600">Unlike organizations whose primary mission is advocacy, regulation, or law enforcement, NFSINT focuses on transforming information into practical knowledge that empowers individuals, professionals, communities, and institutions to make informed decisions that enhance public safety.</p>
    <div class="mt-10 grid gap-8 sm:grid-cols-3">
      {notList.map((item) => (
        <div>
          <p class="font-serif text-lg font-bold text-navy">{item.title}</p>
          <p class="mt-2 text-sm text-slate-600">{item.body}</p>
        </div>
      ))}
    </div>
  </section>

  <section class="bg-navy py-20 text-white">
    <div class="mx-auto max-w-3xl px-6">
      <p class="text-sm font-semibold uppercase tracking-wide text-gold">Long-Term Vision</p>
      <h2 class="mt-2 font-serif text-2xl font-bold">Where This Is Intended to Lead</h2>
      <p class="mt-4 text-slate-300">The long-term goal is to establish NFSINT as the nation's premier independent firearm safety intelligence organization—a trusted source of research, analysis, education, and professional standards that helps reduce preventable firearm injuries through evidence-based information and collaboration.</p>
      <p class="mt-4 text-slate-300">Rather than functioning as a regulatory body or law enforcement agency, NFSINT would serve as a neutral center for collecting knowledge, identifying trends, and developing practical solutions that improve firearm safety for communities across the United States.</p>
      <p class="mt-4 text-sm text-slate-400">NFSINT is currently in the organizational development stage. Objectives described on this page are planned or envisioned, and are published here so partners can evaluate the concept honestly.</p>
      <div class="mt-6 flex gap-4">
        <a href="/intelligence" class="rounded bg-gold px-5 py-2.5 text-sm font-semibold text-navy">See the Intelligence Cycle</a>
        <a href="/about" class="rounded border border-white px-5 py-2.5 text-sm font-semibold text-white">Current Status</a>
      </div>
    </div>
  </section>
</Layout>
```

- [ ] **Step 2: Verify against the live site**

Navigate to `http://localhost:4321/mission` with Playwright and compare content and structure against the live `/mission` page.

- [ ] **Step 3: Commit**

```bash
git add src/pages/mission.astro
git commit -m "Build Mission page"
```

---

### Task 9: Intelligence page

**Files:**
- Create: `src/pages/intelligence.astro`

**Interfaces:**
- Consumes: `Layout`, `Hero`, `NumberedList`, `ProductGrid` (Task 3).

- [ ] **Step 1: Create the Intelligence page**

```astro
---
import Layout from "../layouts/Layout.astro";
import Hero from "../components/Hero.astro";
import NumberedList from "../components/NumberedList.astro";
import ProductGrid from "../components/ProductGrid.astro";
import heroImage from "../assets/images/intelligence-hero.webp";

const sources = [
  "Public safety reports", "Court decisions", "Accident investigations", "Academic research",
  "Industry publications", "Firearms instructors", "Community organizations",
  "Publicly available government data", "Safety trends and emerging issues",
];

const analysisProducts = [
  "Threat assessments", "Safety bulletins", "Incident trend reports", "Risk analyses",
  "Best-practice recommendations", "Training updates", "Research publications",
];

const analyticStandards = [
  "Findings are attributed to their sources and dated.",
  "Confidence and limitations are stated plainly.",
  "Machine assistance is reviewed by a human analyst.",
  "Products avoid advocacy framing and political language.",
];

const cycle = [
  { number: "01", heading: "Collection", description: "Sourcing information from credible public reporting, research, and practitioners." },
  { number: "02", heading: "Analysis", description: "Verifying, contextualizing, and identifying patterns, risks, and emerging issues." },
  { number: "03", heading: "Production", description: "Drafting bulletins, assessments, and reports written for practical use." },
  { number: "04", heading: "Dissemination", description: "Delivering products to owners, professionals, institutions, and decision-makers." },
  { number: "05", heading: "Feedback", description: "Capturing field response to sharpen future collection priorities." },
];

const products = [
  { title: "National Firearm Safety Bulletins", description: "Periodic bulletins summarizing current safety issues, recalls, and prevention guidance." },
  { title: "Threat Awareness Reports", description: "Assessments of emerging risks relevant to institutions, ranges, and community organizations." },
  { title: "Annual Firearm Safety Index", description: "A yearly synthesis of publicly available indicators of firearm safety and prevention." },
  { title: "Safety Intelligence Database", description: "A searchable, citation-backed repository of safety findings and lessons learned." },
  { title: "AI-Powered Research Assistant", description: "A guided research tool to help practitioners locate relevant safety literature quickly." },
  { title: "Instructor Resource Center", description: "Curriculum support, updates, and reference material for firearms instructors." },
  { title: "Incident Lessons Learned Library", description: "Structured case reviews focused on preventable factors and corrective practice." },
  { title: "Safety Certification Programs", description: "Standards-based certification pathways for individuals and organizations." },
  { title: "Public Education Campaigns", description: "Plain-language campaigns on storage, access prevention, and situational awareness." },
  { title: "Community Risk Assessments", description: "Structured assessments helping local organizations identify and reduce risk." },
];
---
<Layout title="Intelligence" description="Safety intelligence is a discipline: sourcing credible information, analyzing it rigorously, and publishing something a practitioner can actually use.">
  <Hero
    eyebrow="Intelligence"
    heading="Collection, Analysis, and Production"
    description="Safety intelligence is a discipline: sourcing credible information, analyzing it rigorously, and publishing something a practitioner can actually use."
    image={heroImage}
    imageAlt="Abstract navy network of connected data nodes"
  />

  <section class="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:grid-cols-2">
    <div>
      <p class="text-sm font-semibold uppercase tracking-wide text-gold">Intelligence Collection</p>
      <h2 class="mt-2 font-serif text-2xl font-bold text-navy">Where the Information Comes From</h2>
      <p class="mt-4 text-slate-600">NFSINT gathers information exclusively from credible, publicly available, and practitioner-contributed sources.</p>
    </div>
    <div>
      <ul class="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
        {sources.map((s) => <li>{s}</li>)}
      </ul>
      <p class="mt-4 text-sm text-slate-500">Collection priorities are set by analytic need, not by volume. Sources are recorded and cited so every published finding can be traced back to its origin.</p>
    </div>
  </section>

  <section class="bg-slate-50 py-20">
    <div class="mx-auto grid max-w-6xl gap-12 px-6 sm:grid-cols-2">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-gold">Intelligence Analysis</p>
        <h2 class="mt-2 font-serif text-2xl font-bold text-navy">Turning Raw Information into Usable Products</h2>
        <p class="mt-4 text-slate-600">Analysis is where fragmented reporting becomes a pattern, and a pattern becomes guidance. NFSINT analysis is intended to produce products such as:</p>
        <ul class="mt-4 space-y-2 text-sm text-slate-600">
          {analysisProducts.map((p) => <li>{p}</li>)}
        </ul>
      </div>
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-gold">Analytic Standards</p>
        <ul class="mt-4 space-y-3 text-sm text-slate-600">
          {analyticStandards.map((s) => <li>{s}</li>)}
        </ul>
      </div>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-6 py-20">
    <p class="text-sm font-semibold uppercase tracking-wide text-gold">The Intelligence Cycle</p>
    <h2 class="mt-2 font-serif text-3xl font-bold text-navy">Collection to Feedback, Then Again</h2>
    <p class="mt-4 max-w-2xl text-slate-600">A closed loop keeps products accurate over time: what the field reports back shapes what NFSINT collects next.</p>
    <div class="mt-10"><NumberedList items={cycle} columns={3} /></div>
    <p class="mt-6 text-sm text-slate-500">Feedback returns to Collection, restarting the cycle.</p>
  </section>

  <section class="bg-slate-50 py-20">
    <div class="mx-auto max-w-6xl px-6">
      <p class="text-sm font-semibold uppercase tracking-wide text-gold">Intelligence Products</p>
      <h2 class="mt-2 font-serif text-3xl font-bold text-navy">Potential Intelligence Products</h2>
      <p class="mt-4 max-w-2xl text-slate-600">Every product below is planned or in development. None are operational today, and nothing on this page should be read as an existing service.</p>
      <div class="mt-10"><ProductGrid items={products} /></div>
      <p class="mt-8 text-slate-600">Organizations interested in early access, pilot participation, or contributing source material to the collection program are invited to make contact.</p>
      <a href="/contact" class="mt-2 inline-block text-sm font-semibold text-gold hover:underline">Contact the Program</a>
    </div>
  </section>
</Layout>
```

- [ ] **Step 2: Verify against the live site, including the 10-item product grid**

Navigate to `http://localhost:4321/intelligence` with Playwright; confirm all 10 product cards render with correct titles/descriptions and the 5-step cycle displays in order.

- [ ] **Step 3: Commit**

```bash
git add src/pages/intelligence.astro
git commit -m "Build Intelligence page"
```

---

### Task 10: Research page

**Files:**
- Create: `src/pages/research.astro`

**Interfaces:**
- Consumes: `Layout`, `Hero` (Task 3). The 8 research areas use a plain, unnumbered card grid written directly in this page (no shared component — this exact shape appears only here).

- [ ] **Step 1: Create the Research page**

```astro
---
import Layout from "../layouts/Layout.astro";
import Hero from "../components/Hero.astro";
import heroImage from "../assets/images/research-hero.webp";

const principles = [
  { title: "Independent", body: "research agendas are not set by advocacy campaigns or political outcomes." },
  { title: "Evidence-based", body: "findings rest on documented data and transparent method, not assertion." },
  { title: "Practitioner-informed", body: "instructors and safety professionals help frame the questions." },
  { title: "Openly limited", body: "what a study cannot show is stated as plainly as what it can." },
];

const areas = [
  { title: "Safe firearm storage", description: "Evaluating storage practices, adoption barriers, and effective access-prevention guidance." },
  { title: "Suicide prevention", description: "Studying prevention frameworks, means-safety counseling, and support pathways with care and gravity." },
  { title: "Accidental shootings", description: "Examining contributing factors in unintentional discharges and how they can be prevented." },
  { title: "Human factors in firearm incidents", description: "Applying human-factors science to handling errors, fatigue, stress, and procedural drift." },
  { title: "Situational awareness", description: "Understanding how attention, perception, and environment shape safe decisions." },
  { title: "Defensive decision-making", description: "Researching judgment under stress, decision thresholds, and de-escalation behavior." },
  { title: "Training effectiveness", description: "Measuring which instructional methods produce durable, transferable safe behavior." },
  { title: "Public safety communication", description: "Testing how safety guidance is best framed, delivered, and retained by communities." },
];

const collaborationList = [
  "Co-authored studies and literature reviews.",
  "Peer review of NFSINT analytic products.",
  "Access to structured, de-identified safety observations.",
  "Joint grant applications and symposium participation.",
];
---
<Layout title="Research" description="NFSINT conducts independent, evidence-based research. Its purpose is prevention.">
  <Hero
    eyebrow="Research"
    heading="Independent, Evidence-Based Research"
    description="NFSINT conducts independent, evidence-based research. Its purpose is prevention: understanding why preventable firearm injuries occur and what measurably reduces them."
    image={heroImage}
    imageAlt="Research desk with printed statistical reports and charts in neutral daylight"
  />

  <section class="mx-auto max-w-6xl px-6 py-20">
    <p class="text-sm font-semibold uppercase tracking-wide text-gold">Approach</p>
    <h2 class="mt-2 font-serif text-3xl font-bold text-navy">Questions First, Conclusions Last</h2>
    <p class="mt-4 max-w-2xl text-slate-600">Research is scoped around practical questions raised by the collection program, and published with its methods, sources, and limitations visible.</p>
    <div class="mt-10 grid gap-6 sm:grid-cols-4">
      {principles.map((p) => (
        <div>
          <p class="font-serif text-lg font-bold text-navy">{p.title}</p>
          <p class="mt-2 text-sm text-slate-600">— {p.body}</p>
        </div>
      ))}
    </div>
  </section>

  <section class="bg-slate-50 py-20">
    <div class="mx-auto max-w-6xl px-6">
      <p class="text-sm font-semibold uppercase tracking-wide text-gold">Research Areas</p>
      <h2 class="mt-2 font-serif text-3xl font-bold text-navy">Eight Areas of Study</h2>
      <p class="mt-4 max-w-2xl text-slate-600">These are the initial areas of inquiry for the NFSINT research program. Each is chosen because better evidence in that area would translate directly into prevention.</p>
      <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {areas.map((a) => (
          <article class="rounded-lg border border-slate-200 bg-white p-6">
            <h3 class="font-serif text-lg font-bold text-navy">{a.title}</h3>
            <p class="mt-2 text-sm text-slate-600">{a.description}</p>
          </article>
        ))}
      </div>
    </div>
  </section>

  <section class="mx-auto max-w-2xl px-6 py-20 text-center">
    <p class="text-sm font-semibold uppercase tracking-wide text-gold">Crisis Resources</p>
    <p class="mt-4 text-slate-600">If you or someone you know is in crisis, call or text 988 (Suicide &amp; Crisis Lifeline) in the United States.</p>
    <p class="mt-2 text-sm text-slate-500">NFSINT is a research organization and does not provide crisis counseling or clinical care. The Lifeline is available 24 hours a day, every day.</p>
  </section>

  <section class="bg-navy py-20 text-white">
    <div class="mx-auto max-w-3xl px-6">
      <p class="text-sm font-semibold uppercase tracking-wide text-gold">Research Collaboration</p>
      <h2 class="mt-2 font-serif text-2xl font-bold">For Academics, Clinicians, and Institutions</h2>
      <p class="mt-4 text-slate-300">NFSINT intends to work with universities, hospital systems, public health researchers, and professional bodies on joint study, peer review, and responsible data sharing.</p>
      <p class="mt-6 text-sm font-semibold uppercase tracking-wide text-gold">What Collaboration Can Look Like</p>
      <ul class="mt-3 space-y-2 text-slate-300">
        {collaborationList.map((c) => <li>{c}</li>)}
      </ul>
      <a href="/contact" class="mt-6 inline-block rounded bg-gold px-6 py-3 text-sm font-semibold text-navy">Propose a Collaboration</a>
    </div>
  </section>
</Layout>
```

- [ ] **Step 2: Verify against the live site**

Navigate to `http://localhost:4321/research` with Playwright; confirm all 8 research area cards render and the 988 crisis resource text is present verbatim.

- [ ] **Step 3: Commit**

```bash
git add src/pages/research.astro
git commit -m "Build Research page"
```

---

### Task 11: Technology page

**Files:**
- Create: `src/pages/technology.astro`

**Interfaces:**
- Consumes: `Layout`, `Hero`, `NumberedList` (Task 3).

- [ ] **Step 1: Create the Technology page**

```astro
---
import Layout from "../layouts/Layout.astro";
import Hero from "../components/Hero.astro";
import NumberedList from "../components/NumberedList.astro";
import heroImage from "../assets/images/technology-hero.webp";

const capabilities = [
  { number: "01", heading: "Safety reporting", description: "Structured intake for near-miss and safety observations from participating organizations." },
  { number: "02", heading: "Training management", description: "Course records, rosters, curriculum versions, and credential tracking in one system." },
  { number: "03", heading: "Risk assessment", description: "Guided assessment workflows that produce comparable, documented risk profiles." },
  { number: "04", heading: "Knowledge management", description: "A governed library of findings, sources, and lessons learned with version history." },
  { number: "05", heading: "AI-assisted safety analysis", description: "Machine assistance for summarization, classification, and trend detection under human review." },
  { number: "06", heading: "Information sharing", description: "Controlled distribution of bulletins and assessments to verified partner organizations." },
  { number: "07", heading: "Educational platforms", description: "Delivery of courses, modules, and public education material across devices." },
];

const positioning = [
  { title: "Software as a service", body: "Delivered as a hosted, subscription-based platform so organizations of any size can participate without building infrastructure." },
  { title: "Data analytics core", body: "Structured records make comparison possible across time, region, and organization type — the basis of trend detection." },
  { title: "Scalable by design", body: "A single instructor, a range, or a multi-site institution should be able to use the same system at different depths." },
  { title: "Governed and auditable", body: "Sources, versions, and revisions are tracked so published intelligence can be traced and corrected." },
];
---
<Layout title="Technology" description="Analysis at national scale requires software. The platform layer for safety intelligence.">
  <Hero
    eyebrow="Technology"
    heading="The Platform Layer for Safety Intelligence"
    description="Analysis at national scale requires software. NFSINT intends to build the reporting, training, and knowledge systems that make safety intelligence usable day to day."
    image={heroImage}
    imageAlt="Abstract navy software dashboard panels representing a secure data platform"
  />

  <section class="mx-auto max-w-6xl px-6 py-20">
    <div class="grid gap-12 sm:grid-cols-2">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-gold">Overview</p>
        <h2 class="mt-2 font-serif text-3xl font-bold text-navy">Infrastructure, Not Gadgets</h2>
        <p class="mt-4 text-slate-600">The technology program is deliberately unglamorous: intake, records, analysis support, and controlled distribution. These are the systems that turn scattered observations into a durable body of knowledge.</p>
      </div>
      <div class="rounded-lg border border-slate-200 p-6">
        <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">Development Status</p>
        <span class="mt-2 inline-block rounded-full bg-navy2/10 px-3 py-1 text-xs font-semibold uppercase text-navy">In Development</span>
        <p class="mt-3 text-sm text-slate-600">The platform described on this page is in development. Capability descriptions represent intended scope for evaluation by partners and prospective pilot organizations, not features available today.</p>
      </div>
    </div>
  </section>

  <section class="bg-slate-50 py-20">
    <div class="mx-auto max-w-6xl px-6">
      <p class="text-sm font-semibold uppercase tracking-wide text-gold">Capabilities</p>
      <h2 class="mt-2 font-serif text-3xl font-bold text-navy">Seven Planned Platform Capabilities</h2>
      <p class="mt-4 max-w-2xl text-slate-600">Each capability corresponds to a step in the intelligence cycle, from field intake through distribution back to the field.</p>
      <div class="mt-10"><NumberedList items={capabilities} columns={3} /></div>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-6 py-20">
    <p class="text-sm font-semibold uppercase tracking-wide text-gold">Positioning</p>
    <h2 class="mt-2 font-serif text-3xl font-bold text-navy">A Scalable SaaS and Data Analytics Platform</h2>
    <p class="mt-4 max-w-2xl text-slate-600">NFSINT technology is envisioned as a subscription platform with an analytics core — the same architecture that has professionalized safety management in aviation, healthcare, and industrial risk.</p>
    <div class="mt-10 grid gap-8 sm:grid-cols-4">
      {positioning.map((p) => (
        <div>
          <h3 class="font-serif text-lg font-bold text-navy">{p.title}</h3>
          <p class="mt-2 text-sm text-slate-600">{p.body}</p>
        </div>
      ))}
    </div>
    <a href="/partners" class="mt-10 inline-block rounded bg-navy px-6 py-3 text-sm font-semibold text-white">Platform Partnership and Investment</a>
  </section>
</Layout>
```

- [ ] **Step 2: Verify against the live site**

Navigate to `http://localhost:4321/technology` with Playwright; confirm all 7 capabilities and 4 positioning points render.

- [ ] **Step 3: Commit**

```bash
git add src/pages/technology.astro
git commit -m "Build Technology page"
```

---

### Task 12: Programs page, final cross-page verification, and README

**Files:**
- Create: `src/pages/programs.astro`
- Modify: `README.md`

**Interfaces:**
- Consumes: `Layout`, `Hero`, `ProductGrid` (Task 3). This is the last page task; its Step 4 verifies all 9 pages together.

- [ ] **Step 1: Create the Programs page**

```astro
---
import Layout from "../layouts/Layout.astro";
import Hero from "../components/Hero.astro";
import ProductGrid from "../components/ProductGrid.astro";
import heroImage from "../assets/images/programs-hero.webp";

const educationAudience = [
  "Firearm owners", "Families", "Schools", "Colleges", "Faith organizations",
  "Businesses", "Security professionals", "Firearms instructors", "Community leaders",
];

const trainingAudience = [
  "Firearms instructors", "Range Safety Officers", "Security personnel",
  "Corporate safety teams", "Emergency preparedness professionals", "Community organizations",
];

const credentials = [
  { title: "Instructor Credentialing", description: "A planned credential recognizing instructors who meet NFSINT curriculum and safety standards." },
  { title: "Range Safety Officer Certification", description: "An envisioned certification covering range protocols, incident response, and documentation." },
  { title: "Organizational Safety Certification", description: "A planned pathway for ranges, employers, and institutions adopting NFSINT safety practices." },
  { title: "Continuing Education Units", description: "Planned continuing-education recognition tied to bulletins, research, and training updates." },
];
---
<Layout title="Programs" description="Education and professional development programs from NFSINT.">
  <Hero
    eyebrow="Programs"
    heading="Education and Professional Development"
    description="Intelligence only reduces harm when it reaches the people who act on it. NFSINT programs are the delivery mechanism — for the public and for professionals."
    image={heroImage}
    imageAlt="Empty modern professional training classroom with neutral seating and a presentation screen"
  />

  <section class="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:grid-cols-2">
    <div>
      <p class="text-sm font-semibold uppercase tracking-wide text-gold">Public Safety Education</p>
      <h2 class="mt-2 font-serif text-2xl font-bold text-navy">Plain-Language Safety Education for Everyday Decisions</h2>
      <p class="mt-4 text-slate-600">NFSINT intends to develop educational programs that translate research and analysis into guidance people can apply at home, at work, and in their communities.</p>
      <p class="mt-4 text-slate-600">Curricula are planned to be modular, evidence-based, and revised as new findings enter the safety intelligence database.</p>
    </div>
    <div>
      <div class="flex items-center gap-3">
        <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">Programs Developed For</p>
        <span class="rounded-full bg-navy2/10 px-3 py-1 text-xs font-semibold uppercase text-navy">Planned</span>
      </div>
      <ul class="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-600">
        {educationAudience.map((a) => <li>{a}</li>)}
      </ul>
    </div>
  </section>

  <section class="bg-slate-50 py-20">
    <div class="mx-auto max-w-6xl px-6">
      <div class="flex items-center gap-3">
        <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">Specialized Training For</p>
        <span class="rounded-full bg-navy2/10 px-3 py-1 text-xs font-semibold uppercase text-navy">Planned</span>
      </div>
      <ul class="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-600 sm:grid-cols-3">
        {trainingAudience.map((a) => <li>{a}</li>)}
      </ul>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-6 py-20">
    <p class="text-sm font-semibold uppercase tracking-wide text-gold">Professional Development</p>
    <h2 class="mt-2 font-serif text-2xl font-bold text-navy">Standards-Based Training for Practitioners</h2>
    <p class="mt-4 max-w-2xl text-slate-600">Professional programs are intended to raise consistency across the field — shared terminology, shared protocols, and shared expectations for documentation and review.</p>
    <p class="mt-4 max-w-2xl text-slate-600">Where training standards currently vary widely, NFSINT aims to publish a common reference that instructors and organizations may adopt voluntarily.</p>
  </section>

  <section class="bg-slate-50 py-20">
    <div class="mx-auto max-w-6xl px-6">
      <p class="text-sm font-semibold uppercase tracking-wide text-gold">Credentialing</p>
      <h2 class="mt-2 font-serif text-3xl font-bold text-navy">Planned Certifications and Credentialing</h2>
      <p class="mt-4 max-w-2xl text-slate-600">The credential pathways below are envisioned, not yet offered. They are published so instructors and organizations can review the intended direction and comment on it.</p>
      <div class="mt-10"><ProductGrid items={credentials} /></div>
    </div>
  </section>

  <section class="bg-navy py-20 text-center text-white">
    <div class="mx-auto max-w-2xl px-6">
      <p class="text-sm font-semibold uppercase tracking-wide text-gold">Register Interest</p>
      <h2 class="mt-2 font-serif text-2xl font-bold">Be First in Line When Programs Open</h2>
      <p class="mt-4 text-slate-300">Instructors, range operators, safety officers, and institutions may register interest now. NFSINT will contact registrants as curricula and credentialing pathways are finalized.</p>
      <p class="mt-4 text-sm text-slate-400">Use the contact form and select Institutional Membership or Partnership to register program interest. Include your role, organization, and the programs you would like to see first.</p>
      <a href="/contact" class="mt-6 inline-block rounded bg-gold px-6 py-3 text-sm font-semibold text-navy">Register Program Interest</a>
    </div>
  </section>
</Layout>
```

- [ ] **Step 2: Update README.md**

Replace `README.md` with:

```markdown
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
```

- [ ] **Step 3: Verify the Programs page**

Navigate to `http://localhost:4321/programs` with Playwright; confirm both audience lists and all 4 credential cards render.

- [ ] **Step 4: Full cross-page verification pass**

Using the Playwright browser tool, navigate to all 9 local routes (`/`, `/mission`, `/about`, `/intelligence`, `/research`, `/technology`, `/programs`, `/partners`, `/contact`) and their corresponding live URLs (`https://authority-research-safety.supercoolpreview.com/...`), comparing:
- Every heading and paragraph matches verbatim
- Every nav link in the header menu resolves to the correct page (no 404s)
- Every footer link resolves correctly, including the duplicate `/intelligence` and `/programs` hrefs
- No requests to `supercoolpreview.com` or `cloudfront.net` appear in `browser_network_requests` on any page
- Resize to a mobile width (375px) via `browser_resize` and confirm no layout breakage on at least Home, About, and Contact
- **Known gap to close here, not before:** Mission, About, Intelligence, Programs, and Partners each reuse one extra low-opacity background texture image somewhere on the live page beyond their hero (confirmed present via each page's `<img>` list in Task 1's research, but this plan did not pin down its exact section placement the way Task 4 did for Home). During this pass, check each of those 5 pages against its live counterpart for a faint background texture this plan's page code is missing, and add the matching `Image` overlay (same `opacity-20`, `absolute inset-0 h-full w-full object-cover` pattern used in Task 4) to whichever section is missing it.

Fix any discrepancy found before proceeding — per the spec, this comparison is what "done" means for this sub-project, not a nice-to-have.

- [ ] **Step 5: Commit**

```bash
git add src/pages/programs.astro README.md
git commit -m "Build Programs page; update README; complete frontend rebuild"
```

## Not covered by this plan

- **Cloudflare Pages deployment.** The spec names it as the default hosting target but explicitly calls it "not a hard requirement." No task here configures an adapter, `wrangler.toml`, or an actual deploy — the deliverable is a verified local build. Deploying it is a short follow-up once this plan is complete and reviewed, not a step hidden inside it.
- Everything in the spec's "Open items carried to later sub-projects" section (live form submission, the Safety Intelligence Database, the Research Assistant, the bulletin CMS, GitHub repo creation) — each is its own future sub-project with its own spec and plan.
