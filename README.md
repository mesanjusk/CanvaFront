# Canva Clone Skeleton

This repository contains a minimal front‑end project built with React, Vite and fabric.js. It provides a simple canvas editor with a layout inspired by Canva.

## Running locally

```bash
npm install
npm run dev
```

## Features

- Add text, rectangles and circles
- Upload an image to the canvas with a preview crop step
- Change fill colour, stroke colour and stroke width
- Adjust font size of selected text objects
- Move objects to front or back
- Download the canvas as an image
- Alignment tools and image cropping (both on upload and after adding)
- Canvas size can be changed

This code base is meant as a starting point for further development.

## Prototype pages

The project also includes a basic video editor and print layout page that load after login:

- `VideoEditor` allows adding simple text and image overlays over an uploaded video and saving the design to your API endpoint via `VITE_BASE_URL`.
- `PrintLayout` lets you pick from a couple of preset sizes and edit them using the existing `CanvasEditor` component.

These pages are intentionally minimal and meant as examples rather than full Canva replacements.
