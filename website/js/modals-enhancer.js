// ── Divergence Tooltip & Stage Detail Panel System ─────────────────────────
//
// Per kg-modal with a TTL mapping:
//   • Hovering a .div-icon → tooltip with divergence rationale
//   • Clicking a .segment  → expandable panel with stage realization description
//
// TTL files are expected at: ../ontology/graphs/<filename>
// ──────────────────────────────────────────────────────────────────────────

// ── Modal ID → TTL filename mapping ────────────────────────────────────────
const MODAL_TTL_MAP = {
  'kg-modal-matrix':       'the-matrix.ttl',
  'kg-modal-lion-king':    'the-lion-king.ttl',
  'kg-modal-call-of-wild': 'the-call-of-the-wild.ttl',
  'kg-modal-Rostam':       'rostam-haft-khan.ttl',
  'kg-modal-waltermitty':  'walter-mitty.ttl',
  'kg-modal-batman':       'batman.ttl',
  'kg-modal-oedipus':      'oedipus.ttl',
  'kg-modal-sablefable':   'sableFable.ttl',
  'kg-modal-ladybird':     'lady-bird.ttl',
  'kg-modal-aeneid':       'aeneid.ttl',
};

const TTL_BASE_PATH = '../ontology/graphs/';

// Cache: modalId → parsed stageMap
const divergenceCache = {};
const fetchPromises   = {};

// ── TTL Parser ──────────────────────────────────────────────────────────────
function parseTTL(text) {
  const stageMap = {};

  // Step 1: divergence IRI → { type, label, rationale }
  const divergenceInfo = {};
  const divTypes = ['SemioticDivergence', 'NarrativeDivergence', 'SequentialDivergence'];
  const typeToKey = {
    'SemioticDivergence':   'semiotic',
    'NarrativeDivergence':  'narrative',
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

    const labelMatch    = block.match(/rdfs:label\s+"([^"]+)"/);
    const rationaleMatch = block.match(/monomyth:divergenceRationale\s+"""([\s\S]*?)"""@en/);

    divergenceInfo[iri] = {
      type:      typeToKey[divType],
      label:     labelMatch     ? labelMatch[1]                                   : iri.split('/').pop(),
      rationale: rationaleMatch ? rationaleMatch[1].replace(/\s+/g, ' ').trim()  : null,
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
      { pred: 'hasNarrativeDivergence',  key: 'narrative'  },
      { pred: 'hasSemioticDivergence',   key: 'semiotic'   },
    ];
    for (const { pred, key } of divPredicates) {
      const re    = new RegExp(`monomyth:${pred}\\s+<([^>]+)>`);
      const match = block.match(re);
      if (match) {
        const info = divergenceInfo[match[1]];
        if (info) stageMap[order][key] = { label: info.label, rationale: info.rationale };
      }
    }
  }

  return stageMap;
}

// ── Fetch & cache TTL ───────────────────────────────────────────────────────
async function getDivergenceData(modalId) {
  if (divergenceCache[modalId]) return divergenceCache[modalId];
  if (fetchPromises[modalId])   return fetchPromises[modalId];

  const filename = MODAL_TTL_MAP[modalId];
  if (!filename) return null;

  fetchPromises[modalId] = fetch(`${TTL_BASE_PATH}${filename}`)
    .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.text(); })
    .then(text => { const d = parseTTL(text); divergenceCache[modalId] = d; return d; })
    .catch(err => { console.warn('[divergence-tooltips]', err); return null; });

  return fetchPromises[modalId];
}

// ── Tooltip ─────────────────────────────────────────────────────────────────
let tooltip  = null;
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
  tooltip.querySelector('.div-tooltip-type').textContent  = typeLabel;
  tooltip.querySelector('.div-tooltip-label').textContent = label;
  tooltip.querySelector('.div-tooltip-body').textContent  = rationale || 'No rationale available.';

  tooltip.style.opacity = '0';
  tooltip.style.display = 'block';

  const rect  = icon.getBoundingClientRect();
  const ttW   = 420;
  let   left  = rect.left + window.scrollX + rect.width / 2 - ttW / 2;
  let   top   = rect.top  + window.scrollY - 8;

  left = Math.max(8, Math.min(left, window.innerWidth - ttW - 8));
  tooltip.style.left  = `${left}px`;
  tooltip.style.top   = `${top}px`;
  tooltip.style.width = `${ttW}px`;

  requestAnimationFrame(() => {
    tooltip.style.opacity   = '1';
    tooltip.style.transform = 'translateY(-100%) translateY(-12px)';
  });
}

function hideTooltip() {
  hideTimer = setTimeout(() => {
    if (tooltip) {
      tooltip.style.opacity   = '0';
      tooltip.style.transform = 'translateY(-100%) translateY(-8px)';
      setTimeout(() => { tooltip.style.display = 'none'; }, 250);
    }
  }, 120);
}

const TYPE_LABELS = {
  sequential: 'Sequential Divergence',
  narrative:  'Narrative Divergence',
  semiotic:   'Semiotic Divergence',
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

function openPanel(panel, order, stageData) {
  const kicker = panel.querySelector('.stage-detail-kicker');
  const title  = panel.querySelector('.stage-detail-title');
  const body   = panel.querySelector('.stage-detail-body');

  kicker.textContent = `Stage ${order} of 17`;
  title.textContent  = stageData?.label       || `Stage ${order}`;
  body.textContent   = stageData?.description || 'No description available for this stage.';

  panel.classList.add('open');
}

function closePanel(panel, segments) {
  panel.classList.remove('open');
  if (segments) segments.forEach(s => s.classList.remove('segment-active'));
}

// ── Wire up a modal ─────────────────────────────────────────────────────────
function wireModal(modal) {
  const modalId     = modal.id;
  const fitBarLarge = modal.querySelector('.fit-bar.fit-bar-large');
  if (!fitBarLarge) return;

  // Pre-fetch TTL
  getDivergenceData(modalId);

  const segments   = [...fitBarLarge.querySelectorAll('.segment')];
  const panel      = createDetailPanel(fitBarLarge);
  let   activeIdx  = null;

  // Close button
  panel.querySelector('.stage-detail-close').addEventListener('click', () => {
    closePanel(panel, segments);
    activeIdx = null;
  });

  // ── Segment click → stage detail ──────────────────────────────────────────
  segments.forEach((segment, idx) => {
    segment.style.cursor = 'pointer';
    const stageOrder = idx + 1;

    segment.addEventListener('click', async (e) => {
      // Don't trigger if clicking a div-icon (those have their own tooltip)
      if (e.target.classList.contains('div-icon')) return;

      const data = await getDivergenceData(modalId);

      if (activeIdx === idx && panel.classList.contains('open')) {
        // Same segment clicked again → close
        closePanel(panel, segments);
        activeIdx = null;
        return;
      }

      // Highlight active segment
      segments.forEach(s => s.classList.remove('segment-active'));
      segment.classList.add('segment-active');
      activeIdx = idx;

      openPanel(panel, stageOrder, data ? data[stageOrder] : null);
    });
  });

  // ── Divergence icon hover → tooltip ───────────────────────────────────────
  fitBarLarge.querySelectorAll('.div-icon').forEach(icon => {
    let divType = null;
    if (icon.classList.contains('sequential'))     divType = 'sequential';
    else if (icon.classList.contains('narrative')) divType = 'narrative';
    else if (icon.classList.contains('semiotic'))  divType = 'semiotic';
    if (!divType) return;

    const segment    = icon.closest('.segment');
    const stageOrder = segments.indexOf(segment) + 1;

    icon.addEventListener('mouseenter', async () => {
      const data      = await getDivergenceData(modalId);
      const stageDivs = data ? data[stageOrder] : null;
      const divInfo   = stageDivs ? stageDivs[divType] : null;
      showTooltip(icon, TYPE_LABELS[divType],
        divInfo ? divInfo.label    : TYPE_LABELS[divType],
        divInfo ? divInfo.rationale : null
      );
    });
    icon.addEventListener('mouseleave', hideTooltip);
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
