# SEO Setup Guide

## What's Already Done

- **Meta description** – 150–160 chars, keyword-optimized
- **Title & meta tags** – In `client/index.html`
- **og:image & twitter:image** – Social share image (1200×630)
- **Sitemap** – `https://deuncifyer.com/sitemap.xml`
- **robots.txt** – `https://deuncifyer.com/robots.txt`
- **JSON-LD** – SoftwareApplication schema for Google
- **Open Graph & Twitter** – Social sharing tags with image alt
- **Semantic headings** – H1/H2/H3 for keyword targeting
- **Internal linking** – /how-it-works, /pricing, /examples, Terms, Privacy
- **CTAs with UTM params** – Ready for analytics when you add GA4
- **Trust badge** – “Secure video uploads”
- **Testimonial** – Social proof on homepage
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
