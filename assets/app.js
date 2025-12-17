const DATA_URL = new URL("../data/news.json", import.meta.url);

function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Mangler element #${id}`);
  return node;
}

function fmtDate(iso) {
  const d = new Date(iso);
  // Norsk format, men uten å låse timezone for hardt:
  return d.toLocaleString("no-NO", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" });
}

function normalize(s) {
  return (s || "").toString().toLowerCase();
}

async function loadData() {
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ved lasting av data`);
  const json = await res.json();
  if (!json?.items || !Array.isArray(json.items)) throw new Error("Ugyldig dataformat: forventer { items: [] }");
  // Nyeste først
  return json.items.slice().sort((a,b) => new Date(b.date) - new Date(a.date));
}

function renderItems(items) {
  const list = el("list");
  list.innerHTML = "";

  if (!items.length) {
    list.innerHTML = `<div class="card"><div class="top">Ingen treff</div><h3>Fant ingen saker</h3></div>`;
    return;
  }

  for (const item of items) {
    const tickers = Array.isArray(item.tickers) ? item.tickers : [];
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="top">
        <span>${fmtDate(item.date)}</span>
        <span>${item.source ?? ""}</span>
      </div>
      <h3><a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.title ?? "Uten tittel"}</a></h3>
      <div class="tags">
        ${tickers.map(t => `<span class="tag">${t}</span>`).join("")}
      </div>
    `;
    list.appendChild(card);
  }
}

export async function renderLatest() {
  const status = el("status");
  try {
    status.textContent = "Laster…";
    const items = await loadData();
    renderItems(items.slice(0, 20));
    status.textContent = "";
  } catch (e) {
    console.error(e);
    status.textContent = "Feil: " + (e?.message ?? e);
  }
}

export async function renderArchive() {
  const status = el("status");
  const q = el("q");
  const days = el("days");

  let all = [];
  const apply = () => {
    const query = normalize(q.value);
    const dayCount = Number(days.value);
    const cutoff = Date.now() - dayCount * 24 * 60 * 60 * 1000;

    const filtered = all.filter(it => {
      const t = normalize(it.title);
      const s = normalize(it.source);
      const tick = (it.tickers || []).map(normalize).join(" ");
      const matches = !query || `${t} ${s} ${tick}`.includes(query);
      const within = dayCount >= 9999 || new Date(it.date).getTime() >= cutoff;
      return matches && within;
    });

    renderItems(filtered);
    status.textContent = filtered.length ? "" : "Ingen treff.";
  };

  try {
    status.textContent = "Laster…";
    all = await loadData();
    status.textContent = "";
    apply();
    q.addEventListener("input", apply);
    days.addEventListener("change", apply);
  } catch (e) {
    console.error(e);
    status.textContent = "Feil: " + (e?.message ?? e);
  }
}
