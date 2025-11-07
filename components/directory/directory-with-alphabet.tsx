"use client";

import { useState, useEffect, useMemo } from "react";
import { AlphabetFilter } from "./alphabet-filter";
import { CachedDirectoryClient } from "./cached-directory-client";
import type { DirectoryListing } from "@/lib/directory/types";

interface DirectoryWithAlphabetProps {
  initialListings: DirectoryListing[];
  countryCode: string;
  actionLabel: string;
  emptyTitle: string;
  emptyDescription: string;
}

export function DirectoryWithAlphabet({
  initialListings,
  countryCode,
  actionLabel,
  emptyTitle,
  emptyDescription,
}: DirectoryWithAlphabetProps) {
  const [selectedLetter, setSelectedLetter] = useState("A");

  // Find which letters have guides
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    initialListings.forEach(listing => {
      const firstChar = listing.name.charAt(0).toUpperCase();
      if (/^[A-Z]$/.test(firstChar)) {
        letters.add(firstChar);
      } else {
        letters.add("#");
      }
    });
    return letters;
  }, [initialListings]);

  // When data changes, ensure selected letter has guides, or switch to first available
  useEffect(() => {
    if (initialListings.length > 0 && !availableLetters.has(selectedLetter)) {
      // Current letter has no guides, find first available letter
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#";
      const firstAvailable = alphabet.split("").find(letter => availableLetters.has(letter));
      if (firstAvailable) {
        console.log(`[DirectoryWithAlphabet] Switching from '${selectedLetter}' to '${firstAvailable}' (no guides found)`);
        setSelectedLetter(firstAvailable);
      }
    }
  }, [initialListings, selectedLetter, availableLetters]);

  return (
    <div className="space-y-6">
      {/* Alphabet Filter - Always visible */}
      <AlphabetFilter
        selectedLetter={selectedLetter}
        allListings={initialListings}
        onLetterChange={setSelectedLetter}
      />

      {/* Results Grid */}
      <CachedDirectoryClient
        initialListings={initialListings}
        countryCode={countryCode}
        selectedLetter={selectedLetter}
        actionLabel={actionLabel}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    </div>
  );
}
