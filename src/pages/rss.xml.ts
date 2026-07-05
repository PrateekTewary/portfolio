import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

type BlogPost = CollectionEntry<'blog'>;

export async function GET(context: APIContext) {
  const posts: BlogPost[] = await getCollection('blog');

  const publishedPosts = posts
    .filter((post: BlogPost) => !post.data.draft)
    .sort(
      (a: BlogPost, b: BlogPost) =>
        b.data.date.getTime() - a.data.date.getTime()
    );

  return rss({
    title: "YOUR_NAME's blog",
    description: 'Articles about software engineering, technology, and more.',
    site: context.site!,
    items: publishedPosts.map((post: BlogPost) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.id}`,
    })),
  });
}