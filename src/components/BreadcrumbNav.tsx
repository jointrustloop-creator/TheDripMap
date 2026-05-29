import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  /** Optional className applied to the wrapping <nav> — use for color overrides
      on dark backgrounds (e.g., "text-white/70" inside the magazine hero). */
  className?: string;
  /** Color override for the active (last) item — defaults to slate-900.
      Set to "text-white" when rendering on a dark background. */
  activeClassName?: string;
}

export const BreadcrumbNav = ({ items, className, activeClassName }: BreadcrumbNavProps) => {
  const SITE_URL = 'https://www.thedripmap.com';
  const homeEntry = {
    "@type": "ListItem",
    "position": 1,
    "name": "Home",
    "item": SITE_URL,
  };
  const itemEntries = items.map((item, index) => {
    const entry: Record<string, unknown> = {
      "@type": "ListItem",
      "position": index + 2,
      "name": item.label,
    };
    if (item.href) entry.item = `${SITE_URL}${item.href}`;
    return entry;
  });
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [homeEntry, ...itemEntries],
  };

  return (
    <nav className={cn(
      "flex items-center gap-2 text-xs font-bold text-slate-400 mb-8 overflow-x-auto no-scrollbar py-2",
      className
    )}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Link href="/" className="flex items-center gap-1 hover:text-wellness-600 transition-colors shrink-0">
        <Home size={14} />
        <span>Home</span>
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={12} className="shrink-0" />
          {item.href ? (
            <Link href={item.href} className="hover:text-wellness-600 transition-colors shrink-0">
              {item.label}
            </Link>
          ) : (
            <span className={cn("shrink-0", activeClassName ?? "text-slate-900")}>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
