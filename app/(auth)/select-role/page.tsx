import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RoleSelection } from "@/features/auth/components/RoleSelection";

export default function SelectRolePage() {
  return (
    <AuthLayout title="Choose your role" subtitle="Select how you'd like to continue.">
      <Suspense fallback={null}>
        <RoleSelection />
      </Suspense>
    </AuthLayout>
  );
}
