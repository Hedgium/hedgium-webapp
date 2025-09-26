"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="navbar bg-base-100 sticky top-0 z-50 shadow-md">
      <div className="navbar-start">
        <div className="dropdown">
          <label
            tabIndex={0}
            className="btn btn-ghost lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <Icon icon="lucide:x" width={24} height={24} />
            ) : (
              <Icon icon="lucide:menu" width={24} height={24} />
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
          className="btn btn-ghost normal-case text-xl font-bold text-primary"
        >
          <Icon icon="lucide:line-chart" className="mr-2" width={24} height={24} />
          Hedgium
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <Link href="/#features">Features</Link>
          </li>
          <li>
            <Link href="/#strategies">Strategies</Link>
          </li>
          <li>
            <Link href="/#pricing">Pricing</Link>
          </li>
        </ul>
      </div>
      <div className="navbar-end space-x-2">
        <Link href="/login" className="btn btn-primary btn-outline">
          Login
        </Link>
        <Link href="/register" className="btn btn-primary">
          Sign Up
        </Link>
      </div>
    </nav>
  );
}
