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
function nordnetUrl(item){
  // Åpner Nordnet aksjeliste (Oslo) – brukeren kan søke på ticker/ISIN der.
  // (Stabil URL som fungerer uten at vi må kjenne intern instrument-id)
  const q = encodeURIComponent(item.ticker || item.isin || item.company || "");
  return `https://www.nordnet.no/market/stocks?exchangeList=no%3Aose&selectedTab=prices&query=${q}`;
}

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

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
        ${item.url ? `<a class="btn" href="${item.url}" target="_blank" rel="noreferrer">Les mer (Euronext) →</a>` : ""}
        <a class="btn" href="${nordnetUrl(item)}" target="_blank" rel="noreferrer">Kurs & graf (Nordnet) →</a>
      </div>
    </article>
  `;
}

