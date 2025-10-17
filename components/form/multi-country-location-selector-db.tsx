"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { ParksDropdownWithSearch } from "./parks-dropdown-with-search";

// Types matching database structure
type Country = {
  code: string;
  name: string;
  region?: string;
  flag_emoji?: string;
};

type Region = {
  id: string;
  name: string;
  type?: string;
  code?: string;
  capital?: string;
};

type City = {
  id: string;
  name: string;
  population?: number;
  is_capital?: boolean;
  is_major_city?: boolean;
};

type Park = {
  id: string;
  name: string;
  type?: string;
  unesco_site?: boolean;
};

export type CountryLocation = {
  countryCode: string;
  countryName: string;
  regions: string[]; // region IDs
  cities: string[]; // city IDs
  parks: string[]; // park IDs
};

export type LocationSelection = {
  countries: CountryLocation[];
};

export type MultiCountryLocationSelectorProps = {
  value: LocationSelection;
  onChange: (value: LocationSelection) => void;
  required?: boolean;
};

export function MultiCountryLocationSelectorDB({
  value,
  onChange,
  required = false,
}: MultiCountryLocationSelectorProps) {
  // State
  const [countries, setCountries] = useState<Country[]>([]);
  const [regionsByCountry, setRegionsByCountry] = useState<Record<string, Region[]>>({});
  const [citiesByRegion, setCitiesByRegion] = useState<Record<string, City[]>>({});
  const [parksByCountry, setParksByCountry] = useState<Record<string, Park[]>>({});

  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [loadingRegions, setLoadingRegions] = useState<Record<string, boolean>>({});
  const [loadingCities, setLoadingCities] = useState<Record<string, boolean>>({});
  const [loadingParks, setLoadingParks] = useState<Record<string, boolean>>({});

  // Fetch all countries on mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Initialize from value
  useEffect(() => {
    if (value.countries.length > 0) {
      setSelectedCountries(value.countries.map(c => c.countryCode));
      setExpandedCountries(new Set(value.countries.map(c => c.countryCode)));
      // Fetch regions for already selected countries
      value.countries.forEach(country => {
        fetchRegions(country.countryCode);
        fetchParks(country.countryCode);
      });
    }
  }, []);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/locations/countries');
      const data = await response.json();
      if (data.countries) {
        setCountries(data.countries);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async (countryCode: string) => {
    if (regionsByCountry[countryCode]) return; // Already loaded

    try {
      setLoadingRegions(prev => ({ ...prev, [countryCode]: true }));
      const response = await fetch(`/api/locations/regions?country=${countryCode}`);
      const data = await response.json();
      if (data.regions) {
        setRegionsByCountry(prev => ({ ...prev, [countryCode]: data.regions }));
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
    } finally {
      setLoadingRegions(prev => ({ ...prev, [countryCode]: false }));
    }
  };

  const fetchCities = async (regionId: string) => {
    if (citiesByRegion[regionId]) return; // Already loaded

    try {
      setLoadingCities(prev => ({ ...prev, [regionId]: true }));
      const response = await fetch(`/api/locations/cities?region=${regionId}`);
      const data = await response.json();
      if (data.cities) {
        setCitiesByRegion(prev => ({ ...prev, [regionId]: data.cities }));
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoadingCities(prev => ({ ...prev, [regionId]: false }));
    }
  };

  const fetchParks = async (countryCode: string) => {
    if (parksByCountry[countryCode]) return; // Already loaded

    try {
      setLoadingParks(prev => ({ ...prev, [countryCode]: true }));

      // Fetch parks in batches to overcome Supabase 1000-row limit
      let allParks: Park[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `/api/locations/parks?country=${countryCode}&offset=${page * pageSize}&limit=${pageSize}`
        );
        const data = await response.json();

        if (data.parks && data.parks.length > 0) {
          allParks = [...allParks, ...data.parks];
          hasMore = data.parks.length === pageSize; // If we got a full page, there might be more
          page++;
        } else {
          hasMore = false;
        }
      }

      setParksByCountry(prev => ({ ...prev, [countryCode]: allParks }));
    } catch (error) {
      console.error('Error fetching parks:', error);
    } finally {
      setLoadingParks(prev => ({ ...prev, [countryCode]: false }));
    }
  };

  const availableCountries = countries.filter(
    country => !selectedCountries.includes(country.code)
  );

  const handleAddCountry = async (countryCode: string) => {
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

    // Fetch regions and parks for this country
    await fetchRegions(countryCode);
    await fetchParks(countryCode);
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

  const handleAddRegion = async (countryCode: string, regionId: string) => {
    if (!regionId) return;

    // Check if already selected
    const country = value.countries.find(c => c.countryCode === countryCode);
    if (country && country.regions.includes(regionId)) return;

    const newCountries = value.countries.map(country => {
      if (country.countryCode === countryCode) {
        return {
          ...country,
          regions: [...country.regions, regionId],
        };
      }
      return country;
    });

    onChange({ countries: newCountries });

    // Fetch cities for this region
    await fetchCities(regionId);
  };

  const handleRemoveRegion = (countryCode: string, regionId: string) => {
    const newCountries = value.countries.map(country => {
      if (country.countryCode === countryCode) {
        return {
          ...country,
          regions: country.regions.filter(id => id !== regionId),
          // Also remove cities from this region
          cities: country.cities.filter(cityId => {
            const cities = citiesByRegion[regionId] || [];
            return !cities.some(c => c.id === cityId);
          }),
        };
      }
      return country;
    });

    onChange({ countries: newCountries });
  };

  const handleAddCity = (countryCode: string, cityId: string) => {
    if (!cityId) return;

    const newCountries = value.countries.map(country => {
      if (country.countryCode === countryCode) {
        return {
          ...country,
          cities: [...country.cities, cityId],
        };
      }
      return country;
    });

    onChange({ countries: newCountries });
  };

  const handleRemoveCity = (countryCode: string, cityId: string) => {
    const newCountries = value.countries.map(country => {
      if (country.countryCode === countryCode) {
        return {
          ...country,
          cities: country.cities.filter(id => id !== cityId),
        };
      }
      return country;
    });

    onChange({ countries: newCountries });
  };

  const handleAddPark = (countryCode: string, parkId: string) => {
    if (!parkId) return;

    const newCountries = value.countries.map(country => {
      if (country.countryCode === countryCode) {
        return {
          ...country,
          parks: [...country.parks, parkId],
        };
      }
      return country;
    });

    onChange({ countries: newCountries });
  };

  const handleRemovePark = (countryCode: string, parkId: string) => {
    const newCountries = value.countries.map(country => {
      if (country.countryCode === countryCode) {
        return {
          ...country,
          parks: country.parks.filter(id => id !== parkId),
        };
      }
      return country;
    });

    onChange({ countries: newCountries });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-foreground/60">Loading countries...</span>
      </div>
    );
  }

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
              {country.flag_emoji ? `${country.flag_emoji} ` : ''}{country.name}
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
        {value.countries.map((country) => {
          const regions = regionsByCountry[country.countryCode] || [];
          const parks = parksByCountry[country.countryCode] || [];
          const availableRegions = regions.filter(r => !country.regions.includes(r.id));
          const availableParks = parks.filter(p => !country.parks.includes(p.id));

          // Get all cities from selected regions
          const allCitiesForCountry: City[] = [];
          country.regions.forEach(regionId => {
            const cities = citiesByRegion[regionId] || [];
            allCitiesForCountry.push(...cities);
          });
          const availableCities = allCitiesForCountry.filter(c => !country.cities.includes(c.id));

          return (
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
                  {/* Regions Dropdown */}
                  <DropdownSelect
                    label="Regions / Provinces"
                    hint="Select states, provinces, or regions where you operate"
                    required
                    loading={loadingRegions[country.countryCode]}
                    options={availableRegions}
                    selectedOptions={country.regions.map(id => regions.find(r => r.id === id)).filter(Boolean) as Region[]}
                    getOptionLabel={(r) => `${r.name}${r.type ? ` (${r.type})` : ''}`}
                    getOptionValue={(r) => r.id}
                    onAdd={(regionId) => handleAddRegion(country.countryCode, regionId)}
                    onRemove={(regionId) => handleRemoveRegion(country.countryCode, regionId)}
                    placeholder="-- Select a region --"
                  />

                  {/* Cities Dropdown */}
                  <DropdownSelect
                    label="Cities"
                    hint="Select specific cities within the selected regions"
                    required
                    loading={Object.values(loadingCities).some(Boolean)}
                    options={availableCities}
                    selectedOptions={country.cities.map(id => allCitiesForCountry.find(c => c.id === id)).filter(Boolean) as City[]}
                    getOptionLabel={(c) => `${c.name}${c.is_capital ? ' 🏛️' : ''}${c.is_major_city ? ' ⭐' : ''}`}
                    getOptionValue={(c) => c.id}
                    onAdd={(cityId) => handleAddCity(country.countryCode, cityId)}
                    onRemove={(cityId) => handleRemoveCity(country.countryCode, cityId)}
                    placeholder={country.regions.length > 0 ? "-- Select a city --" : "Select regions first"}
                    disabled={country.regions.length === 0}
                  />

                  {/* Parks Dropdown with Search */}
                  <ParksDropdownWithSearch
                    label="National Parks (Optional)"
                    hint="Search and select national parks or protected areas"
                    loading={loadingParks[country.countryCode]}
                    parks={parks}
                    selectedParks={country.parks.map(id => parks.find(p => p.id === id)).filter(Boolean) as Park[]}
                    onAdd={(parkId) => handleAddPark(country.countryCode, parkId)}
                    onRemove={(parkId) => handleRemovePark(country.countryCode, parkId)}
                    placeholder="-- Select a park --"
                  />
                </div>
              )}
            </div>
          );
        })}
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

type DropdownSelectProps<T> = {
  label: string;
  hint?: string;
  required?: boolean;
  loading?: boolean;
  disabled?: boolean;
  options: T[];
  selectedOptions: T[];
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  placeholder: string;
};

function DropdownSelect<T>({
  label,
  hint,
  required,
  loading,
  disabled,
  options,
  selectedOptions,
  getOptionLabel,
  getOptionValue,
  onAdd,
  onRemove,
  placeholder,
}: DropdownSelectProps<T>) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-foreground/60">{hint}</p>}

      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-foreground/60">Loading...</span>
        </div>
      ) : (
        <>
          {/* Dropdown for adding items */}
          <select
            value=""
            onChange={(e) => {
              onAdd(e.target.value);
              e.target.value = ""; // Reset selection
            }}
            disabled={disabled || options.length === 0}
            className="w-full rounded-lg border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">{placeholder}</option>
            {options.length > 0 && (
              <option value="" disabled className="font-medium">
                ── {options.length} available ──
              </option>
            )}
            {options.map((option) => (
              <option key={getOptionValue(option)} value={getOptionValue(option)}>
                {getOptionLabel(option)}
              </option>
            ))}
          </select>

          {/* Show count and hint for multiple selection */}
          {options.length > 0 && selectedOptions.length === 0 && (
            <p className="text-xs text-foreground/50 italic">
              ✨ You can select multiple {label.toLowerCase()} - select from dropdown above
            </p>
          )}

          {/* Selected items as tags */}
          {selectedOptions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-foreground/70">
                  Selected ({selectedOptions.length}):
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedOptions.map((option) => (
                  <span
                    key={getOptionValue(option)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary border border-primary/20"
                  >
                    {getOptionLabel(option)}
                    <button
                      type="button"
                      onClick={() => onRemove(getOptionValue(option))}
                      className="hover:text-red-500 transition ml-1"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {required && selectedOptions.length === 0 && (
            <p className="text-xs text-red-500">⚠️ Please select at least one {label.toLowerCase()}</p>
          )}
        </>
      )}
    </div>
  );
}
