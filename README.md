# SK Design Studio

A clean-room Canva-inspired visual editor for printing, invitations and social graphics. This replaces the old CanvaFront Vite prototype with Next.js App Router and Fabric.js 5.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. No credentials or database required.

## Working features

- Beautiful responsive template and projects dashboard
- Editable canvas: text, shapes, images, freehand drawing, layers, opacity, fonts, colors, alignments and keyboard shortcuts
- Multiple pages, duplicate/delete/reorder, custom page sizes and paper presets
- Local-first IndexedDB autosave, manual named revisions, undo/redo, project rename/duplicate/delete
- Template starters and CSV bulk-personalization using {{field}} placeholders
- PNG/JPEG raster, SVG vector and PDF print exports with DPI options
- Margin and bleed guides, transparent-background support, size-aware print controls
- JSON design backup/import for portability

## Data model

A design has id, title, preset, dimensions, pages containing Fabric-compatible scene JSON, timestamps and a list of saved revisions. The editor operates in 72 logical units per inch so a 5.5 x 8.5 inch page is 396 x 612 logical units. DPI is applied at export time.

## Storage and security

This edition is intentionally **local-first**. Designs and images are stored in the browser's IndexedDB. There is no public unauthenticated cloud API. Clearing browser site data removes locally stored work, so use the Download Project backup action regularly. Data will not sync between browsers/devices until an authenticated cloud backend is connected.

This release does **not** yet include MongoDB/cloud account sync, live multi-user collaboration, CMYK color-managed PDF, server-side render workers, AI generation, or video timelines. Those require backend services, security controls and print QA. The PDF exporter rasterizes the page at the selected effective DPI; the SVG exporter preserves vector shapes/text when possible. Always inspect final prints in a professional PDF/preflight tool.

## Testing

```bash
npm test
npm run build
```

## Deployment

Connect this GitHub repo to a Vercel project with framework **Next.js**. No environment variables required. Production builds use the default `next build`.


## Bulk template manager

Open **/admin/templates** on the deployed site. This is an on-device template library, not a remotely authenticated admin service. Imported layouts and their published/draft status are saved to IndexedDB in the current browser only. Do not mistake "Publish" for publishing to other devices. For cross-device sharing, export an editable ZIP from one browser and import it on the other. Site-wide publishing requires shared storage and authenticated admin access.

### Upload 1–500 editable templates at once

1. In Template Manager, choose **Sample ZIP** to see the expected format.
2. Prepare one JSON file per editable layout: either an SK Design Studio project backup (with a pages array) or template JSON with editable Fabric objects.
3. Put the JSON files in a ZIP, plus optional PNG/JPG/WebP previews and manifest.csv:

~~~text
template-pack.zip
|-- manifest.csv
|-- templates/
|   |-- royal-wedding.json
|   +-- social-sale.json
+-- previews/
    |-- royal-wedding.png
    +-- social-sale.jpg
~~~

Example manifest.csv:

~~~csv
file,name,category,description,keywords,preview
templates/royal-wedding.json,Royal Wedding,Wedding,Traditional invitation,marriage;traditional,previews/royal-wedding.png
templates/social-sale.json,Seasonal Sale,Social,Editable promo,offer;discount,previews/social-sale.jpg
~~~

If no manifest exists, every JSON file except manifest.json in the ZIP is treated as a template. Imported items start as drafts, and duplicate layouts are skipped using normalized canvas fingerprints. Previews are generated when none are supplied. Use filters, categories, bulk publish/unpublish, metadata editing, selection, ZIP export and Edit design in the manager. For changes to a design, use Save template in the editor; a design opened from a custom template will update that local template.

Limits: maximum 500 layouts per ZIP, 75 MB compressed ZIP, 180 MB expanded size, 22 MB per archive entry, 18 MB per JSON. Unsupported external image URLs in editable scenes are blocked; embedded PNG/JPEG/WebP data is supported. Flat PNG/JPG files cannot become fully editable templates automatically. SVG/PDF/PSD/AI/CDR imports require conversion.

### Sharing publicly across devices

The original 8 bundled template starters remain available to every visitor. Custom templates added in the manager are local to the importing browser, including their Published status. This is intentional until a secured backend is configured. We must not expose an unauthenticated public upload/publish API or pretend a browser-only admin screen restricts remote users.
