import fs from 'node:fs/promises';
import path from 'node:path';
import { BlogClient } from 'seobot';

const BLOG_DIRECTORY = path.join(process.cwd(), 'blog');
const BLOG_ASSETS_DIRECTORY = path.join(process.cwd(), 'public', 'blog');
const DEFAULT_LIMIT = 10;

function parseArgs(argv) {
  const options = {
    page: 0,
    limit: DEFAULT_LIMIT,
    maxPages: 1,
    dryRun: false,
    force: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case '--page': {
        const value = Number.parseInt(argv[index + 1] ?? '', 10);
        if (!Number.isNaN(value)) {
          options.page = Math.max(0, value);
        }
        index += 1;
        break;
      }

      case '--limit': {
        const value = Number.parseInt(argv[index + 1] ?? '', 10);
        if (!Number.isNaN(value)) {
          options.limit = Math.max(1, value);
        }
        index += 1;
        break;
      }

      case '--max-pages': {
        const value = Number.parseInt(argv[index + 1] ?? '', 10);
        if (!Number.isNaN(value)) {
          options.maxPages = Math.max(1, value);
        }
        index += 1;
        break;
      }

      case '--all': {
        options.maxPages = Number.POSITIVE_INFINITY;
        break;
      }

      case '--dry-run': {
        options.dryRun = true;
        break;
      }

      case '--force': {
        options.force = true;
        break;
      }

      default:
        break;
    }
  }

  return options;
}

async function ensureDirectories() {
  await fs.mkdir(BLOG_DIRECTORY, { recursive: true });
  await fs.mkdir(BLOG_ASSETS_DIRECTORY, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if ((error?.code ?? '') === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

async function resolvePostPath(slug) {
  const extensions = ['.md', '.mdx'];

  for (const extension of extensions) {
    const candidate = path.join(BLOG_DIRECTORY, `${slug}${extension}`);
    if (await fileExists(candidate)) {
      return { filePath: candidate, existed: true };
    }
  }

  return {
    filePath: path.join(BLOG_DIRECTORY, `${slug}.md`),
    existed: false,
  };
}

function escapeYamlString(value) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
}

function buildFrontMatter(data) {
  const entries = Object.entries(data).filter(([, value]) => value !== undefined && value !== null && value !== '');
  const lines = ['---'];

  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        continue;
      }

      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${escapeYamlString(`${item}`)}`);
      }
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: ${escapeYamlString(`${value}`)}`);
    }
  }

  lines.push('---');
  return lines.join('\n');
}

function normaliseExtension(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext && ext.length <= 5) {
    return ext;
  }

  return '.jpg';
}

function buildImagePath(slug, imageUrl) {
  try {
    const url = new URL(imageUrl);
    const cleanPath = url.pathname.split('/').filter(Boolean).pop() ?? '';
    const extension = normaliseExtension(cleanPath);
    const fileName = `${slug}${extension}`;
    return {
      fileName,
      absolute: path.join(BLOG_ASSETS_DIRECTORY, fileName),
      relative: `/blog/${fileName}`,
    };
  } catch (error) {
    console.warn(`⚠️  Skipping invalid image URL for ${slug}: ${imageUrl}`);
    return undefined;
  }
}

async function downloadImage(imageUrl, destinationPath, dryRun) {
  if (dryRun) {
    return;
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image (${response.status} ${response.statusText})`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destinationPath, buffer);
}

async function writePostFile(filePath, frontMatter, markdownContent, dryRun) {
  const content = `${frontMatter}\n\n${markdownContent.trim()}\n`;
  if (dryRun) {
    return;
  }

  await fs.writeFile(filePath, content, 'utf-8');
}

async function processArticle(articleSummary, options, client) {
  const reports = { created: false, updated: false, skipped: false, imageDownloaded: false };

  const slug = articleSummary.slug;

  if (!slug) {
    reports.skipped = true;
    console.warn('⚠️  Encountered article without a slug. Skipping.');
    return reports;
  }

  let article = articleSummary;
  const shouldLoadDetails = options.force || !article.markdown || article.published === undefined;

  if (shouldLoadDetails) {
    try {
      const detailedArticle = await client.getArticle(slug);
      if (detailedArticle) {
        article = { ...article, ...detailedArticle };
      }
    } catch (error) {
      reports.skipped = true;
      console.warn(`⚠️  Failed to fetch full article for ${slug}: ${error.message}`);
      return reports;
    }
  }

  if (article.deleted || article.published === false) {
    reports.skipped = true;
    return reports;
  }

  const publishedAt = article.publishedAt ?? article.createdAt ?? new Date().toISOString();
  const frontMatterData = {
    title: article.headline ?? slug.replace(/-/g, ' '),
    publishedAt,
    updatedAt: article.updatedAt ?? publishedAt,
    description: article.metaDescription ?? undefined,
    excerpt: article.metaDescription ?? undefined,
    tags: Array.isArray(article.tags) ? article.tags.map((tag) => tag.title ?? tag.slug).filter(Boolean) : undefined,
    coverImage: undefined,
    draft: false,
  };

  if (article.image) {
    const imagePaths = buildImagePath(slug, article.image);
    if (imagePaths) {
      const alreadyExists = await fileExists(imagePaths.absolute);
      if (!alreadyExists || options.force) {
        try {
          await downloadImage(article.image, imagePaths.absolute, options.dryRun);
          reports.imageDownloaded = true;
          console.log(`🖼️  Saved image for ${slug} → ${imagePaths.relative}`);
        } catch (error) {
          console.warn(`⚠️  Failed to download image for ${slug}: ${error.message}`);
        }
      }

      frontMatterData.coverImage = imagePaths.relative;
    }
  }

  const frontMatter = buildFrontMatter(frontMatterData);
  const markdown = (article.markdown ?? '').trim();
  if (!markdown) {
    console.warn(`⚠️  Article ${slug} does not include markdown content. Skipping.`);
    reports.skipped = true;
    return reports;
  }

  const { filePath, existed } = await resolvePostPath(slug);

  await writePostFile(filePath, frontMatter, markdown, options.dryRun);

  reports.created = !existed;
  reports.updated = existed;
  console.log(`✅  ${options.dryRun ? 'Would write' : existed ? 'Updated' : 'Created'} blog post: ${slug}`);

  return reports;
}

async function fetchArticles(client, page, limit) {
  try {
    const response = await client.getArticles(page, limit);
    console.log({ response });

    // Handle structure: { articles: [...], total: number }
    const articles = response?.articles;

    if (!Array.isArray(articles)) {
      console.warn(`⚠️  Unexpected response for page ${page}. Expected articles array.`);
      return [];
    }

    return articles;
  } catch (error) {
    console.error(`❌  Failed to fetch articles on page ${page}: ${error.message}`);
    return [];
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const apiKey = process.env.SEOBOT_API_KEY;
  if (!apiKey) {
    console.error('❌  SEOBOT_API_KEY is not set. Add it to your environment or .env.local file.');
    process.exit(1);
  }

  await ensureDirectories();

  const client = new BlogClient(apiKey);

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let imageCount = 0;

  let currentPage = options.page;
  let processedPages = 0;

  while (processedPages < options.maxPages) {
    const articles = await fetchArticles(client, currentPage, options.limit);

    if (articles.length === 0) {
      if (processedPages === 0) {
        console.log('ℹ️  No articles returned from SEOBot.');
      }
      break;
    }

    for (const article of articles) {
      const report = await processArticle(article, options, client);
      createdCount += report.created ? 1 : 0;
      skippedCount += report.skipped ? 1 : 0;
      imageCount += report.imageDownloaded ? 1 : 0;
      updatedCount += report.updated ? 1 : 0;
    }

    processedPages += 1;
    currentPage += 1;

    if (articles.length < options.limit) {
      break;
    }
  }

  console.log('\nDone.');
  console.log(`   Posts created: ${createdCount}`);
  console.log(`   Posts updated: ${updatedCount}`);
  console.log(`   Posts skipped: ${skippedCount}`);
  console.log(`   Images downloaded: ${imageCount}`);
  console.log(`   Dry run: ${options.dryRun ? 'Yes' : 'No'}`);
}

main().catch((error) => {
  console.error(`❌  Unexpected error: ${error.message}`);
  process.exit(1);
});
