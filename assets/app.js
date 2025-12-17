async function loadData() {
  const res = await fetch("./data/listings.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Fant ikke data/listings.json (har Action kjørt?)");
  return res.json();
}

function el(id){ return document.getElementById(id); }

function buildNordnetUrl(item) {
  const ticker = (item.ticker || "").trim();
  if (!ticker) return null;

  // Prøv å hente exchange fra Euronext-lenken (typisk ...-XOSL)
  let mic = "xosl";
  if (item.url) {
    const m = item.url.match(/-([A-Z0-9]{4})$/);
    if (m) mic = m[1].toLowerCase();
  }

  // Mange Oslo-aksjer fungerer med format: /aksjer/kurser/{ticker}-{mic}
  return `https://www.nordnet.no/aksjer/kurser/${encodeURIComponent(ticker.toLowerCase())}-${encodeURIComponent(mic)}`;
}

function cardHTML(item){
  const safe = (x) => (x ?? "").toString();
  const nordnetUrl = buildNordnetUrl(item);

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

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
        ${item.url ? `<a class="btn" href="${item.url}" target="_blank" rel="noreferrer">Les om selskapet →</a>` : ""}
        ${nordnetUrl ? `<a class="btn secondary" href="${nordnetUrl}" target="_blank" rel="noreferrer">Kurs & graf (Nordnet) →</a>` : ""}
      </div>
    </article>
  `;
}
