// Hand-kept list of public pages. /resources stays out on purpose.
const pages = [
  '/',
  '/research/',
  '/people/',
  '/publications/',
  '/teaching/',
  '/grants/',
  '/news/',
  '/contact/',
  '/industry/',
];

export function GET({ site }) {
  const urls = pages
    .map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`)
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
