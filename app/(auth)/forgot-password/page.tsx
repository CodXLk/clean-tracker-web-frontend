import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a verification code."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
