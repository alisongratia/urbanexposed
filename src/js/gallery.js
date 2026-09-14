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

function pickCover(images, coverFilename) {
  if (coverFilename) {
    const match = images.find((img) => img.name === coverFilename);
    if (match) return match;
  }
  return images[0];
}

function buildLightbox() {
  let lightbox = document.querySelector(".lightbox");
  if (lightbox) return lightbox;

  lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.hidden = true;
  lightbox.innerHTML = `
    <button class="lightbox__close" aria-label="Close">&times;</button>
    <div class="lightbox__scroll"></div>
  `;
  document.body.appendChild(lightbox);

  lightbox.querySelector(".lightbox__close").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  return lightbox;
}

function openLightbox(images, startIndex) {
  const lightbox = buildLightbox();
  const scrollEl = lightbox.querySelector(".lightbox__scroll");
  scrollEl.innerHTML = images
    .map((img, i) => `<img src="${img.url}" alt="" loading="lazy" draggable="false" data-lightbox-index="${i}">`)
    .join("");

  lightbox.hidden = false;
  document.body.style.overflow = "hidden";

  const target = scrollEl.querySelector(`[data-lightbox-index="${startIndex}"]`);
  if (target) target.scrollIntoView({ block: "start" });
}

function closeLightbox() {
  const lightbox = document.querySelector(".lightbox");
  if (!lightbox) return;
  lightbox.hidden = true;
  document.body.style.overflow = "";
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
    const cover = pickCover(images, hero.dataset.cover);
    hero.style.backgroundImage = `url('${cover.url}')`;
  }

  gallery.innerHTML = images
    .map(
      (img, i) => `
      <figure class="location__photo">
        <button class="location__photo-btn" type="button" data-index="${i}" aria-label="View photo larger">
          <img src="${img.url}" alt="${slug} photo" loading="lazy" draggable="false">
        </button>
      </figure>`
    )
    .join("");

  gallery.querySelectorAll(".location__photo-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openLightbox(images, Number(btn.dataset.index));
    });
  });
}

async function renderCardThumbnails() {
  const cards = document.querySelectorAll("[data-card-slug]");
  await Promise.all(
    Array.from(cards).map(async (card) => {
      const slug = card.dataset.cardSlug;
      const images = await fetchLocationImages(slug);
      if (images.length > 0) {
        const cover = pickCover(images, card.dataset.cover);
        card.style.backgroundImage = `url('${cover.url}')`;
      }
    })
  );
}

document.addEventListener("contextmenu", (e) => {
  if (e.target.tagName === "IMG") e.preventDefault();
});

document.addEventListener("DOMContentLoaded", () => {
  renderLocationGallery();
  renderCardThumbnails();
});
