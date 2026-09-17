import { mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';

// Only public website files belong in the deployment directory.
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of ['styles.css', 'logo.png', 'menu.pdf', '_headers']) {
  await copyFile(file, `dist/${file}`);
}

let html = await readFile('index.html', 'utf8');
const siteURL = process.env.SITE_URL || process.env.CF_PAGES_URL;
if (siteURL) {
  const url = new URL(siteURL);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('SITE_URL must be an HTTP or HTTPS URL');
  const base = `${url.origin}/`;
  const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  html = html.replace('</head>', `  <link rel="canonical" href="${escape(base)}">\n  <meta property="og:url" content="${escape(base)}">\n</head>`);
  html = html.replace('content="logo.png"', `content="${escape(base)}logo.png"`);
  html = html.replace('"image": "logo.png"', `"image": ${JSON.stringify(`${base}logo.png`)}`);
  html = html.replace('"hasMenu": "menu.pdf"', `"hasMenu": ${JSON.stringify(`${base}menu.pdf`)}`);
  await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(base)}</loc></url></urlset>\n`);
  await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${base}sitemap.xml\n`);
} else {
  await writeFile('dist/robots.txt', 'User-agent: *\nAllow: /\n');
}
await writeFile('dist/index.html', html);
console.log('Static website built in dist/');
