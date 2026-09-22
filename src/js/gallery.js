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
    <div class="lightbox__track"></div>
    <div class="lightbox__nav">
      <button class="lightbox__prev" aria-label="Previous photo">&larr;</button>
      <span class="lightbox__count"></span>
      <button class="lightbox__next" aria-label="Next photo">&rarr;</button>
    </div>
  `;
  document.body.appendChild(lightbox);

  lightbox.querySelector(".lightbox__close").addEventListener("click", closeLightbox);
  lightbox.querySelector(".lightbox__prev").addEventListener("click", () => lightboxStep(-1));
  lightbox.querySelector(".lightbox__next").addEventListener("click", () => lightboxStep(1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") lightboxStep(1);
    if (e.key === "ArrowLeft") lightboxStep(-1);
  });

  const track = lightbox.querySelector(".lightbox__track");
  track.addEventListener("scroll", () => updateLightboxCount(), { passive: true });

  return lightbox;
}

function lightboxStep(delta) {
  const lightbox = document.querySelector(".lightbox");
  const track = lightbox.querySelector(".lightbox__track");
  track.scrollBy({ left: delta * track.clientWidth, behavior: "smooth" });
}

function updateLightboxCount() {
  const lightbox = document.querySelector(".lightbox");
  if (!lightbox) return;
  const track = lightbox.querySelector(".lightbox__track");
  const count = lightbox.querySelector(".lightbox__count");
  const total = track.children.length;
  const index = Math.round(track.scrollLeft / track.clientWidth);
  count.textContent = `${Math.min(index + 1, total)} / ${total}`;
}

function openLightbox(images, startIndex) {
  const lightbox = buildLightbox();
  const track = lightbox.querySelector(".lightbox__track");
  track.innerHTML = images
    .map((img) => `<img src="${img.url}" alt="" loading="lazy" draggable="false">`)
    .join("");

  lightbox.hidden = false;
  document.body.style.overflow = "hidden";

  track.scrollLeft = startIndex * track.clientWidth;
  updateLightboxCount();
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
  maybeShowSubscribePrompt(slug);

  const images = await fetchLocationImages(slug);

  if (images.length === 0) {
    gallery.innerHTML = `<p class="location__empty">No photos yet — drop some into the <code>${slug}</code> folder in the Supabase <code>locations</code> bucket.</p>`;
    return;
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

async function subscribeEmail(email) {
  return window.supabaseClient.from("subscribers").insert({ email });
}

function initSubscribeForm() {
  const form = document.querySelector("[data-subscribe-form]");
  if (!form) return;

  const status = document.querySelector("[data-subscribe-status]");
  const button = form.querySelector("button");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    if (!email) return;

    button.disabled = true;
    status.hidden = true;

    const { error } = await subscribeEmail(email);

    button.disabled = false;
    status.hidden = false;

    if (error) {
      status.textContent =
        error.code === "23505"
          ? "You're already on the list."
          : "Something went wrong — try again.";
    } else {
      status.textContent = "You're in. Thanks for following along.";
      form.reset();
    }
  });
}

// --- Engagement-triggered subscribe prompt (location pages only) ---

function getSeenLocations() {
  try {
    return new Set(JSON.parse(localStorage.getItem("ue_seen_locations") || "[]"));
  } catch {
    return new Set();
  }
}

function markLocationSeen(slug) {
  try {
    const seen = getSeenLocations();
    seen.add(slug);
    localStorage.setItem("ue_seen_locations", JSON.stringify([...seen]));
  } catch {
    // localStorage unavailable (private browsing, etc.) — skip silently
  }
}

function subscribePromptHandled() {
  try {
    return localStorage.getItem("ue_subscribe_prompt_done") === "1";
  } catch {
    return false;
  }
}

function markSubscribePromptHandled() {
  try {
    localStorage.setItem("ue_subscribe_prompt_done", "1");
  } catch {
    // ignore
  }
}

function showSubscribeToast() {
  const toast = document.createElement("div");
  toast.className = "subscribe-toast";
  toast.innerHTML = `
    <button class="subscribe-toast__close" type="button" aria-label="Dismiss">&times;</button>
    <p class="subscribe-toast__text">Enjoying the tour? Get new locations in your inbox.</p>
    <form class="subscribe-toast__form">
      <input type="email" placeholder="you@example.com" required aria-label="Email address">
      <button type="submit">Subscribe</button>
    </form>
    <p class="subscribe-toast__status" hidden></p>
  `;
  document.body.appendChild(toast);

  const dismiss = () => {
    markSubscribePromptHandled();
    toast.classList.remove("subscribe-toast--visible");
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector(".subscribe-toast__close").addEventListener("click", dismiss);

  const form = toast.querySelector(".subscribe-toast__form");
  const status = toast.querySelector(".subscribe-toast__status");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.querySelector("input").value.trim();
    if (!email) return;

    const button = form.querySelector("button");
    button.disabled = true;
    const { error } = await subscribeEmail(email);
    button.disabled = false;
    status.hidden = false;

    if (error) {
      status.textContent =
        error.code === "23505"
          ? "You're already on the list."
          : "Something went wrong — try again.";
    } else {
      status.textContent = "You're in. Thanks for following along.";
      form.hidden = true;
      markSubscribePromptHandled();
      setTimeout(dismiss, 2500);
    }
  });

  requestAnimationFrame(() => toast.classList.add("subscribe-toast--visible"));
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function renderHomeMosaic() {
  const mosaic = document.querySelector("[data-mosaic]");
  if (!mosaic) return;

  const entries = Array.from(mosaic.querySelectorAll("[data-mosaic-slug]"));
  const loading = mosaic.querySelector(".location__loading");

  const perLocation = await Promise.all(
    entries.map(async (entry) => {
      const slug = entry.dataset.mosaicSlug;
      const href = entry.dataset.mosaicHref;
      const images = await fetchLocationImages(slug);

      const featuredNames = (entry.dataset.mosaicFeatured || "")
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);

      const chosen = featuredNames.length
        ? featuredNames
            .map((name) => images.find((img) => img.name === name))
            .filter(Boolean)
        : shuffle(images).slice(0, 3);

      return chosen.map((img) => ({ href, url: img.url }));
    })
  );

  const tiles = shuffle(perLocation.flat());

  if (loading) loading.remove();
  entries.forEach((entry) => entry.remove());

  if (tiles.length === 0) {
    mosaic.innerHTML = `<p class="location__empty">No photos yet.</p>`;
    return;
  }

  mosaic.innerHTML = tiles
    .map(
      (tile) => `
      <a class="mosaic__tile" href="${tile.href}">
        <img src="${tile.url}" alt="" loading="lazy" draggable="false">
      </a>`
    )
    .join("");
}

function maybeShowSubscribePrompt(slug) {
  if (subscribePromptHandled()) return;

  const seenBefore = getSeenLocations();
  markLocationSeen(slug);

  const hasSeenAnotherLocation = [...seenBefore].some((s) => s !== slug);
  if (hasSeenAnotherLocation) {
    setTimeout(showSubscribeToast, 1500);
  }
}

document.addEventListener("contextmenu", (e) => {
  if (e.target.tagName === "IMG") e.preventDefault();
});

document.addEventListener("DOMContentLoaded", () => {
  renderLocationGallery();
  renderCardThumbnails();
  renderHomeMosaic();
  initSubscribeForm();
});
