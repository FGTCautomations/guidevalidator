"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

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

type LocationOption = {
  id: string;
  name: string;
  code?: string;
};

export function MultiCountryLocationSelector({
  value,
  onChange,
  countries,
  required = false,
}: MultiCountryLocationSelectorProps) {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());

  // Location data cache
  const [locationData, setLocationData] = useState<{
    [countryCode: string]: {
      regions: LocationOption[];
      cities: LocationOption[];
      parks: LocationOption[];
      loading: boolean;
      citiesLoading: boolean;
      parksLoading: boolean;
    };
  }>({});

  // Track selected region IDs for each country
  const [selectedRegionIds, setSelectedRegionIds] = useState<{
    [countryCode: string]: Set<string>;
  }>({});

  // Initialize from value
  useEffect(() => {
    if (value.countries.length > 0) {
      setSelectedCountries(value.countries.map(c => c.countryCode));
      setExpandedCountries(new Set(value.countries.map(c => c.countryCode)));

      // Fetch location data for each country
      value.countries.forEach(country => {
        fetchRegions(country.countryCode);
      });
    }
  }, []);

  const fetchRegions = async (countryCode: string) => {
    if (locationData[countryCode]?.regions.length > 0) return; // Already loaded

    setLocationData(prev => ({
      ...prev,
      [countryCode]: {
        regions: [],
        cities: [],
        parks: [],
        loading: true,
        citiesLoading: false,
        parksLoading: false,
      },
    }));

    try {
      const response = await fetch(`/api/locations/regions?country=${countryCode}`);
      const data = await response.json();

      setLocationData(prev => ({
        ...prev,
        [countryCode]: {
          ...prev[countryCode],
          regions: data.regions || [],
          loading: false,
        },
      }));
    } catch (error) {
      console.error(`Error fetching regions for ${countryCode}:`, error);
      setLocationData(prev => ({
        ...prev,
        [countryCode]: {
          ...prev[countryCode],
          regions: [],
          loading: false,
        },
      }));
    }
  };

  const fetchCitiesForRegions = async (countryCode: string, regionIds: string[]) => {
    if (regionIds.length === 0) {
      // No regions selected, clear cities
      setLocationData(prev => ({
        ...prev,
        [countryCode]: {
          ...prev[countryCode],
          cities: [],
          citiesLoading: false,
        },
      }));
      return;
    }

    setLocationData(prev => ({
      ...prev,
      [countryCode]: {
        ...prev[countryCode],
        citiesLoading: true,
      },
    }));

    try {
      // Fetch cities for each selected region
      const citiesPromises = regionIds.map(regionId =>
        fetch(`/api/locations/cities?region=${regionId}`).then(res => res.json())
      );

      const citiesResults = await Promise.all(citiesPromises);
      const allCities: LocationOption[] = [];
      const seenIds = new Set<string>();

      citiesResults.forEach(result => {
        if (result.cities) {
          result.cities.forEach((city: LocationOption) => {
            if (!seenIds.has(city.id)) {
              seenIds.add(city.id);
              allCities.push(city);
            }
          });
        }
      });

      setLocationData(prev => ({
        ...prev,
        [countryCode]: {
          ...prev[countryCode],
          cities: allCities,
          citiesLoading: false,
        },
      }));
    } catch (error) {
      console.error(`Error fetching cities for ${countryCode}:`, error);
      setLocationData(prev => ({
        ...prev,
        [countryCode]: {
          ...prev[countryCode],
          cities: [],
          citiesLoading: false,
        },
      }));
    }
  };

  const fetchParksForRegions = async (countryCode: string, regionIds: string[]) => {
    if (regionIds.length === 0) {
      // No regions selected, clear parks
      setLocationData(prev => ({
        ...prev,
        [countryCode]: {
          ...prev[countryCode],
          parks: [],
          parksLoading: false,
        },
      }));
      return;
    }

    setLocationData(prev => ({
      ...prev,
      [countryCode]: {
        ...prev[countryCode],
        parksLoading: true,
      },
    }));

    try {
      // Fetch parks for each selected region
      const parksPromises = regionIds.map(regionId =>
        fetch(`/api/locations/parks?region=${regionId}`).then(res => res.json())
      );

      const parksResults = await Promise.all(parksPromises);
      const allParks: LocationOption[] = [];
      const seenIds = new Set<string>();

      parksResults.forEach(result => {
        if (result.parks) {
          result.parks.forEach((park: LocationOption) => {
            if (!seenIds.has(park.id)) {
              seenIds.add(park.id);
              allParks.push(park);
            }
          });
        }
      });

      setLocationData(prev => ({
        ...prev,
        [countryCode]: {
          ...prev[countryCode],
          parks: allParks,
          parksLoading: false,
        },
      }));
    } catch (error) {
      console.error(`Error fetching parks for ${countryCode}:`, error);
      setLocationData(prev => ({
        ...prev,
        [countryCode]: {
          ...prev[countryCode],
          parks: [],
          parksLoading: false,
        },
      }));
    }
  };

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

    // Fetch regions for this country
    fetchRegions(countryCode);
  };

  const handleRemoveCountry = (countryCode: string) => {
    const newCountries = value.countries.filter(c => c.countryCode !== countryCode);
    setSelectedCountries(selectedCountries.filter(code => code !== countryCode));

    const newExpanded = new Set(expandedCountries);
    newExpanded.delete(countryCode);
    setExpandedCountries(newExpanded);

    // Clear region IDs
    const newRegionIds = { ...selectedRegionIds };
    delete newRegionIds[countryCode];
    setSelectedRegionIds(newRegionIds);

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

  const handleAddRegion = (countryCode: string, regionName: string, regionId: string) => {
    if (!regionName) return;

    // Add region name to countries
    const newCountries = value.countries.map(country => {
      if (country.countryCode === countryCode) {
        if (country.regions.includes(regionName)) return country;
        return {
          ...country,
          regions: [...country.regions, regionName],
        };
      }
      return country;
    });

    onChange({ countries: newCountries });

    // Track region ID
    const newRegionIds = {
      ...selectedRegionIds,
      [countryCode]: new Set([...(selectedRegionIds[countryCode] || []), regionId]),
    };
    setSelectedRegionIds(newRegionIds);

    // Fetch cities and parks for all selected regions in this country
    const regionIds = Array.from(newRegionIds[countryCode]);
    fetchCitiesForRegions(countryCode, regionIds);
    fetchParksForRegions(countryCode, regionIds);
  };

  const handleRemoveRegion = (countryCode: string, regionName: string) => {
    // Remove region name from countries
    const newCountries = value.countries.map(country => {
      if (country.countryCode === countryCode) {
        return {
          ...country,
          regions: country.regions.filter(r => r !== regionName),
          // Also clear cities and parks from this region
          cities: [],
          parks: [],
        };
      }
      return country;
    });

    onChange({ countries: newCountries });

    // Find region ID by name and remove it
    const countryData = locationData[countryCode];
    const regionToRemove = countryData?.regions.find(r => r.name === regionName);

    if (regionToRemove) {
      const currentRegionIds = selectedRegionIds[countryCode] || new Set();
      currentRegionIds.delete(regionToRemove.id);

      const newRegionIds = {
        ...selectedRegionIds,
        [countryCode]: currentRegionIds,
      };
      setSelectedRegionIds(newRegionIds);

      // Re-fetch cities and parks for remaining regions
      const regionIds = Array.from(currentRegionIds);
      fetchCitiesForRegions(countryCode, regionIds);
      fetchParksForRegions(countryCode, regionIds);
    }
  };

  const handleAddSelection = (countryCode: string, field: 'cities' | 'parks', itemName: string) => {
    if (!itemName) return;

    const newCountries = value.countries.map(country => {
      if (country.countryCode === countryCode) {
        if (country[field].includes(itemName)) return country;
        return {
          ...country,
          [field]: [...country[field], itemName],
        };
      }
      return country;
    });

    onChange({ countries: newCountries });
  };

  const handleRemoveSelection = (countryCode: string, field: 'cities' | 'parks', itemName: string) => {
    const newCountries = value.countries.map(country => {
      if (country.countryCode === countryCode) {
        return {
          ...country,
          [field]: country[field].filter(item => item !== itemName),
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
        {value.countries.map((country) => {
          const countryData = locationData[country.countryCode];
          const isLoading = countryData?.loading ?? true;
          const citiesLoading = countryData?.citiesLoading ?? false;
          const parksLoading = countryData?.parksLoading ?? false;

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
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-foreground/60">Loading regions...</span>
                    </div>
                  ) : (
                    <>
                      {/* Regions - Always shown first */}
                      <RegionSelector
                        label="Regions / Provinces"
                        hint="Select states, provinces, or regions where you operate"
                        regions={countryData?.regions || []}
                        selected={country.regions}
                        onAdd={(name, id) => handleAddRegion(country.countryCode, name, id)}
                        onRemove={(name) => handleRemoveRegion(country.countryCode, name)}
                        required
                      />

                      {/* Cities - Only shown after regions are selected */}
                      {country.regions.length > 0 && (
                        <>
                          {citiesLoading ? (
                            <div className="flex items-center py-4">
                              <Loader2 className="w-5 h-5 animate-spin text-primary" />
                              <span className="ml-2 text-sm text-foreground/60">Loading cities for selected regions...</span>
                            </div>
                          ) : (
                            <DropdownSelector
                              label="Cities"
                              hint="Select cities in the selected regions"
                              options={countryData?.cities || []}
                              selected={country.cities}
                              onAdd={(name) => handleAddSelection(country.countryCode, 'cities', name)}
                              onRemove={(name) => handleRemoveSelection(country.countryCode, 'cities', name)}
                              required
                            />
                          )}
                        </>
                      )}

                      {/* National Parks - Only shown after regions are selected */}
                      {country.regions.length > 0 && (
                        <>
                          {parksLoading ? (
                            <div className="flex items-center py-4">
                              <Loader2 className="w-5 h-5 animate-spin text-primary" />
                              <span className="ml-2 text-sm text-foreground/60">Loading parks for selected regions...</span>
                            </div>
                          ) : (
                            <DropdownSelector
                              label="National Parks (Optional)"
                              hint="Select parks and tourist attractions in the selected regions"
                              options={countryData?.parks || []}
                              selected={country.parks}
                              onAdd={(name) => handleAddSelection(country.countryCode, 'parks', name)}
                              onRemove={(name) => handleRemoveSelection(country.countryCode, 'parks', name)}
                            />
                          )}
                        </>
                      )}

                      {country.regions.length === 0 && (
                        <p className="text-sm text-foreground/60 italic">
                          Select regions first to see cities and parks
                        </p>
                      )}
                    </>
                  )}
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

type RegionSelectorProps = {
  label: string;
  hint?: string;
  regions: LocationOption[];
  selected: string[];
  onAdd: (name: string, id: string) => void;
  onRemove: (name: string) => void;
  required?: boolean;
};

function RegionSelector({
  label,
  hint,
  regions,
  selected,
  onAdd,
  onRemove,
  required
}: RegionSelectorProps) {
  const availableRegions = regions.filter(reg => !selected.includes(reg.name));

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-foreground/60">{hint}</p>}

      <select
        value=""
        onChange={(e) => {
          const selectedOption = regions.find(r => r.id === e.target.value);
          if (selectedOption) {
            onAdd(selectedOption.name, selectedOption.id);
          }
        }}
        className="w-full rounded-lg border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="">-- Select {label.toLowerCase()} --</option>
        {availableRegions.map((region) => (
          <option key={region.id} value={region.id}>
            {region.name}
          </option>
        ))}
      </select>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.map((regionName) => (
            <span
              key={regionName}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
            >
              {regionName}
              <button
                type="button"
                onClick={() => onRemove(regionName)}
                className="hover:text-red-500 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {required && selected.length === 0 && (
        <p className="text-xs text-red-500">Please select at least one {label.toLowerCase()}</p>
      )}
    </div>
  );
}

type DropdownSelectorProps = {
  label: string;
  hint?: string;
  options: LocationOption[];
  selected: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  required?: boolean;
};

function DropdownSelector({
  label,
  hint,
  options,
  selected,
  onAdd,
  onRemove,
  required
}: DropdownSelectorProps) {
  const availableOptions = options.filter(opt => !selected.includes(opt.name));

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-foreground/60">{hint}</p>}

      <select
        value=""
        onChange={(e) => {
          if (e.target.value) {
            onAdd(e.target.value);
          }
        }}
        className="w-full rounded-lg border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        disabled={options.length === 0}
      >
        <option value="">
          {options.length === 0
            ? `No ${label.toLowerCase()} available`
            : `-- Select ${label.toLowerCase()} --`}
        </option>
        {availableOptions.map((option) => (
          <option key={option.id} value={option.name}>
            {option.name}
          </option>
        ))}
      </select>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="hover:text-red-500 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {required && selected.length === 0 && (
        <p className="text-xs text-red-500">Please select at least one {label.toLowerCase()}</p>
      )}
    </div>
  );
}
