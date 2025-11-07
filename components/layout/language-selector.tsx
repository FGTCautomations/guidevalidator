"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { locales, localeLabels, type SupportedLocale } from "@/i18n/config";

interface LanguageSelectorProps {
  currentLocale: SupportedLocale;
}

export function LanguageSelector({ currentLocale }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleLanguageChange = (newLocale: SupportedLocale) => {
    setIsOpen(false);

    // Get the current path without the locale prefix
    const segments = pathname.split("/");
    segments[1] = newLocale; // Replace the locale segment
    const newPath = segments.join("/");

    // Use window.location for navigation to avoid typed routes issue
    window.location.href = newPath;
  };

  // Mapping of locale codes to flag emojis
  const localeFlags: Record<SupportedLocale, string> = {
    en: "🇬🇧",
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm font-medium text-foreground/80 transition hover:border-foreground/20 hover:text-foreground"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span className="text-base">{localeFlags[currentLocale]}</span>
        <span className="hidden sm:inline">{localeLabels[currentLocale]}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-foreground/10 bg-background shadow-lg">
          <div className="max-h-80 overflow-y-auto py-1">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => handleLanguageChange(locale)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-foreground/5 ${
                  locale === currentLocale
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-foreground/80"
                }`}
              >
                <span className="text-base">{localeFlags[locale]}</span>
                <span>{localeLabels[locale]}</span>
                {locale === currentLocale && (
                  <svg
                    className="ml-auto h-4 w-4 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
