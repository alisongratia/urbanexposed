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
     - src: /img/locations/your-place-slug/01.jpg
       caption: "Optional note on this specific photo — what room, what stood out."
     - /img/locations/your-place-slug/02.jpg
   blurb: |
     <p>Optional writeup — history, condition, how the visit went.</p>
   ---
   ```

   Each entry under `images` can be a plain path (no caption) or an object
   with `src` and `caption` — use captions as a running field log per photo
   as you sort through a shoot.

3. That's it — the new location shows up on the home page automatically,
   newest first.

The three entries already in `src/locations/` (Forest Haven, Hollow Creek
Asylum, Bellwether Steel Mill) are starting points. Forest Haven has real
field notes but placeholder images — see below. Hollow Creek and Bellwether
are fully placeholder; delete or replace them once you've added your own.

### Swapping in real photos for Forest Haven

`src/locations/forest-haven.md` is already set up with captions describing
five photos from that visit, pointing at placeholder images
(`src/img/locations/forest-haven/01.svg` … `05.svg`). To finish it:

1. Add the real photos to `src/img/locations/forest-haven/` (any filenames).
2. Update the `coverImage` and each `images[].src` in `forest-haven.md` to
   point at the new filenames, and swap the `.svg` placeholders for the real
   `.jpg`/`.png` files (delete the old placeholders once replaced).
3. Fill in the real `dateExplored` (currently a placeholder) and edit the
   blurb/captions as you like — they're a first draft.

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
