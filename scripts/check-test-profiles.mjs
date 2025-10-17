import { Client } from "pg";

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    throw new Error("SUPABASE_DB_URL not set");
  }

  const client = new Client({ connectionString });
  await client.connect();

  const emails = [
    "admin.qa@guidevalidator.test",
    "test.guide@guidevalidator.test",
    "test.agent@guidevalidator.test",
    "test.dmc@guidevalidator.test",
    "test.transport@guidevalidator.test",
  ];

  const { rows } = await client.query(
    `select u.email, p.id as profile_id, p.role, p.full_name, p.country_code, p.verified, p.license_verified, p.organization_id
     from auth.users u
     left join public.profiles p on p.id = u.id
     where u.email = any($1::text[])
     order by u.email`,
    [emails]
  );

  const profileIds = rows.map((row) => row.profile_id).filter((value) => !!value);

  const memberRows = profileIds.length === 0
    ? { rows: [] }
    : await client.query(
        `select a.slug, am.profile_id, am.role
         from public.agency_members am
         join public.agencies a on a.id = am.agency_id
         where am.profile_id = any($1::uuid[])
         order by a.slug`,
        [profileIds]
      );

  console.log(JSON.stringify({ profiles: rows, members: memberRows.rows }, null, 2));

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
