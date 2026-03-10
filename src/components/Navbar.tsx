"use client";

import React, { useState } from "react";
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

  return (
    <nav className="navbar px-4 lg:px-8 bg-base-100/80 backdrop-blur-md sticky top-0 z-50 border-b border-base-300 glass-effect">
      <div className="navbar-start">
        <div className="dropdown">
          <label
            tabIndex={0}
            className="btn btn-ghost lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X size={24} height={24} />
            ) : (
              <Menu size={24} height={24} />
            )}
          </label>
          {isMenuOpen && (
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
            >
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
        <Link
          href="/"
          className="flex items-center text-base-content hover:opacity-90 transition-opacity"
          aria-label="Hedgium home"
        >
          <img
            src="/images/logos/Hedgium Banner cropped.png"
            alt="HEDGIUM"
            className="h-8 w-auto"
          />
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-base-content hover:text-primary"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="navbar-end flex items-center gap-4">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-base-content hover:text-primary text-sm font-medium uppercase tracking-wide"
        >
          <LogIn className="h-4 w-4 shrink-0" aria-hidden />
          LOGIN
        </Link>
        <Link
          href="/onboarding"
          className="btn btn-primary btn-sm shadow hover:shadow-md"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}