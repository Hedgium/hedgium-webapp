import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hedgium | Quant-Based Investment Platform",
  description:
    "Hedgium offers a quant-based dual-engine investing framework for superior risk-adjusted returns.",
};

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
