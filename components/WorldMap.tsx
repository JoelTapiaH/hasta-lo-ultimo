"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { COUNTRIES } from "@/lib/world";
import { formatDay } from "@/lib/game";

const W = 960;
const H = 500;

type Props = {
  lit: number;
  maxReached: number;
  conqueredOn: string[];
  todayDone: number;
  todayRequired: number;
};

export default function WorldMap({ lit, maxReached, conqueredOn, todayDone, todayRequired }: Props) {
  const [tip, setTip] = useState<{ x: number; y: number; title: string; sub: string } | null>(null);

  const { paths, sphere, graticule } = useMemo(() => {
    const projection = geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], { type: "Sphere" });
    const path = geoPath(projection);
    return {
      paths: COUNTRIES.map((c) => path(c.feature) ?? ""),
      sphere: path({ type: "Sphere" }) ?? "",
      graticule: path(geoGraticule10()) ?? "",
    };
  }, []);

  // Si hoy ya se conquistó, el siguiente país empieza vacío
  const progress = todayDone >= todayRequired ? 0 : todayDone / Math.max(1, todayRequired);

  function status(i: number) {
    if (i < lit) return i === lit - 1 ? "lit newest" : "lit";
    if (i === lit) return "target";
    if (i < maxReached) return "lost";
    return "dark";
  }

  function describe(i: number) {
    if (i < lit) return `Conquistado el ${formatDay(conqueredOn[i])}`;
    if (i === lit) return todayDone >= todayRequired ? "Siguiente conquista (mañana)" : `Conquista de hoy · ${todayDone}/${todayRequired}`;
    if (i < maxReached) return "Se apagó — hay que reconquistarlo";
    return `Por conquistar · #${i + 1}`;
  }

  function onMove(e: MouseEvent<SVGPathElement>, i: number) {
    const box = e.currentTarget.ownerSVGElement!.parentElement!.getBoundingClientRect();
    setTip({ x: e.clientX - box.left, y: e.clientY - box.top, title: COUNTRIES[i].name, sub: describe(i) });
  }

  return (
    <div className="map-wrap" onMouseLeave={() => setTip(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="map" role="img" aria-label={`Mapa: ${lit} de ${COUNTRIES.length} países conquistados`}>
        <defs>
          <radialGradient id="ocean" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#101a3a" />
            <stop offset="100%" stopColor="#060a1c" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d={sphere} fill="url(#ocean)" />
        <path d={graticule} className="graticule" />
        {paths.map((d, i) => {
          const s = status(i);
          if (s.startsWith("lit")) return null;
          return (
            <path
              key={COUNTRIES[i].id}
              d={d}
              className={`country ${s}`}
              style={s === "target" ? { fillOpacity: 0.12 + progress * 0.6 } : undefined}
              onMouseMove={(e) => onMove(e, i)}
            />
          );
        })}
        <g filter="url(#glow)">
          {paths.slice(0, lit).map((d, i) => (
            <path key={COUNTRIES[i].id} d={d} className={`country ${status(i)}`} onMouseMove={(e) => onMove(e, i)} />
          ))}
        </g>
        <path d={sphere} className="sphere-edge" />
      </svg>
      {tip && (
        <div className="tip" style={{ left: tip.x, top: tip.y }}>
          <strong>{tip.title}</strong>
          <span>{tip.sub}</span>
        </div>
      )}
      <div className="legend">
        <span><i className="dot lit" /> Encendido</span>
        <span><i className="dot target" /> Conquista de hoy</span>
        <span><i className="dot lost" /> Apagado</span>
        <span><i className="dot dark" /> Por conquistar</span>
      </div>
    </div>
  );
}
