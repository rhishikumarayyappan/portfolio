(() => {
  document.documentElement.classList.remove("no-js");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.getElementById("year").textContent = new Date().getFullYear();

  // Nav border on scroll
  const nav = document.querySelector(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Reveal on scroll + metric count-up
  const countUp = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    if (reduceMotion || target === 0) return;
    const start = performance.now();
    const dur = 1400;
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
          el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 4) * 80}ms`;
          el.classList.add("in");
          const num = el.querySelector("[data-count]");
          if (num) countUp(num);
          io.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  // Trust-gate console
  const THRESHOLD = 0.85;
  const fill = document.getElementById("gaugeFill");
  const tick = document.getElementById("gaugeThreshold");
  const value = document.getElementById("gaugeValue");
  const log = document.getElementById("log");
  const statEval = document.getElementById("statEval");
  const statHitl = document.getElementById("statHitl");
  if (!fill || !log) return;

  const arcLen = fill.getTotalLength();
  fill.style.strokeDasharray = arcLen;
  fill.style.strokeDashoffset = arcLen;

  // Threshold marker on the arc (centre 60,62 · radius 50)
  const angle = Math.PI * (1 - THRESHOLD);
  const cx = 60, cy = 62, r1 = 42, r2 = 58;
  tick.setAttribute("x1", cx + r1 * Math.cos(angle));
  tick.setAttribute("y1", cy - r1 * Math.sin(angle));
  tick.setAttribute("x2", cx + r2 * Math.cos(angle));
  tick.setAttribute("y2", cy - r2 * Math.sin(angle));

  const queries = [
    "Summarise clause 4.2 of the vendor contract",
    "¿Cuál es la política de reembolso?",
    "Is this transaction pattern anomalous?",
    "Draft a reply citing the data-retention policy",
    "Quelle est la date limite de conformité ?",
    "Which supplier failed the last audit?",
    "Explain the model's credit decision",
    "Extract obligations from the DPA annex",
    "Was ist die Kündigungsfrist?",
    "Flag PII in this customer ticket",
  ];
  // Mostly-confident scores with occasional low-confidence cases
  const scores = [0.93, 0.88, 0.71, 0.96, 0.9, 0.79, 0.94, 0.87, 0.82, 0.97];

  let i = 0, evaluated = 0, routed = 0;
  const MAX_ROWS = 5;

  const step = () => {
    const q = queries[i % queries.length];
    const s = scores[i % scores.length];
    i++;
    evaluated++;
    const pass = s >= THRESHOLD;
    if (!pass) routed++;

    fill.style.strokeDashoffset = arcLen * (1 - s);
    fill.classList.toggle("warn", !pass);
    value.textContent = s.toFixed(2);
    value.style.color = pass ? "" : "var(--amber)";
    statEval.textContent = evaluated;
    statHitl.textContent = routed;

    const li = document.createElement("li");
    li.className = pass ? "pass" : "hitl";
    li.innerHTML = `<span class="q"></span><span class="verdict">${pass ? "PASS " + s.toFixed(2) : "ABSTAIN → HUMAN"}</span><span class="bar"><i style="width:${s * 100}%"></i></span>`;
    li.querySelector(".q").textContent = q;
    log.prepend(li);

    const rows = log.querySelectorAll("li:not(.out)");
    if (rows.length > MAX_ROWS) {
      const last = rows[rows.length - 1];
      last.classList.add("out");
      setTimeout(() => last.remove(), 400);
    }
  };

  // Seed a few rows so the panel isn't empty on load
  for (let k = 0; k < 3; k++) step();
  if (!reduceMotion) {
    let timer = setInterval(step, 2400);
    document.addEventListener("visibilitychange", () => {
      clearInterval(timer);
      if (!document.hidden) timer = setInterval(step, 2400);
    });
  }
})();
