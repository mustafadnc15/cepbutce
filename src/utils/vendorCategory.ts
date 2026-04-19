// Best-effort vendor→category suggester. Runs on the OCR'd vendor string and
// returns one of the default category ids, or null if nothing matches. Used
// by the results screen to pre-fill the category dropdown — the user can
// always override.

const RULES: Array<{ match: RegExp; categoryId: string }> = [
  // Food & drink
  { match: /\b(migros|bim|a101|[şs]ok|[cç]arsi|carrefour|carrefoursa|file|macro|metro|onur|hakmar|happy center|[ıi]smar|marketyerim)\b/i, categoryId: 'cat_food' },
  { match: /\b(starbucks|kahve|caf[eé]|coffee|bakery|f[ıi]r[ıi]n|sim[ıi]t|pastane|lezzet|mado|burger|pizza|kebap|d[oö]ner|restoran|restaurant|lokanta|domino|komagene|[cç]i[gğ] k[oö]fte)\b/i, categoryId: 'cat_food' },
  // Transport
  { match: /\b(istanbulkart|martı|marti|scooter|taksi|uber|bitaksi|bolt|[oö]deme ist[.]?|metro\s?ist|tramvay|iett|toplu ula[sş]ım|shell|bp|opet|petrol ofisi|total|aygaz|otopark)\b/i, categoryId: 'cat_transport' },
  // Bills / telco / utility
  { match: /\b(turkcell|vodafone|t[uü]rk telekom|ttnet|superonline|turknet|digiturk|tivibu|bedas|bedaş|ayedas|ayedaş|aydem|igdas|igdaş|iski|askİ|netflix|spotify|icloud|disney|apple music|chatgpt|amazon prime|youtube premium)\b/i, categoryId: 'cat_bills' },
  // Health / pharmacy
  { match: /\b(eczane|pharmacy|hastane|hospital|klinik|clinic|di[sş] hekim|laboratuvar)\b/i, categoryId: 'cat_health' },
  // Entertainment
  { match: /\b(cinemax|cinemaximum|sinema|kinema|cineplex|mars|tiyatro|konser|concert|bilet|passolig)\b/i, categoryId: 'cat_entertainment' },
  // Education / books
  { match: /\b(kitap|book|kirtasiye|d&r|kit[tTaasş]|pandora|idefix)\b/i, categoryId: 'cat_education' },
  // Shopping
  { match: /\b(lc waikiki|koton|boyner|defacto|h&m|zara|bershka|pull[ ]?&[ ]?bear|mavi|colins|u\.s\.polo|ipekyol|trendyol|hepsiburada|n11|amazon|gittigidiyor)\b/i, categoryId: 'cat_shopping' },
  // Housing / rent (rare on receipts but still worth catching)
  { match: /\b(kira|rent|aidat|site\syonetim)\b/i, categoryId: 'cat_housing' },
];

export function suggestCategoryFromVendor(vendor: string | null): string | null {
  if (!vendor) return null;
  const v = vendor.toLocaleLowerCase('tr-TR');
  for (const rule of RULES) {
    if (rule.match.test(v)) return rule.categoryId;
  }
  return null;
}
