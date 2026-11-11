# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/` (checks image sizes first) |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run images:optimize` | Shrink, rename and tidy new images (see [Images](#images)) |
| `npm run images:check`    | Fail if any image is too large or too wide       |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Images

Photos straight from a phone are 3000px+ and several MB. Astro serves resized WebP copies on the
pages, but the source files still live in git, so keep them small:

1. Drop new photos into the relevant `images/` folder, e.g. `src/content/cooking/images/my-dish/`.
2. Run `npm run images:optimize`. It resizes to 2000px on the long edge, recompresses, strips
   metadata, converts PNGs to WebP, replaces spaces and parentheses in file names with hyphens, and
   updates the references in your `.md`/`.mdx` files. Running it again changes nothing.
3. `npm run build` runs `images:check` first and stops if an image is over 1 MB or 2400px wide.

Keep your untouched originals outside the repository. Prefer committing images only after step 2, so
git history never stores the large versions. Animated GIFs are left alone (limit 3 MB); a short
looping MP4/WebM is usually much smaller. The "open full-size photo" links and the social-sharing
image use generated copies (2000px WebP and 1200x630 JPEG), never the source file.

## Typography and layout

- **Fonts** are declared in `astro.config.mjs` (`fonts`): Inter for text and card titles, Fraunces for page
  headings. They are downloaded at build time and served from the site itself (about 88 KB, no third-party
  requests). To change one, edit its entry there and the matching name in `src/styles/global.css`.
- **Sizes**: body text is 15px (`body` in `global.css`), small text 13px, nothing under 12px. Card titles use
  Tailwind's `font-sans`, which is what makes them different from the serif page headings.
- **Width**: pages use `max-w-7xl` with 16px/24px side padding (`BaseLayout`, `Header`, `Footer`); articles
  (`/cooking/<dish>`, blog posts) use `max-w-6xl`. Paragraph width is capped at `52rem` in `global.css` so long
  text stays readable while photos use the full width.
- **Cards** (`CookingCard`, `BlogCard`): horizontal rows on phones, then 2, 3, 4 and 5 columns as the screen
  grows (see the `grid` classes in `src/pages/cooking/index.astro`).

## Cooking and recipes

The `/cooking` page has two sections: recipes and kitchen notes (cooking projects,
photos, and experiments). Add entries as Markdown or MDX files in
`src/content/cooking/`; no page code changes are needed.

### Publish a recipe

1. Copy `src/content/cooking/first-recipe.md` to a new file, such as
   `src/content/cooking/lemon-potatoes.md`.
2. Replace the title, description, date, tags, ingredients, method, and notes with
   your own content.
3. Set `draft: false`, then build and deploy the site as usual.

The filename becomes the URL: `lemon-potatoes.md` is available at
`/cooking/lemon-potatoes`. Subfolders are supported, too. Published entries appear
newest first within their section. Drafts are excluded from both the listing and
detail routes, including in the dev server; temporarily set `draft: false` locally
to preview one, and restore it before deploying if it is not ready.

```yaml
---
title: "Your recipe title"
description: "A short description of the dish."
date: 2026-10-28
kind: recipe
tags: ["Vegetarian", "Weeknight"]
draft: false
prepMinutes: 10
cookMinutes: 30
servings: "2-4"
---
```

Only `title`, `description`, and `date` are required. `kind` defaults to `recipe`,
`tags` to an empty list, and `draft` to `false`. Prep and cook times are optional
whole numbers of minutes (zero is allowed); servings is an optional quoted
string. Write ingredients, steps, and any extra sections in the Markdown body.

### Share cooking work

Copy `src/content/cooking/first-kitchen-note.md` and use `kind: kitchen-note`.
Write about a dish, a cooking experiment, or a meal, with as many photos as you
like. Recipe timing and serving details are not displayed for kitchen notes.

### Add photos

Store your own images in `src/content/cooking/images/` and run `npm run images:optimize` (see
[Images](#images)). To display an image on
the card and at the top of its page, add a `cover` to the frontmatter:

```yaml
cover:
  src: "./images/lemon-potatoes.jpg"
  alt: "Golden roasted potatoes with lemon wedges on a white plate"
```

The path is relative to the Markdown file. Cover images are optional, but when
provided they must exist and have meaningful alt text. Astro optimizes local
images. Add more photos anywhere in the Markdown body:

```markdown
![Potatoes spread out on a baking tray before roasting](./images/potatoes-prep.jpg)
```

### Photo-first cooking diaries

The published `src/content/cooking/dahi-vada.md` entry shows how to share a dish
before writing its full recipe. Its 14 photos are grouped into five stages,
matching the numbered source folders. The local WebP copies are resized to
1600 pixels and have embedded metadata removed; the original photos are unchanged.

Add an optional `stages` list to any cooking entry's frontmatter:

```yaml
stages:
  - title: "The batter"
    photos:
      - src: "./images/dahi-vada/1/batter.webp"
        alt: "Mixing the vada batter by hand in a steel bowl"
  - title: "Shape"
    note: "Optional short notes about this stage."
    photos:
      - src: "./images/dahi-vada/2/shaped-vada.webp"
        alt: "A shaped vada with a hole in the center"
```

Stages and their photos display in the order written, with automatic stage
numbers. Each stage needs a title and at least one photo with alt text.
Photos open at full size in a new tab. To add writing later, add a stage's
optional `note`, or write ingredients, instructions, and other Markdown below
the frontmatter; that content appears after the photo diary.

The starter entries `first-recipe.md` and `first-kitchen-note.md` remain drafts.
Entries without stages keep the standard recipe or kitchen-note layout.

### Photo galleries (carousel and grid layouts)

For kitchen notes (or any entry) with a batch of photos that don't need the
step-by-step `stages` structure, add a `galleries` list to the frontmatter.
Each gallery picks one `layout` and lists its `photos`, each with an optional
`caption` shown alongside the photo:

```yaml
galleries:
  - title: "From the kitchen counter"
    layout: carousel
    photos:
      - src: "./images/paratha-and-rotis/dough.jpg"
        alt: "Dough resting in a steel bowl"
        caption: "Letting the dough rest for 20 minutes before rolling."
      - src: "./images/paratha-and-rotis/rolling.jpg"
        alt: "Rolling a paratha into a circle"
        caption: "A loose grip and a rotating motion keep the circle even."
```

`layout` picks how the photos are arranged:

| Layout         | Description                                                             |
| -------------- | ------------------------------------------------------------------------ |
| `carousel`     | One photo at a time with arrows, dots, swipe (touch screens) and its caption shown below it. |
| `grid`         | Even tiles, side by side (the default). Each tile is at most 26rem wide, so one or two photos never fill the screen. |
| `feature-grid` | One big photo with smaller ones beside it. It fits exactly with 3 or 5+ photos; with 1, 2 or 4 photos it automatically uses `grid` so there are no gaps. |
| `square-grid`  | Small, uniform square thumbnails, Instagram-style, for many photos.       |
| `masonry`      | Variable-height columns that keep each photo's own aspect ratio — good for a mix of portrait and landscape photos. |

`title` is optional. Captions are optional per photo; grids show a caption
under each photo, and the carousel shows the current photo's caption below it.
Galleries render after the written content, in the order listed. Add as many
galleries as you like, mixing layouts across an entry.

To place a gallery in the middle of your writing instead of after it, use an
`.mdx` file and import the component directly:

```mdx
---
title: "Paratha and Roti"
kind: kitchen-note
---

import ImageGallery from '../../components/ImageGallery.astro';
import doughImage from './images/paratha-and-rotis/dough.jpg';

Some text about the dough...

<ImageGallery
  layout="masonry"
  photos={[
    { src: doughImage, alt: "Dough resting in a steel bowl", caption: "Resting for 20 minutes." },
  ]}
/>

More text after the gallery...
```

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
