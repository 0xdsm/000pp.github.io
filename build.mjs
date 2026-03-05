/**
 * build.mjs — generates index.html from blog articles.
 *
 * Each article lives at blog/<slug>/index.html and must contain:
 *   <script type="application/json" id="meta">
 *   { "title": "...", "date": "YYYY-MM-DD", "description": "...", "tags": [...] }
 *   </script>
 *
 * Run: node build.mjs
 * No dependencies required.
 */

import { readdir, readFile, writeFile } from 'fs/promises'
import { watch } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const BLOG_DIR = join(ROOT, 'blog')

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00Z')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

async function getArticles() {
  let entries
  try {
    entries = await readdir(BLOG_DIR, { withFileTypes: true })
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.warn('blog/ directory not found — no articles to list.')
      return []
    }
    throw e
  }

  const dirs = entries.filter(e => e.isDirectory())
  const articles = []

  for (const dir of dirs) {
    const indexPath = join(BLOG_DIR, dir.name, 'index.html')
    let html
    try {
      html = await readFile(indexPath, 'utf8')
    } catch (e) {
      if (e.code === 'ENOENT') {
        console.warn(`  skip: blog/${dir.name}/ has no index.html`)
        continue
      }
      throw e
    }

    const match = html.match(/<script[^>]+id="meta"[^>]*>([\s\S]*?)<\/script>/m)
    if (!match) {
      console.warn(`  skip: blog/${dir.name}/index.html has no <script id="meta"> block`)
      continue
    }

    let meta
    try {
      meta = JSON.parse(match[1].trim())
    } catch (e) {
      console.warn(`  skip: blog/${dir.name}/index.html has invalid JSON in meta block`)
      continue
    }

    articles.push({
      title: meta.title ?? dir.name,
      date: meta.date ?? '1970-01-01',
      description: meta.description ?? '',
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      slug: dir.name,
    })
  }

  articles.sort((a, b) => new Date(b.date) - new Date(a.date))
  return articles
}

function renderHead(title, description = '') {
  return `  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${description}">
  <title>${title}</title>
  <link rel="stylesheet" href="/style.css">`
}

function renderArticleItem(article) {
  const tags = article.tags
    .map(t => `<span class="tag">${t}</span>`)
    .join('\n          ')

  return `      <li class="article-item">
        <a href="/blog/${article.slug}/">
          <time datetime="${article.date}">${formatDate(article.date)}</time>
          <h2>${article.title}</h2>
          ${article.description ? `<p>${article.description}</p>` : ''}
          ${tags ? `<div class="tags">\n          ${tags}\n          </div>` : ''}
        </a>
      </li>`
}

function renderIndex(articles) {
  const items = articles.length
    ? articles.map(renderArticleItem).join('\n')
    : '      <li><p style="color:var(--fg-muted);font-style:italic">No articles yet.</p></li>'

  return `<!DOCTYPE html>
<html lang="en">
<head>
${renderHead('hacking4.fun', 'Writing on security and technology.')}
</head>
<body>
  <div class="wrapper">
    <site-header></site-header>

    <img src="/static/banner.jpg" alt="">

    <main>
      <ul class="articles">
${items}
      </ul>
    </main>
    <site-footer></site-footer>
  </div>
  <script src="/components.js"></script>
</body>
</html>
`
}

async function build() {
  console.log('Building...')
  const articles = await getArticles()
  console.log(`  Found ${articles.length} article(s)`)

  const html = renderIndex(articles)
  await writeFile(join(ROOT, 'index.html'), html, 'utf8')
  console.log('  → index.html written')
}

async function main() {
  await build()

  if (!process.argv.includes('--watch')) return

  let debounce = null
  console.log('Watching blog/ for changes...')

  watch(BLOG_DIR, { recursive: true }, (_, filename) => {
    if (!filename?.endsWith('.html')) return
    clearTimeout(debounce)
    debounce = setTimeout(async () => {
      console.log(`  change: ${filename}`)
      await build()
    }, 100)
  })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
