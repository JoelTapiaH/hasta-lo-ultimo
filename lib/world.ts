import { geoCentroid, geoDistance } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import world from "world-atlas/countries-110m.json";
import countries from "i18n-iso-countries";
import es from "i18n-iso-countries/langs/es.json";

countries.registerLocale(es);

const START_ID = "376"; // Israel — "en Jerusalén, en toda Judea, en Samaria, y hasta lo último de la tierra"

export type Country = { id: string; name: string; feature: Feature<Geometry> };

const topo = world as unknown as Parameters<typeof feature>[0] & { objects: { countries: never } };
const all = (feature(topo, topo.objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>).features
  .filter((f) => f.id !== "010"); // sin Antártida

const origin = geoCentroid(all.find((f) => f.id === START_ID)!);

// Orden de conquista: del más cercano a Jerusalén al más lejano
export const COUNTRIES: Country[] = all
  .map((f) => ({ f, dist: geoDistance(geoCentroid(f), origin) }))
  .sort((a, b) => a.dist - b.dist)
  .map(({ f }) => ({
    id: String(f.id ?? f.properties.name),
    name: (f.id && countries.getName(String(f.id), "es")) || f.properties.name,
    feature: f,
  }));
