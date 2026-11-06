// Builds the static site from src/index.html.
//
//   cd tools && npm install && npm run build
//
// For each language (EN, BM, 中文) it runs the page's own script in jsdom, so every
// heading and paragraph is written into the HTML (crawlers and AI tools can read it
// without JavaScript). It writes:
//   /index.html      English   https://beyouclinic.my/
//   /ms/index.html   Malay     https://beyouclinic.my/ms/
//   /zh/index.html   Chinese   https://beyouclinic.my/zh/
//   /img/*           images that used to be embedded as base64
//   /sitemap.xml     all language URLs with hreflang alternates
// Edit text in src/index.html (the T = {...} table), then re-run the build.

import { JSDOM } from "jsdom";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://beyouclinic.my";
const SRC = readFileSync(join(ROOT, "src/index.html"), "utf8");
const TODAY = new Date().toISOString().slice(0, 10);

const LANGS = {
  en: {
    path: "/", tag: "en-MY", hreflang: "en", ogLocale: "en_MY",
    title: "Be You Clinic · Skin | Hair | Body · TTDI, Kuala Lumpur",
    desc: "Be You Clinic in Taman Tun Dr Ismail (TTDI), Kuala Lumpur. Doctor-led skin, hair and body treatments. Book a consultation on WhatsApp.",
    ogTitle: "Be You Clinic · TTDI, Kuala Lumpur",
    ogDesc: "Doctor-led skin, hair and body treatments in TTDI. Book a consultation on WhatsApp.",
  },
  ms: {
    path: "/ms/", tag: "ms-MY", hreflang: "ms", ogLocale: "ms_MY",
    title: "Be You Clinic · Kulit | Rambut | Badan · TTDI, Kuala Lumpur",
    desc: "Be You Clinic di Taman Tun Dr Ismail (TTDI), Kuala Lumpur. Rawatan kulit, rambut dan badan dikendalikan oleh doktor. Tempah konsultasi melalui WhatsApp.",
    ogTitle: "Be You Clinic · TTDI, Kuala Lumpur",
    ogDesc: "Rawatan kulit, rambut dan badan oleh doktor di TTDI. Tempah konsultasi melalui WhatsApp.",
  },
  zh: {
    path: "/zh/", tag: "zh-Hans-MY", hreflang: "zh-Hans", ogLocale: "zh_CN",
    title: "Be You Clinic · 皮肤 | 头发 | 身体 · 吉隆坡 TTDI",
    desc: "Be You Clinic 位于吉隆坡 Taman Tun Dr Ismail（TTDI），提供由医生主导的皮肤、头发与身体疗程。通过 WhatsApp 预约咨询。",
    ogTitle: "Be You Clinic · 吉隆坡 TTDI",
    ogDesc: "TTDI 医生主导的皮肤、头发与身体疗程。通过 WhatsApp 预约咨询。",
  },
};

// ---------- images: pull base64 out into /img files ----------
mkdirSync(join(ROOT, "img"), { recursive: true });
const imgNames = new Map(); // data URI -> /img/name
function nameFor(alt, cls, ext, i) {
  if (/logo|brand/.test(cls) || /Skin \| Hair \| Body/.test(alt)) return `logo.${ext}`;
  if (/arch-photo/.test(cls)) return `clinic-reception.${ext}`;
  if (/Tricia/.test(alt)) return `dr-tricia-yeow.${ext}`;
  if (/Fotona/.test(alt)) return `fotona-treatment-map.${ext}`;
  return `image-${i}.${ext}`;
}
let srcHtml = SRC;
{
  const re = /<img([^>]*?)src="(data:image\/(\w+);base64,([A-Za-z0-9+/=]+))"([^>]*)>/g;
  let i = 0;
  srcHtml = srcHtml.replace(re, (m, pre, uri, type, b64, post) => {
    const attrs = pre + post;
    const alt = (attrs.match(/alt="([^"]*)"/) || [])[1] || "";
    const cls = (attrs.match(/class="([^"]*)"/) || [])[1] || "";
    const ext = type === "jpeg" ? "jpg" : type;
    if (!imgNames.has(uri)) {
      const name = nameFor(alt, cls, ext, ++i);
      writeFileSync(join(ROOT, "img", name), Buffer.from(b64, "base64"));
      imgNames.set(uri, "/img/" + name);
    }
    return `<img${pre}src="${imgNames.get(uri)}"${post}>`;
  });
}

// ---------- structured data (same on every language page) ----------
const CLINIC_ID = `${SITE}/#clinic`;
const DOCTOR_ID = `${SITE}/#dr-tricia-yeow`;
const jsonld = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "MedicalClinic",
      "@id": CLINIC_ID,
      name: "Be You Clinic",
      legalName: "Be You Clinic Sdn Bhd",
      url: `${SITE}/`,
      logo: `${SITE}/img/logo.png`,
      image: [`${SITE}/img/clinic-reception.jpg`],
      description: "Doctor-led aesthetic clinic in Taman Tun Dr Ismail (TTDI), Kuala Lumpur, offering face, body and hair treatments.",
      telephone: "+60168056836",
      address: {
        "@type": "PostalAddress",
        streetAddress: "12-G, Jalan Wan Kadir 4, Taman Tun Dr Ismail",
        addressLocality: "Kuala Lumpur",
        addressRegion: "Wilayah Persekutuan Kuala Lumpur",
        postalCode: "60000",
        addressCountry: "MY",
      },
      geo: { "@type": "GeoCoordinates", latitude: 3.136874, longitude: 101.6303099 },
      hasMap: "https://maps.app.goo.gl/PduwnAqJKnzuP4JU7",
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: "10:00",
          closes: "18:00",
        },
      ],
      knowsLanguage: ["en", "ms", "zh"],
      sameAs: ["https://www.instagram.com/beyouclinicmy/"],
      availableService: [
        { "@type": "MedicalProcedure", name: "Fotona4D laser facial rejuvenation" },
        { "@type": "MedicalProcedure", name: "PicoCare picosecond laser for pigmentation" },
        { "@type": "MedicalProcedure", name: "Ice diode laser hair removal" },
        { "@type": "MedicalProcedure", name: "Porcelain Glow Reset (Fire & Ice facial with PicoCare laser)" },
      ],
      employee: { "@id": DOCTOR_ID },
    },
    {
      "@type": "Person",
      "@id": DOCTOR_ID,
      name: "Dr Tricia Yeow",
      alternateName: "Dr Hui Qian Tricia Yeow",
      honorificPrefix: "Dr",
      jobTitle: "Medical Aesthetic Physician",
      image: `${SITE}/img/dr-tricia-yeow.jpg`,
      worksFor: { "@id": CLINIC_ID },
      knowsAbout: ["Aesthetic medicine", "Injectables", "Dermal fillers", "Energy-based devices", "Laser skin treatment"],
      hasCredential: [
        { "@type": "EducationalOccupationalCredential", credentialCategory: "degree", name: "Doctor of Medicine (MD)" },
        { "@type": "EducationalOccupationalCredential", credentialCategory: "degree", name: "MSc Medical Aesthetics" },
        {
          "@type": "EducationalOccupationalCredential",
          credentialCategory: "license",
          name: "Letter of Credentialing and Privileging (LCP) in Aesthetic Medicine",
          recognizedBy: { "@type": "GovernmentOrganization", name: "Ministry of Health Malaysia" },
        },
      ],
      sameAs: ["https://www.imcas.com/en/profile/dr-hui-qian-tricia-yeow"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: `${SITE}/`,
      name: "Be You Clinic",
      inLanguage: ["en-MY", "ms-MY", "zh-Hans-MY"],
      publisher: { "@id": CLINIC_ID },
    },
  ],
};

// ---------- render each language ----------
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const alternates = Object.values(LANGS)
  .map((L) => `<link rel="alternate" hreflang="${L.hreflang}" href="${SITE}${L.path}">`)
  .concat(`<link rel="alternate" hreflang="x-default" href="${SITE}/">`)
  .join("\n");

for (const [code, L] of Object.entries(LANGS)) {
  let html = srcHtml.replace('<html lang="en">', `<html lang="${L.tag}" data-lang="${code}">`);
  if (!html.includes(`data-lang="${code}"`)) throw new Error("could not set <html lang>");

  const dom = new JSDOM(html, { runScripts: "dangerously", url: SITE + L.path, pretendToBeVisual: true });
  const { document } = dom.window;

  // Fail loudly if anything was left untranslated/empty.
  const empty = [...document.querySelectorAll("[data-i18n],[data-i18n-html]")].filter((e) => !e.textContent.trim());
  if (empty.length) throw new Error(`${code}: ${empty.length} empty text elements, e.g. ${empty[0].outerHTML}`);

  // Head metadata
  const head = document.head;
  head.querySelector("title").textContent = L.title;
  head.querySelector('meta[name="description"]').setAttribute("content", L.desc);
  head.querySelector('link[rel="canonical"]').setAttribute("href", SITE + L.path);
  head.querySelector('meta[property="og:url"]').setAttribute("content", SITE + L.path);
  head.querySelector('meta[property="og:title"]').setAttribute("content", L.ogTitle);
  head.querySelector('meta[property="og:description"]').setAttribute("content", L.ogDesc);
  const extra = `
${alternates}
<meta property="og:locale" content="${L.ogLocale}">
${Object.values(LANGS).filter((o) => o !== L).map((o) => `<meta property="og:locale:alternate" content="${o.ogLocale}">`).join("\n")}
<meta property="og:site_name" content="Be You Clinic">
<meta property="og:image" content="${SITE}/img/clinic-reception.jpg">
<meta property="og:image:alt" content="${esc(code === "zh" ? "Be You Clinic TTDI 接待处" : code === "ms" ? "Kaunter penyambut tetamu Be You Clinic, TTDI" : "Be You Clinic reception, TTDI")}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/img/logo.png" type="image/png">
<link rel="apple-touch-icon" href="/img/logo.png">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
`;
  head.querySelector('link[rel="canonical"]').insertAdjacentHTML("afterend", extra);

  const out = "<!doctype html>\n" + document.documentElement.outerHTML + "\n";
  const file = join(ROOT, L.path, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, out);
  const hash = createHash("sha1").update(out).digest("hex").slice(0, 8);
  console.log(`${code}: ${L.path}index.html  ${(out.length / 1024).toFixed(0)} KB  ${hash}`);
  dom.window.close();
}

// ---------- sitemap ----------
const xhtml = Object.values(LANGS)
  .map((L) => `    <xhtml:link rel="alternate" hreflang="${L.hreflang}" href="${SITE}${L.path}"/>`)
  .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/"/>`)
  .join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${Object.values(LANGS)
  .map((L) => `  <url>\n    <loc>${SITE}${L.path}</loc>\n    <lastmod>${TODAY}</lastmod>\n${xhtml}\n  </url>`)
  .join("\n")}
</urlset>
`;
writeFileSync(join(ROOT, "sitemap.xml"), sitemap);
console.log("sitemap.xml written");
