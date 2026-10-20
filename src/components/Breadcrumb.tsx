"use client";

import React from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = "" }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Fil d'Ariane" className={`py-2 ${className}`}>
      <ol className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 leading-normal">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5 min-w-0">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-[#0B1B3D] transition-colors flex items-center gap-1 shrink-0"
                >
                  {item.icon && (
                    <span className="material-symbols-outlined text-[15px] text-slate-400">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={`flex items-center gap-1 truncate ${
                    isLast ? "font-bold text-[#0B1B3D]" : "text-slate-500"
                  }`}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.icon && (
                    <span className="material-symbols-outlined text-[15px] text-slate-400">
                      {item.icon}
                    </span>
                  )}
                  <span className="truncate">{item.label}</span>
                </span>
              )}

              {!isLast && (
                <span
                  className="text-slate-400 select-none text-[13px] font-medium leading-none px-0.5"
                  aria-hidden="true"
                >
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
