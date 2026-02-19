"use strict";

const slides = [
  { src: "https://picsum.photos/id/1015/1200/700", alt: "Mountain lake" },
  { src: "https://picsum.photos/id/1016/1200/700", alt: "Forest road" },
  { src: "https://picsum.photos/id/1025/1200/700", alt: "Dog portrait" },
  { src: "https://picsum.photos/id/1039/1200/700", alt: "Coastline" },
  { src: "https://picsum.photos/id/1043/1200/700", alt: "River valley" },
];

const els = {
  img: document.getElementById("slideImg"),
  prev: document.getElementById("prevBtn"),
  next: document.getElementById("nextBtn"),
  dots: document.getElementById("dots"),
  count: document.getElementById("countText"),
  autoplay: document.getElementById("autoplayToggle"),
  carousel: document.querySelector(".carousel"),
};

let index = 0;
let timer = null;

initDots();
render();

els.prev.addEventListener("click", () => goTo(index - 1));
els.next.addEventListener("click", () => goTo(index + 1));

document.addEventListener("keydown", (e) => {
  // Don’t hijack typing in inputs (good habit)
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea") return;

  if (e.key === "ArrowLeft") goTo(index - 1);
  if (e.key === "ArrowRight") goTo(index + 1);
});

els.autoplay.addEventListener("change", () => {
  if (els.autoplay.checked) startAutoplay();
  else stopAutoplay();
});

// Pause autoplay when hovering the carousel (nice UX)
els.carousel.addEventListener("mouseenter", () => stopAutoplay());
els.carousel.addEventListener("mouseleave", () => {
  if (els.autoplay.checked) startAutoplay();
});

function initDots() {
  els.dots.innerHTML = "";
  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "dot";
    b.setAttribute("aria-label", `Go to slide ${i + 1}`);
    b.addEventListener("click", () => goTo(i));
    els.dots.appendChild(b);
  });
}

function goTo(nextIndex) {
  // wrap-around
  index = (nextIndex + slides.length) % slides.length;
  render();
}

function render() {
  const s = slides[index];
  els.img.src = s.src;
  els.img.alt = s.alt;

  els.count.textContent = `${index + 1} / ${slides.length}`;

  const dotButtons = Array.from(els.dots.children);
  dotButtons.forEach((btn, i) => {
    btn.classList.toggle("active", i === index);
  });
}

function startAutoplay() {
  stopAutoplay();
  timer = setInterval(() => goTo(index + 1), 4000);
}

function stopAutoplay() {
  if (timer) clearInterval(timer);
  timer = null;
}
