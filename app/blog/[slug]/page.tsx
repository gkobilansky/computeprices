/* eslint-disable @next/next/no-img-element */
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import type { Metadata } from 'next';
import { getPostBySlug, getPostSlugs } from '@/lib/blog';
import { formatDate } from '@/lib/utils';
import { generateMetadata as createSiteMetadata, siteConfig } from '@/app/metadata';

export const revalidate = 3600;

const markdownComponents: Components = {
  h1: ({ children, ...props }) => (
    <h1 className="mt-12 text-4xl font-bold tracking-tight" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mt-12 text-3xl font-semibold" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-8 text-2xl font-semibold" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="mt-6 text-xl font-semibold" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p className="leading-relaxed text-base-content/80" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-base-content" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic text-base-content" {...props}>
      {children}
    </em>
  ),
  ul: ({ children, ...props }) => (
    <ul className="my-6 list-disc space-y-2 pl-6 text-base-content/80" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-6 list-decimal space-y-2 pl-6 text-base-content/80" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote className="my-8 border-l-4 border-primary/40 bg-primary/5 px-6 py-4 italic text-base-content/80" {...props}>
      {children}
    </blockquote>
  ),
  code: ({ inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code className="rounded bg-base-200 px-1 py-0.5 text-sm" {...props}>
          {children}
        </code>
      );
    }

    return (
      <pre className="my-6 overflow-x-auto rounded-lg bg-base-200 p-4 text-sm leading-relaxed" {...props}>
        <code className={className}>{children}</code>
      </pre>
    );
  },
  table: ({ children, ...props }) => (
    <div className="my-6 overflow-x-auto">
      <table className="min-w-full divide-y divide-base-200" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-base-200" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th className="px-4 py-2 text-left text-sm font-semibold uppercase tracking-wide text-base-content/70" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-3 text-sm text-base-content/80" {...props}>
      {children}
    </td>
  ),
  a: ({ children, ...props }) => (
    <a className="font-semibold text-primary underline-offset-4 transition hover:underline" target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),
  img: ({ alt, src, ...props }) =>
    src ? (
      <span className="my-8 flex flex-col items-center">
        <img
          src={src}
          alt={alt ?? ''}
          className="max-h-[480px] w-full rounded-xl object-cover"
          loading="lazy"
          {...props}
        />
        {alt ? <span className="mt-2 text-sm text-base-content/60">{alt}</span> : null}
      </span>
    ) : null,
};

type BlogRouteParams = {
  slug: string;
};

type BlogPostPageParams = {
  params: Promise<BlogRouteParams>;
};

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageParams): Promise<Metadata> {
  try {
    const { slug } = await params;
    const post = await getPostBySlug(slug);
    const base = createSiteMetadata({
      title: `${post.meta.title} | Blog`,
      description: post.meta.description ?? post.meta.excerpt,
      path: `/blog/${post.meta.slug}`,
    });

    const images = post.meta.coverImage
      ? [{ url: post.meta.coverImage, alt: post.meta.title }]
      : base.openGraph?.images;

    return {
      ...base,
      openGraph: {
        ...base.openGraph,
        type: 'article',
        publishedTime: post.meta.publishedAt,
        modifiedTime: post.meta.updatedAt ?? post.meta.publishedAt,
        authors: [siteConfig.creator],
        tags: post.meta.tags,
        images,
      },
      twitter: {
        ...base.twitter,
        images: post.meta.coverImage ? [post.meta.coverImage] : base.twitter?.images,
      },
    };
  } catch (error) {
    return createSiteMetadata({
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
      path: '/blog',
    });
  }
}

export default async function BlogPostPage({ params }: BlogPostPageParams) {
  try {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (post.meta.draft) {
      notFound();
    }

    return (
      <article className="mx-auto flex max-w-3xl flex-col gap-10">
        <div className="space-y-4">
          <Link href="/blog" className="text-sm font-medium text-primary hover:underline">
            ← Back to blog
          </Link>

          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-base-content/60">
              <time dateTime={post.meta.publishedAt}>{formatDate(post.meta.publishedAt)}</time>
              <span aria-hidden="true">•</span>
              <span>{post.meta.readingTimeMinutes} min read</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-base-content">{post.meta.title}</h1>
            {post.meta.excerpt ? (
              <p className="text-lg text-base-content/70">{post.meta.excerpt}</p>
            ) : null}

            {post.meta.tags.length > 0 ? (
              <ul className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                {post.meta.tags.map((tag) => (
                  <li key={tag} className="rounded-full bg-primary/10 px-3 py-1">
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
          </header>
        </div>

        {post.meta.coverImage ? (
          <div className="overflow-hidden rounded-3xl border border-base-200">
            <Image
              src={post.meta.coverImage}
              alt={post.meta.title}
              width={1280}
              height={720}
              priority
              className="h-auto w-full object-cover"
              unoptimized={post.meta.coverImage.startsWith('http')}
            />
          </div>
        ) : null}

        <div className="blog-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[
              rehypeSlug,
              [
                rehypeAutolinkHeadings,
                {
                  behavior: 'wrap',
                  properties: {
                    className: 'anchor-link',
                  },
                },
              ],
            ]}
            components={markdownComponents}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {post.meta.canonicalUrl ? (
          <footer className="rounded-xl border border-base-200 bg-base-100 p-6 text-sm text-base-content/60">
            <p>
              Originally published on{' '}
              <a href={post.meta.canonicalUrl} rel="noopener noreferrer" target="_blank" className="font-medium text-primary underline-offset-4 hover:underline">
                {post.meta.canonicalUrl}
              </a>
              .
            </p>
          </footer>
        ) : null}
      </article>
    );
  } catch (error) {
    notFound();
  }
}
