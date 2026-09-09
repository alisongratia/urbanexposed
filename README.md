# Urban Exposed

A photo archive of abandoned places, built as a static site with [Eleventy](https://www.11ty.dev/).

## Adding a new location

1. Add your photos to `src/img/locations/<your-place-slug>/`.
2. Create a new file `src/locations/<your-place-slug>.md`, copying an
   existing entry as a template:

   ```md
   ---
   layout: location.njk
   title: "Place Name"
   type: "Hospital / Factory / House / etc."
   region: "General area only — no addresses or coordinates"
   dateExplored: 2024-01-01
   coverImage: /img/locations/your-place-slug/01.jpg
   images:
     - /img/locations/your-place-slug/01.jpg
     - /img/locations/your-place-slug/02.jpg
   blurb: |
     <p>Optional writeup — history, condition, how the visit went.</p>
   ---
   ```

3. That's it — the new location shows up on the home page automatically,
   newest first.

The two entries already in `src/locations/` (Hollow Creek Asylum, Bellwether
Steel Mill) are placeholders with generated sample images. Delete or replace
them once you've added your own.

## Local development

```bash
npm install
npm start       # serves the site at http://localhost:8080 with live reload
npm run build   # builds the static site into _site/
```

## Deploying

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`)
that builds the site and deploys it to GitHub Pages on every push to `main`.

To turn it on: in the repo's **Settings → Pages**, set "Source" to
**GitHub Actions**. After that, any push to `main` will publish automatically.

## A note on locations

Exact addresses and coordinates are intentionally left out of this site.
Abandoned places are often unsafe, sometimes trespassing-restricted, and can
be damaged by vandalism or overcrowding once a location becomes well known.
Keep location fields general (city/region/state at most).
