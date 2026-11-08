// Show one banner line per visit, picked at random from the lines in overrides/main.html.
//
// The script never changes the banner HTML. Material's dismiss button remembers a closed
// banner by a hash of that HTML, so a change would bring a dismissed banner back. Instead,
// the script adds a <style> rule that shows the chosen line and hides the others.
// The choice is kept in sessionStorage, so the line stays the same for the whole visit.
(function () {
  var KEY = "banner-quip";

  function pick(count) {
    var n = NaN;
    try {
      n = parseInt(sessionStorage.getItem(KEY), 10);
    } catch (e) {
      // storage blocked: pick a new line, without remembering it
    }
    if (!(n >= 1 && n <= count)) {
      n = 1 + Math.floor(Math.random() * count);
      try {
        sessionStorage.setItem(KEY, String(n));
      } catch (e) {
        // storage blocked: the line can change on the next page
      }
    }
    return n;
  }

  function show() {
    var lines = document.querySelectorAll(".banner-quips > span");
    if (!lines.length) {
      return;
    }
    var n = pick(lines.length);
    var style = document.getElementById("banner-quip-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "banner-quip-style";
      document.head.appendChild(style);
    }
    style.textContent =
      ".banner-quips > span { display: none !important; }\n" +
      ".banner-quips > span:nth-child(" + n + ") { display: inline !important; }";
  }

  // Material's instant navigation swaps pages without a reload: run again on each page.
  if (typeof document$ !== "undefined") {
    document$.subscribe(show);
  } else {
    document.addEventListener("DOMContentLoaded", show);
  }
})();
