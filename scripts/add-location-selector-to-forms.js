const fs = require('fs');
const path = require('path');

// Update DMC form
function updateDmcForm() {
  const filePath = path.join(__dirname, '..', 'components', 'auth', 'applications', 'dmc-sign-up-form.tsx');
  let content = fs.readFileSync(filePath, 'utf8');

  // Add import
  if (!content.includes('MultiCountryLocationSelector')) {
    content = content.replace(
      'import { LoginCredentialsInput } from "@/components/form/login-credentials-input";',
      'import { LoginCredentialsInput } from "@/components/form/login-credentials-input";\nimport { MultiCountryLocationSelector, type LocationSelection } from "@/components/form/multi-country-location-selector";'
    );
  }

  // Add state
  content = content.replace(
    'const [languages, setLanguages] = useState<string[]>([]);',
    'const [languages, setLanguages] = useState<string[]>([]);\n  const [locationData, setLocationData] = useState<LocationSelection>({ countries: [] });'
  );

  // Add hidden input
  content = content.replace(
    'value={JSON.stringify(languages)} />',
    'value={JSON.stringify(languages)} />\n      <input type="hidden" name="locationData" value={JSON.stringify(locationData)} />'
  );

  // Replace destination coverage textarea
  const oldDestination = `        <TextArea
          label="Destination coverage"
          name="destinationCoverage"
          rows={3}
          required
          placeholder="Spain
Portugal
Morocco"
        />`;

  const newDestination = `        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Destination Coverage <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-foreground/60">
            Select all countries, regions, and cities where you provide DMC services
          </p>
          <MultiCountryLocationSelector
            value={locationData}
            onChange={setLocationData}
            countries={countries}
            required
          />
        </div>`;

  content = content.replace(oldDestination, newDestination);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ DMC form updated with location selector!');
}

// Update Transport form
function updateTransportForm() {
  const filePath = path.join(__dirname, '..', 'components', 'auth', 'applications', 'transport-sign-up-form.tsx');
  let content = fs.readFileSync(filePath, 'utf8');

  // Add import
  if (!content.includes('MultiCountryLocationSelector')) {
    content = content.replace(
      'import { LoginCredentialsInput } from "@/components/form/login-credentials-input";',
      'import { LoginCredentialsInput } from "@/components/form/login-credentials-input";\nimport { MultiCountryLocationSelector, type LocationSelection } from "@/components/form/multi-country-location-selector";'
    );
  }

  // Add state
  content = content.replace(
    'const [languages, setLanguages] = useState<string[]>([]);',
    'const [languages, setLanguages] = useState<string[]>([]);\n  const [locationData, setLocationData] = useState<LocationSelection>({ countries: [] });'
  );

  // Add hidden input
  content = content.replace(
    'value={JSON.stringify(languages)} />',
    'value={JSON.stringify(languages)} />\n      <input type="hidden" name="locationData" value={JSON.stringify(locationData)} />'
  );

  // Replace service areas textarea
  const oldServiceAreas = `        <TextArea
          label="Service areas (one per line)"
          name="serviceAreas"
          rows={3}
          required
          placeholder="Ho Chi Minh City
Da Nang
Hoi An"
        />`;

  const newServiceAreas = `        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Service Areas <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-foreground/60">
            Select all countries, regions, and cities where you provide transport services
          </p>
          <MultiCountryLocationSelector
            value={locationData}
            onChange={setLocationData}
            countries={countries}
            required
          />
        </div>`;

  content = content.replace(oldServiceAreas, newServiceAreas);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Transport form updated with location selector!');
}

try {
  updateDmcForm();
  updateTransportForm();
  console.log('\n✅ All forms updated successfully with location selectors!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
