// marp.config.js — auto-loaded by marp-cli from the working directory.
//
// Why this exists:
//   marp-cli does NOT understand ```mermaid code fences out of the box. The
//   workshop decks (01-introduction.md, …) describe their architecture with
//   diagrams, and we want those authored as portable Mermaid (which also
//   renders natively on GitHub) instead of hand-drawn ASCII art.
//
// What it does:
//   1. Registers a tiny markdown-it plugin that rewrites every ```mermaid
//      fence into a <div class="mermaid">…</div> that the Mermaid runtime
//      can find.
//   2. Injects the Mermaid runtime (once per deck) so those divs render in
//      the browser — both in live preview (`marp -s .`, see watch.sh) and in
//      the exported HTML.
//
// `html: true` is required so the injected <script> survives Marp's renderer.
//
// Mermaid is pinned and loaded from a CDN (mirrors the repo's "npx with a
// pinned version" style). If you present offline, vendor mermaid locally and
// point MERMAID_SRC at the local file instead.

const MERMAID_SRC =
  'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'

/** markdown-it plugin: ```mermaid fences -> <div class="mermaid"> + runtime. */
function mermaidPlugin(md) {
  const defaultFence = md.renderer.rules.fence.bind(md.renderer.rules)

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    if (token.info.trim().toLowerCase() === 'mermaid') {
      // Escape so the browser hands Mermaid the *source* via textContent
      // (entities are decoded back to '-->', '<br/>', … at read time).
      const source = md.utils.escapeHtml(token.content)

      // Inject the runtime exactly once per rendered deck.
      let runtime = ''
      if (!env.__mermaidInjected) {
        env.__mermaidInjected = true
        runtime =
          '<script type="module">' +
          `import mermaid from '${MERMAID_SRC}';` +
          'mermaid.initialize({ startOnLoad: true, theme: \'neutral\',' +
          // Reserve space for subgraph titles so they never overlap the child
          // nodes (the gaia theme's larger font otherwise pushes nodes up into
          // the title — see "MCP Architecture" / "We Build Servers" slides).
          ' flowchart: { subGraphTitleMargin: { top: 8, bottom: 16 } } });' +
          '</script>' +
          // Center every diagram and cap its height so a tall/wide chart
          // scales down to fit the slide instead of overflowing the bottom
          // edge (e.g. the GuardLayer flowchart). Marp sections are a fixed
          // pixel size that is transform-scaled, so px caps scale with them.
          '<style>' +
          '.mermaid { display: flex; justify-content: center; }' +
          '.mermaid svg { max-width: 100%; max-height: 340px; height: auto; }' +
          '</style>'
      }

      return `${runtime}<div class="mermaid">\n${source}</div>\n`
    }
    return defaultFence(tokens, idx, options, env, self)
  }
}

/**
 * markdown-it plugin: shrink the deck-wide base font a notch.
 *
 * gaia sets `section { font-size: 35px }` and scales everything else (headings,
 * body, code, lists) in em, so lowering the section font-size shrinks the whole
 * slide proportionally and gives dense slides more room before they clip at the
 * bottom. Mermaid diagrams are capped in px, so they keep their size.
 * Injected once at the top of the deck as a global <style> (html: true lets it
 * through, same as the Mermaid runtime above).
 */
function baseFontPlugin(md) {
  const SIZE = '28px'    // gaia default is 35px; ~20% smaller
  const TOP_PAD = '35px' // gaia default section padding is 70px; halve the top gap
  // gaia scopes its own `section` rule with a high-specificity selector
  // (div#…>svg>foreignObject>section), so a plain `section{}` is overridden.
  // !important wins the cascade; em/rem children scale off this used value.
  const CSS =
    `<style>section { font-size: ${SIZE} !important; --marpit-root-font-size: ${SIZE} !important; padding-top: ${TOP_PAD} !important; }</style>`
  md.core.ruler.push('inject_base_font', (state) => {
    if (state.inlineMode) return
    const token = new state.Token('html_block', '', 0)
    token.content = CSS + '\n'
    state.tokens.unshift(token)
  })
}

module.exports = {
  // Allow the injected <script>/<style> through Marp's HTML sanitizer.
  html: true,
  // Add the Mermaid converter + base-font tweak, keep everything else.
  engine: ({ marp }) => marp.use(mermaidPlugin).use(baseFontPlugin),
}
