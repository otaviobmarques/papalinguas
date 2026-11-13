import type { Metadata } from "next";
import PrototipoTutores from "./PrototipoTutores";

export const metadata: Metadata = { title: "Protótipo dos tutores em foto", robots: { index: false, follow: false } };

export default function Page() {
  return <PrototipoTutores />;
}
