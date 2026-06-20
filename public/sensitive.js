(() => {
  try {
    if (localStorage.getItem("dash-hide-sensitive") === "true") {
      document.documentElement.setAttribute("data-hide-sensitive", "true");
    }
  } catch {
    // localStorage unavailable; default to visible
  }
})();
