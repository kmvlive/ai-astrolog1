import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Значение имени — AI Астролог",
  description: "Происхождение, значение и характер имени. AI расскажет про любое имя.",
  openGraph: {
    title: "Значение имени | AI Астролог",
    description: "Происхождение, значение и характер имени",
  },
};

export default function NamesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
