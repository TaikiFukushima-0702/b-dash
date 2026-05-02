/**
 * 書誌情報取得: Google Books API → 国立国会図書館サーチ API
 * ISBN-10/13 どちらでも対応。和書はNDL、洋書はGoogle Booksの方が当たりやすい。
 */

export type LookupResult = {
  isbn: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishedAt?: string;
  coverUrl?: string;
  totalPages?: number;
  source: "google" | "ndl";
};

export async function lookupByIsbn(rawIsbn: string): Promise<LookupResult | null> {
  const isbn = rawIsbn.replace(/[-\s]/g, "");
  if (!/^\d{10}(\d{3})?$/.test(isbn)) return null;

  // 並列取得して、最初に成立した方を採用
  const [google, ndl] = await Promise.allSettled([fetchGoogle(isbn), fetchNdl(isbn)]);

  // 和書は NDL を優先(Google Booksは和書の情報が薄いことがある)
  if (ndl.status === "fulfilled" && ndl.value) return ndl.value;
  if (google.status === "fulfilled" && google.value) return google.value;
  return null;
}

async function fetchGoogle(isbn: string): Promise<LookupResult | null> {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
    { next: { revalidate: 60 * 60 * 24 * 7 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const v = data.items?.[0]?.volumeInfo;
  if (!v) return null;
  return {
    isbn,
    title: v.title ?? "(無題)",
    authors: v.authors ?? [],
    publisher: v.publisher,
    publishedAt: v.publishedDate,
    coverUrl: v.imageLinks?.thumbnail?.replace(/^http:\/\//, "https://"),
    totalPages: v.pageCount,
    source: "google",
  };
}

async function fetchNdl(isbn: string): Promise<LookupResult | null> {
  // NDLサーチ OpenSearch (RSS/XML)
  const res = await fetch(
    `https://ndlsearch.ndl.go.jp/api/opensearch?isbn=${isbn}`,
    { next: { revalidate: 60 * 60 * 24 * 7 } }
  );
  if (!res.ok) return null;
  const xml = await res.text();
  const item = xml.match(/<item>([\s\S]*?)<\/item>/);
  if (!item) return null;
  const block = item[1];
  const get = (tag: string) => {
    const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
    return m ? decodeHtml(m[1].trim()) : undefined;
  };
  const title = get("title");
  if (!title) return null;
  const authors = [...block.matchAll(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/g)].map((m) =>
    decodeHtml(m[1].trim())
  );
  return {
    isbn,
    title,
    authors,
    publisher: get("dc:publisher"),
    publishedAt: get("dc:date") ?? get("dcterms:issued"),
    coverUrl: `https://ndlsearch.ndl.go.jp/thumbnail/${isbn}.jpg`,
    source: "ndl",
  };
}

function decodeHtml(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
