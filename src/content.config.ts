import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/blog',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    ogImage: z.string().optional(),
  }),
});

const cooking = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/cooking',
  }),
  schema: ({ image }) => {
    const photo = z.object({
      src: image(),
      alt: z.string().trim().min(1),
      caption: z.string().trim().min(1).optional(),
    });

    return z.object({
      title: z.string().trim().min(1),
      description: z.string().trim().min(1),
      date: z.coerce.date(),
      kind: z.enum(['recipe', 'kitchen-note']).default('recipe'),
      isVeg: z.boolean().default(true),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      cover: photo.optional(),
      prepMinutes: z.number().int().nonnegative().optional(),
      cookMinutes: z.number().int().nonnegative().optional(),
      servings: z.string().trim().min(1).optional(),
      stages: z.array(z.object({
        title: z.string().trim().min(1),
        note: z.string().trim().min(1).optional(),
        photos: z.array(photo).min(1),
      })).default([]),
      galleries: z.array(z.object({
        title: z.string().trim().min(1).optional(),
        layout: z.enum(['carousel', 'grid', 'feature-grid', 'square-grid', 'masonry']).default('grid'),
        photos: z.array(photo).min(1),
      })).default([]),
    });
  },
});

export const collections = { blog, cooking };