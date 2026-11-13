import * as React from "react";
import { cn } from "@/lib/utils";

export interface GridVignetteBackgroundProps {
  size?: number;
  x?: number;
  y?: number;
  horizontalVignetteSize?: number;
  verticalVignetteSize?: number;
  intensity?: number;
}

export function GridVignetteBackground({
  className,
  size = 48,
  x = 50,
  y = 50,
  horizontalVignetteSize = 100,
  verticalVignetteSize = 100,
  intensity = 0,
  style,
  ...props
}: React.ComponentProps<"div"> & GridVignetteBackgroundProps) {
  const mask = `radial-gradient(ellipse ${horizontalVignetteSize}% ${verticalVignetteSize}% at ${x}% ${y}%, black ${
    100 - intensity
  }%, transparent 100%)`;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-0 z-[-1] opacity-50 bg-[image:linear-gradient(to_right,var(--muted-foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--muted-foreground)_1px,transparent_1px)]",
        className
      )}
      style={{
        backgroundSize: `${size}px ${size}px`,
        maskImage: mask,
        WebkitMaskImage: mask,
        ...style,
      }}
      {...props}
    />
  );
}

export default GridVignetteBackground;
