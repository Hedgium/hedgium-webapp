"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Menu, LogIn } from "lucide-react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "What We Do", href: "/#what-we-do" },
  { label: "Unlock Potential", href: "/#unlock-potential" },
  { label: "Why Hedgium", href: "/#why-hedgium" },
  { label: "Fees", href: "/#fees" },
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
    <nav className="w-full px-4 lg:px-4 py-1 lg:py-2 bg-base-100/80 backdrop-blur-md sticky top-0 z-50 border-b border-base-300 glass-effect">
      <div className="navbar px-0 max-w-8xl mx-auto">
      <div className="navbar-start relative z-[100]">
        <Link
          href="/"
          className="flex items-center text-base-content hover:opacity-90 transition-opacity"
          aria-label="Hedgium home"
        >
          <img
            src="/images/logos/Hedgium Banner cropped.png"
            alt="HEDGIUM"
            className="h-10 lg:h-12 w-auto "
          />


        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-1 flex-nowrap shrink-0">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                className="text-sm xl:text-base text-base-content hover:text-primary whitespace-nowrap"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="navbar-end flex items-center gap-2 lg:gap-6">
        
        <Link
          href="/get-started"
          className="btn btn-primary hidden lg:flex btn-md lg:btn-lg shadow hover:shadow-md shrink-0"
        >
          Get Started
        </Link>

        <Link
          href="/login"
          className="hidden lg:flex items-center gap-1.5 text-base-content hover:text-primary text-sm font-medium uppercase tracking-wide shrink-0"
        >
          <LogIn className="h-5 w-5 shrink-0" aria-hidden />
          <span>LOGIN</span>
        </Link>



        <div
          ref={menuRef}
          className={`dropdown dropdown-end ${isMenuOpen ? "dropdown-open" : ""} lg:hidden`}
        >
          <button
            type="button"
            className="btn btn-ghost px-2"
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
          {isMenuOpen && (
            <ul className="menu menu-sm dropdown-content mt-3 z-[200] p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300">

              <li className="px-2">
                <Link
                  href="/get-started"
                  onClick={() => setIsMenuOpen(false)}
                  className="btn btn-primary btn-sm w-full my-2 justify-center"
                >
                  Get Started
                </Link>
              </li>

              <li>
                
              <Link
              href="/login"
              className="items-center gap-1.5 text-base-content hover:text-primary text-sm font-medium tracking-wide shrink-0"
            >
              {/* <LogIn className="h-5 w-5 shrink-0" aria-hidden /> */}
              <span>Login</span>
            </Link>

              </li>

              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} onClick={() => setIsMenuOpen(false)}>
                    {label}
                  </Link>
                </li>
              ))}
              
            </ul>
          )}
        </div>
      </div>

      </div>
    </nav>
  );
}