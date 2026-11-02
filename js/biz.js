/* Taanış ui 1.4 — search, open-now, forms. Pages work without it. */
(function () {
  var root = (document.querySelector('link[href$="css/biz.css"]') || {}).getAttribute ? document.querySelector('link[href$="css/biz.css"]').getAttribute("href").replace("css/biz.css", "") : "";
  var DK = ["su", "mo", "tu", "we", "th", "fr", "sa"];
  function iradNow() { var d = new Date(Date.now() + 6 * 3600 * 1000); return { day: DK[d.getUTCDay()], min: d.getUTCHours() * 60 + d.getUTCMinutes() }; }
  function toMin(s) { var p = s.split(":"); return +p[0] * 60 + (+p[1] || 0); }

  // open now
  var op = document.querySelector(".open[data-hours]");
  if (op) {
    try {
      var h = JSON.parse(op.getAttribute("data-hours")), n = iradNow(), v = h[n.day] || "closed", open = false;
      if (v === "24h") open = true;
      else if (v !== "closed" && v.indexOf("-") > 0) {
        var a = toMin(v.split("-")[0]), b = toMin(v.split("-")[1]);
        if (b <= a) b += 1440;
        open = (n.min >= a && n.min < b) || (n.min + 1440 >= a && n.min + 1440 < b);
      }
      op.textContent = open ? "Open now" : "Closed now";
      op.className = "open " + (open ? "yes" : "no");
      var tr = document.querySelector('.hours tr[data-d="' + n.day + '"]');
      if (tr) tr.className = "today";
    } catch (e) {}
  }

  // data
  var DATA = null;
  function getData(cb) {
    if (DATA) return cb(DATA);
    fetch(root + "data/places.json").then(function (r) { return r.json(); }).then(function (d) { DATA = d; cb(d); }).catch(function () {});
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function norm(s) { return String(s).toLowerCase().replace(/ı/g, "i").replace(/[öő]/g, "o").replace(/[ü]/g, "u").replace(/ñ/g, "n").replace(/ş/g, "sh").replace(/ç/g, "ch").replace(/ё/g, "е"); }

  // search on home
  var form = document.getElementById("bigsearch");
  if (form) {
    var q = document.getElementById("q"), fc = document.getElementById("fcity"), fg = document.getElementById("fgroup"), fv = document.getElementById("fver");
    var box = document.getElementById("results"), list = document.getElementById("rlist"), more = document.getElementById("rmore"), title = document.getElementById("rtitle");
    function run() {
      var t = norm(q.value.trim()), c = fc.value, g = fg.value, ver = fv.checked;
      if (!t && !c && !g && !ver) { box.hidden = true; return; }
      getData(function (d) {
        var words = t.split(/\s+/).filter(Boolean), out = [];
        for (var i = 0; i < d.length; i++) {
          var r = d[i];
          if (c && r[6] !== c) continue;
          if (g && r[4] !== g) continue;
          if (ver && !r[8]) continue;
          var hay = norm(r[1] + " " + r[2] + " " + r[3] + " " + r[5] + " " + r[7]);
          var ok = true;
          for (var w = 0; w < words.length; w++) if (hay.indexOf(words[w]) < 0) { ok = false; break; }
          if (ok) out.push(r);
        }
        out.sort(function (a, b) { return (b[10] - a[10]) || (b[8] - a[8]) || (b[9] ? 1 : 0) - (a[9] ? 1 : 0); });
        title.textContent = out.length ? out.length.toLocaleString("en") + " found" : "Nothing found";
        list.innerHTML = out.slice(0, 48).map(function (r) {
          var href = r[9] ? root + r[9] : "https://maps.attelkom.net/?p=" + r[0];
          return '<a class="card" href="' + href + '"><span class="av sm" style="background:#9aa79c">' + esc(r[1].charAt(0)) + '</span><span class="ct"><b>' + esc(r[1]) + (r[8] ? ' <span class="tick">✓</span>' : "") + "</b><small>" + esc(r[2] !== r[1] ? r[2] : "") + '</small><span class="meta">' + esc(r[5]) + " · " + esc((r[7] ? r[7] + " · " : "") + r[6]) + "</span>" + (r[10] ? "" : '<span class="unoff">Unofficial page</span>') + "</span></a>";
        }).join("");
        more.textContent = out.length > 48 ? "Showing 48. Add a word or choose a city to narrow the search." : "";
        box.hidden = false;
      });
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); run(); box.scrollIntoView({ behavior: "smooth", block: "start" }); });
    [fc, fg, fv].forEach(function (el) { el.addEventListener("change", run); });
    var tm; q.addEventListener("input", function () { clearTimeout(tm); tm = setTimeout(run, 250); });
    var hq = document.querySelector(".hsearch");
    if (hq) hq.addEventListener("submit", function (e) { e.preventDefault(); q.value = document.getElementById("hq").value; run(); box.scrollIntoView({ block: "start" }); });
    try { var qs = new URLSearchParams(location.search).get("q"); if (qs) { q.value = qs; run(); } } catch (e) {}
  }

  // claim page: name from the hash
  var cf = document.getElementById("claimfor");
  if (cf && location.hash.length > 1) {
    var id = location.hash.slice(1);
    getData(function (d) { for (var i = 0; i < d.length; i++) if (d[i][0] === id) { cf.innerHTML = "You are claiming <b>" + esc(d[i][1]) + "</b>, " + esc(d[i][5]) + ", " + esc(d[i][6]) + "."; break; } });
  }

  // forms send nothing
  ["addform", "claimform"].forEach(function (fid) {
    var f = document.getElementById(fid);
    if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = document.getElementById("formmsg");
      document.getElementById("appno").textContent = "TN-" + (Date.now() % 900000 + 100000);
      msg.hidden = false;
      msg.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
})();
