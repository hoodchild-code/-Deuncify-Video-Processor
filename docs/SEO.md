# SEO Setup Guide

## What's Already Done

- **Title & meta tags** – In `client/index.html`
- **Sitemap** – `https://deuncifyer.com/sitemap.xml`
- **robots.txt** – `https://deuncifyer.com/robots.txt`
- **JSON-LD** – WebApplication schema for Google
- **Open Graph & Twitter** – Social sharing tags
- **Semantic headings** – H1/H2 structure on pages
- **Route lazy loading** – Smaller initial bundle
- **Video preload** – `metadata` only for faster load

---

## Google Search Console (Do This Next)

1. **Go to** [search.google.com/search-console](https://search.google.com/search-console)

2. **Add property**
   - Choose "URL prefix"
   - Enter: `https://deuncifyer.com`

3. **Verify ownership** (choose one):
   - **HTML file** – Download the file, put it in `client/public/`, rebuild, deploy
   - **DNS** – Add the TXT record to GoDaddy
   - **HTML tag** – Add the meta tag to `client/index.html` in `<head>`

4. **Submit sitemap**
   - After verification: Sitemaps → Add new sitemap
   - Enter: `sitemap.xml`
   - Click Submit

---

## Bing Webmaster Tools (Optional)

1. Go to [bing.com/webmasters](https://www.bing.com/webmasters)
2. Add site: `https://deuncifyer.com`
3. Verify (similar to Google)
4. Submit sitemap: `https://deuncifyer.com/sitemap.xml`

---

## Monitoring

- **Google Search Console** – Impressions, clicks, indexing issues
- **PageSpeed Insights** – [pagespeed.web.dev](https://pagespeed.web.dev) – Test deuncifyer.com
- **Core Web Vitals** – LCP, FID, CLS (Google Search Console shows these after enough data)
