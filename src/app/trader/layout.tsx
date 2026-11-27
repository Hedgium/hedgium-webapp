import type { Metadata } from "next";
import TraderLayoutClient from "./TraderLayoutClient";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

export default function TraderLayout({ children }: { children: React.ReactNode }) {
  return <TraderLayoutClient>{children}</TraderLayoutClient>;
}
