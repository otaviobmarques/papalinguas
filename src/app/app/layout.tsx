"use client";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const emAula = path.startsWith("/app/aula") && !path.startsWith("/app/aulas");
  return (
    <>
      <div className={emAula ? "" : "mx-auto w-full max-w-md px-4 pb-32 pt-5"}>{children}</div>
      {!emAula && <BottomNav />}
    </>
  );
}
