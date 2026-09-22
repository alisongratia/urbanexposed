# Urban Exposed

A photo archive of abandoned places, built as a static site with [Eleventy](https://www.11ty.dev/). Photos are not stored in this repo — they live in Supabase Storage and are fetched live by the browser, so dropping photos in shows them on the site immediately with no rebuild or redeploy needed.

## Adding photos to an existing location

1. Open the [Supabase dashboard](https://supabase.com/dashboard) for this project → **Storage** → the `locations` bucket.
2. Open (or create) the folder matching that location's slug — the same name as its file in `src/locations/`, e.g. `forest-haven` for `src/locations/forest-haven.md`.
3. Drag your photos in. Any filenames work; they're sorted alphabetically on the page.

That's it — refresh the site and the photos appear. The first photo (alphabetically) becomes that location's cover image on the home page and hero banner.

## Adding a brand-new location

1. In the Supabase `locations` bucket, create a new folder named with your place's slug (lowercase, hyphenated — e.g. `hillcrest-drive-in`) and drop photos into it.
2. Create a new file `src/locations/<your-place-slug>.md` (the filename must match the Supabase folder name), copying an existing entry as a template:

   ```md
   ---
   layout: location.njk
   title: "Place Name"
   type: "Hospital / Factory / House / etc."
   region: "General area only — no addresses or coordinates"
   dateExplored: 2024-01-01
   demolished: false
   coverImage: ""
   blurb: |
     <p>Writeup, from credible sources: when it opened, what it was/did, and
     when and why it closed. See src/locations/forest-haven.md for the
     standard this should follow.</p>
   ---
   ```

3. Push that file to GitHub (on the `locations` folder you already dropped in, no code change needed there). The new location shows up on the home page automatically, newest first.

Set `demolished: true` once a place has actually been torn down — that's the only time exact locations get shared, so this flips a "Demolished" tag on next to the region at the top of that location's page.

By default, the cover photo (used as the hero banner and the home page card thumbnail) is just whichever uploaded file sorts first alphabetically. Set `coverImage` to a specific filename (e.g. `"IMG_5892.jpeg"`, matching a file already uploaded in that location's Supabase folder) to pin a specific photo as the cover instead.

The home page's mixed photo mosaic normally shows 3 random photos per location. A few ways to hand-pick favorites instead, in priority order:

- **Easiest:** in Supabase, create a `favorites` subfolder inside that location's folder (e.g. `forest-haven/favorites/`) and drop copies — or move originals — of your favorite photos into it. They still show up in that location's own gallery like normal, and are also pulled into the home mosaic. No filenames to remember, no code involved.
- **Alternative:** rename any photo (in any location's folder) to include the word "favorite" anywhere in the filename — e.g. `IMG_5892.jpeg` → `favorite-IMG_5892.jpeg`. Only used if that location has no `favorites` subfolder.
- **Alternative:** add a `featuredPhotos` list of filenames to that location's frontmatter (only used if the two options above are empty for that location):

  ```md
  featuredPhotos:
    - "IMG_5892.jpeg"
    - "IMG_5901.jpeg"
  ```

The three entries already in `src/locations/` (Forest Haven, Hollow Creek Asylum, Bellwether Steel Mill) are starting points — Forest Haven has real field notes and is waiting on real photos; Hollow Creek and Bellwether are fully placeholder text. Delete or rewrite them once you've added your own.

## Supabase setup

This site expects:

- A **Storage bucket named `locations`**, set to **Public**.
- One folder per location inside it, matching each location's `src/locations/<slug>.md` filename.
- A read policy on `storage.objects` for the `anon` role so the site can list files (marking a bucket "Public" alone allows fetching a known file URL, but listing a folder's contents needs an explicit policy). In the SQL editor:

  ```sql
  create policy "Public read locations bucket"
  on storage.objects for select
  to anon
  using ( bucket_id = 'locations' );
  ```

The project URL and anon/publishable key are already wired into `src/_data/site.json`. That key is meant to be public (it's the "publishable" key, not `service_role`) — safe to be visible in the site's client-side code.

Email subscribers (home page signup form) are stored in a `subscribers` table (`email`, `created_at`), insert-only for anonymous visitors — there's no read policy, so the list isn't publicly readable, only visible to you via the Supabase dashboard. Export it from there (Table Editor → subscribers → Export) whenever you're ready to actually email people.

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
