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
