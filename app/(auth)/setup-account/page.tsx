import { AuthLayout } from "@/components/auth/AuthLayout";
import { SetupAccountForm } from "@/features/auth/components/SetupAccountForm";

interface SetupAccountPageProps {
  searchParams: Promise<{ email?: string; tempPassword?: string }>;
}

export default async function SetupAccountPage({ searchParams }: SetupAccountPageProps) {
  const { email = "", tempPassword = "" } = await searchParams;

  return (
    <AuthLayout
      title="Set up your account"
      subtitle="Choose a password to activate your Primeway account."
    >
      <SetupAccountForm email={email} temporaryPassword={tempPassword} />
    </AuthLayout>
  );
}
