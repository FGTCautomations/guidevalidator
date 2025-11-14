export const dynamic = "force-dynamic";

import { ChangePasswordForm } from "@/components/account/change-password-form";

export default async function SecurityPage() {
  return (
    <div className="py-8">
      <ChangePasswordForm />
    </div>
  );
}
