// ── Divergence Tooltip & Stage Detail Panel System ─────────────────────────
//
// Per kg-modal with a TTL mapping:
//   • Hovering a .div-icon → tooltip with divergence rationale
//   • Clicking a .segment  → expandable panel with stage realization description
//
// TTL files are expected at:
//   - /subgraphs/<filename> (production)
//   - ../graph/subgraphs/<filename> (local fallback)
// ──────────────────────────────────────────────────────────────────────────

// ── Modal ID → TTL filename mapping ────────────────────────────────────────
const MODAL_TTL_MAP = {
  'kg-modal-matrix': 'the-matrix.ttl',
  'kg-modal-lion-king': 'the-lion-king.ttl',
  'kg-modal-call-of-wild': 'the-call-of-the-wild.ttl',
  'kg-modal-rostam': 'rostam-haft-khan.ttl',
  'kg-modal-waltermitty': 'walter-mitty.ttl',
  'kg-modal-batman': 'batman.ttl',
  'kg-modal-oedipus': 'oedipus.ttl',
  'kg-modal-sable-fable': 'sable-fable.ttl',
  'kg-modal-ladybird': 'lady-bird.ttl',
  'kg-modal-aeneid': 'aeneid.ttl',
  'kg-modal-zelda': 'ocarina-of-time.ttl',
  'kg-modal-orlando': 'orlando-furioso.ttl',
};

const TTL_BASE_PATHS = ['/subgraphs/', '../graph/subgraphs/'];

// Cache: modalId → parsed stageMap
const divergenceCache = {};
const fetchPromises = {};

// ── TTL Parser ──────────────────────────────────────────────────────────────
function parseTTL(text) {
  const stageMap = {};

  // Step 1: divergence IRI → { type, label, rationale }
  const divergenceInfo = {};
  const divTypes = ['SemioticDivergence', 'NarrativeDivergence', 'SequentialDivergence'];
  const typeToKey = {
    'SemioticDivergence': 'semiotic',
    'NarrativeDivergence': 'narrative',
    'SequentialDivergence': 'sequential',
  };

  const blocks = text.split(/\n(?=<)/);

  for (const block of blocks) {
    let divType = null;
    for (const dt of divTypes) {
      if (block.includes(`monomyth:${dt}`)) { divType = dt; break; }
    }
    if (!divType) continue;

    const iriMatch = block.match(/^<([^>]+)>/);
    if (!iriMatch) continue;
    const iri = iriMatch[1];

    const labelMatch = block.match(/rdfs:label\s+"([^"]+)"/);
    const rationaleMatch = block.match(/monomyth:divergenceRationale\s+"""([\s\S]*?)"""@en/);

    divergenceInfo[iri] = {
      type: typeToKey[divType],
      label: labelMatch ? labelMatch[1] : iri.split('/').pop(),
      rationale: rationaleMatch ? rationaleMatch[1].replace(/\s+/g, ' ').trim() : null,
    };
  }

  // Step 2: stage realizations → { label, description, divergences }
  for (const block of blocks) {
    if (!block.includes('monomyth:StageRealization')) continue;

    const orderMatch = block.match(/monomyth:stageRealizationOrder\s+(\d+)/);
    if (!orderMatch) continue;
    const order = parseInt(orderMatch[1], 10);
    if (!stageMap[order]) stageMap[order] = {};

    // Stage realization label
    const labelMatch = block.match(/rdfs:label\s+"([^"]+)"@en/);
    if (labelMatch) stageMap[order].label = labelMatch[1];

    // Realization description
    const descMatch = block.match(/monomyth:realizationDescription\s+"""([\s\S]*?)"""@en/);
    if (descMatch) stageMap[order].description = descMatch[1].replace(/\s+/g, ' ').trim();

    // Divergences
    const divPredicates = [
      { pred: 'hasSequentialDivergence', key: 'sequential' },
      { pred: 'hasNarrativeDivergence', key: 'narrative' },
      { pred: 'hasSemioticDivergence', key: 'semiotic' },
    ];
    for (const { pred, key } of divPredicates) {
      const re = new RegExp(`monomyth:${pred}\\s+<([^>]+)>`);
      const match = block.match(re);
      if (match) {
        const info = divergenceInfo[match[1]];
        if (info) stageMap[order][key] = { label: info.label, rationale: info.rationale };
      }
    }
  }

  return stageMap;
}

// ── Batman-specific parser ──────────────────────────────────────────────────
// Batman: Year One has two journeys sharing stageRealizationOrder 1-17.
// We hardcode the stage IRI slugs for each journey in the correct order,
// then build two clean stage maps from the parsed TTL data.

const BATMAN_BASE = 'batman-year-one/stages/';

// Stage IRI slugs in order 1-17 for each journey
const BATMAN_BRUCE_SLUGS = [
  'the-train-to-gotham',        // 1
  'i-am-not-ready',             // 2
  'the-bat-at-the-window',      // 3
  'the-dinner-party-ambush',    // 4
  'the-tenement-siege',         // 5
  'the-distributed-trials',     // 6
  'encounter-with-selina',      // 7
  'the-absent-temptation',      // 8
  'the-absent-atonement',       // 9
  'the-absent-apotheosis',      // 10
  'the-bridge-rescue',          // 11
  'refusal-of-the-return',      // 12
  'the-magic-flight',           // 13
  'rescue-from-without',        // 14
  'crossing-the-return-threshold', // 15
  'master-of-two-worlds',       // 16
  'freedom-to-live',            // 17
];

const BATMAN_GORDON_SLUGS = [
  'arrival-in-gotham',          // 1
  'waiting-to-report',          // 2
  'the-absent-aid',             // 3
  'the-beating',                // 4
  'beating-flass',              // 5
  'the-honest-cop-trials',      // 6
  'the-intellectual-equal',     // 7
  'the-extramarital-affair',    // 8
  'confession-to-barbara',      // 9
  'family-man',                 // 10
  'the-bridge-alliance',        // 11
  'refusal-of-the-return',      // 12
  'the-magic-flight',           // 13
  'rescue-from-without',        // 14
  'crossing-the-return-threshold', // 15
  'master-of-two-worlds',       // 16
  'freedom-to-live',            // 17
];

function parseBatmanTTL(text) {
  const blocks = text.split(/\n(?=<)/);

  // Step 1: build divergence IRI → { label, rationale }
  const divergenceInfo = {};
  const divTypes = ['SemioticDivergence', 'NarrativeDivergence', 'SequentialDivergence'];
  const typeToKey = { SemioticDivergence: 'semiotic', NarrativeDivergence: 'narrative', SequentialDivergence: 'sequential' };

  for (const block of blocks) {
    let divType = null;
    for (const dt of divTypes) { if (block.includes(`monomyth:${dt}`)) { divType = dt; break; } }
    if (!divType) continue;
    const iriMatch = block.match(/^<([^>]+)>/);
    if (!iriMatch) continue;
    const labelMatch = block.match(/rdfs:label\s+"([^"]+)"/);
    const rationaleMatch = block.match(/monomyth:divergenceRationale\s+"""([\s\S]*?)"""@en/);
    divergenceInfo[iriMatch[1]] = {
      label: labelMatch ? labelMatch[1] : iriMatch[1].split('/').pop(),
      rationale: rationaleMatch ? rationaleMatch[1].replace(/\s+/g, ' ').trim() : null,
    };
  }

  // Step 2: build slug → stageData lookup from all StageRealization blocks
  const slugData = {};
  for (const block of blocks) {
    if (!block.includes('monomyth:StageRealization')) continue;
    const iriMatch = block.match(/^<([^>]+)>/);
    if (!iriMatch) continue;
    const fullIri = iriMatch[1]; // e.g. batman-year-one/stages/the-train-to-gotham
    const slug = fullIri.replace(BATMAN_BASE, '');
    const entry = {};

    const labelMatch = block.match(/rdfs:label\s+"([^"]+)"@en/);
    if (labelMatch) entry.label = labelMatch[1];

    const descMatch = block.match(/monomyth:realizationDescription\s+"""([\s\S]*?)"""@en/);
    if (descMatch) entry.description = descMatch[1].replace(/\s+/g, ' ').trim();

    const divPredicates = [
      { pred: 'hasSequentialDivergence', key: 'sequential' },
      { pred: 'hasNarrativeDivergence', key: 'narrative' },
      { pred: 'hasSemioticDivergence', key: 'semiotic' },
    ];
    for (const { pred, key } of divPredicates) {
      const m = block.match(new RegExp(`monomyth:${pred}\\s+<([^>]+)>`));
      if (m && divergenceInfo[m[1]]) {
        entry[key] = { label: divergenceInfo[m[1]].label, rationale: divergenceInfo[m[1]].rationale };
      }
    }
    slugData[slug] = entry;
  }

  // Step 3: assemble ordered stage maps from the hardcoded slug lists
  function buildMap(slugList) {
    const map = {};
    slugList.forEach((slug, idx) => {
      map[idx + 1] = slugData[slug] || {};
    });
    return map;
  }

  return [buildMap(BATMAN_BRUCE_SLUGS), buildMap(BATMAN_GORDON_SLUGS)];
}


// ── Fetch & cache TTL ───────────────────────────────────────────────────────
async function getDivergenceData(modalId) {
  if (divergenceCache[modalId]) return divergenceCache[modalId];
  if (fetchPromises[modalId]) return fetchPromises[modalId];

  const filename = MODAL_TTL_MAP[modalId];
  if (!filename) return null;

  const isBatman = modalId === 'kg-modal-batman';

  fetchPromises[modalId] = (async () => {
    let lastErr = null;
    for (const basePath of TTL_BASE_PATHS) {
      try {
        const r = await fetch(`${basePath}${filename}`);
        if (!r.ok) throw new Error(`${r.status}`);
        return await r.text();
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error('Unable to fetch TTL');
  })()
    .then(text => {
      const d = isBatman ? parseBatmanTTL(text) : parseTTL(text);
      divergenceCache[modalId] = d;
      return d;
    })
    .catch(err => { console.warn('[modals-enhancer]', err); return null; });

  return fetchPromises[modalId];
}

// ── Tooltip ─────────────────────────────────────────────────────────────────
let tooltip = null;
let hideTimer = null;

function createTooltip() {
  if (tooltip) return;
  tooltip = document.createElement('div');
  tooltip.id = 'div-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.innerHTML = `
    <div class="div-tooltip-type"></div>
    <div class="div-tooltip-label"></div>
    <div class="div-tooltip-body"></div>
  `;
  document.body.appendChild(tooltip);
}

function showTooltip(icon, typeLabel, label, rationale) {
  clearTimeout(hideTimer);
  tooltip.querySelector('.div-tooltip-type').textContent = typeLabel;
  tooltip.querySelector('.div-tooltip-label').textContent = label;
  tooltip.querySelector('.div-tooltip-body').textContent = rationale || 'No rationale available.';

  tooltip.style.opacity = '0';
  tooltip.style.display = 'block';

  const rect = icon.getBoundingClientRect();
  const ttW = 420;
  let left = rect.left + window.scrollX + rect.width / 2 - ttW / 2;
  let top = rect.top + window.scrollY - 8;

  left = Math.max(8, Math.min(left, window.innerWidth - ttW - 8));
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
  tooltip.style.width = `${ttW}px`;

  requestAnimationFrame(() => {
    tooltip.style.opacity = '1';
    tooltip.style.transform = 'translateY(-100%) translateY(-12px)';
  });
}

function hideTooltip() {
  hideTimer = setTimeout(() => {
    if (tooltip) {
      tooltip.style.opacity = '0';
      tooltip.style.transform = 'translateY(-100%) translateY(-8px)';
      setTimeout(() => { tooltip.style.display = 'none'; }, 250);
    }
  }, 120);
}

const TYPE_LABELS = {
  sequential: 'Sequential Divergence',
  narrative: 'Narrative Divergence',
  semiotic: 'Semiotic Divergence',
};

// ── Stage Detail Panel ──────────────────────────────────────────────────────
function createDetailPanel(fitBar) {
  const panel = document.createElement('div');
  panel.className = 'stage-detail-panel';
  panel.innerHTML = `
    <div class="stage-detail-inner">
      <button class="stage-detail-close" aria-label="Close stage detail">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
      <div class="stage-detail-kicker"></div>
      <div class="stage-detail-title"></div>
      <div class="stage-detail-body"></div>
    </div>
  `;
  // Insert immediately after the fit-bar
  fitBar.parentNode.insertBefore(panel, fitBar.nextSibling);
  return panel;
}

function openPanel(panel, order, total, stageData) {
  const kicker = panel.querySelector('.stage-detail-kicker');
  const title = panel.querySelector('.stage-detail-title');
  const body = panel.querySelector('.stage-detail-body');

  kicker.textContent = `Stage ${order} of ${total}`;
  title.textContent = stageData?.label || `Stage ${order}`;
  body.textContent = stageData?.description || 'No description available for this stage.';

  panel.classList.add('open');
}

function closePanel(panel, segments) {
  panel.classList.remove('open');
  if (segments) segments.forEach(s => s.classList.remove('segment-active'));
}

// ── Wire up a modal ─────────────────────────────────────────────────────────
function isMobile() { return window.innerWidth <= 600; }

function wireModal(modal) {
  const modalId = modal.id;
  const isBatman = modalId === 'kg-modal-batman';

  // Pre-fetch TTL
  getDivergenceData(modalId);

  // For batman: wire each fit-bar to its own stage map index.
  // For all others: wire the single fit-bar to the single stage map.
  const fitBars = isBatman
    ? [...modal.querySelectorAll('.fit-bar.fit-bar-large')]
    : [modal.querySelector('.fit-bar.fit-bar-large')].filter(Boolean);

  if (!fitBars.length) return;

  fitBars.forEach((fitBarLarge, barIdx) => {
    const segments = [...fitBarLarge.querySelectorAll('.segment')];
    const panel = createDetailPanel(fitBarLarge);
    let activeIdx = null;

    // Close button
    panel.querySelector('.stage-detail-close').addEventListener('click', () => {
      closePanel(panel, segments);
      activeIdx = null;
    });

    // ── Segment click → stage detail (desktop only) ──────────────────────────
    segments.forEach((segment, idx) => {
      segment.style.cursor = 'pointer';
      const stageOrder = idx + 1;

      segment.addEventListener('click', async (e) => {
        if (isMobile()) return;  // no interaction on mobile
        if (e.target.classList.contains('div-icon')) return;

        const rawData = await getDivergenceData(modalId);
        // For batman rawData is an array [bruceMap, gordonMap]; otherwise it's a plain map
        const stageMap = isBatman ? (rawData ? rawData[barIdx] : null) : rawData;

        if (activeIdx === idx && panel.classList.contains('open')) {
          closePanel(panel, segments);
          activeIdx = null;
          return;
        }

        segments.forEach(s => s.classList.remove('segment-active'));
        segment.classList.add('segment-active');
        activeIdx = idx;

        openPanel(panel, stageOrder, segments.length, stageMap ? stageMap[stageOrder] : null);
      });
    });

    // ── Divergence icon hover → tooltip (desktop only) ──────────────────
    fitBarLarge.querySelectorAll('.div-icon').forEach(icon => {
      if (isMobile()) return;  // no hover tooltips on mobile
      let divType = null;
      if (icon.classList.contains('sequential')) divType = 'sequential';
      else if (icon.classList.contains('narrative')) divType = 'narrative';
      else if (icon.classList.contains('semiotic')) divType = 'semiotic';
      if (!divType) return;

      const segment = icon.closest('.segment');
      const stageOrder = segments.indexOf(segment) + 1;

      icon.addEventListener('mouseenter', async () => {
        const rawData = await getDivergenceData(modalId);
        const stageMap = isBatman ? (rawData ? rawData[barIdx] : null) : rawData;
        const stageDivs = stageMap ? stageMap[stageOrder] : null;
        const divInfo = stageDivs ? stageDivs[divType] : null;
        showTooltip(icon, TYPE_LABELS[divType],
          divInfo ? divInfo.label : TYPE_LABELS[divType],
          divInfo ? divInfo.rationale : null
        );
      });
      icon.addEventListener('mouseleave', hideTooltip);
    });
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────
function init() {
  createTooltip();

  document.querySelectorAll('.kg-modal').forEach(modal => {
    if (!MODAL_TTL_MAP[modal.id]) return;
    const observer = new MutationObserver(() => {
      if (modal.getAttribute('aria-hidden') === 'false') {
        wireModal(modal);
        observer.disconnect();
      }
    });
    observer.observe(modal, { attributes: true });
  });
}

document.addEventListener('DOMContentLoaded', init);
