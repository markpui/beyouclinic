# Be You Clinic website

Static site for https://beyouclinic.my, hosted on Vercel. Bookings open WhatsApp to +60 16-805 6836.

## Pages

| URL | File | Notes |
| --- | --- | --- |
| `/` | `index.html` | English (generated) |
| `/ms/` | `ms/index.html` | Bahasa Melayu (generated) |
| `/zh/` | `zh/index.html` | 中文 (generated) |
| `/doctors/dr-tricia-yeow/` | `doctors/dr-tricia-yeow/index.html` | **Draft**, `noindex`, hand-written. Not in the sitemap yet. |

## Editing the main page

Do **not** edit `index.html`, `ms/index.html` or `zh/index.html` by hand: they are generated.

1. Edit `src/index.html`. Text for all three languages lives in the `T = { en:{…}, zh:{…}, ms:{…} }` table near the bottom.
2. Rebuild:

   ```sh
   cd tools
   npm install   # first time only
   npm run build
   ```

3. Commit the regenerated files.

The build runs the page's own script for each language and writes the finished text into the HTML. Crawlers and AI tools can then read every heading and paragraph without running JavaScript. It also:

- writes per-language `<title>`, description, canonical, `og:*` tags and hreflang links
- adds JSON-LD structured data: `MedicalClinic` (address, geo, hours, phone) and `Person` (Dr Tricia)
- moves embedded images out to `/img/`
- regenerates `sitemap.xml` with hreflang alternates

Page titles, descriptions and opening hours for structured data are set in `tools/build.mjs`.

`src/`, `tools/` and this README are excluded from the deployment by `.vercelignore`.

## Publishing Dr Tricia's page

Once she approves the text:

1. Remove the `<meta name="robots" content="noindex,nofollow">` line and the yellow draft banner.
2. Add the URL to `sitemap.xml`. To keep it there across rebuilds, add it to the sitemap section in `tools/build.mjs`.
3. Link to it from the "Meet your doctor" section of `src/index.html`, then rebuild.
