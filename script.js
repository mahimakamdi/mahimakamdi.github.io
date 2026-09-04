const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, {threshold: 0.08});
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

// Add a subtle reveal to major content blocks.
document.querySelectorAll(".skill-card,.project-card,.project-feature,.manifest,.timeline-item,.credential-card,.contact-box")
  .forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${Math.min(i * 45, 300)}ms`;
    observer.observe(el);
  });

// ---------------------------------------------------------------------------
// README / PDF viewer modal
// Click any [data-view] button to pop open a repo's README (rendered as
// markdown) or a PDF, without leaving the page. Falls back gracefully to a
// "no README yet, go look at the repo" message if nothing is found.
// ---------------------------------------------------------------------------
(function () {
  const overlay = document.getElementById("viewerOverlay");
  const body = document.getElementById("viewerBody");
  const title = document.getElementById("viewerTitle");
  const ghLink = document.getElementById("viewerGhLink");
  const closeBtn = document.getElementById("viewerClose");
  if (!overlay) return;

  const README_NAMES = ["README.md", "readme.md", "Readme.md", "README.MD"];
  const cache = new Map();

  function openModal() {
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }
  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  function renderMarkdown(md) {
    if (window.marked && window.DOMPurify) {
      const html = window.marked.parse(md, { breaks: true, gfm: true });
      return window.DOMPurify.sanitize(html);
    }
    // Tiny fallback if the CDN scripts didn't load — preformatted text is
    // still readable, just not pretty.
    const esc = md.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    return `<pre>${esc}</pre>`;
  }

  async function fetchReadme(repo, branches) {
    for (const branch of branches) {
      for (const name of README_NAMES) {
        const url = `https://raw.githubusercontent.com/${repo}/${branch}/${name}`;
        try {
          const res = await fetch(url);
          if (res.ok) {
            const text = await res.text();
            if (text.trim()) return text;
          }
        } catch (_) { /* try next combo */ }
      }
    }
    return null;
  }

  async function openViewer({ repo, branch, pdf, viewTitle }) {
    title.textContent = viewTitle || repo;
    ghLink.href = `https://github.com/${repo}`;
    openModal();

    if (pdf) {
      body.innerHTML = `<iframe class="pdf-frame" src="${pdf}" title="${viewTitle} PDF"></iframe>`;
      return;
    }

    const cacheKey = repo;
    if (cache.has(cacheKey)) {
      body.innerHTML = cache.get(cacheKey);
      return;
    }

    body.innerHTML = `<p class="loader">📦 Fetching cargo manifest (README) from GitHub…</p>`;
    const branches = branch ? [branch, "main", "master"] : ["main", "master"];
    const uniqueBranches = [...new Set(branches)];

    const md = await fetchReadme(repo, uniqueBranches);
    let html;
    if (md) {
      html = renderMarkdown(md);
    } else {
      html = `<div class="fallback">No README has been unpacked for this crate yet 📦<br>Pop over to GitHub to see the raw code instead.</div>`;
    }
    cache.set(cacheKey, html);
    body.innerHTML = html;
  }

  document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openViewer({
        repo: btn.dataset.repo,
        branch: btn.dataset.branch,
        pdf: btn.dataset.pdf,
        viewTitle: btn.dataset.title,
      });
    });
  });
})();

// ---------------------------------------------------------------------------
// Modern cosmetic flourishes: mouse-tilt cards, count-up stats, rotating
// headline word. All skipped gracefully on touch devices / reduced motion.
// ---------------------------------------------------------------------------
(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Tilt-on-mousemove for skill cards, project cards and the ID badge.
  if (canHover && !prefersReduced) {
    document.querySelectorAll(".tilt").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(700px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-4px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  // Count-up hero stats (3.4+, 10+, 99%).
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const isFloat = !Number.isInteger(target);
    const duration = 1100;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      el.textContent = (isFloat ? val.toFixed(1) : Math.round(val)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    if (prefersReduced) {
      el.textContent = (isFloat ? target.toFixed(1) : target) + suffix;
    } else {
      requestAnimationFrame(tick);
    }
  }
  document.querySelectorAll("[data-count]").forEach(animateCount);

  // Rotating headline word — a little wink at what the job actually involves.
  const rotateEl = document.getElementById("rotateWord");
  if (rotateEl && !prefersReduced) {
    const words = ["cloud systems.", "K8s clusters.", "CI/CD pipelines.", "AWS bills, tamed.", "production fires."];
    let idx = 0;
    setInterval(() => {
      rotateEl.style.opacity = 0;
      rotateEl.style.transform = "translateY(6px)";
      setTimeout(() => {
        idx = (idx + 1) % words.length;
        rotateEl.textContent = words[idx];
        rotateEl.style.opacity = 1;
        rotateEl.style.transform = "translateY(0)";
      }, 350);
    }, 2600);
  }
})();

// A little something for anyone who opens devtools.
console.log(
  "%c📦 Nice, you found the engine room.",
  "font-family:monospace;font-size:13px;color:#ff9f43;font-weight:bold;"
);
console.log(
  "%cIf you're a recruiter reading source instead of the page — I like you already. mahimakamdi25@gmail.com",
  "font-family:monospace;font-size:11px;color:#9aa0ac;"
);
