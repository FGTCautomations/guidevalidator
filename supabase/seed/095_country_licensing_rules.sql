-- Guide licensing requirements by country
insert into public.country_licensing_rules (country_code, guide_license_required, dmc_license_required, transport_license_required, authority_url, notes)
values
  ('DE', true, false, false, 'https://www.berlin.de/sen/web/service/leistungen/120686/', 'Germany requires G?stef?hrer cards for professional guiding in many states.'),
  ('FR', true, false, false, 'https://www.service-public.fr/professionnels-entreprises/vosdroits/F23468', 'France requires the Carte Professionnelle de Guide-Conf?rencier for museum and monument guiding.'),
  ('IT', true, false, false, 'https://www.beniculturali.it/guida-turistica', 'Italy mandates regional licensing for tour guides with national examinations.'),
  ('PT', true, false, false, 'https://turismodeportugal.pt/', 'Portugal licenses Guia Int?rprete Nacional for guiding services.'),
  ('JP', true, false, false, 'https://www.jnto.go.jp/', 'Japan requires the National Licensed Guide-Interpreter qualification for paid foreign language guiding.'),
  ('CN', true, false, false, 'https://www.mct.gov.cn/', 'China issues Tour Guide Certificates via the Ministry of Culture and Tourism.'),
  ('AT', true, false, false, 'https://www.wko.at/service/wirtschaftsrecht-gewerberecht/fremdenfuehrer.html', 'Austria regulates guiding under the Austrian Tourist Guide trade law.'),
  ('GR', true, false, false, 'https://mintour.gov.gr/', 'Greece requires Ministry of Tourism certification for all licensed guides.')
on conflict (country_code) do update set
  guide_license_required = excluded.guide_license_required,
  dmc_license_required = excluded.dmc_license_required,
  transport_license_required = excluded.transport_license_required,
  authority_url = excluded.authority_url,
  notes = excluded.notes,
  updated_at = now();
