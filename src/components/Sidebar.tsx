/**
 * admin/src/components/Sidebar.tsx
 * Admin navigation sidebar.
 */

"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", enabled: true },
  { label: "Users", href: "/dashboard/users", enabled: false },
  { label: "Agent Runs", href: "/dashboard/agent-runs", enabled: false },
  { label: "Compliance", href: "/dashboard/compliance", enabled: false },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-navy-700 flex flex-col">
      <div className="px-6 py-6 border-b border-white/10">
        <p className="text-white font-bold text-lg">MamaCare AI</p>
        <p className="text-rose-200 text-xs mt-0.5">Admin Dashboard</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = item.enabled && pathname === item.href;
          const base =
            "block px-3 py-2 rounded-lg text-sm font-medium transition-colors";
          if (!item.enabled) {
            return (
              <span
                key={item.href}
                aria-disabled="true"
                title="Coming soon"
                className={`${base} cursor-not-allowed text-white/35 select-none`}
              >
                {item.label}
              </span>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? `${base} bg-white/10 text-white`
                  : `${base} text-white/60 hover:text-white hover:bg-white/5`
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-2">
        <SignedIn>
          <div className="px-1 flex items-center justify-between gap-2">
            <span className="text-white/50 text-xs">Account</span>
            <UserButton
              afterSignOutUrl="/dashboard"
              appearance={{ elements: { userButtonBox: "flex" } }}
            />
          </div>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button
              type="button"
              className="w-full rounded-lg bg-white/10 text-white text-sm font-medium py-2 hover:bg-white/20"
            >
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </aside>
  );
}
