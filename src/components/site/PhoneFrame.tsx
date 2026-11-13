import Image from "next/image";

/** Moldura de celular para as capturas reais do app. */
export default function PhoneFrame({ src, alt, priority, className = "" }: { src: string; alt: string; priority?: boolean; className?: string }) {
  return (
    <div className={`relative mx-auto w-[240px] rounded-[2.4rem] border-[10px] border-ink bg-ink shadow-2xl sm:w-[270px] ${className}`}>
      <div className="absolute left-1/2 top-1.5 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-ink" aria-hidden />
      <Image src={src} alt={alt} width={390} height={844} priority={priority} className="h-auto w-full rounded-[1.7rem]" sizes="270px" />
    </div>
  );
}
