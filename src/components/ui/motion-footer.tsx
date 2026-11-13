"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

.cinematic-footer-wrapper {
  font-family: 'Plus Jakarta Sans', sans-serif;
  -webkit-font-smoothing: antialiased;

  --pill-bg-1: color-mix(in oklch, var(--foreground) 5%, transparent);
  --pill-bg-2: color-mix(in oklch, var(--foreground) 1.5%, transparent);
  --pill-shadow: color-mix(in oklch, var(--background) 50%, transparent);
  --pill-highlight: color-mix(in oklch, var(--foreground) 12%, transparent);
  --pill-inset-shadow: color-mix(in oklch, var(--background) 80%, transparent);
  --pill-border: color-mix(in oklch, var(--foreground) 10%, transparent);

  --pill-bg-1-hover: color-mix(in oklch, var(--foreground) 10%, transparent);
  --pill-bg-2-hover: color-mix(in oklch, var(--foreground) 3%, transparent);
  --pill-border-hover: color-mix(in oklch, var(--foreground) 22%, transparent);
  --pill-shadow-hover: color-mix(in oklch, var(--background) 70%, transparent);
  --pill-highlight-hover: color-mix(in oklch, var(--foreground) 22%, transparent);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px color-mix(in oklch, var(--destructive) 50%, transparent)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 10px color-mix(in oklch, var(--destructive) 80%, transparent)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 40s linear infinite;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-footer-breathe,
  .animate-footer-scroll-marquee,
  .animate-footer-heartbeat {
    animation: none;
  }
}

.footer-bg-grid {
  background-size: 60px 60px;
  background-image:
    linear-gradient(to right, color-mix(in oklch, var(--foreground) 4%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 4%, transparent) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%,
    color-mix(in oklch, var(--primary) 18%, transparent) 0%,
    color-mix(in oklch, var(--secondary) 16%, transparent) 40%,
    transparent 70%
  );
}

.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow:
    0 10px 30px -10px var(--pill-shadow),
    inset 0 1px 1px var(--pill-highlight),
    inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow:
    0 20px 40px -10px var(--pill-shadow-hover),
    inset 0 1px 1px var(--pill-highlight-hover);
  color: var(--foreground);
}

.footer-giant-bg-text {
  font-size: clamp(5.5rem, 24vw, 22rem);
  line-height: 0.78;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in oklch, var(--foreground) 6%, transparent);
  background: linear-gradient(180deg, color-mix(in oklch, var(--foreground) 12%, transparent) 0%, transparent 65%);
  -webkit-background-clip: text;
  background-clip: text;
}

.footer-text-glow {
  background: linear-gradient(180deg, var(--foreground) 0%, color-mix(in oklch, var(--foreground) 50%, transparent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 20px color-mix(in oklch, var(--foreground) 15%, transparent));
}

@media (max-height: 620px) {
  .cinematic-footer-outer {
    height: auto !important;
    min-height: 100dvh !important;
    clip-path: none !important;
  }
  .cinematic-footer-panel {
    position: relative !important;
    height: auto !important;
    min-height: 100dvh !important;
    padding-top: 4.5rem;
  }
}
`;

export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
  };

export const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;

          gsap.to(element, {
            x: x * 0.35,
            y: y * 0.35,
            rotationX: -y * 0.12,
            rotationY: x * 0.12,
            scale: 1.04,
            ease: "power2.out",
            duration: 0.4,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            ease: "elastic.out(1, 0.3)",
            duration: 1.1,
          });
        };

        element.addEventListener("mousemove", handleMouseMove as EventListener);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          element.removeEventListener("mousemove", handleMouseMove as EventListener);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node: HTMLElement | null) => {
          localRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

export interface FooterActionPill {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  external?: boolean;
}

export interface FooterSecondaryLink {
  label: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
}

export interface CinematicFooterProps {
  brandName?: string;
  giantText?: string;
  heading?: string;
  subtitle?: string;
  marqueeItems?: string[];
  primaryActions?: FooterActionPill[];
  secondaryLinks?: FooterSecondaryLink[];
  copyrightText?: string;
  craftedLabel?: string;
  className?: string;
}

const DEFAULT_MARQUEE = [
  "Real-Time Telemetry",
  "US EPA & India CPCB",
  "WHO 2021 Air Targets",
  "Atmospheric 3D Twin",
  "Clinical Health Advisories",
];

export function CinematicFooter({
  brandName = "AirIQ Platform",
  giantText = "AIRIQ",
  heading = "Breathe with clarity.",
  subtitle,
  marqueeItems = DEFAULT_MARQUEE,
  primaryActions = [],
  secondaryLinks = [],
  copyrightText,
  craftedLabel = "clean air & public health",
  className,
}: CinematicFooterProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        giantTextRef.current,
        { y: "8vh", scale: 0.85, opacity: 0 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 85%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );

      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 65%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );
    }, wrapperRef);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderMarqueeTrack = () => (
    <div className="flex items-center space-x-6 sm:space-x-12 px-4 sm:px-6">
      {marqueeItems.map((item, idx) => (
        <React.Fragment key={idx}>
          <span className="whitespace-nowrap">{item}</span>
          <span className={idx % 2 === 0 ? "text-primary/70" : "text-secondary/70"}>✦</span>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div
        ref={wrapperRef}
        className={cn("cinematic-footer-outer relative z-0 h-[100dvh] min-h-[560px] w-full", className)}
        style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <footer className="cinematic-footer-panel fixed bottom-0 left-0 flex h-[100dvh] min-h-[560px] w-full flex-col justify-between overflow-hidden bg-background text-foreground cinematic-footer-wrapper">
          {/* Ambient Light & Grid Background */}
          <div className="footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[85vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />
          <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

          {/* Giant background text */}
          <div
            ref={giantTextRef}
            aria-hidden="true"
            className="footer-giant-bg-text absolute -bottom-[1.5vh] sm:-bottom-[4vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none"
          >
            {giantText}
          </div>

          {/* 1. Diagonal Sleek Marquee (Top of footer) */}
          <div className="absolute top-5 sm:top-10 left-0 w-full overflow-hidden border-y border-border/50 bg-background/70 backdrop-blur-md py-2.5 sm:py-4 z-10 -rotate-2 scale-110 shadow-2xl">
            <div className="flex w-max animate-footer-scroll-marquee text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground uppercase">
              {renderMarqueeTrack()}
              {renderMarqueeTrack()}
            </div>
          </div>

          {/* 2. Main Center Content */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-3 sm:px-6 mt-12 sm:mt-20 w-full max-w-5xl mx-auto">
            <div ref={headingRef} className="text-center mb-5 sm:mb-10 space-y-2 sm:space-y-3">
              <h2 className="text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-black footer-text-glow tracking-tighter leading-none px-1">
                {heading}
              </h2>
              {subtitle && (
                <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed px-2">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Interactive Magnetic Pills Layout */}
            <div ref={linksRef} className="flex flex-col items-center gap-3 sm:gap-5 w-full">
              {primaryActions.length > 0 && (
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2 sm:gap-3.5 md:gap-4 w-full max-w-md sm:max-w-none">
                  {primaryActions.map((action, idx) =>
                    action.href ? (
                      <MagneticButton
                        key={idx}
                        as="a"
                        href={action.href}
                        target={action.external ? "_blank" : undefined}
                        rel={action.external ? "noreferrer" : undefined}
                        className="footer-glass-pill px-3 py-2.5 sm:px-7 sm:py-4 rounded-full text-foreground font-bold text-[11px] sm:text-sm md:text-base flex items-center justify-center gap-1.5 sm:gap-2.5 group min-h-[44px] touch-manipulation whitespace-nowrap"
                      >
                        <span className="shrink-0">{action.icon}</span>
                        <span className="truncate">{action.label}</span>
                      </MagneticButton>
                    ) : (
                      <MagneticButton
                        key={idx}
                        as="button"
                        type="button"
                        onClick={action.onClick}
                        className="footer-glass-pill px-3 py-2.5 sm:px-7 sm:py-4 rounded-full text-foreground font-bold text-[11px] sm:text-sm md:text-base flex items-center justify-center gap-1.5 sm:gap-2.5 group min-h-[44px] touch-manipulation whitespace-nowrap"
                      >
                        <span className="shrink-0">{action.icon}</span>
                        <span className="truncate">{action.label}</span>
                      </MagneticButton>
                    )
                  )}
                </div>
              )}

              {secondaryLinks.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-3 md:gap-4 w-full">
                  {secondaryLinks.map((link, idx) =>
                    link.href ? (
                      <MagneticButton
                        key={idx}
                        as="a"
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noreferrer" : undefined}
                        className="footer-glass-pill px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full text-muted-foreground font-medium text-[10px] sm:text-xs md:text-sm hover:text-foreground min-h-[36px] sm:min-h-[40px] inline-flex items-center justify-center touch-manipulation whitespace-nowrap"
                      >
                        {link.label}
                      </MagneticButton>
                    ) : (
                      <MagneticButton
                        key={idx}
                        as="button"
                        type="button"
                        onClick={link.onClick}
                        className="footer-glass-pill px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full text-muted-foreground font-medium text-[10px] sm:text-xs md:text-sm hover:text-foreground min-h-[36px] sm:min-h-[40px] inline-flex items-center justify-center touch-manipulation whitespace-nowrap"
                      >
                        {link.label}
                      </MagneticButton>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. Bottom Bar / Credits */}
          <div className="relative z-20 w-full pb-20 sm:pb-24 md:pb-8 px-4 sm:px-6 md:pl-12 md:pr-44 flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4">
            <div className="text-muted-foreground text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase order-2 md:order-1 text-center md:text-left">
              {copyrightText || `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`}
            </div>

            <div className="flex items-center gap-2.5 order-1 md:order-2">
              <div className="footer-glass-pill px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full flex items-center gap-1.5 sm:gap-2 cursor-default border-border/50">
                <span className="text-muted-foreground text-[9px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest whitespace-nowrap">
                  Crafted with
                </span>
                <span className="animate-footer-heartbeat text-xs sm:text-base text-destructive">
                  ❤
                </span>
                <span className="text-muted-foreground text-[9px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest">
                  for
                </span>
                <span className="text-foreground font-black text-[10px] sm:text-xs tracking-normal whitespace-nowrap">
                  {craftedLabel}
                </span>
              </div>

              <MagneticButton
                as="button"
                type="button"
                onClick={scrollToTop}
                aria-label="Scroll back to top"
                className="md:hidden w-10 h-10 rounded-full footer-glass-pill flex items-center justify-center text-muted-foreground hover:text-foreground group shrink-0 touch-manipulation"
              >
                <ArrowUp className="w-4 h-4 transform group-hover:-translate-y-1 transition-transform duration-300" />
              </MagneticButton>
            </div>

            <MagneticButton
              as="button"
              type="button"
              onClick={scrollToTop}
              aria-label="Scroll back to top"
              className="hidden md:flex w-12 h-12 rounded-full footer-glass-pill items-center justify-center text-muted-foreground hover:text-foreground group order-3 shrink-0"
            >
              <ArrowUp className="w-5 h-5 transform group-hover:-translate-y-1 transition-transform duration-300" />
            </MagneticButton>
          </div>
        </footer>
      </div>
    </>
  );
}

export default CinematicFooter;
