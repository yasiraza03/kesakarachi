"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** km/h */
  windSpeed: number;
  /** meteorological: the direction the wind blows FROM, degrees */
  windDirection: number;
  /** 0..1 */
  rain: number;
  /** ug/m3, modelled */
  pm25: number | null;
  weatherOn: boolean;
  airOn: boolean;
  paused: boolean;
};

type P = { x: number; y: number; life: number; speed: number; size: number };

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * A screen-space atmosphere: wind streaks, rain, drifting dust.
 *
 * Honest framing: wind and PM2.5 are single readings for the whole city, so this is drawn as a uniform
 * field. It visualises the *numbers*, not a spatial wind map.
 */
export function AtmosphereCanvas(props: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    let raf = 0;
    let running = true;
    
    let accent = "169,216,208";
    const dustRgb = "201,184,154";

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      const hex = (v: string) => {
        const m = /^#([0-9a-f]{6})$/i.exec(v.trim());
        if (!m) return null;
        const n = parseInt(m[1], 16);
        return `${n >> 16},${(n >> 8) & 255},${n & 255}`;
      };
      accent = hex(cs.getPropertyValue("--accent")) ?? accent;
    };
    readColors();
    const colorTimer = setInterval(readColors, 4000);

    const wind: P[] = [];
    const rain: P[] = [];
    const dust: P[] = [];
    const spawn = (kind: "wind" | "rain" | "dust"): P => ({
      x: rnd(-40, w + 40), y: rnd(-40, h + 40), life: rnd(0, 1),
      speed: kind === "rain" ? rnd(0.8, 1.3) : rnd(0.6, 1.4), size: kind === "dust" ? rnd(0.6, 1.9) : rnd(0.8, 1.6),
    });

    let last = performance.now();
    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(48, now - last) / 16.67;
      last = now;
      const p = latest.current;
      if (p.paused) {
        ctx.clearRect(0, 0, w, h);
        return;
      }

      // fade previous frame -> trails
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.14)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";

      const toward = ((p.windDirection + 180) * Math.PI) / 180;
      const dx = Math.sin(toward);
      const dy = -Math.cos(toward);
      const v = Math.max(0.35, p.windSpeed * 0.07);

      // wind streaks
      const windTarget = p.weatherOn ? Math.round(Math.min(200, 36 + p.windSpeed * 4)) : 0;
      while (wind.length < windTarget) wind.push(spawn("wind"));
      while (wind.length > windTarget) wind.pop();
      ctx.lineWidth = 1;
      for (const s of wind) {
        const step = v * s.speed * dt;
        const nx = s.x + dx * step * 3;
        const ny = s.y + dy * step * 3;
        ctx.strokeStyle = `rgba(${accent},${0.05 + 0.2 * Math.sin(s.life * Math.PI)})`;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        s.x = nx; s.y = ny; s.life += 0.006 * dt;
        if (s.life >= 1 || s.x < -60 || s.x > w + 60 || s.y < -60 || s.y > h + 60) {
          s.life = 0;
          // respawn upwind so the field stays full
          s.x = rnd(0, w) - dx * (w * 0.4) * Math.random();
          s.y = rnd(0, h) - dy * (h * 0.4) * Math.random();
        }
      }

      // rain
      const rainTarget = p.weatherOn ? Math.round(p.rain * 320) : 0;
      while (rain.length < rainTarget) rain.push(spawn("rain"));
      while (rain.length > rainTarget) rain.pop();
      const slant = Math.max(-0.6, Math.min(0.6, dx * (p.windSpeed / 40)));
      ctx.strokeStyle = "rgba(169,216,208,0.42)";
      ctx.lineWidth = 1;
      for (const s of rain) {
        const len = 9 + 12 * p.rain;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + slant * len, s.y + len);
        ctx.stroke();
        s.y += (10 + 9 * p.rain) * s.speed * dt;
        s.x += slant * 10 * s.speed * dt;
        if (s.y > h + 20) { s.y = rnd(-60, -5); s.x = rnd(-40, w + 40); }
      }

      // dust motes (modelled PM2.5)
      const dustTarget = p.airOn && p.pm25 !== null ? Math.round(Math.min(170, p.pm25 * 2.4)) : 0;
      while (dust.length < dustTarget) dust.push(spawn("dust"));
      while (dust.length > dustTarget) dust.pop();
      ctx.fillStyle = `rgba(${dustRgb},0.32)`;
      for (const s of dust) {
        s.x += (dx * v * 0.5 + Math.sin(s.life * 6 + s.y * 0.01) * 0.12) * s.speed * dt;
        s.y += (dy * v * 0.5 + Math.cos(s.life * 5 + s.x * 0.01) * 0.1) * s.speed * dt;
        s.life += 0.004 * dt;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        if (s.x < -10) s.x = w + 10;
        if (s.x > w + 10) s.x = -10;
        if (s.y < -10) s.y = h + 10;
        if (s.y > h + 10) s.y = -10;
      }
    };
    raf = requestAnimationFrame(frame);

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      clearInterval(colorTimer);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />;
}
