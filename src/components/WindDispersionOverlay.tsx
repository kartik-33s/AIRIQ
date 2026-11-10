import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { WindDispersionData } from '../types/aqi';

interface WindDispersionOverlayProps {
  map: L.Map | null;
  active: boolean;
  showSmoke: boolean;
  showVectors: boolean;
  data: WindDispersionData | null;
}

interface Particle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  speedMultiplier: number;
}

export const WindDispersionOverlay: React.FC<WindDispersionOverlayProps> = ({
  map,
  active,
  showSmoke,
  showVectors,
  data,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const vectorLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize particles
  const initParticles = (width: number, height: number, count: number) => {
    const list: Particle[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        x: Math.random() * width,
        y: Math.random() * height,
        age: Math.floor(Math.random() * 80),
        maxAge: 70 + Math.floor(Math.random() * 60),
        speedMultiplier: 0.8 + Math.random() * 0.5,
      });
    }
    particlesRef.current = list;
  };

  // Interpolate wind vector at screen coordinate (px, py)
  const getVectorAtPoint = (px: number, py: number, width: number, height: number) => {
    if (!data || !map) {
      return { angle: 315, speed: 5.0 };
    }

    // Default to center
    let angle = data.center.windDirection;
    let speed = data.center.windSpeed;

    if (data.grid && data.grid.length > 0) {
      // Find nearest grid points in screen coordinates
      let totalWeight = 0;
      let weightedSpeed = 0;
      let weightedSin = 0;
      let weightedCos = 0;

      for (const pt of data.grid) {
        try {
          const screenPt = map.latLngToContainerPoint([pt.lat, pt.lng]);
          const dx = screenPt.x - px;
          const dy = screenPt.y - py;
          const distSq = Math.max(400, dx * dx + dy * dy);
          const weight = 1 / distSq;

          const rad = (pt.windDirection * Math.PI) / 180;
          weightedSin += Math.sin(rad) * weight;
          weightedCos += Math.cos(rad) * weight;
          weightedSpeed += pt.windSpeed * weight;
          totalWeight += weight;
        } catch {
          // If point cannot be projected
        }
      }

      if (totalWeight > 0) {
        const avgRad = Math.atan2(weightedSin / totalWeight, weightedCos / totalWeight);
        angle = (avgRad * 180) / Math.PI;
        if (angle < 0) angle += 360;
        speed = weightedSpeed / totalWeight;
      }
    }

    return { angle, speed: Math.max(1.5, Math.min(30, speed)) };
  };

  // Setup vector markers on the map
  useEffect(() => {
    if (!map) return;

    if (!vectorLayerRef.current) {
      vectorLayerRef.current = L.layerGroup().addTo(map);
    }

    vectorLayerRef.current.clearLayers();

    if (active && showVectors && data && data.grid) {
      data.grid.forEach((pt) => {
        // Arrow points in direction wind blows TOWARD: windDirection + 180 deg
        const blowToward = (pt.windDirection + 180) % 360;
        const icon = L.divIcon({
          className: 'wind-vector-glyph',
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none;">
              <div style="
                transform: rotate(${blowToward}deg);
                width: 26px;
                height: 26px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: ${showSmoke ? '#f59e0b' : '#38bdf8'};
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));
              ">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              </div>
              <span style="
                background: rgba(15, 23, 42, 0.85);
                color: #e2e8f0;
                font-size: 9px;
                font-weight: 700;
                padding: 1px 5px;
                border-radius: 9999px;
                border: 1px solid rgba(255,255,255,0.2);
                margin-top: -2px;
                white-space: nowrap;
              ">
                ${pt.windSpeed} km/h
              </span>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker([pt.lat, pt.lng], { icon, interactive: false });
        vectorLayerRef.current?.addLayer(marker);
      });
    }

    return () => {
      vectorLayerRef.current?.clearLayers();
    };
  }, [map, active, showVectors, showSmoke, data]);

  // Main Canvas Animation Loop
  useEffect(() => {
    if (!map || !active) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      const size = map.getSize();
      if (canvas.width !== size.x || canvas.height !== size.y) {
        canvas.width = size.x;
        canvas.height = size.y;
        initParticles(size.x, size.y, showSmoke ? 220 : 300);
      }
    };

    resizeCanvas();
    initParticles(canvas.width, canvas.height, showSmoke ? 220 : 300);

    const isDarkMode = document.documentElement.classList.contains('dark');
    // Clear initial
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;

      // Trail fade effect: leaves silky smooth motion tails
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = showSmoke ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';

      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Interpolate wind at particle position
        const { angle, speed } = getVectorAtPoint(p.x, p.y, width, height);

        // Angle wind blows TOWARD: angle + 180 deg
        const blowTowardRad = ((angle + 180) * Math.PI) / 180;
        const moveDist = (speed / 3.8) * p.speedMultiplier;
        const dx = Math.sin(blowTowardRad) * moveDist;
        const dy = -Math.cos(blowTowardRad) * moveDist;

        const nextX = p.x + dx;
        const nextY = p.y + dy;

        // Render particle
        if (showSmoke) {
          // Smoke dispersion mode: soft hazy particulate puffs
          const smokeOpacity = Math.sin((p.age / p.maxAge) * Math.PI) * 0.45;
          const smokeRadius = 2.5 + (p.age / p.maxAge) * 3.5;

          ctx.beginPath();
          ctx.arc(nextX, nextY, smokeRadius, 0, Math.PI * 2);
          // Color smoke based on regional pollution / dust
          const isHighSmog = (data?.center.pm25 ?? 80) >= 120;
          if (isHighSmog) {
            ctx.fillStyle = `rgba(245, 158, 11, ${smokeOpacity})`; // Amber smog
          } else {
            ctx.fillStyle = isDarkMode
              ? `rgba(203, 213, 225, ${smokeOpacity})`
              : `rgba(100, 116, 139, ${smokeOpacity})`;
          }
          ctx.fill();
        } else {
          // Wind Streamlines Mode: sleek glowing cyan/blue vector lines
          const progress = p.age / p.maxAge;
          const alpha = Math.sin(progress * Math.PI) * 0.75;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(nextX, nextY);

          // Color by wind velocity: cyan (calm) -> sky (moderate) -> amber (gale)
          let strokeColor = `rgba(56, 189, 248, ${alpha})`; // sky-400
          if (speed >= 18) {
            strokeColor = `rgba(244, 63, 94, ${alpha})`; // rose-500
          } else if (speed >= 10) {
            strokeColor = `rgba(52, 211, 153, ${alpha})`; // emerald-400
          }

          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1.8;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        p.x = nextX;
        p.y = nextY;
        p.age++;

        // Reset if offscreen or expired
        if (p.age >= p.maxAge || p.x < -10 || p.x > width + 10 || p.y < -10 || p.y > height + 10) {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.age = 0;
          p.maxAge = 60 + Math.floor(Math.random() * 60);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    const onMapChange = () => {
      resizeCanvas();
    };

    map.on('move', onMapChange);
    map.on('zoom', onMapChange);
    map.on('resize', onMapChange);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      map.off('move', onMapChange);
      map.off('zoom', onMapChange);
      map.off('resize', onMapChange);
    };
  }, [map, active, showSmoke, data]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[450]"
      style={{ touchAction: 'none' }}
    />
  );
};
