"use client";

import { useState, useMemo } from "react";
import { X, Search, ChevronDown, ChevronUp } from "lucide-react";

type Park = {
  id: string;
  name: string;
  type?: string;
  unesco_site?: boolean;
};

type ParksDropdownProps = {
  label: string;
  hint?: string;
  loading?: boolean;
  parks: Park[];
  selectedParks: Park[];
  onAdd: (parkId: string) => void;
  onRemove: (parkId: string) => void;
  placeholder: string;
};

export function ParksDropdownWithSearch({
  label,
  hint,
  loading,
  parks,
  selectedParks,
  onAdd,
  onRemove,
  placeholder,
}: ParksDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLetters, setExpandedLetters] = useState<Set<string>>(new Set());

  // Filter parks by search query
  const filteredParks = useMemo(() => {
    if (!searchQuery.trim()) return parks;

    const query = searchQuery.toLowerCase();
    return parks.filter(park =>
      park.name.toLowerCase().includes(query) ||
      park.type?.toLowerCase().includes(query)
    );
  }, [parks, searchQuery]);

  // Group parks by first letter
  const parksByLetter = useMemo(() => {
    const grouped: Record<string, Park[]> = {};

    filteredParks.forEach(park => {
      const firstLetter = park.name[0]?.toUpperCase() || '#';
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(park);
    });

    // Sort each group alphabetically
    Object.keys(grouped).forEach(letter => {
      grouped[letter].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [filteredParks]);

  // Get sorted letters
  const letters = useMemo(() => {
    return Object.keys(parksByLetter).sort();
  }, [parksByLetter]);

  const toggleLetter = (letter: string) => {
    const newExpanded = new Set(expandedLetters);
    if (newExpanded.has(letter)) {
      newExpanded.delete(letter);
    } else {
      newExpanded.add(letter);
    }
    setExpandedLetters(newExpanded);
  };

  const expandAll = () => {
    setExpandedLetters(new Set(letters));
  };

  const collapseAll = () => {
    setExpandedLetters(new Set());
  };

  const selectedParkIds = useMemo(() =>
    new Set(selectedParks.map(p => p.id)),
    [selectedParks]
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
      </label>
      {hint && <p className="text-xs text-foreground/60">{hint}</p>}

      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-foreground/60">Loading parks...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search parks..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-foreground/15 bg-background/80 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Stats and Actions */}
          <div className="flex items-center justify-between text-xs text-foreground/60">
            <span>
              {filteredParks.length} park{filteredParks.length !== 1 ? 's' : ''}
              {searchQuery && ` found`}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={expandAll}
                className="hover:text-primary transition"
              >
                Expand All
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={collapseAll}
                className="hover:text-primary transition"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Alphabetical Groups */}
          {filteredParks.length === 0 ? (
            <div className="text-center py-8 text-sm text-foreground/40">
              {searchQuery ? `No parks found matching "${searchQuery}"` : 'No parks available'}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto border border-foreground/15 rounded-lg">
              {letters.map((letter) => {
                const parksInGroup = parksByLetter[letter];
                const isExpanded = expandedLetters.has(letter);

                return (
                  <div key={letter} className="border-b border-foreground/10 last:border-b-0">
                    {/* Letter Header */}
                    <button
                      type="button"
                      onClick={() => toggleLetter(letter)}
                      className="w-full flex items-center justify-between p-3 bg-foreground/5 hover:bg-foreground/10 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-primary">{letter}</span>
                        <span className="text-xs text-foreground/60">
                          ({parksInGroup.length})
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-foreground/60" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-foreground/60" />
                      )}
                    </button>

                    {/* Parks List */}
                    {isExpanded && (
                      <div className="divide-y divide-foreground/5">
                        {parksInGroup.map((park) => {
                          const isSelected = selectedParkIds.has(park.id);

                          return (
                            <div
                              key={park.id}
                              className={`flex items-center justify-between p-3 hover:bg-primary/5 transition ${
                                isSelected ? 'bg-primary/10' : ''
                              }`}
                            >
                              <div className="flex-1 min-w-0 pr-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-foreground truncate">
                                    {park.name}
                                  </span>
                                  {park.unesco_site && (
                                    <span className="text-xs">🌍</span>
                                  )}
                                </div>
                                {park.type && (
                                  <p className="text-xs text-foreground/50 truncate">
                                    {park.type}
                                  </p>
                                )}
                              </div>

                              {isSelected ? (
                                <button
                                  type="button"
                                  onClick={() => onRemove(park.id)}
                                  className="flex-shrink-0 text-xs px-3 py-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                                >
                                  Remove
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onAdd(park.id)}
                                  className="flex-shrink-0 text-xs px-3 py-1 rounded-full bg-primary text-white hover:bg-primary/90 transition"
                                >
                                  Add
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Parks Summary */}
          {selectedParks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-foreground/70">
                  Selected ({selectedParks.length}):
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedParks.map((park) => (
                  <span
                    key={park.id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary border border-primary/20"
                  >
                    <span className="truncate max-w-xs">
                      {park.name}
                      {park.unesco_site && ' 🌍'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemove(park.id)}
                      className="hover:text-red-500 transition ml-1 flex-shrink-0"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
