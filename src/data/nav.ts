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
