function applySingleSlideMode() {
  const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  const slides = Array.from(document.querySelectorAll(".slide"));
  const singleSlide = /^slide-\d+$/.test(hash);
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);

  document.body.classList.toggle("single-slide", singleSlide);
  document.documentElement.style.setProperty("--single-scale", String(scale));

  for (const slide of slides) {
    slide.classList.toggle("active", singleSlide && slide.id === hash);
  }
}

window.addEventListener("hashchange", applySingleSlideMode);
window.addEventListener("DOMContentLoaded", applySingleSlideMode);
window.addEventListener("resize", applySingleSlideMode);
