import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Renova a sessão do Supabase a cada requisição e aplica a restrição de IP do painel (opcional). */
export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const permitidos = process.env.ADMIN_ALLOWED_IPS?.split(",").map((s) => s.trim()).filter(Boolean);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (permitidos?.length && (!ip || !permitidos.includes(ip))) return new NextResponse("Acesso negado", { status: 403 });
    // Sem cookie de sessão: vai para o login (a assinatura é conferida no layout do painel)
    if (!req.nextUrl.pathname.startsWith("/admin/login") && !req.cookies.get("pl_admin")) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let res = NextResponse.next({ request: req });
  const sb = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  await sb.auth.getUser();
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|api/webhooks).*)"],
};
