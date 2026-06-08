(() => {
  var stored = localStorage.getItem("dash-theme");
  var dark =
    stored === "dark" ||
    ((stored === "system" || !stored) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  try {
    if (dark) document.documentElement.classList.add("dark");
  } catch {
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
    }
  }
})();
