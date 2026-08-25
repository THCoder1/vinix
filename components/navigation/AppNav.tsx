"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/browser";

export default function AppNav() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="sidebar">
      <div className="logo">VINIX</div>

      <nav className="nav">
        <Link href="/">Dashboard</Link>
        <Link href="/stock">Stock</Link>
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="secondary-button nav-signout"
          onClick={handleSignOut}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}