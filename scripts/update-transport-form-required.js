const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'auth', 'applications', 'transport-sign-up-form.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// First, add required parameter to TextArea function
content = content.replace(
  /function TextArea\(\{\s*label,\s*name,\s*rows = 4,\s*placeholder,\s*\}: \{\s*label: string;\s*name: string;\s*rows\?: number;\s*placeholder\?: string;\s*\}\)/,
  `function TextArea({
  label,
  name,
  rows = 4,
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  rows?: number;
  placeholder?: string;
  required?: boolean;
})`
);

content = content.replace(
  'placeholder={placeholder}\n        className="rounded-xl border border-foreground/15',
  'placeholder={placeholder}\n        required={required}\n        className="rounded-xl border border-foreground/15'
);

// Update all the fields to be required
const updates = [
  // Registration number
  ['placeholder="Enter N/A if not available" />', '/>'],
  // Country select
  ['<span className="font-medium">Country of registration</span>', '<span className="font-medium">Country of registration <span className="text-red-500">*</span></span>'],
  ['defaultValue={COUNTRY_PLACEHOLDER}', 'required\n              defaultValue={COUNTRY_PLACEHOLDER}'],
  ['<option value={COUNTRY_PLACEHOLDER}>Select country</option>', '<option value={COUNTRY_PLACEHOLDER}>-- Please select --</option>'],
  // Company address
  ['name="companyAddress"\n          rows={3} />', 'name="companyAddress"\n          rows={3}\n          required />'],
  // Contact phone
  ['name="contactPhone" required placeholder="Enter N/A if not available" />', 'name="contactPhone" required />'],
  // Website
  ['name="websiteUrl" placeholder="https://..." />', 'name="websiteUrl" required placeholder="https://..." />'],
  // Logo URL
  ['name="logoUrl" placeholder="https://..." />', 'name="logoUrl" required placeholder="https://..." />'],
  // Short description
  ['name="shortDescription"\n          rows={3}', 'name="shortDescription"\n          rows={3}\n          required'],
  // Fleet documents
  ['name="fleetDocuments"\n          rows={3}', 'name="fleetDocuments"\n          rows={3}\n          required'],
  // Insurance documents
  ['name="insuranceDocuments"\n          rows={3}', 'name="insuranceDocuments"\n          rows={3}\n          required'],
  // Safety certifications
  ['name="safetyCertifications"\n          rows={3}', 'name="safetyCertifications"\n          rows={3}\n          required'],
  // Representative name
  ['name="representativeName" required placeholder="Enter N/A if not available" />', 'name="representativeName" required />'],
  // Representative role
  ['name="representativeRole" required placeholder="Enter N/A if not available" />', 'name="representativeRole" required />'],
  // Representative email
  ['name="representativeEmail" required placeholder="Enter N/A if not available" type="email" />', 'name="representativeEmail" required type="email" />'],
  // Representative phone
  ['name="representativePhone" required placeholder="Enter N/A if not available" />', 'name="representativePhone" required />'],
  // Service areas
  ['name="serviceAreas"\n          rows={3}', 'name="serviceAreas"\n          rows={3}\n          required'],
  // Fleet overview
  ['name="fleetOverview"\n          rows={3}', 'name="fleetOverview"\n          rows={3}\n          required'],
  // Service types
  ['name="serviceTypes"\n          rows={3}', 'name="serviceTypes"\n          rows={3}\n          required'],
  // Safety features
  ['name="safetyFeatures"\n          rows={3}', 'name="safetyFeatures"\n          rows={3}\n          required'],
  // Media gallery
  ['name="mediaGallery"\n          rows={3}', 'name="mediaGallery"\n          rows={3}\n          required'],
  // Client references
  ['name="clientReferences"\n          rows={3}', 'name="clientReferences"\n          rows={3}\n          required'],
  // Availability notes
  ['name="availabilityNotes"\n          rows={2}', 'name="availabilityNotes"\n          rows={2}\n          required'],
  // Booking info
  ['name="bookingInfo"\n          rows={3}', 'name="bookingInfo"\n          rows={3}\n          required'],
  // Pricing summary
  ['name="pricingSummary"\n          rows={3}', 'name="pricingSummary"\n          rows={3}\n          required'],
  // Billing notes
  ['name="billingNotes"\n          rows={2} placeholder="Billing entity, VAT requirements, etc." />', 'name="billingNotes"\n          rows={2}\n          required placeholder="Billing entity, VAT requirements, etc" />'],
];

updates.forEach(([find, replace]) => {
  if (content.includes(find)) {
    content = content.replace(find, replace);
  } else {
    console.log(`Warning: Could not find: ${find.substring(0, 50)}...`);
  }
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Transport form updated successfully!');
