// Pulls location photos live from Supabase Storage at page-load time.
// Drop photos into the `locations/<slug>/` folder in Supabase and they show
// up here on next page view — no rebuild needed.

async function fetchLocationImages(slug) {
  if (!window.supabaseClient) return [];
  const { bucket } = window.SUPABASE_CONFIG;
  const { data, error } = await window.supabaseClient.storage
    .from(bucket)
    .list(slug, { sortBy: { column: "name", order: "asc" } });

  if (error || !data) return [];

  return data
    .filter((file) => file.name && !file.name.startsWith("."))
    .map((file) => {
      const { data: pub } = window.supabaseClient.storage
        .from(bucket)
        .getPublicUrl(`${slug}/${file.name}`);
      return { name: file.name, url: pub.publicUrl };
    });
}

async function renderLocationGallery() {
  const gallery = document.querySelector("[data-gallery]");
  if (!gallery) return;

  const slug = gallery.dataset.gallery;
  const images = await fetchLocationImages(slug);
  const hero = document.querySelector("[data-hero]");

  if (images.length === 0) {
    gallery.innerHTML = `<p class="location__empty">No photos yet — drop some into the <code>${slug}</code> folder in the Supabase <code>locations</code> bucket.</p>`;
    return;
  }

  if (hero) {
    hero.style.backgroundImage = `url('${images[0].url}')`;
  }

  gallery.innerHTML = images
    .map(
      (img) => `
      <figure class="location__photo">
        <a href="${img.url}" target="_blank" rel="noopener">
          <img src="${img.url}" alt="${slug} photo" loading="lazy">
        </a>
      </figure>`
    )
    .join("");
}

async function renderCardThumbnails() {
  const cards = document.querySelectorAll("[data-card-slug]");
  await Promise.all(
    Array.from(cards).map(async (card) => {
      const slug = card.dataset.cardSlug;
      const images = await fetchLocationImages(slug);
      if (images.length > 0) {
        card.style.backgroundImage = `url('${images[0].url}')`;
      }
    })
  );
}

document.addEventListener("DOMContentLoaded", () => {
  renderLocationGallery();
  renderCardThumbnails();
});
