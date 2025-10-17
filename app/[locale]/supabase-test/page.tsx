import { getSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type SupabaseTestPageProps = {
  params: { locale: string };
};

type ProfilePreview = {
  id: string;
  full_name?: string | null;
  updated_at?: string | null;
};

export default async function SupabaseTestPage({ params }: SupabaseTestPageProps) {
  const supabase = getSupabaseServiceClient();

  let profiles: ProfilePreview[] = [];
  let errorMessage: string | null = null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5);

    if (error) {
      errorMessage = error.message;
    } else {
      profiles = data ?? [];
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";
  }

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-semibold">Supabase Connection Test</h1>
      <p className="text-slate-500">
        Locale: <span className="font-mono">{params.locale}</span>
      </p>

      {errorMessage ? (
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">Failed to query the profiles table.</p>
          <p>Error: {errorMessage}</p>
        </div>
      ) : (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-medium">Successfully contacted Supabase.</p>
          <p>Showing up to five recent profiles below.</p>
        </div>
      )}

      {errorMessage ? null : (
        <table className="min-w-full overflow-hidden rounded-md border text-sm shadow-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left font-medium">ID</th>
              <th className="px-3 py-2 text-left font-medium">Full name</th>
              <th className="px-3 py-2 text-left font-medium">Updated at</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length ? (
              profiles.map((profile) => (
                <tr key={profile.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{profile.id}</td>
                  <td className="px-3 py-2">{profile.full_name ?? "-"}</td>
                  <td className="px-3 py-2">{profile.updated_at ?? "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-4 text-center" colSpan={3}>
                  No rows returned from profiles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </main>
  );
}