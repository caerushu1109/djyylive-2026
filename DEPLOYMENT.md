# Deployment Guide

## Recommended Stack

- Hosting: Vercel
- DNS: your domain registrar or Cloudflare
- Public root: `/zh/index.html`

This project is currently a static site and is already structured to deploy without a custom backend.

## Current Deployment Assets

- `vercel.json`
- `404.html`
- `robots.txt`
- `sitemap.xml`
- `site.webmanifest`

## Local Preview

```bash
cd /Users/caerushu/Documents/New\ project
python3 -m http.server 8090
```

Then open:

- `http://localhost:8090/zh/index.html`
- `http://localhost:8090/en/index.html`

## Vercel Deployment Steps

1. Import the GitHub repository into Vercel
2. Set the project as a static site
3. Keep the output directory as the repository root
4. Confirm redirects from:
   - `/` -> `/zh/index.html`
   - `/zh` -> `/zh/index.html`
   - `/en` -> `/en/index.html`
5. Verify localized pages load correctly

## Domain Binding

Buy the domain when:

- the homepage visual direction is stable
- the bilingual path structure is stable
- you are ready to keep the project public on a real URL

After purchase:

1. Add the domain in Vercel
2. Update DNS records at the registrar
3. Verify HTTPS
4. Recheck canonical and hreflang tags

## Before Public Launch

- Check mobile layout on homepage, schedule, live, and match pages
- Verify both `/zh` and `/en` paths
- Verify `robots.txt` and `sitemap.xml`
- Confirm launch-critical pages are visually stable
- Confirm API provider selection for live data if tournament launch is near
