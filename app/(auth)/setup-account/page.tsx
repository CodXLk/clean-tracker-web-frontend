import { SetupAccountForm } from "@/features/auth/components/SetupAccountForm";

interface SetupAccountPageProps {
  searchParams: Promise<{ email?: string; tempPassword?: string }>;
}

export default async function SetupAccountPage({ searchParams }: SetupAccountPageProps) {
  const { email = "", tempPassword = "" } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFB] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-grey-300 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-on-surface">Set up your account</h1>
          <p className="mt-1 text-sm text-grey-500">
            Choose a password to activate your Primeway account.
          </p>
        </div>
        <SetupAccountForm email={email} temporaryPassword={tempPassword} />
      </div>
    </main>
  );
}
