const navbar = document.getElementById("navbar");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const progressBar = document.getElementById("progressBar");
const toTop = document.getElementById("toTop");

/* ---------- Scroll effects ---------- */
function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  navbar.classList.toggle("scrolled", y > 20);
  toTop.classList.toggle("show", y > 500);
  progressBar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ---------- Mobile menu ---------- */
menuToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});
navLinks.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  })
);

/* ---------- Reveal on scroll ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* ---------- Active nav link ---------- */
const links = navLinks.querySelectorAll("a");
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id === "seasons" ? "meetings" : entry.target.id;
        links.forEach((a) => {
          const href = a.getAttribute("href");
          a.classList.toggle("active", href === "#" + id);
        });
      }
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
document.querySelectorAll("header[id], section[id]").forEach((s) => sectionObserver.observe(s));

/* ---------- Stars in the hero sky ---------- */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const starsBox = document.getElementById("stars");
if (starsBox) {
  const count = window.innerWidth < 600 ? 40 : 80;
  for (let i = 0; i < count; i++) {
    const s = document.createElement("span");
    const size = 1 + Math.random() * 2.5;
    s.className = "star";
    s.style.width = size + "px";
    s.style.height = size + "px";
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    if (!reduceMotion) {
      s.style.animationDuration = 2 + Math.random() * 4 + "s";
      s.style.animationDelay = -Math.random() * 5 + "s";
    }
    starsBox.appendChild(s);
  }
}

/* ---------- Season switch (winter / summer) ---------- */
const seasonButtons = document.querySelectorAll(".season-btn");
const tiles = document.querySelectorAll(".tile[data-winter]");
const seasonNote = document.getElementById("seasonNote");

const SEASON_LABEL = {
  winter: "❄️ شتاءً",
  summer: "☀️ صيفًا",
};

function applySeason(season, animate) {
  document.body.dataset.season = season;
  const other = season === "winter" ? "summer" : "winter";

  seasonButtons.forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.season === season));
  });

  tiles.forEach((tile) => {
    const main = tile.querySelector(".t-main");
    const alt = tile.querySelector(".tile-alt");
    main.textContent = tile.dataset[season];
    alt.textContent = SEASON_LABEL[other] + " " + tile.dataset[other] + " مساءً";
    if (animate) {
      main.classList.remove("swap");
      void main.offsetWidth;
      main.classList.add("swap");
    }
  });

  seasonNote.textContent =
    season === "winter"
      ? "التوقيت الشتوي: تبدأ الاجتماعات في السادسة مساءً"
      : "التوقيت الصيفي: تبدأ الاجتماعات في السابعة مساءً";

  updateNextMeeting();
}

seasonButtons.forEach((btn) =>
  btn.addEventListener("click", () => applySeason(btn.dataset.season, true))
);

/* ---------- Next meeting ---------- */
const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

// hours are 24h; evening meetings depend on the season
const MEETINGS = [
  { day: 0, name: "اجتماع العبادة والكلمة", hour: { winter: 18, summer: 19 } },
  { day: 4, name: "اجتماع الصلاة", hour: { winter: 18, summer: 19 } },
  { day: 6, name: "درس الكتاب المقدس", hour: { winter: 18, summer: 19 } },
  { day: 5, name: "اجتماع الشبيبة", hour: { winter: 13, summer: 13 } },
  { day: 5, name: "اجتماع مدارس الأحد والناشئة", hour: { winter: 16, summer: 16 } },
];

function formatTime(hour24) {
  const h = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const period = hour24 >= 12 && hour24 < 17 ? (hour24 < 16 ? "ظهرًا" : "عصرًا") : hour24 >= 17 ? "مساءً" : "صباحًا";
  return h + ":00 " + period;
}

function updateNextMeeting() {
  const target = document.getElementById("nextText");
  if (!target) return;

  const season = document.body.dataset.season;
  const now = new Date();
  let best = null;

  MEETINGS.forEach((m) => {
    const hour = m.hour[season];
    for (let add = 0; add < 8; add++) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + add, hour, 0, 0);
      if (start.getDay() !== m.day) continue;
      const endsAt = start.getTime() + 2 * 60 * 60 * 1000;
      if (endsAt < now.getTime()) continue;
      if (!best || start < best.start) best = { start, hour, name: m.name, add };
      break;
    }
  });

  if (!best) return;

  const diffMs = best.start.getTime() - now.getTime();
  let when;
  if (diffMs <= 0) {
    when = "يُعقد الآن";
  } else if (best.add === 0) {
    const mins = Math.round(diffMs / 60000);
    when = mins < 60 ? "بعد " + mins + " دقيقة" : "اليوم الساعة " + formatTime(best.hour);
  } else if (best.add === 1) {
    when = "غدًا الساعة " + formatTime(best.hour);
  } else {
    when = "يوم " + DAY_NAMES[best.start.getDay()] + " الساعة " + formatTime(best.hour);
  }

  target.textContent = best.name + " — " + when;
}

/* ---------- Highlight today's meetings ---------- */
const today = new Date().getDay();
document.querySelectorAll("[data-day]").forEach((el) => {
  if (Number(el.dataset.day) === today) el.classList.add("is-today");
});

/* ---------- Init: summer from April to October, winter otherwise ---------- */
const month = new Date().getMonth(); // 0 = January
applySeason(month >= 3 && month <= 9 ? "summer" : "winter", false);
setInterval(updateNextMeeting, 60000);
