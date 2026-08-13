import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AUTH_COOKIE } from "@/lib/constants";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
