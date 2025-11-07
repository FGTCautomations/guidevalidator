"use client";

import { useMemo } from "react";
import type { DirectoryListing } from "@/lib/directory/types";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const SPECIAL = "#"; // For names starting with numbers or special characters

interface AlphabetFilterProps {
  selectedLetter: string;
  allListings: DirectoryListing[];
  onLetterChange: (letter: string) => void;
}

export function AlphabetFilter({ selectedLetter, allListings, onLetterChange }: AlphabetFilterProps) {
  // Calculate guide counts for each letter
  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    // Count for each alphabet letter
    ALPHABET.forEach(letter => {
      counts[letter] = allListings.filter(listing =>
        listing.name.charAt(0).toUpperCase() === letter
      ).length;
    });

    // Count for special characters
    counts[SPECIAL] = allListings.filter(listing => {
      const firstChar = listing.name.charAt(0).toUpperCase();
      return !/^[A-Z]$/.test(firstChar);
    }).length;

    return counts;
  }, [allListings]);

  const handleLetterClick = (letter: string) => {
    // Pure client-side - no URL changes, no server requests!
    onLetterChange(letter);
  };

  return (
    <div className="rounded-xl border border-foreground/10 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-foreground">Browse by Name</h3>
        <p className="text-xs text-foreground/60 mt-1">
          Click a letter to filter guides by first name
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Alphabet buttons */}
        {ALPHABET.map((letter) => {
          const count = letterCounts[letter] || 0;
          const hasGuides = count > 0;

          return (
            <button
              key={letter}
              onClick={() => handleLetterClick(letter)}
              disabled={!hasGuides}
              className={`
                relative flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-all
                ${selectedLetter === letter
                  ? "border-primary bg-primary text-white shadow-md"
                  : hasGuides
                    ? "border-primary/30 bg-primary/5 text-foreground hover:border-primary hover:bg-primary/10 hover:shadow-sm"
                    : "border-foreground/10 bg-gray-50 text-foreground/30 cursor-not-allowed"
                }
                disabled:opacity-50
              `}
              title={hasGuides ? `${count} guide${count === 1 ? '' : 's'} starting with ${letter}` : `No guides starting with ${letter}`}
            >
              {letter}
              {hasGuides && selectedLetter !== letter && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-white">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}

        {/* Special character button for names starting with numbers/symbols */}
        {(() => {
          const count = letterCounts[SPECIAL] || 0;
          const hasGuides = count > 0;

          return (
            <button
              onClick={() => handleLetterClick(SPECIAL)}
              disabled={!hasGuides}
              className={`
                relative flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-all
                ${selectedLetter === SPECIAL
                  ? "border-primary bg-primary text-white shadow-md"
                  : hasGuides
                    ? "border-primary/30 bg-primary/5 text-foreground hover:border-primary hover:bg-primary/10 hover:shadow-sm"
                    : "border-foreground/10 bg-gray-50 text-foreground/30 cursor-not-allowed"
                }
                disabled:opacity-50
              `}
              title={hasGuides ? `${count} guide${count === 1 ? '' : 's'} with special characters` : "No guides with special characters"}
            >
              {SPECIAL}
              {hasGuides && selectedLetter !== SPECIAL && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-white">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })()}
      </div>
    </div>
  );
}
