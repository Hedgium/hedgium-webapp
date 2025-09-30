"use client";
import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";

interface SliderProps {
  children: React.ReactNode;
  slidesToScroll?: number;
  className?: string;
}

export default function Slider({
  children,
  slidesToScroll = 1,
  className = "",
}: SliderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const slideStepRef = useRef<number>(0);
  const maxIndexRef = useRef<number>(0);
  const scrollDebounceRef = useRef<number | null>(null);
  const touchStartRef = useRef<number | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Calculate step, maxIndex, and set scroll-padding to match container padding
  const calcMetrics = () => {
    const container = containerRef.current;
    if (!container) return;

    const childrenEls = Array.from(container.children) as HTMLElement[];
    if (!childrenEls.length) return;

    const first = childrenEls[0];
    // step is difference of offsetLeft between first and second child (or first width)
    let step = first.offsetWidth;
    if (childrenEls.length > 1) {
      const second = childrenEls[1];
      const diff = Math.abs(second.offsetLeft - first.offsetLeft);
      if (diff > 0) step = diff;
    }
    slideStepRef.current = step || 1;

    // Respect current padding for scroll-snap alignment
    const cs = window.getComputedStyle(container);
    const padLeft = parseFloat(cs.paddingLeft || "0") || 0;
    const padRight = parseFloat(cs.paddingRight || "0") || 0;

    container.style.setProperty("scroll-padding-left", `${padLeft}px`);
    container.style.setProperty("scroll-padding-right", `${padRight}px`);

    const clientWidth = container.clientWidth;
    const scrollWidth = container.scrollWidth;
    const maxIndex = Math.max(
      0,
      Math.round((scrollWidth - clientWidth) / slideStepRef.current)
    );
    maxIndexRef.current = maxIndex;

    // Update index/arrow states according to current scroll
    updateIndexFromScroll();
  };

  // Round scrollLeft/step into an index
  const updateIndexFromScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const step = slideStepRef.current || 1;
    const raw = container.scrollLeft;
    let idx = Math.round(raw / step);
    idx = Math.max(0, Math.min(idx, maxIndexRef.current));
    setCurrentIndex(idx);
    setCanScrollLeft(idx > 0);
    setCanScrollRight(idx < maxIndexRef.current);
  };

  const scrollToIndex = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const step = slideStepRef.current || 1;
    index = Math.max(0, Math.min(index, maxIndexRef.current));
    const target = Math.round(index * step);
    container.scrollTo({ left: target, behavior: "smooth" });

    // optimistic update
    setCurrentIndex(index);
    setCanScrollLeft(index > 0);
    setCanScrollRight(index < maxIndexRef.current);

    if (scrollDebounceRef.current) window.clearTimeout(scrollDebounceRef.current);
    scrollDebounceRef.current = window.setTimeout(() => {
      updateIndexFromScroll();
    }, 350);
  };

  const handlePrev = () => scrollToIndex(currentIndex - slidesToScroll);
  const handleNext = () => scrollToIndex(currentIndex + slidesToScroll);

  // scroll event (debounced)
  const onScroll = () => {
    if (scrollDebounceRef.current) window.clearTimeout(scrollDebounceRef.current);
    scrollDebounceRef.current = window.setTimeout(() => {
      updateIndexFromScroll();
    }, 80);
  };

  // touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current == null) return;
    const dx = touchStartRef.current - e.changedTouches[0].clientX;
    const threshold = Math.max(30, (slideStepRef.current || 120) / 4);
    if (dx > threshold) handleNext();
    else if (dx < -threshold) handlePrev();
    touchStartRef.current = null;
  };

  // initial metrics + observe resizes and layout changes
  useEffect(() => {
    calcMetrics();

    const onWinResize = () => calcMetrics();
    window.addEventListener("resize", onWinResize);

    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(() => calcMetrics());
      if (containerRef.current) {
        ro.observe(containerRef.current);
        if (containerRef.current.firstElementChild)
          ro.observe(containerRef.current.firstElementChild);
      }
    } catch (err) {
      // fallback for old browsers
    }

    const initTimer = window.setTimeout(calcMetrics, 120);

    return () => {
      window.removeEventListener("resize", onWinResize);
      if (ro) ro.disconnect();
      clearTimeout(initTimer);
      if (scrollDebounceRef.current) window.clearTimeout(scrollDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  useEffect(() => {
    const t = window.setTimeout(calcMetrics, 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Prev */}
      <button
        aria-label="Previous"
        onClick={handlePrev}
        disabled={!canScrollLeft}
        className={`hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10
                    bg-base-200 rounded-full p-2 shadow transition-opacity
                    ${canScrollLeft ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-40"}`}
      >
        <Icon icon="lucide:chevron-left" width={20} height={20} />
      </button>

      {/* slider wrapper */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide"
      >
        {children}
      </div>

      {/* Next */}
      <button
        aria-label="Next"
        onClick={handleNext}
        disabled={!canScrollRight}
        className={`hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10
                    bg-base-200 rounded-full p-2 shadow transition-opacity
                    ${canScrollRight ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-40"}`}
      >
        <Icon icon="lucide:chevron-right" width={20} height={20} />
      </button>
    </div>
  );
}
