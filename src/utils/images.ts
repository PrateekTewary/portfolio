import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

const FULL_SIZE_MAX_WIDTH = 2000;

/**
 * URL for the "open full-size photo" links. Points at a generated 2000px WebP rather than the
 * source file, so an oversized original is never copied into the deployed site.
 */
export async function fullSizeUrl(src: ImageMetadata): Promise<string> {
  const image = await getImage({
    src,
    width: Math.min(src.width, FULL_SIZE_MAX_WIDTH),
    format: 'webp',
    quality: 82,
  });
  return image.src;
}

/** 1200x630 JPEG for link previews (WebP is not supported by every social network). */
export async function socialImageUrl(src: ImageMetadata): Promise<string> {
  const image = await getImage({
    src,
    width: 1200,
    height: 630,
    fit: 'cover',
    format: 'jpg',
    quality: 80,
  });
  return image.src;
}
