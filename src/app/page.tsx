'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import AOS from 'aos';
import 'aos/dist/aos.css';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatWeDoSection from '@/components/home/WhatWeDoSection';
import UnlockPotentialSection from '@/components/home/UnlockPotentialSection';
import PlaybooksSection from '@/components/home/PlaybooksSection';
import HeroSection from '@/components/home/HeroSection';

const LazyPlaceholder = ({ h = 400 }: { h?: number }) => (
  <div className="bg-base-200" style={{ minHeight: `${h}px` }} aria-hidden />
);

const WhyHedgiumSection = dynamic(
  () =>
    import('@/components/home/WhyHedgiumSection').then((mod) => {
      const C = mod.default;
      return {
        default: function WithAOS() {
          useEffect(() => {
            AOS.refresh();
          }, []);
          return <C />;
        },
      };
    }),
  { ssr: false, loading: () => <LazyPlaceholder h={500} /> }
);

const SandboxSection = dynamic(
  () =>
    import('@/components/home/SandboxSection').then((mod) => {
      const C = mod.default;
      return {
        default: function WithAOS() {
          useEffect(() => {
            AOS.refresh();
          }, []);
          return <C />;
        },
      };
    }),
  { ssr: false, loading: () => <LazyPlaceholder h={450} /> }
);

const FeesSection = dynamic(
  () =>
    import('@/components/home/FeesSection').then((mod) => {
      const C = mod.default;
      return {
        default: function WithAOS() {
          useEffect(() => {
            AOS.refresh();
          }, []);
          return <C />;
        },
      };
    }),
  { ssr: false, loading: () => <LazyPlaceholder h={400} /> }
);

const ContactSection = dynamic(
  () =>
    import('@/components/home/ContactSection').then((mod) => {
      const C = mod.default;
      return {
        default: function WithAOS() {
          useEffect(() => {
            AOS.refresh();
          }, []);
          return <C />;
        },
      };
    }),
  { ssr: false, loading: () => <LazyPlaceholder h={350} /> }
);

const FAQSection = dynamic(
  () =>
    import('@/components/home/FAQSection').then((mod) => {
      const C = mod.default;
      return {
        default: function WithAOS() {
          useEffect(() => {
            AOS.refresh();
          }, []);
          return <C />;
        },
      };
    }),
  { ssr: false, loading: () => <LazyPlaceholder h={500} /> }
);

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
      {/* uncomment this when sandbox is ready */}
      {/* <SandboxSection /> */}
      <FeesSection />
      <ContactSection />
      <FAQSection />
      <Footer />
    </>
  );
}
