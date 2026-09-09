import type { MetadataRoute } from "next";

const SITE = "https://my.neiro-astro.ru";

const staticPages: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] }[] = [
  { path: "",                priority: 1.0, changeFrequency: "daily" },
  { path: "/horoscopes",     priority: 0.9, changeFrequency: "daily" },
  { path: "/divinations",    priority: 0.9, changeFrequency: "weekly" },
  { path: "/crystal-ball",   priority: 0.7, changeFrequency: "weekly" },
  { path: "/blog",           priority: 0.8, changeFrequency: "daily" },
  { path: "/pricing",        priority: 0.7, changeFrequency: "monthly" },
  { path: "/moon",           priority: 0.6, changeFrequency: "daily" },
  { path: "/calendars",      priority: 0.9, changeFrequency: "weekly" },
];

const divinations: { path: string; priority: number }[] = [
  { path: "/divinations/tarot-yes-no",    priority: 0.8 },
  { path: "/divinations/celtic-cross",    priority: 0.8 },
  { path: "/divinations/tarot-love",      priority: 0.8 },
  { path: "/divinations/tarot-future",    priority: 0.8 },
  { path: "/divinations/tarot-birthdate", priority: 0.8 },
  { path: "/divinations/coffee-grounds",  priority: 0.8 },
  { path: "/divinations/runes",           priority: 0.8 },
];

const CAL_SLUGS = ["holidays", "orthodox", "muslim", "lunar", "gardener", "haircut", "names"];

function calendarDatePages(year: number) {
  const out: MetadataRoute.Sitemap = [];
  for (const slug of CAL_SLUGS) {
    const d = new Date(Date.UTC(year, 0, 1));
    while (d.getUTCFullYear() === year) {
      out.push({
        url: `${SITE}/calendars/${slug}/${d.toISOString().slice(0, 10)}`,
        changeFrequency: "yearly" as const,
        priority: 0.5,
      });
      d.setUTCDate(d.getUTCDate() + 1);
    }
  }
  return out;
}

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const nowISO = now.toISOString();
  const year = now.getFullYear();
  return [
    ...staticPages.map((p) => ({
      url: `${SITE}${p.path}`,
      lastModified: nowISO,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),
    ...divinations.map((p) => ({
      url: `${SITE}${p.path}`,
      lastModified: nowISO,
      changeFrequency: "monthly" as const,
      priority: p.priority,
    })),
    ...CAL_SLUGS.map((slug) => ({
      url: `${SITE}/calendars/${slug}`,
      lastModified: nowISO,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...calendarDatePages(year),
  ];
}
