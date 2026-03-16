"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Menu, LogIn } from "lucide-react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "What We Do", href: "/#what-we-do" },
  { label: "Unlock Potential", href: "/#unlock-potential" },
  { label: "Why Hedgium", href: "/#why-hedgium" },
  { label: "Fees", href: "/#pricing" },
] as const;

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const close = (e: MouseEvent | PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setIsMenuOpen(false);
    };
    document.addEventListener("pointerdown", close, true);
    return () => document.removeEventListener("pointerdown", close, true);
  }, [isMenuOpen]);

  return (
    <nav className="w-full px-4 lg:px-8 py-1 lg:py-3  bg-base-100/80 backdrop-blur-md sticky top-0 z-50 border-b border-base-300 glass-effect">
      
      <div className="navbar max-w-7xl mx-auto">
      <div className="navbar-start relative z-[100]">
        <div
          ref={menuRef}
          className={`dropdown ${isMenuOpen ? "dropdown-open" : ""}`}
        >
          <button
            type="button"
            className="btn btn-ghost lg:hidden px-2"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X size={24} height={24} />
            ) : (
              <Menu size={24} height={24} />
            )}
          </button>
          {isMenuOpen && <ul className="menu menu-sm dropdown-content mt-3 z-[200] p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} onClick={() => setIsMenuOpen(false)}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          }
        </div>
        <Link
          href="/"
          className="flex items-center text-base-content hover:opacity-90 transition-opacity"
          aria-label="Hedgium home"
        >
          <img
            src="/images/logos/Hedgium Banner cropped.png"
            alt="HEDGIUM"
            className="h-12 w-auto "
          />


        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-sm lg:text-base xl:text-md 2xl:text-lg text-base-content hover:text-primary"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="navbar-end flex items-center gap-4">

      <Link
          href="/get-started"
          className="btn btn-primary btn-md shadow hover:shadow-md"
        >
          Get Started
        </Link>

        <Link
          href="/login"
          className="lg:flex items-center gap-1.5 text-base-content hover:text-primary text-sm font-medium uppercase tracking-wide"
        >
          <LogIn className="h-5 w-5 shrink-0" aria-hidden />
          <span className="hidden lg:block">LOGIN</span>
        </Link>
        
      </div>

      </div>
    </nav>
  );
}