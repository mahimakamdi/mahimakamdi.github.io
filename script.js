const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, {threshold: 0.08});
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

// Add a subtle reveal to major content blocks.
document.querySelectorAll(".skill-card,.project-card,.project-feature,.timeline-item,.credential-card,.contact-box")
  .forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${Math.min(i * 45, 300)}ms`;
    observer.observe(el);
  });
