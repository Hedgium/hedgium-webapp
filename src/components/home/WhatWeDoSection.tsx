'use client';

import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import TwinEngineFrameworkSection from '@/components/home/TwinEngineFrameworkSection';

const WHAT_WE_DO_IMAGES = [
  '/images/home/what we do _ slide 1.png',
  '/images/home/what we do _ slide 2.png',
].map((path) => path.replace(/ /g, '%20'));

const WHAT_WE_DO_SLIDES = [
  {
    id: 'slide-1',
    image: WHAT_WE_DO_IMAGES[0],
    bottomText: "Superior Risk-Adjusted Returns"
    
  },
  {
    id: 'slide-2',
    image: WHAT_WE_DO_IMAGES[1],
    bottomText: "Over 20 years of investing & trading experience"

  }
  // {
  //   id: 'slide-3',
  //   image: WHAT_WE_DO_IMAGES[2],
  //   bottomText: (
  //     <>
  //       <span className="font-light text-2xl">{`{ `}</span>
  //       2 decades of investing & trading experience
  //       <span className="font-light text-2xl">{` }`}</span>
  //     </>
  //   ),
  // },
];

export default function WhatWeDoSection() {
  const [current, setCurrent] = useState(0);
  const total = WHAT_WE_DO_SLIDES.length;

  useEffect(() => {
    const t = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 5000);
    return () => clearInterval(t);
  }, [total]);

  return (
    <>
      <section id="what-we-do" className="py-16 md:py-24 bg-base-100">
        <div className="max-w-8xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8 md:gap-16 items-stretch">
            <div
              className="lg:w-1/2 flex flex-col justify-center"
              data-aos="fade-up"
              data-aos-duration="650"
              data-aos-once="true"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-4xl 2xl:text-5xl text-base-content leading-snug mb-8">
                Outperform Benchmark Returns with Our{' '}
                <span className="text-primary font-bold">Twin Engine Investing</span> framework
              </h2>
              <p className="text-base md:text-lg lg:text-xl xl:text-xl 2xl:text-2xl text-base-content/80 mb-8">
                Hedgium is a quant-driven research house focused on generating{' '}
                <span className="text-primary font-bold">market-neutral alpha</span> for clients.
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/get-started?ref=schedule_call" className="btn btn-primary btn-md lg:btn-lg xl:btn-xl 2xl:btn-2xl gap-2 w-fit">
                  <Calendar className="w-6 h-6" aria-hidden />
                  Set up a Free Call
                </Link>
              </div>
            </div>
            <div
              className="lg:w-1/2 flex flex-col order-1 lg:order-2"
              data-aos="fade-up"
              data-aos-duration="650"
              data-aos-delay="100"
              data-aos-once="true"
            >
              <div className="h-[320px] md:h-[480px] min-h-0 flex flex-col gap-2 md:p-4">
                <div className="flex-1 min-h-0 relative rounded-xl overflow-hidden">
                  <Image
                    src={WHAT_WE_DO_SLIDES[current].image}
                    alt=""
                    fill
                    className="object-contain w-full h-full"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div className="flex items-center text-center justify-center gap-2 mt-auto shrink-0">
                  <span className="text-base lg:text-lg xl:text-xl text-primary font-semibold">{WHAT_WE_DO_SLIDES[current].bottomText}</span>
                </div>
              </div>
              <div className="flex justify-center gap-2 py-4 shrink-0">
                {WHAT_WE_DO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    onClick={() => setCurrent(i)}
                    className={`h-2 rounded-sm transition-all ${i === current ? 'w-6 bg-primary' : 'w-2 bg-base-300'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <TwinEngineFrameworkSection />
    </>
  );
}
