async function loadData() {
  const res = await fetch("./data/listings.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Fant ikke data/listings.json (har Action kjørt?)");
  return res.json();
}

function el(id){ return document.getElementById(id); }

function cardHTML(item){
  const safe = (x) => (x ?? "").toString();
  return `
    <article class="card">
      <div class="title">
        <h3 class="company">${safe(item.company)}</h3>
        <span class="pill">${safe(item.date)}</span>
      </div>

      <div class="pills">
        <span class="pill">${safe(item.market)}</span>
        <span class="pill">${safe(item.location)}</span>
        <span class="pill">Ticker: ${safe(item.ticker || "-")}</span>
        <span class="pill">ISIN: ${safe(item.isin || "-")}</span>
      </div>

      ${item.url ? `<a class="btn" href="${item.url}" target="_blank" rel="noreferrer">Åpne på Euronext Live →</a>` : ""}
    </article>
  `;
}

function setMeta(data, count){
  el("meta").textContent = `Sist oppdatert: ${data.generated_at} · Treff: ${count}`;
  el("source").innerHTML = `Kilde: <a href="${data.source}" target="_blank" rel="noreferrer">Euronext Live</a>`;
}

async function renderRecent(){
  const data = await loadData();
  setMeta(data, (data.recent || []).length);

  const list = el("list");
  const items = data.recent || [];

  if (!items.length){
    list.innerHTML = `<div class="card"><p class="small">Ingen nye Oslo-noteringer siste 48 timer.</p></div>`;
    return;
  }
  list.innerHTML = items.map(cardHTML).join("");
}

async function renderOlder(){
  const data = await loadData();
  const allOlder = data.older || [];
  let shown = allOlder.slice();

  setMeta(data, shown.length);

  const input = el("q");
  const list = el("list");

  function apply(){
    const q = (input.value || "").trim().toLowerCase();
    shown = !q ? allOlder : allOlder.filter(it => {
      const hay = `${it.company} ${it.ticker} ${it.isin} ${it.market} ${it.location}`.toLowerCase();
      return hay.includes(q);
    });

    setMeta(data, shown.length);

    list.innerHTML = shown.length
      ? shown.map(cardHTML).join("")
      : `<div class="card"><p class="small">Ingen treff.</p></div>`;
  }

  input.addEventListener("input", apply);
  apply();
}

window.App = { renderRecent, renderOlder };
