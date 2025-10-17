#!/usr/bin/env node
import pg from 'pg';

const { Client } = pg;

// Complete list of all 195 countries (ISO 3166-1 alpha-2)
// Source: ISO standard + REST Countries data
const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan', region: 'Asia', subregion: 'Southern Asia', capital: 'Kabul' },
  { code: 'AL', name: 'Albania', region: 'Europe', subregion: 'Southern Europe', capital: 'Tirana' },
  { code: 'DZ', name: 'Algeria', region: 'Africa', subregion: 'Northern Africa', capital: 'Algiers' },
  { code: 'AD', name: 'Andorra', region: 'Europe', subregion: 'Southern Europe', capital: 'Andorra la Vella' },
  { code: 'AO', name: 'Angola', region: 'Africa', subregion: 'Middle Africa', capital: 'Luanda' },
  { code: 'AG', name: 'Antigua and Barbuda', region: 'Americas', subregion: 'Caribbean', capital: 'Saint John\'s' },
  { code: 'AR', name: 'Argentina', region: 'Americas', subregion: 'South America', capital: 'Buenos Aires' },
  { code: 'AM', name: 'Armenia', region: 'Asia', subregion: 'Western Asia', capital: 'Yerevan' },
  { code: 'AU', name: 'Australia', region: 'Oceania', subregion: 'Australia and New Zealand', capital: 'Canberra' },
  { code: 'AT', name: 'Austria', region: 'Europe', subregion: 'Central Europe', capital: 'Vienna' },
  { code: 'AZ', name: 'Azerbaijan', region: 'Asia', subregion: 'Western Asia', capital: 'Baku' },
  { code: 'BS', name: 'Bahamas', region: 'Americas', subregion: 'Caribbean', capital: 'Nassau' },
  { code: 'BH', name: 'Bahrain', region: 'Asia', subregion: 'Western Asia', capital: 'Manama' },
  { code: 'BD', name: 'Bangladesh', region: 'Asia', subregion: 'Southern Asia', capital: 'Dhaka' },
  { code: 'BB', name: 'Barbados', region: 'Americas', subregion: 'Caribbean', capital: 'Bridgetown' },
  { code: 'BY', name: 'Belarus', region: 'Europe', subregion: 'Eastern Europe', capital: 'Minsk' },
  { code: 'BE', name: 'Belgium', region: 'Europe', subregion: 'Western Europe', capital: 'Brussels' },
  { code: 'BZ', name: 'Belize', region: 'Americas', subregion: 'Central America', capital: 'Belmopan' },
  { code: 'BJ', name: 'Benin', region: 'Africa', subregion: 'Western Africa', capital: 'Porto-Novo' },
  { code: 'BT', name: 'Bhutan', region: 'Asia', subregion: 'Southern Asia', capital: 'Thimphu' },
  { code: 'BO', name: 'Bolivia', region: 'Americas', subregion: 'South America', capital: 'Sucre' },
  { code: 'BA', name: 'Bosnia and Herzegovina', region: 'Europe', subregion: 'Southern Europe', capital: 'Sarajevo' },
  { code: 'BW', name: 'Botswana', region: 'Africa', subregion: 'Southern Africa', capital: 'Gaborone' },
  { code: 'BR', name: 'Brazil', region: 'Americas', subregion: 'South America', capital: 'Brasília' },
  { code: 'BN', name: 'Brunei', region: 'Asia', subregion: 'Southeast Asia', capital: 'Bandar Seri Begawan' },
  { code: 'BG', name: 'Bulgaria', region: 'Europe', subregion: 'Eastern Europe', capital: 'Sofia' },
  { code: 'BF', name: 'Burkina Faso', region: 'Africa', subregion: 'Western Africa', capital: 'Ouagadougou' },
  { code: 'BI', name: 'Burundi', region: 'Africa', subregion: 'Eastern Africa', capital: 'Gitega' },
  { code: 'CV', name: 'Cabo Verde', region: 'Africa', subregion: 'Western Africa', capital: 'Praia' },
  { code: 'KH', name: 'Cambodia', region: 'Asia', subregion: 'Southeast Asia', capital: 'Phnom Penh' },
  { code: 'CM', name: 'Cameroon', region: 'Africa', subregion: 'Middle Africa', capital: 'Yaoundé' },
  { code: 'CA', name: 'Canada', region: 'Americas', subregion: 'North America', capital: 'Ottawa' },
  { code: 'CF', name: 'Central African Republic', region: 'Africa', subregion: 'Middle Africa', capital: 'Bangui' },
  { code: 'TD', name: 'Chad', region: 'Africa', subregion: 'Middle Africa', capital: 'N\'Djamena' },
  { code: 'CL', name: 'Chile', region: 'Americas', subregion: 'South America', capital: 'Santiago' },
  { code: 'CN', name: 'China', region: 'Asia', subregion: 'Eastern Asia', capital: 'Beijing' },
  { code: 'CO', name: 'Colombia', region: 'Americas', subregion: 'South America', capital: 'Bogotá' },
  { code: 'KM', name: 'Comoros', region: 'Africa', subregion: 'Eastern Africa', capital: 'Moroni' },
  { code: 'CG', name: 'Congo', region: 'Africa', subregion: 'Middle Africa', capital: 'Brazzaville' },
  { code: 'CD', name: 'DR Congo', region: 'Africa', subregion: 'Middle Africa', capital: 'Kinshasa' },
  { code: 'CR', name: 'Costa Rica', region: 'Americas', subregion: 'Central America', capital: 'San José' },
  { code: 'HR', name: 'Croatia', region: 'Europe', subregion: 'Southern Europe', capital: 'Zagreb' },
  { code: 'CU', name: 'Cuba', region: 'Americas', subregion: 'Caribbean', capital: 'Havana' },
  { code: 'CY', name: 'Cyprus', region: 'Europe', subregion: 'Eastern Mediterranean', capital: 'Nicosia' },
  { code: 'CZ', name: 'Czech Republic', region: 'Europe', subregion: 'Central Europe', capital: 'Prague' },
  { code: 'DK', name: 'Denmark', region: 'Europe', subregion: 'Northern Europe', capital: 'Copenhagen' },
  { code: 'DJ', name: 'Djibouti', region: 'Africa', subregion: 'Eastern Africa', capital: 'Djibouti' },
  { code: 'DM', name: 'Dominica', region: 'Americas', subregion: 'Caribbean', capital: 'Roseau' },
  { code: 'DO', name: 'Dominican Republic', region: 'Americas', subregion: 'Caribbean', capital: 'Santo Domingo' },
  { code: 'EC', name: 'Ecuador', region: 'Americas', subregion: 'South America', capital: 'Quito' },
  { code: 'EG', name: 'Egypt', region: 'Africa', subregion: 'Northern Africa', capital: 'Cairo' },
  { code: 'SV', name: 'El Salvador', region: 'Americas', subregion: 'Central America', capital: 'San Salvador' },
  { code: 'GQ', name: 'Equatorial Guinea', region: 'Africa', subregion: 'Middle Africa', capital: 'Malabo' },
  { code: 'ER', name: 'Eritrea', region: 'Africa', subregion: 'Eastern Africa', capital: 'Asmara' },
  { code: 'EE', name: 'Estonia', region: 'Europe', subregion: 'Northern Europe', capital: 'Tallinn' },
  { code: 'SZ', name: 'Eswatini', region: 'Africa', subregion: 'Southern Africa', capital: 'Mbabane' },
  { code: 'ET', name: 'Ethiopia', region: 'Africa', subregion: 'Eastern Africa', capital: 'Addis Ababa' },
  { code: 'FJ', name: 'Fiji', region: 'Oceania', subregion: 'Melanesia', capital: 'Suva' },
  { code: 'FI', name: 'Finland', region: 'Europe', subregion: 'Northern Europe', capital: 'Helsinki' },
  { code: 'FR', name: 'France', region: 'Europe', subregion: 'Western Europe', capital: 'Paris' },
  { code: 'GA', name: 'Gabon', region: 'Africa', subregion: 'Middle Africa', capital: 'Libreville' },
  { code: 'GM', name: 'Gambia', region: 'Africa', subregion: 'Western Africa', capital: 'Banjul' },
  { code: 'GE', name: 'Georgia', region: 'Asia', subregion: 'Western Asia', capital: 'Tbilisi' },
  { code: 'DE', name: 'Germany', region: 'Europe', subregion: 'Central Europe', capital: 'Berlin' },
  { code: 'GH', name: 'Ghana', region: 'Africa', subregion: 'Western Africa', capital: 'Accra' },
  { code: 'GR', name: 'Greece', region: 'Europe', subregion: 'Southern Europe', capital: 'Athens' },
  { code: 'GD', name: 'Grenada', region: 'Americas', subregion: 'Caribbean', capital: 'St. George\'s' },
  { code: 'GT', name: 'Guatemala', region: 'Americas', subregion: 'Central America', capital: 'Guatemala City' },
  { code: 'GN', name: 'Guinea', region: 'Africa', subregion: 'Western Africa', capital: 'Conakry' },
  { code: 'GW', name: 'Guinea-Bissau', region: 'Africa', subregion: 'Western Africa', capital: 'Bissau' },
  { code: 'GY', name: 'Guyana', region: 'Americas', subregion: 'South America', capital: 'Georgetown' },
  { code: 'HT', name: 'Haiti', region: 'Americas', subregion: 'Caribbean', capital: 'Port-au-Prince' },
  { code: 'HN', name: 'Honduras', region: 'Americas', subregion: 'Central America', capital: 'Tegucigalpa' },
  { code: 'HU', name: 'Hungary', region: 'Europe', subregion: 'Central Europe', capital: 'Budapest' },
  { code: 'IS', name: 'Iceland', region: 'Europe', subregion: 'Northern Europe', capital: 'Reykjavik' },
  { code: 'IN', name: 'India', region: 'Asia', subregion: 'Southern Asia', capital: 'New Delhi' },
  { code: 'ID', name: 'Indonesia', region: 'Asia', subregion: 'Southeast Asia', capital: 'Jakarta' },
  { code: 'IR', name: 'Iran', region: 'Asia', subregion: 'Southern Asia', capital: 'Tehran' },
  { code: 'IQ', name: 'Iraq', region: 'Asia', subregion: 'Western Asia', capital: 'Baghdad' },
  { code: 'IE', name: 'Ireland', region: 'Europe', subregion: 'Northern Europe', capital: 'Dublin' },
  { code: 'IL', name: 'Israel', region: 'Asia', subregion: 'Western Asia', capital: 'Jerusalem' },
  { code: 'IT', name: 'Italy', region: 'Europe', subregion: 'Southern Europe', capital: 'Rome' },
  { code: 'CI', name: 'Ivory Coast', region: 'Africa', subregion: 'Western Africa', capital: 'Yamoussoukro' },
  { code: 'JM', name: 'Jamaica', region: 'Americas', subregion: 'Caribbean', capital: 'Kingston' },
  { code: 'JP', name: 'Japan', region: 'Asia', subregion: 'Eastern Asia', capital: 'Tokyo' },
  { code: 'JO', name: 'Jordan', region: 'Asia', subregion: 'Western Asia', capital: 'Amman' },
  { code: 'KZ', name: 'Kazakhstan', region: 'Asia', subregion: 'Central Asia', capital: 'Nur-Sultan' },
  { code: 'KE', name: 'Kenya', region: 'Africa', subregion: 'Eastern Africa', capital: 'Nairobi' },
  { code: 'KI', name: 'Kiribati', region: 'Oceania', subregion: 'Micronesia', capital: 'Tarawa' },
  { code: 'KW', name: 'Kuwait', region: 'Asia', subregion: 'Western Asia', capital: 'Kuwait City' },
  { code: 'KG', name: 'Kyrgyzstan', region: 'Asia', subregion: 'Central Asia', capital: 'Bishkek' },
  { code: 'LA', name: 'Laos', region: 'Asia', subregion: 'Southeast Asia', capital: 'Vientiane' },
  { code: 'LV', name: 'Latvia', region: 'Europe', subregion: 'Northern Europe', capital: 'Riga' },
  { code: 'LB', name: 'Lebanon', region: 'Asia', subregion: 'Western Asia', capital: 'Beirut' },
  { code: 'LS', name: 'Lesotho', region: 'Africa', subregion: 'Southern Africa', capital: 'Maseru' },
  { code: 'LR', name: 'Liberia', region: 'Africa', subregion: 'Western Africa', capital: 'Monrovia' },
  { code: 'LY', name: 'Libya', region: 'Africa', subregion: 'Northern Africa', capital: 'Tripoli' },
  { code: 'LI', name: 'Liechtenstein', region: 'Europe', subregion: 'Central Europe', capital: 'Vaduz' },
  { code: 'LT', name: 'Lithuania', region: 'Europe', subregion: 'Northern Europe', capital: 'Vilnius' },
  { code: 'LU', name: 'Luxembourg', region: 'Europe', subregion: 'Western Europe', capital: 'Luxembourg' },
  { code: 'MG', name: 'Madagascar', region: 'Africa', subregion: 'Eastern Africa', capital: 'Antananarivo' },
  { code: 'MW', name: 'Malawi', region: 'Africa', subregion: 'Eastern Africa', capital: 'Lilongwe' },
  { code: 'MY', name: 'Malaysia', region: 'Asia', subregion: 'Southeast Asia', capital: 'Kuala Lumpur' },
  { code: 'MV', name: 'Maldives', region: 'Asia', subregion: 'Southern Asia', capital: 'Malé' },
  { code: 'ML', name: 'Mali', region: 'Africa', subregion: 'Western Africa', capital: 'Bamako' },
  { code: 'MT', name: 'Malta', region: 'Europe', subregion: 'Southern Europe', capital: 'Valletta' },
  { code: 'MH', name: 'Marshall Islands', region: 'Oceania', subregion: 'Micronesia', capital: 'Majuro' },
  { code: 'MR', name: 'Mauritania', region: 'Africa', subregion: 'Western Africa', capital: 'Nouakchott' },
  { code: 'MU', name: 'Mauritius', region: 'Africa', subregion: 'Eastern Africa', capital: 'Port Louis' },
  { code: 'MX', name: 'Mexico', region: 'Americas', subregion: 'North America', capital: 'Mexico City' },
  { code: 'FM', name: 'Micronesia', region: 'Oceania', subregion: 'Micronesia', capital: 'Palikir' },
  { code: 'MD', name: 'Moldova', region: 'Europe', subregion: 'Eastern Europe', capital: 'Chișinău' },
  { code: 'MC', name: 'Monaco', region: 'Europe', subregion: 'Western Europe', capital: 'Monaco' },
  { code: 'MN', name: 'Mongolia', region: 'Asia', subregion: 'Eastern Asia', capital: 'Ulaanbaatar' },
  { code: 'ME', name: 'Montenegro', region: 'Europe', subregion: 'Southern Europe', capital: 'Podgorica' },
  { code: 'MA', name: 'Morocco', region: 'Africa', subregion: 'Northern Africa', capital: 'Rabat' },
  { code: 'MZ', name: 'Mozambique', region: 'Africa', subregion: 'Eastern Africa', capital: 'Maputo' },
  { code: 'MM', name: 'Myanmar', region: 'Asia', subregion: 'Southeast Asia', capital: 'Naypyidaw' },
  { code: 'NA', name: 'Namibia', region: 'Africa', subregion: 'Southern Africa', capital: 'Windhoek' },
  { code: 'NR', name: 'Nauru', region: 'Oceania', subregion: 'Micronesia', capital: 'Yaren' },
  { code: 'NP', name: 'Nepal', region: 'Asia', subregion: 'Southern Asia', capital: 'Kathmandu' },
  { code: 'NL', name: 'Netherlands', region: 'Europe', subregion: 'Western Europe', capital: 'Amsterdam' },
  { code: 'NZ', name: 'New Zealand', region: 'Oceania', subregion: 'Australia and New Zealand', capital: 'Wellington' },
  { code: 'NI', name: 'Nicaragua', region: 'Americas', subregion: 'Central America', capital: 'Managua' },
  { code: 'NE', name: 'Niger', region: 'Africa', subregion: 'Western Africa', capital: 'Niamey' },
  { code: 'NG', name: 'Nigeria', region: 'Africa', subregion: 'Western Africa', capital: 'Abuja' },
  { code: 'KP', name: 'North Korea', region: 'Asia', subregion: 'Eastern Asia', capital: 'Pyongyang' },
  { code: 'MK', name: 'North Macedonia', region: 'Europe', subregion: 'Southern Europe', capital: 'Skopje' },
  { code: 'NO', name: 'Norway', region: 'Europe', subregion: 'Northern Europe', capital: 'Oslo' },
  { code: 'OM', name: 'Oman', region: 'Asia', subregion: 'Western Asia', capital: 'Muscat' },
  { code: 'PK', name: 'Pakistan', region: 'Asia', subregion: 'Southern Asia', capital: 'Islamabad' },
  { code: 'PW', name: 'Palau', region: 'Oceania', subregion: 'Micronesia', capital: 'Ngerulmud' },
  { code: 'PA', name: 'Panama', region: 'Americas', subregion: 'Central America', capital: 'Panama City' },
  { code: 'PG', name: 'Papua New Guinea', region: 'Oceania', subregion: 'Melanesia', capital: 'Port Moresby' },
  { code: 'PY', name: 'Paraguay', region: 'Americas', subregion: 'South America', capital: 'Asunción' },
  { code: 'PE', name: 'Peru', region: 'Americas', subregion: 'South America', capital: 'Lima' },
  { code: 'PH', name: 'Philippines', region: 'Asia', subregion: 'Southeast Asia', capital: 'Manila' },
  { code: 'PL', name: 'Poland', region: 'Europe', subregion: 'Central Europe', capital: 'Warsaw' },
  { code: 'PT', name: 'Portugal', region: 'Europe', subregion: 'Southern Europe', capital: 'Lisbon' },
  { code: 'QA', name: 'Qatar', region: 'Asia', subregion: 'Western Asia', capital: 'Doha' },
  { code: 'RO', name: 'Romania', region: 'Europe', subregion: 'Eastern Europe', capital: 'Bucharest' },
  { code: 'RU', name: 'Russia', region: 'Europe', subregion: 'Eastern Europe', capital: 'Moscow' },
  { code: 'RW', name: 'Rwanda', region: 'Africa', subregion: 'Eastern Africa', capital: 'Kigali' },
  { code: 'KN', name: 'Saint Kitts and Nevis', region: 'Americas', subregion: 'Caribbean', capital: 'Basseterre' },
  { code: 'LC', name: 'Saint Lucia', region: 'Americas', subregion: 'Caribbean', capital: 'Castries' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', region: 'Americas', subregion: 'Caribbean', capital: 'Kingstown' },
  { code: 'WS', name: 'Samoa', region: 'Oceania', subregion: 'Polynesia', capital: 'Apia' },
  { code: 'SM', name: 'San Marino', region: 'Europe', subregion: 'Southern Europe', capital: 'San Marino' },
  { code: 'ST', name: 'Sao Tome and Principe', region: 'Africa', subregion: 'Middle Africa', capital: 'São Tomé' },
  { code: 'SA', name: 'Saudi Arabia', region: 'Asia', subregion: 'Western Asia', capital: 'Riyadh' },
  { code: 'SN', name: 'Senegal', region: 'Africa', subregion: 'Western Africa', capital: 'Dakar' },
  { code: 'RS', name: 'Serbia', region: 'Europe', subregion: 'Southern Europe', capital: 'Belgrade' },
  { code: 'SC', name: 'Seychelles', region: 'Africa', subregion: 'Eastern Africa', capital: 'Victoria' },
  { code: 'SL', name: 'Sierra Leone', region: 'Africa', subregion: 'Western Africa', capital: 'Freetown' },
  { code: 'SG', name: 'Singapore', region: 'Asia', subregion: 'Southeast Asia', capital: 'Singapore' },
  { code: 'SK', name: 'Slovakia', region: 'Europe', subregion: 'Central Europe', capital: 'Bratislava' },
  { code: 'SI', name: 'Slovenia', region: 'Europe', subregion: 'Southern Europe', capital: 'Ljubljana' },
  { code: 'SB', name: 'Solomon Islands', region: 'Oceania', subregion: 'Melanesia', capital: 'Honiara' },
  { code: 'SO', name: 'Somalia', region: 'Africa', subregion: 'Eastern Africa', capital: 'Mogadishu' },
  { code: 'ZA', name: 'South Africa', region: 'Africa', subregion: 'Southern Africa', capital: 'Pretoria' },
  { code: 'KR', name: 'South Korea', region: 'Asia', subregion: 'Eastern Asia', capital: 'Seoul' },
  { code: 'SS', name: 'South Sudan', region: 'Africa', subregion: 'Eastern Africa', capital: 'Juba' },
  { code: 'ES', name: 'Spain', region: 'Europe', subregion: 'Southern Europe', capital: 'Madrid' },
  { code: 'LK', name: 'Sri Lanka', region: 'Asia', subregion: 'Southern Asia', capital: 'Colombo' },
  { code: 'SD', name: 'Sudan', region: 'Africa', subregion: 'Northern Africa', capital: 'Khartoum' },
  { code: 'SR', name: 'Suriname', region: 'Americas', subregion: 'South America', capital: 'Paramaribo' },
  { code: 'SE', name: 'Sweden', region: 'Europe', subregion: 'Northern Europe', capital: 'Stockholm' },
  { code: 'CH', name: 'Switzerland', region: 'Europe', subregion: 'Central Europe', capital: 'Bern' },
  { code: 'SY', name: 'Syria', region: 'Asia', subregion: 'Western Asia', capital: 'Damascus' },
  { code: 'TJ', name: 'Tajikistan', region: 'Asia', subregion: 'Central Asia', capital: 'Dushanbe' },
  { code: 'TZ', name: 'Tanzania', region: 'Africa', subregion: 'Eastern Africa', capital: 'Dodoma' },
  { code: 'TH', name: 'Thailand', region: 'Asia', subregion: 'Southeast Asia', capital: 'Bangkok' },
  { code: 'TL', name: 'Timor-Leste', region: 'Asia', subregion: 'Southeast Asia', capital: 'Dili' },
  { code: 'TG', name: 'Togo', region: 'Africa', subregion: 'Western Africa', capital: 'Lomé' },
  { code: 'TO', name: 'Tonga', region: 'Oceania', subregion: 'Polynesia', capital: 'Nuku\'alofa' },
  { code: 'TT', name: 'Trinidad and Tobago', region: 'Americas', subregion: 'Caribbean', capital: 'Port of Spain' },
  { code: 'TN', name: 'Tunisia', region: 'Africa', subregion: 'Northern Africa', capital: 'Tunis' },
  { code: 'TR', name: 'Turkey', region: 'Asia', subregion: 'Western Asia', capital: 'Ankara' },
  { code: 'TM', name: 'Turkmenistan', region: 'Asia', subregion: 'Central Asia', capital: 'Ashgabat' },
  { code: 'TV', name: 'Tuvalu', region: 'Oceania', subregion: 'Polynesia', capital: 'Funafuti' },
  { code: 'UG', name: 'Uganda', region: 'Africa', subregion: 'Eastern Africa', capital: 'Kampala' },
  { code: 'UA', name: 'Ukraine', region: 'Europe', subregion: 'Eastern Europe', capital: 'Kyiv' },
  { code: 'AE', name: 'United Arab Emirates', region: 'Asia', subregion: 'Western Asia', capital: 'Abu Dhabi' },
  { code: 'GB', name: 'United Kingdom', region: 'Europe', subregion: 'Northern Europe', capital: 'London' },
  { code: 'US', name: 'United States', region: 'Americas', subregion: 'North America', capital: 'Washington, D.C.' },
  { code: 'UY', name: 'Uruguay', region: 'Americas', subregion: 'South America', capital: 'Montevideo' },
  { code: 'UZ', name: 'Uzbekistan', region: 'Asia', subregion: 'Central Asia', capital: 'Tashkent' },
  { code: 'VU', name: 'Vanuatu', region: 'Oceania', subregion: 'Melanesia', capital: 'Port Vila' },
  { code: 'VA', name: 'Vatican City', region: 'Europe', subregion: 'Southern Europe', capital: 'Vatican City' },
  { code: 'VE', name: 'Venezuela', region: 'Americas', subregion: 'South America', capital: 'Caracas' },
  { code: 'VN', name: 'Vietnam', region: 'Asia', subregion: 'Southeast Asia', capital: 'Hanoi' },
  { code: 'YE', name: 'Yemen', region: 'Asia', subregion: 'Western Asia', capital: 'Sana\'a' },
  { code: 'ZM', name: 'Zambia', region: 'Africa', subregion: 'Eastern Africa', capital: 'Lusaka' },
  { code: 'ZW', name: 'Zimbabwe', region: 'Africa', subregion: 'Eastern Africa', capital: 'Harare' }
];

async function populateCountries() {
  const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";
  const client = new Client({ connectionString });

  try {
    console.log(`🌍 Populating all ${COUNTRIES.length} countries...\n`);

    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected\n');

    console.log('🚀 Inserting/updating countries...\n');

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const country of COUNTRIES) {
      try {
        // Check if country exists
        const existingCountry = await client.query(
          'SELECT code FROM public.countries WHERE code = $1',
          [country.code]
        );

        if (existingCountry.rows.length > 0) {
          // Update existing country
          await client.query(`
            UPDATE public.countries
            SET
              name = $2,
              region = $3,
              subregion = $4,
              capital = $5,
              updated_at = NOW()
            WHERE code = $1
          `, [country.code, country.name, country.region, country.subregion, country.capital]);

          updated++;
          console.log(`   ✓ Updated: ${country.code} - ${country.name}`);
        } else {
          // Insert new country
          await client.query(`
            INSERT INTO public.countries (
              code, name, region, subregion, capital,
              created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          `, [country.code, country.name, country.region, country.subregion, country.capital]);

          inserted++;
          console.log(`   ✓ Inserted: ${country.code} - ${country.name}`);
        }

      } catch (error) {
        skipped++;
        console.log(`   ✗ Skipped: ${country.name} - ${error.message}`);
      }
    }

    console.log(`\n✅ Population complete!`);
    console.log(`   📊 Inserted: ${inserted}`);
    console.log(`   📊 Updated: ${updated}`);
    console.log(`   📊 Skipped: ${skipped}`);
    console.log(`   📊 Total: ${inserted + updated} countries in database\n`);

    // Verify count
    const countResult = await client.query('SELECT COUNT(*) FROM public.countries');
    console.log(`✅ Database now has ${countResult.rows[0].count} countries\n`);

    // Show breakdown by region
    const regionResult = await client.query(`
      SELECT region, COUNT(*) as count
      FROM public.countries
      WHERE region IS NOT NULL
      GROUP BY region
      ORDER BY count DESC
    `);

    console.log('📋 Countries by region:');
    regionResult.rows.forEach(row => {
      console.log(`   ${row.region}: ${row.count} countries`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

populateCountries();
