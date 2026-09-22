import { AuthGate } from "@/components/account/auth-gate";
import { AccountSidebar } from "@/components/account/account-sidebar";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="container-page py-8 sm:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          <AccountSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </AuthGate>
  );
}
