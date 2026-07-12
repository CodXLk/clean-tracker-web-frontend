export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="lg:pl-64">
      {children}
    </div>
  );
}
