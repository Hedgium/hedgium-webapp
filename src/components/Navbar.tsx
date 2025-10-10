"use client";

import React, { useState } from "react";
import { X, Menu } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="navbar bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 glass-effect">
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
              <li>
                <Link href="/#features" onClick={() => setIsMenuOpen(false)}>
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#strategies" onClick={() => setIsMenuOpen(false)}>
                  Strategies
                </Link>
              </li>
              <li>
                <Link href="/#pricing" onClick={() => setIsMenuOpen(false)}>
                  Pricing
                </Link>
              </li>
            </ul>
          )}
        </div>
        <Link
          href="/"
          className="btn btn-ghost normal-case text-xl font-bold text-gray-900 hover:text-primary"
        >
          Hedgium
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 text-gray-700">
          <li>
            <Link href="/#features" className="hover:text-primary">Features</Link>
          </li>
          <li>
            <Link href="/#strategies" className="hover:text-primary">Strategies</Link>
          </li>
          <li>
            <Link href="/#pricing" className="hover:text-primary">Pricing</Link>
          </li>
        </ul>
      </div>
      <div className="navbar-end space-x-2">
        <Link href="/login" className="btn btn-ghost text-gray-700 hover:text-primary">
          Login
        </Link>
        <Link href="/register" className="btn btn-primary shadow hover:shadow-md">
          Get Started
        </Link>
      </div>
    </nav>
  );
}