"use client";

import { useState } from "react";

interface CustomLanguageInputProps {
  value: string[];
  onChange: (languages: string[]) => void;
  label?: string;
  availableLanguages?: string[];
}

const DEFAULT_LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese",
  "Russian", "Chinese", "Japanese", "Korean", "Arabic", "Hindi",
  "Dutch", "Swedish", "Norwegian", "Danish", "Finnish", "Polish",
  "Turkish", "Greek", "Hebrew", "Thai", "Vietnamese", "Indonesian",
  "Malay", "Tagalog", "Swahili", "Czech", "Hungarian", "Romanian"
];

export function CustomLanguageInput({
  value = [],
  onChange,
  label = "Languages Spoken",
  availableLanguages = DEFAULT_LANGUAGES,
}: CustomLanguageInputProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customLanguage, setCustomLanguage] = useState("");

  const handleToggleLanguage = (language: string) => {
    if (value.includes(language)) {
      onChange(value.filter((l) => l !== language));
    } else {
      onChange([...value, language]);
    }
  };

  const handleAddCustomLanguage = () => {
    if (customLanguage.trim() && !value.includes(customLanguage.trim())) {
      onChange([...value, customLanguage.trim()]);
      setCustomLanguage("");
      setShowCustomInput(false);
    }
  };

  const handleRemoveLanguage = (language: string) => {
    onChange(value.filter((l) => l !== language));
  };

  // Separate custom languages (not in default list) from standard ones
  const customLanguages = value.filter((lang) => !availableLanguages.includes(lang));

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        {label} <span className="text-red-500">*</span>
      </label>

      {/* Selected Languages Display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          {value.map((language) => (
            <span
              key={language}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-green-300 rounded-full text-sm font-medium text-green-900"
            >
              {language}
              <button
                type="button"
                onClick={() => handleRemoveLanguage(language)}
                className="hover:text-red-600 focus:outline-none"
                aria-label={`Remove ${language}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Standard Language Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {availableLanguages.map((language) => (
          <label
            key={language}
            className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
              value.includes(language)
                ? "bg-primary/10 border-primary text-primary font-medium"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="checkbox"
              checked={value.includes(language)}
              onChange={() => handleToggleLanguage(language)}
              className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-sm">{language}</span>
          </label>
        ))}
      </div>

      {/* Add Custom Language */}
      {!showCustomInput ? (
        <button
          type="button"
          onClick={() => setShowCustomInput(true)}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <span className="text-lg">+</span>
          Add a language not listed
        </button>
      ) : (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Enter custom language:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customLanguage}
              onChange={(e) => setCustomLanguage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomLanguage();
                }
              }}
              placeholder="e.g., Catalan, Basque, etc."
              className="flex-1 rounded border border-foreground/20 bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddCustomLanguage}
              className="px-4 py-2 bg-primary text-white rounded font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCustomInput(false);
                setCustomLanguage("");
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded font-medium text-sm hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Custom Languages Notice */}
      {customLanguages.length > 0 && (
        <p className="text-xs text-blue-600">
          Custom language(s) added: {customLanguages.join(", ")}
        </p>
      )}

      {value.length === 0 && (
        <p className="text-xs text-red-600">
          Please select at least one language
        </p>
      )}
    </div>
  );
}
