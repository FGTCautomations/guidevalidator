const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'auth', 'applications', 'dmc-sign-up-form.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update all the fields to be required
const updates = [
  // Registration number
  ['placeholder="Enter N/A if not available" />', '/>', 152],
  // Country select
  ['<span className="font-medium">Country of incorporation</span>', '<span className="font-medium">Country of incorporation <span className="text-red-500">*</span></span>'],
  ['name="registrationCountry"', 'name="registrationCountry"\n              required'],
  ['<option value="">--</option>', '<option value="">-- Please select --</option>'],
  // Office address
  ['name="officeAddress"\n          rows={3} />', 'name="officeAddress"\n          rows={3}\n          required />'],
  // Contact phone
  ['name="contactPhone" required placeholder="Enter N/A if not available" />', 'name="contactPhone" required />'],
  // Website
  ['name="websiteUrl" placeholder="https://..." />', 'name="websiteUrl" required placeholder="https://..." />'],
  // Tax ID
  ['name="taxId" required placeholder="Enter N/A if not available" />', 'name="taxId" required />'],
  // License URL
  ['name="licenseUrl" placeholder="https://..." />', 'name="licenseUrl" required placeholder="https://..." />'],
  // Memberships
  ['name="memberships"\n          rows={2}', 'name="memberships"\n          rows={2}\n          required'],
  // Logo URL
  ['name="logoUrl" placeholder="https://..." />', 'name="logoUrl" required placeholder="https://..." />'],
  // Company overview
  ['name="companyOverview"\n          rows={4} />', 'name="companyOverview"\n          rows={4}\n          required />'],
  // Representative name
  ['name="representativeName" required placeholder="Enter N/A if not available" />', 'name="representativeName" required />'],
  // Representative role
  ['name="representativeRole" required placeholder="Enter N/A if not available" />', 'name="representativeRole" required />'],
  // Representative email
  ['name="representativeEmail" required placeholder="Enter N/A if not available" type="email" />', 'name="representativeEmail" required type="email" />'],
  // Representative phone
  ['name="representativePhone" required placeholder="Enter N/A if not available" />', 'name="representativePhone" required />'],
  // Destination coverage
  ['name="destinationCoverage"\n          rows={3}', 'name="destinationCoverage"\n          rows={3}\n          required'],
  // Services offered
  ['name="servicesOffered"\n          rows={3}', 'name="servicesOffered"\n          rows={3}\n          required'],
  // Specializations
  ['name="specializations"\n          rows={3}', 'name="specializations"\n          rows={3}\n          required'],
  // Portfolio examples
  ['name="portfolioExamples"\n          rows={3}', 'name="portfolioExamples"\n          rows={3}\n          required'],
  // Media gallery
  ['name="mediaGallery"\n          rows={3}', 'name="mediaGallery"\n          rows={3}\n          required'],
  // Client references
  ['name="clientReferences"\n          rows={3}', 'name="clientReferences"\n          rows={3}\n          required'],
  // Response time
  ['placeholder="Within 24 hours" />', 'placeholder="Within 24 hours" required />'],
  // Practical info
  ['name="practicalInfo"\n          rows={3}', 'name="practicalInfo"\n          rows={3}\n          required'],
  // Certifications
  ['name="certifications"\n          rows={2} />', 'name="certifications"\n          rows={2}\n          required />'],
  // Contact methods
  ['name="contactMethods"\n          rows={3}', 'name="contactMethods"\n          rows={3}\n          required'],
  // Billing notes
  ['name="billingNotes"\n          rows={2} placeholder="Billing entity, VAT, etc." />', 'name="billingNotes"\n          rows={2}\n          required placeholder="Billing entity, VAT, etc" />'],
];

updates.forEach(([find, replace]) => {
  if (content.includes(find)) {
    content = content.replace(find, replace);
  } else {
    console.log(`Warning: Could not find: ${find.substring(0, 50)}...`);
  }
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ DMC form updated successfully!');
