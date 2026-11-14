import Link from "next/link";
import Logo from "@/components/marca/Logo";
import { SITE } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#080d18]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 text-sm md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo assinatura />
          <p className="mt-4 max-w-xs text-ink-soft">Tutores de inteligência artificial para você falar um novo idioma com confiança: inglês, espanhol, francês, italiano, alemão, japonês, mandarim e português.</p>
        </div>
        <nav aria-label="Produto" className="flex flex-col gap-3">
          <p className="font-bold text-ink">Produto</p>
          <Link href="/#como-funciona" className="text-ink-soft hover:text-ink">Como funciona</Link>
          <Link href="/#tutores" className="text-ink-soft hover:text-ink">Tutores</Link>
          <Link href="/#planos" className="text-ink-soft hover:text-ink">Planos</Link>
          <Link href="/comecar" className="text-ink-soft hover:text-ink">Teste de nível grátis</Link>
        </nav>
        <nav aria-label="Documentos legais" className="flex flex-col gap-3">
          <p className="font-bold text-ink">Legal</p>
          <Link href="/legal/termos" className="text-ink-soft hover:text-ink">Termos de Uso</Link>
          <Link href="/legal/privacidade" className="text-ink-soft hover:text-ink">Política de Privacidade</Link>
          <Link href="/legal/cookies" className="text-ink-soft hover:text-ink">Política de Cookies</Link>
          <Link href="/legal/reembolso" className="text-ink-soft hover:text-ink">Reembolso e Cancelamento</Link>
        </nav>
        <div className="flex flex-col gap-1 text-ink-soft">
          <p className="font-bold text-ink">Empresa</p>
          <p className="mt-2">{SITE.empresa}</p>
          <p>CNPJ {SITE.cnpj}</p>
          <p><a href={`mailto:${SITE.contato}`} className="hover:text-ink">{SITE.contato}</a></p>
        </div>
      </div>
      <div className="border-t border-white/5">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-ink-soft">© {new Date().getFullYear()} Papalinguas. Para maiores de 18 anos. Os tutores são inteligências artificiais.</p>
      </div>
    </footer>
  );
}
