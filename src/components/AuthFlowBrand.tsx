"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const LIGHT_ICON = "/images/hedgium_icon.png";
const DARK_ICON = "/images/logos_darkmode/Hedgium Icon darkmode.png";

type AuthFlowBrandProps = {
  /** Override default bottom margin (e.g. `mb-0` when inside a spaced header stack). */
  className?: string;
};

export default function AuthFlowBrand({ className = "mb-5" }: AuthFlowBrandProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const iconSrc = mounted && resolvedTheme === "dark" ? DARK_ICON : LIGHT_ICON;

  return (
    <Link
      href="/"
      aria-label="Hedgium — return to sign in"
      className={`block rounded-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={iconSrc}
        alt=""
        className="mx-auto h-9 w-auto sm:h-12"
      />
    </Link>
  );
}
