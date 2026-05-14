import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
}

export const BreadcrumbNav = ({ items }: BreadcrumbNavProps) => {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": item.href ? `https://www.thedripmap.com${item.href}` : undefined
    }))
  };

  return (
    <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-8 overflow-x-auto no-scrollbar py-2">
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
            <span className="text-slate-900 shrink-0">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
