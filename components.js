function getMeta() {
  const el = document.getElementById('meta')
  if (!el) return {}
  try { return JSON.parse(el.textContent) } catch { return {} }
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00Z')
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  })
}

// ─── <site-header> ────────────────────────────────────────

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const path = window.location.pathname

    const navLinks = [
      { href: '/about', label: 'about' },
    ]

    const nav = navLinks.map(({ href, label }) => {
      const active = path === href || path.startsWith(href + '/')
      return `<a href="${href}"${active ? ' class="active"' : ''}>${label}</a>`
    }).join('\n        ')

    this.innerHTML = `
      <header class="site-header">
        <a href="/" class="site-title">larper.me</a>
        <nav>
          ${nav}
        </nav>
      </header>
    `
  }
}

// ─── <site-article-header> ────────────────────────────────

class SiteArticleHeader extends HTMLElement {
  connectedCallback() {
    const meta = getMeta()

    if (meta.title) {
      document.title = meta.title + ' — larper.me'
    }

    const tags = (meta.tags ?? [])
      .map(t => `<span class="tag">${t}</span>`)
      .join('\n          ')

    this.innerHTML = `
      <header class="article-header">
        ${meta.date ? `<time datetime="${meta.date}">${formatDate(meta.date)}</time>` : ''}
        ${meta.title ? `<h1>${meta.title}</h1>` : ''}
        ${tags ? `<div class="tags">\n          ${tags}\n        </div>` : ''}
      </header>
    `
  }
}

// ─── <site-footer> ────────────────────────────────────────

class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="site-footer">
        <p>— <a href="https://github.com/0xdsm">0xdsm</a></p>
      </footer>
    `
  }
}

customElements.define('site-header', SiteHeader)
customElements.define('site-article-header', SiteArticleHeader)
customElements.define('site-footer', SiteFooter)

// ─── Image zoom ───────────────────────────────────────────

function initImageZoom() {
  const content = document.querySelector('.article-content')
  if (!content) return

  const overlay = document.createElement('div')
  overlay.className = 'zoom-overlay'
  overlay.innerHTML = '<img class="zoom-img" alt="">'
  document.body.appendChild(overlay)

  const zoomed = overlay.querySelector('.zoom-img')

  function open(img) {
    zoomed.src = img.src
    zoomed.alt = img.alt
    overlay.classList.add('active')
    document.body.style.overflow = 'hidden'
  }

  function close() {
    overlay.classList.remove('active')
    document.body.style.overflow = ''
  }

  content.addEventListener('click', e => {
    if (e.target.tagName === 'IMG') open(e.target)
  })

  overlay.addEventListener('click', close)

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close()
  })
}

document.addEventListener('DOMContentLoaded', initImageZoom)
