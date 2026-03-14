(function () {
  const SITE = 'https://www.aitool.icu';
  const CONTACT_EMAIL = '3211075869@qq.com';

  const CATEGORY_MAP = {
    'ai-chat': { name: 'AI Chat', color: 'brand' },
    'ai-search': { name: 'AI Search', color: 'brand' },
    'ai-writing': { name: 'AI Writing', color: 'brand' },
    'ai-image': { name: 'AI Image', color: 'brand' },
    'ai-video': { name: 'AI Video', color: 'brand' },
    'ai-audio': { name: 'AI Audio', color: 'brand' },
    'ai-coding': { name: 'AI Coding', color: 'brand' },
    'ai-productivity': { name: 'AI Productivity', color: 'brand' },
    'ai-design': { name: 'AI Design', color: 'brand' },
    'ai-marketing': { name: 'AI Marketing', color: 'brand' }
  };

  const rawTools = Array.isArray(window.AI_TOOLS) ? window.AI_TOOLS : [];
  const tools = rawTools.map((t) => ({
    ...t,
    categoryName: CATEGORY_MAP[t.category]?.name || t.category || 'Other'
  }));

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage save failed:', key, e);
    }
  }

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function slugLink(slug) {
    return `/tools/${slug}.html`;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function textOrFallback(value, fallback = '—') {
    if (value === null || value === undefined || value === '') return fallback;
    return value;
  }

  function listOrFallback(value, fallback = '—') {
    if (!Array.isArray(value) || value.length === 0) return fallback;
    return value.join(', ');
  }

  function formatPricing(tool) {
    const extras = [];
    if (tool.freePlan) extras.push('Free plan');
    if (tool.freeTrial) extras.push('Trial');
    return `${tool.pricing || 'Unknown'}${extras.length ? ' · ' + extras.join(' · ') : ''}`;
  }

  function card(tool) {
    const favoriteIds = load('favorites', []);
    const compareIds = load('compare', []);
    const stackIds = load('stack-default', []);

    const useCases = Array.isArray(tool.useCases) ? tool.useCases.slice(0, 3) : [];
    const logo = escapeHtml((tool.logoLetter || tool.name?.[0] || '?').slice(0, 1));

    return `
      <article class="tool-card">
        <div class="tool-top">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div class="logo">${logo}</div>
            <div>
              <h3><a href="${slugLink(tool.slug)}">${escapeHtml(tool.name)}</a></h3>
              <div class="badges">
                <span class="badge brand">${escapeHtml(tool.categoryName)}</span>
                ${tool.featured ? '<span class="badge ok">Featured</span>' : ''}
                ${tool.deals ? '<span class="badge warn">Deal</span>' : ''}
                ${tool.trending ? '<span class="badge ok">Trending</span>' : ''}
              </div>
            </div>
          </div>
          <div class="small muted">#${escapeHtml(tool.rank ?? '—')}</div>
        </div>

        <p>${escapeHtml(tool.description || 'No description available yet.')}</p>

        <div class="tool-meta">
          <div>Pricing<br><strong>${escapeHtml(formatPricing(tool))}</strong></div>
          <div>Rating<br><strong>${escapeHtml(tool.rating ?? '—')} / 5</strong></div>
          <div>API<br><strong>${tool.api ? 'Yes' : 'No'}</strong></div>
          <div>Team<br><strong>${tool.team ? 'Yes' : 'No'}</strong></div>
        </div>

        <div class="badges">
          ${useCases.map((x) => `<span class="badge">${escapeHtml(x)}</span>`).join('')}
        </div>

        <div class="tool-actions">
          <a class="btn-soft" href="${slugLink(tool.slug)}">View details</a>
          <button class="icon-btn favorite-btn ${favoriteIds.includes(tool.slug) ? 'active' : ''}" data-fav="${escapeHtml(tool.slug)}">❤ Save</button>
          <button class="icon-btn compare-btn ${compareIds.includes(tool.slug) ? 'active' : ''}" data-compare="${escapeHtml(tool.slug)}">⇄ Compare</button>
          <button class="icon-btn stack-btn ${stackIds.includes(tool.slug) ? 'active' : ''}" data-stack="${escapeHtml(tool.slug)}">＋ Stack</button>
        </div>
      </article>
    `;
  }

  function bindActions(scope = document) {
    $$('[data-fav]', scope).forEach((btn) => {
      btn.onclick = () => {
        const slug = btn.dataset.fav;
        let favorites = load('favorites', []);
        favorites = favorites.includes(slug)
          ? favorites.filter((x) => x !== slug)
          : [...favorites, slug];
        save('favorites', favorites);
        btn.classList.toggle('active');
        updateCounters();
      };
    });

    $$('[data-compare]', scope).forEach((btn) => {
      btn.onclick = () => {
        const slug = btn.dataset.compare;
        let compare = load('compare', []);

        if (compare.includes(slug)) {
          compare = compare.filter((x) => x !== slug);
          btn.classList.remove('active');
        } else {
          if (compare.length >= 3) {
            alert('You can compare up to 3 tools.');
            return;
          }
          compare.push(slug);
          btn.classList.add('active');
        }

        save('compare', compare);
        updateCounters();
      };
    });

    $$('[data-stack]', scope).forEach((btn) => {
      btn.onclick = () => {
        const slug = btn.dataset.stack;
        let stack = load('stack-default', []);
        stack = stack.includes(slug)
          ? stack.filter((x) => x !== slug)
          : [...stack, slug];
        save('stack-default', stack);
        btn.classList.toggle('active');
        updateCounters();
      };
    });
  }

  function updateCounters() {
    const favorites = load('favorites', []).length;
    const compare = load('compare', []).length;
    const stack = load('stack-default', []).length;

    $$('[data-counter="favorites"]').forEach((el) => (el.textContent = favorites));
    $$('[data-counter="compare"]').forEach((el) => (el.textContent = compare));
    $$('[data-counter="stack"]').forEach((el) => (el.textContent = stack));
  }

  function newsletterInit() {
    $$('.newsletter-form').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const emailInput = $('input[type="email"]', form);
        const email = emailInput?.value.trim() || '';
        const note =
          $('.newsletter-note', form.parentElement) ||
          form.nextElementSibling;

        if (!note) return;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          note.textContent = 'Enter a valid email address.';
          return;
        }

        const list = load('newsletter-subscribers', []);
        if (!list.includes(email)) list.push(email);
        save('newsletter-subscribers', list);

        note.innerHTML = `Saved locally. To subscribe manually right now, email us at <a href="mailto:${CONTACT_EMAIL}?subject=Newsletter%20Subscription&body=Please%20subscribe%20${encodeURIComponent(email)}">${CONTACT_EMAIL}</a>.`;
        form.reset();
      });
    });
  }

  function filterTools() {
    const q =
      ($('#searchInput')?.value || $('#directorySearch')?.value || '')
        .toLowerCase()
        .trim();
    const cat = ($('#categoryFilter')?.value || '').trim();
    const pricing = ($('#pricingFilter')?.value || '').trim();
    const featuredOnly = $('#featuredOnly')?.checked || false;
    const sort = ($('#sortFilter')?.value || 'featured');

    let result = tools.filter((tool) => {
      const haystack = [
        tool.name,
        tool.description,
        tool.categoryName,
        ...(tool.useCases || []),
        ...(tool.tags || [])
      ]
        .join(' ')
        .toLowerCase();

      const hit = !q || haystack.includes(q);
      const catHit = !cat || tool.category === cat;
      const priceHit = !pricing || tool.pricing === pricing;
      const featHit = !featuredOnly || tool.featured;

      return hit && catHit && priceHit && featHit;
    });

    const sorts = {
      featured: (a, b) =>
        Number(b.featured) - Number(a.featured) || (b.popularity || 0) - (a.popularity || 0),
      popularity: (a, b) => (b.popularity || 0) - (a.popularity || 0),
      rating: (a, b) => (b.rating || 0) - (a.rating || 0),
      newest: (a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')),
      name: (a, b) => String(a.name || '').localeCompare(String(b.name || ''))
    };

    result.sort(sorts[sort] || sorts.featured);
    return result;
  }

  function renderCollection(targetId, arr, count) {
    const root = document.getElementById(targetId);
    if (!root) return;

    root.innerHTML =
      arr.slice(0, count).map(card).join('') ||
      '<div class="empty">No tools found.</div>';

    bindActions(root);
  }

  function renderHome() {
    renderCollection('featuredGrid', tools.filter((t) => t.featured), 8);
    renderCollection(
      'trendingGrid',
      tools.filter((t) => t.trending).sort((a, b) => (b.popularity || 0) - (a.popularity || 0)),
      8
    );
    renderCollection('dealsGrid', tools.filter((t) => t.deals), 6);

    const stackRoot = document.getElementById('stackPreview');
    if (stackRoot) {
      const stackIds = load('stack-default', []);
      const stackTools = tools.filter((t) => stackIds.includes(t.slug));

      stackRoot.innerHTML = stackTools.length
        ? stackTools.slice(0, 5).map((t) => `<li><a href="${slugLink(t.slug)}">${escapeHtml(t.name)}</a><span>${escapeHtml(t.pricing || '—')}</span></li>`).join('')
        : '<li><span class="muted">Your stack is empty.</span><a href="/directory.html">Browse tools</a></li>';
    }
  }

  function renderDirectory() {
    const root = document.getElementById('directoryGrid');
    if (!root) return;

    const result = filterTools();
    const count = $('#resultsCount');
    if (count) count.textContent = `${result.length} tools`;

    root.innerHTML =
      result.map(card).join('') ||
      '<div class="empty">No matching tools. Try clearing some filters.</div>';

    bindActions(root);
  }

  function bindDirectoryEvents() {
    ['searchInput', 'directorySearch', 'categoryFilter', 'pricingFilter', 'sortFilter', 'featuredOnly'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', renderDirectory);
      if (el.tagName === 'SELECT') el.addEventListener('change', renderDirectory);
    });
  }

  function renderTop100() {
    const root = document.getElementById('top100List');
    if (!root) return;

    const ranked = [...tools]
      .sort((a, b) => (a.rank || 9999) - (b.rank || 9999))
      .slice(0, 100);

    root.innerHTML = ranked
      .map(
        (t) => `
        <div class="top100-row">
          <div class="rank">#${escapeHtml(t.rank ?? '—')}</div>
          <div>
            <strong><a href="${slugLink(t.slug)}">${escapeHtml(t.name)}</a></strong>
            <div class="small muted">${escapeHtml(t.description || '')}</div>
          </div>
          <div><span class="badge brand">${escapeHtml(t.categoryName)}</span></div>
          <div>${escapeHtml(formatPricing(t))}</div>
          <div>★ ${escapeHtml(t.rating ?? '—')} · ${escapeHtml(t.popularity ?? '—')}</div>
        </div>
      `
      )
      .join('');
  }

  function renderCompare() {
    const root = document.getElementById('compareTableWrap');
    if (!root) return;

    const ids = load('compare', []);
    const selected = tools.filter((t) => ids.includes(t.slug));

    const chipsRoot = document.getElementById('compareSelection');
    const countRoot = document.getElementById('compareCount');
    const emptyRoot = document.getElementById('compareEmpty');

    if (chipsRoot) {
      chipsRoot.innerHTML = selected.length
        ? selected
            .map((t) => `<span class="chip">${escapeHtml(t.name)}</span>`)
            .join('')
        : '<span class="chip">Selected tools will appear here</span>';
    }

    if (countRoot) {
      countRoot.textContent = selected.length
        ? `${selected.length} tool(s) selected for comparison.`
        : 'You can compare up to 3 tools at the same time.';
    }

    if (!selected.length) {
      root.innerHTML =
        '<div class="empty">No tools selected. Use “Compare” buttons on the directory or tool cards first.</div>';
      if (emptyRoot) emptyRoot.classList.remove('hidden');
      return;
    }

    if (emptyRoot) emptyRoot.classList.add('hidden');

    const fields = [
      ['Category', (t) => textOrFallback(t.categoryName)],
      ['Pricing', (t) => formatPricing(t)],
      ['Free plan', (t) => (t.freePlan ? 'Yes' : 'No')],
      ['Free trial', (t) => (t.freeTrial ? 'Yes' : 'No')],
      ['API', (t) => (t.api ? 'Yes' : 'No')],
      ['Team features', (t) => (t.team ? 'Yes' : 'No')],
      ['Mobile app', (t) => (t.mobile ? 'Yes' : 'No')],
      ['Platforms', (t) => textOrFallback(t.platforms)],
      ['Languages', (t) => listOrFallback(t.languages)],
      ['Outputs', (t) => listOrFallback(t.outputs)],
      ['Best for', (t) => textOrFallback(t.bestFor)],
      ['Use cases', (t) => listOrFallback(t.useCases)],
      ['Privacy posture', (t) => textOrFallback(t.privacy)],
      ['Export options', (t) => textOrFallback(t.exportOptions)],
      ['Rating', (t) => `${textOrFallback(t.rating)} / 5`],
      ['Popularity', (t) => textOrFallback(t.popularity)],
      ['Last updated', (t) => textOrFallback(t.updatedAt)]
    ];

    root.innerHTML = `
      <div class="table-wrap">
        <table class="compare-table">
          <thead>
            <tr>
              <th>Field</th>
              ${selected.map((t) => `<th><a href="${slugLink(t.slug)}">${escapeHtml(t.name)}</a></th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${fields
              .map(
                ([label, fn]) => `
                  <tr>
                    <td><strong>${escapeHtml(label)}</strong></td>
                    ${selected.map((t) => `<td>${escapeHtml(fn(t))}</td>`).join('')}
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function fillCounts() {
    const total = tools.length;
    $$('[data-stat="tool-count"]').forEach((el) => (el.textContent = String(total)));

    Object.keys(CATEGORY_MAP).forEach((slug) => {
      const n = tools.filter((t) => t.category === slug).length;
      $$(`[data-catcount="${slug}"]`).forEach((el) => (el.textContent = String(n)));
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    fillCounts();
    updateCounters();
    bindDirectoryEvents();
    newsletterInit();
    renderHome();
    renderDirectory();
    renderTop100();
    renderCompare();
  });
})();