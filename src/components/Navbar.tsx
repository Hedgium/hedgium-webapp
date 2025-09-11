"use client"

import React from "react";
import { useState } from "react";
import { 
  LineChart, Bot, Code2, Smartphone, Shield, Users, 
  CheckCircle, X, Check, User, Star, ChevronDown,
  TrendingUp, ArrowRight, Menu, X as CloseIcon
} from 'lucide-react';


export default function Navbar(){

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
              {isMenuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
            </label>
            {isMenuOpen && (
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                <li><a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a></li>
                <li><a href="#strategies" onClick={() => setIsMenuOpen(false)}>Strategies</a></li>
                <li><a href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</a></li>
                <li><a href="#testimonials" onClick={() => setIsMenuOpen(false)}>Testimonials</a></li>
              </ul>
            )}
          </div>
          <a className="btn btn-ghost normal-case text-xl font-bold text-primary">
            <LineChart className="mr-2" size={24} />
            Hedgium
          </a>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li><a href="#features">Features</a></li>
            <li><a href="#strategies">Strategies</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#testimonials">Testimonials</a></li>
          </ul>
        </div>
        <div className="navbar-end">
          <a className="btn btn-primary">Sign Up</a>
        </div>
      </nav>
    )
}