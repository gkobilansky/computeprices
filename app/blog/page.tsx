import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts } from '@/lib/blog';
import { formatDate } from '@/lib/utils';
import { generateMetadata as createSiteMetadata } from '@/app/metadata';

export const metadata = createSiteMetadata({
  title: 'Blog',
  description: 'Insights, best practices, and news from the Compute Prices team.',
  path: '/blog',
});

export const revalidate = 3600;

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  if (posts.length === 0) {
    return (
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
        <p className="text-base-content/70 max-w-2xl">
          Our team is working on the first batch of posts. Check back soon for GPU pricing updates,
          infrastructure best practices, and market analysis.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-12">
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
        <p className="text-base-content/70 max-w-2xl">
          Deep dives on the GPU ecosystem, provider comparisons, and lessons from monitoring compute prices at scale.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="group rounded-2xl border border-base-200 bg-base-100 p-6 shadow-sm transition hover:border-primary/40 hover:shadow-lg"
          >
            <div className="space-y-4">
              {post.coverImage ? (
                <Link href={`/blog/${post.slug}`} className="relative block overflow-hidden rounded-xl border border-base-200">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    width={640}
                    height={360}
                    className="h-48 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    unoptimized={post.coverImage.startsWith('http')}
                  />
                </Link>
              ) : null}

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3 text-sm text-base-content/60">
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                  <span aria-hidden="true">•</span>
                  <span>{post.readingTimeMinutes} min read</span>
                </div>

                <h2 className="text-2xl font-semibold leading-tight">
                  <Link href={`/blog/${post.slug}`} className="transition hover:text-primary">
                    {post.title}
                  </Link>
                </h2>

                <p className="text-base-content/70">{post.excerpt}</p>

                {post.tags.length > 0 ? (
                  <ul className="flex flex-wrap gap-2 pt-2 text-xs font-semibold uppercase tracking-wide text-primary">
                    {post.tags.map((tag) => (
                      <li key={tag} className="rounded-full bg-primary/10 px-3 py-1">
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
