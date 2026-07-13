import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFB] px-4">
      <div className="w-full max-w-md rounded-2xl border border-grey-300 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-on-surface">Primeway Cleaning</h1>
          <p className="mt-1 text-sm text-grey-500">Sign in to your account</p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
