'use client';

import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatWeDoSection from '@/components/home/WhatWeDoSection';
import UnlockPotentialSection from '@/components/home/UnlockPotentialSection';
import PlaybooksSection from '@/components/home/PlaybooksSection';
import WhyHedgiumSection from '@/components/home/WhyHedgiumSection';
import SandboxSection from '@/components/home/SandboxSection';
import FeesSection from '@/components/home/FeesSection';
import FAQSection from '@/components/home/FAQSection';
import ContactSection from '@/components/home/ContactSection';
import HeroSection from '@/components/home/HeroSection';

export default function Home() {
  useEffect(() => {
    AOS.init({
      duration: 750,
      once: false,
      offset: 100,
      easing: 'ease-out-cubic',
      anchorPlacement: 'top-bottom',
    });
    const id = requestAnimationFrame(() => AOS.refresh());
    const onLoad = () => AOS.refresh();
    window.addEventListener('load', onLoad);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('load', onLoad);
    };
  }, []);

  useEffect(() => {
    const handleAnchorClick = (e: Event) => {
      const target = e.target as Element;
      const href = target.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const element = document.querySelector(href);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }
    };
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', handleAnchorClick);
    });
    return () => {
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.removeEventListener('click', handleAnchorClick);
      });
    };
  }, []);

  return (
    <>
      <Navbar />

      <HeroSection />

      <WhatWeDoSection />
      <UnlockPotentialSection />
      <PlaybooksSection />
      <WhyHedgiumSection />
      <SandboxSection />
      <FeesSection />
      <FAQSection />
      <ContactSection />
      <Footer />
    </>
  );
}
