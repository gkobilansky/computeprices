import path from 'node:path';
import fs from 'node:fs/promises';
import matter from 'gray-matter';
import { cache } from 'react';

const BLOG_DIRECTORY = path.join(process.cwd(), 'blog');
const MARKDOWN_EXTENSION_LIST = ['.md', '.mdx'] as const;
const MARKDOWN_EXTENSIONS = new Set<string>(MARKDOWN_EXTENSION_LIST);
const WORDS_PER_MINUTE = 200;

export interface BlogPostMeta {
  slug: string;
  title: string;
  description?: string;
  excerpt: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  coverImage?: string;
  canonicalUrl?: string;
  draft: boolean;
  readingTimeMinutes: number;
  wordCount: number;
}

export interface BlogPost {
  slug: string;
  content: string;
  meta: BlogPostMeta;
}

async function pathExists(filePath: string) {
  try {
    await fs.stat(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

function toSlug(fileName: string) {
  return path.parse(fileName).name;
}

const computeExcerpt = (content: string, fallback = 160) => {
  const withoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '');
  const plainText = withoutCodeBlocks
    .replace(/\s+/g, ' ')
    .replace(/[\*_`#>\[\]!~]/g, '')
    .trim();

  if (!plainText) {
    return '';
  }

  if (plainText.length <= fallback) {
    return plainText;
  }

  return `${plainText.slice(0, fallback).trim()}…`;
};

const computeReadingStats = (content: string) => {
  const words = content
    .replace(/```[\s\S]*?```/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));

  return { wordCount: words, readingTimeMinutes: minutes };
};

function parseTags(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((tag) => `${tag}`.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function coerceString(value: unknown) {
  return typeof value === 'string' ? value.trim() : undefined;
}

async function resolvePostFile(slug: string) {
  for (const extension of MARKDOWN_EXTENSION_LIST) {
    const candidate = path.join(BLOG_DIRECTORY, `${slug}${extension}`);
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Unable to find markdown file for slug "${slug}" in ${BLOG_DIRECTORY}`);
}

const readDirectory = cache(async () => {
  try {
    const entries = await fs.readdir(BLOG_DIRECTORY, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && MARKDOWN_EXTENSIONS.has(path.extname(entry.name)))
      .map((entry) => toSlug(entry.name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }

    throw error;
  }
});

export const getPostSlugs = cache(async () => {
  const slugs = await readDirectory();
  return slugs.sort();
});

export const getPostBySlug = cache(async (slug: string): Promise<BlogPost> => {
  const filePath = await resolvePostFile(slug);
  const fileContents = await fs.readFile(filePath, 'utf-8');
  const { data, content } = matter(fileContents);

  const title = coerceString(data.title) ?? slug.replace(/-/g, ' ');
  const description = coerceString(data.description);
  const publishedAt = coerceString(data.publishedAt) ?? coerceString(data.date);

  if (!publishedAt) {
    throw new Error(`Blog post "${slug}" is missing a required "publishedAt" field in its frontmatter.`);
  }

  const updatedAt = coerceString(data.updatedAt);
  const coverImage = coerceString(data.coverImage);
  const canonicalUrl = coerceString(data.canonicalUrl);
  const draft = data.draft === true;

  const tags = parseTags(data.tags);
  const excerpt = coerceString(data.excerpt) ?? description ?? computeExcerpt(content);
  const { wordCount, readingTimeMinutes } = computeReadingStats(content);

  const meta: BlogPostMeta = {
    slug,
    title,
    description: description ?? excerpt,
    excerpt,
    publishedAt,
    updatedAt,
    tags,
    coverImage,
    canonicalUrl,
    draft,
    readingTimeMinutes,
    wordCount,
  };

  return {
    slug,
    content,
    meta,
  };
});

export const getAllPosts = cache(async (options: { includeDrafts?: boolean } = {}) => {
  const { includeDrafts = false } = options;
  const slugs = await getPostSlugs();
  const posts = await Promise.all(slugs.map((slug) => getPostBySlug(slug)));

  return posts
    .filter((post) => includeDrafts || !post.meta.draft)
    .sort((a, b) => new Date(b.meta.publishedAt).getTime() - new Date(a.meta.publishedAt).getTime())
    .map((post) => post.meta);
});
