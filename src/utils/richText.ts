// WorkItem.description is stored as HTML produced by RichTextEditor. Items
// written before the editor existed hold plain text, so anything that
// doesn't look like markup is treated as legacy text and upgraded on read
// (see toEditorHtml) rather than migrated in place.

const HTML_PATTERN = /^\s*<(p|h[1-6]|ul|ol|blockquote|pre|img|hr)[\s>]/i
const URL_PATTERN = /(https?:\/\/[^\s<]+)/g

export function isRichTextHtml(value: string): boolean {
  return HTML_PATTERN.test(value)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function linkify(escaped: string): string {
  return escaped.replace(URL_PATTERN, '<a href="$1">$1</a>')
}

/** Legacy plain text → one paragraph per blank-line-separated block, with
 * single newlines kept as hard breaks and bare URLs turned into links. */
export function plainTextToHtml(text: string): string {
  const blocks = text
    .replace(/\r/g, '')
    .trim()
    .split(/\n{2,}/)
  return blocks
    .filter((block) => block.trim() !== '')
    .map(
      (block) =>
        `<p>${block
          .split('\n')
          .map((line) => linkify(escapeHtml(line)))
          .join('<br>')}</p>`,
    )
    .join('')
}

export function toEditorHtml(description: string): string {
  if (description.trim() === '') return ''
  return isRichTextHtml(description) ? description : plainTextToHtml(description)
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
}

/** Text content of a description, for search/filter matching — so a query
 * like "p" or "img" never matches the markup itself. Regex-based rather than
 * DOMParser because it runs per item on every filter keystroke. */
export function toPlainText(description: string): string {
  if (!isRichTextHtml(description)) return description
  return description
    .replace(/<(br|\/p|\/h[1-6]|\/li|\/blockquote|\/pre)\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .trim()
}

const IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|gif|webp|bmp|avif)([?#].*)?$/i

/** A pasted/typed URL, normalized to a same-origin path when it points back
 * at this app (so copying an attachment link from the address bar stores
 * `/api/attachments/<id>` rather than a localhost:port that may change).
 * Returns null when the text isn't a single http(s) URL or path. */
export function normalizeUrl(text: string): string | null {
  const value = text.trim()
  if (value === '' || /\s/.test(value)) return null
  if (value.startsWith('/')) return value
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.origin === window.location.origin ? url.pathname + url.search + url.hash : url.href
  } catch {
    return null
  }
}

/** Whether a normalized URL should be shown as an image: one of the known
 * image sources (the item's image attachments), or a URL ending in an image
 * file extension. */
export function isImageUrl(url: string, knownImageSources: readonly string[]): boolean {
  return knownImageSources.includes(url) || IMAGE_EXTENSION_PATTERN.test(url)
}
