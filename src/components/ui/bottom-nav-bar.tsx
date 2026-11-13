import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Box,
  Calendar,
  HeartPulse,
  Layers,
  Map,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type BottomNavItem = {
  id?: string;
  label: string;
  icon: React.ComponentType<{
    size?: number | string;
    strokeWidth?: number | string;
    className?: string;
    "aria-hidden"?: boolean;
  }>;
};

const defaultNavItems: BottomNavItem[] = [
  { id: "dashboard", label: "Live", icon: BarChart3 },
  { id: "3d", label: "3D Twin", icon: Box },
  { id: "map", label: "Map", icon: Map },
  { id: "history", label: "History", icon: TrendingUp },
  { id: "forecast", label: "Forecast", icon: Calendar },
  { id: "comparison", label: "Compare", icon: Layers },
  { id: "health", label: "Health", icon: HeartPulse },
];

const MOBILE_LABEL_WIDTH = 68;

export type BottomNavBarProps = {
  items?: BottomNavItem[];
  activeIndex?: number;
  onSelect?: (index: number, item: BottomNavItem) => void;
  className?: string;
  defaultIndex?: number;
  stickyBottom?: boolean;
  ariaLabel?: string;
  labelWidth?: number;
};

export function BottomNavBar({
  items = defaultNavItems,
  activeIndex: controlledActiveIndex,
  onSelect,
  className,
  defaultIndex = 0,
  stickyBottom = false,
  ariaLabel = "Bottom Navigation",
  labelWidth = MOBILE_LABEL_WIDTH,
}: BottomNavBarProps) {
  const [internalActiveIndex, setInternalActiveIndex] = useState(defaultIndex);
  const activeIndex =
    controlledActiveIndex !== undefined
      ? controlledActiveIndex
      : internalActiveIndex;

  const navRef = useRef<HTMLElement | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isFirstRender = useRef(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const navEl = navRef.current;
    const activeBtn = buttonRefs.current[activeIndex];
    if (navEl && activeBtn && navEl.scrollWidth > navEl.clientWidth) {
      const targetLeft =
        activeBtn.offsetLeft -
        navEl.clientWidth / 2 +
        activeBtn.clientWidth / 2;
      navEl.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: shouldReduceMotion ? "auto" : "smooth",
      });
    }
  }, [activeIndex, shouldReduceMotion]);

  const handleSelect = (idx: number, item: BottomNavItem) => {
    if (controlledActiveIndex === undefined) {
      setInternalActiveIndex(idx);
    }
    onSelect?.(idx, item);
  };

  return (
    <motion.nav
      ref={navRef}
      initial={shouldReduceMotion ? false : { scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 300, damping: 26 }
      }
      role="navigation"
      aria-label={ariaLabel}
      className={cn(
        "bg-card dark:bg-card border border-border dark:border-sidebar-border rounded-full flex items-center p-1.5 sm:p-2 shadow-xl space-x-0.5 sm:space-x-1 min-w-0 max-w-[95vw] h-[52px] overflow-x-auto no-scrollbar backdrop-blur-xl",
        stickyBottom &&
          "fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] mx-auto z-40 w-fit",
        className,
      )}
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        const isActive = activeIndex === idx;

        return (
          <motion.button
            key={item.id ?? item.label}
            ref={(el) => {
              buttonRefs.current[idx] = el;
            }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
            className={cn(
              "flex items-center gap-0 px-2.5 sm:px-3 py-2 rounded-full transition-colors duration-200 relative h-10 min-w-[40px] sm:min-w-[44px] min-h-[40px] max-h-[44px] shrink-0 touch-manipulation cursor-pointer",
              isActive
                ? "bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary"
                : "bg-transparent text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
            )}
            onClick={() => handleSelect(idx, item)}
            aria-label={item.label}
            title={item.label}
            aria-current={isActive ? "page" : undefined}
            type="button"
          >
            <Icon
              size={20}
              strokeWidth={2}
              aria-hidden
              className="transition-colors duration-200 shrink-0"
            />

            <motion.div
              initial={false}
              animate={{
                width: isActive ? `${labelWidth}px` : "0px",
                opacity: isActive ? 1 : 0,
                marginLeft: isActive ? "6px" : "0px",
              }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      width: { type: "spring", stiffness: 350, damping: 32 },
                      opacity: { duration: 0.19 },
                      marginLeft: { duration: 0.19 },
                    }
              }
              className="overflow-hidden flex items-center"
              style={{ maxWidth: `${labelWidth}px` }}
            >
              <span
                className={cn(
                  "font-semibold whitespace-nowrap select-none transition-opacity duration-200 overflow-hidden text-ellipsis text-[clamp(0.7rem,0.62rem+0.25vw,0.8125rem)] leading-[1.4]",
                  isActive ? "text-primary dark:text-primary" : "opacity-0",
                )}
                title={item.label}
              >
                {item.label}
              </span>
            </motion.div>
          </motion.button>
        );
      })}
    </motion.nav>
  );
}

export default BottomNavBar;
