"use client";

import { useState, useEffect } from "react";
import { X, Plus, ChevronDown, ChevronUp } from "lucide-react";

export type CountryLocation = {
  countryCode: string;
  countryName: string;
  regions: string[];
  cities: string[];
  parks: string[];
};

export type LocationSelection = {
  countries: CountryLocation[];
};

export type MultiCountryLocationSelectorProps = {
  value: LocationSelection;
  onChange: (value: LocationSelection) => void;
  countries: Array<{ code: string; name: string }>;
  required?: boolean;
};

export function MultiCountryLocationSelector({
  value,
  onChange,
  countries,
  required = false,
}: MultiCountryLocationSelectorProps) {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());

  // Initialize from value
  useEffect(() => {
    if (value.countries.length > 0) {
      setSelectedCountries(value.countries.map(c => c.countryCode));
      setExpandedCountries(new Set(value.countries.map(c => c.countryCode)));
    }
  }, []);

  const availableCountries = countries.filter(
    country => !selectedCountries.includes(country.code)
  );

  const handleAddCountry = (countryCode: string) => {
    if (!countryCode || selectedCountries.includes(countryCode)) return;

    const country = countries.find(c => c.code === countryCode);
    if (!country) return;

    const newCountries = [
      ...value.countries,
      {
        countryCode: country.code,
        countryName: country.name,
        regions: [],
        cities: [],
        parks: [],
      },
    ];

    setSelectedCountries([...selectedCountries, countryCode]);
    setExpandedCountries(new Set([...expandedCountries, countryCode]));
    onChange({ countries: newCountries });
  };

  const handleRemoveCountry = (countryCode: string) => {
    const newCountries = value.countries.filter(c => c.countryCode !== countryCode);
    setSelectedCountries(selectedCountries.filter(code => code !== countryCode));

    const newExpanded = new Set(expandedCountries);
    newExpanded.delete(countryCode);
    setExpandedCountries(newExpanded);

    onChange({ countries: newCountries });
  };

  const toggleExpanded = (countryCode: string) => {
    const newExpanded = new Set(expandedCountries);
    if (newExpanded.has(countryCode)) {
      newExpanded.delete(countryCode);
    } else {
      newExpanded.add(countryCode);
    }
    setExpandedCountries(newExpanded);
  };

  const handleAddTag = (countryCode: string, field: 'regions' | 'cities' | 'parks', tagValue: string) => {
    if (!tagValue.trim()) return;

    const newCountries = value.countries.map(country => {
      if (country.countryCode === countryCode) {
        return {
          ...country,
          [field]: [...country[field], tagValue.trim()],
        };
      }
      return country;
    });

    onChange({ countries: newCountries });
  };

  const handleRemoveTag = (countryCode: string, field: 'regions' | 'cities' | 'parks', index: number) => {
    const newCountries = value.countries.map(country => {
      if (country.countryCode === countryCode) {
        return {
          ...country,
          [field]: country[field].filter((_, i) => i !== index),
        };
      }
      return country;
    });

    onChange({ countries: newCountries });
  };

  return (
    <div className="space-y-4">
      {/* Country Selection Dropdown */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Select Countries {required && <span className="text-red-500">*</span>}
        </label>
        <p className="text-xs text-foreground/60">
          Choose all countries where you offer services
        </p>
        <select
          value=""
          onChange={(e) => handleAddCountry(e.target.value)}
          className="w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">-- Select a country to add --</option>
          {availableCountries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      {/* Validation Message */}
      {selectedCountries.length === 0 && required && (
        <p className="text-sm text-red-500">Please select at least one country</p>
      )}

      {/* Selected Countries */}
      <div className="space-y-3">
        {value.countries.map((country) => (
          <div
            key={country.countryCode}
            className="rounded-xl border border-foreground/15 bg-white/80 overflow-hidden"
          >
            {/* Country Header */}
            <div className="flex items-center justify-between p-4 bg-primary/5">
              <div className="flex items-center gap-3 flex-1">
                <button
                  type="button"
                  onClick={() => toggleExpanded(country.countryCode)}
                  className="hover:text-primary transition"
                >
                  {expandedCountries.has(country.countryCode) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                <div>
                  <h3 className="font-semibold text-foreground">{country.countryName}</h3>
                  <p className="text-xs text-foreground/60">
                    {country.regions.length} regions, {country.cities.length} cities, {country.parks.length} parks
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCountry(country.countryCode)}
                className="text-red-500 hover:text-red-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Expanded Content */}
            {expandedCountries.has(country.countryCode) && (
              <div className="p-4 space-y-4">
                <TagInput
                  label="Regions / Provinces"
                  placeholder="Type region name and press Enter or click +"
                  tags={country.regions}
                  onAdd={(val) => handleAddTag(country.countryCode, 'regions', val)}
                  onRemove={(index) => handleRemoveTag(country.countryCode, 'regions', index)}
                  hint="Add states, provinces, or regions where you operate"
                  required
                />

                <TagInput
                  label="Cities"
                  placeholder="Type city name and press Enter or click +"
                  tags={country.cities}
                  onAdd={(val) => handleAddTag(country.countryCode, 'cities', val)}
                  onRemove={(index) => handleRemoveTag(country.countryCode, 'cities', index)}
                  hint="Add specific cities within the selected regions"
                  required
                />

                <TagInput
                  label="National Parks (Optional)"
                  placeholder="Type park name and press Enter or click +"
                  tags={country.parks}
                  onAdd={(val) => handleAddTag(country.countryCode, 'parks', val)}
                  onRemove={(index) => handleRemoveTag(country.countryCode, 'parks', index)}
                  hint="Add national parks or protected areas"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name="locationData"
        value={JSON.stringify(value)}
        required={required && selectedCountries.length === 0}
      />
    </div>
  );
}

type TagInputProps = {
  label: string;
  placeholder: string;
  tags: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  hint?: string;
  required?: boolean;
};

function TagInput({ label, placeholder, tags, onAdd, onRemove, hint, required }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        onAdd(inputValue);
        setInputValue("");
      }
    }
  };

  const handleAddClick = () => {
    if (inputValue.trim()) {
      onAdd(inputValue);
      setInputValue("");
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-foreground/60">{hint}</p>}

      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={handleAddClick}
          className="rounded-lg border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="hover:text-red-500 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {required && tags.length === 0 && (
        <p className="text-xs text-red-500">Please add at least one {label.toLowerCase()}</p>
      )}
    </div>
  );
}
