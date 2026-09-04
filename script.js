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

// A little something for anyone who opens devtools.
console.log(
  "%c📦 Nice, you found the engine room.",
  "font-family:monospace;font-size:13px;color:#ff9f43;font-weight:bold;"
);
console.log(
  "%cIf you're a recruiter reading source instead of the page — I like you already. mahimakamdi25@gmail.com",
  "font-family:monospace;font-size:11px;color:#9aa0ac;"
);
