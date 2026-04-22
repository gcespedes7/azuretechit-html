// Azuretech homepage interactive workflow canvas
// Tabs → different node graphs. Nodes are draggable; connections redraw live; Run button animates flow.

(function () {
  const NAVY = '#234B70';
  const ORANGE = '#F79226';

  // Graph schemas: each tab has nodes and edges
  const GRAPHS = {
    it: {
      nodes: [
        { id: 'trigger', x: 60,  y: 200, label: 'Form submitted', kind: 'trigger', icon: 'form', meta: 'HR portal · webhook' },
        { id: 'ai',      x: 290, y: 200, label: 'AI Agent',       kind: 'ai',      icon: 'bot',  meta: 'classify role · 200ms' },
        { id: 'split',   x: 520, y: 200, label: 'Is manager?',    kind: 'logic',   icon: 'split',meta: 'branch' },
        { id: 'slack',   x: 760, y: 110, label: 'Invite to Slack',kind: 'action',  icon: 'slack',meta: '#new-hires' },
        { id: 'okta',    x: 760, y: 290, label: 'Provision access',kind: 'action', icon: 'key',  meta: 'Okta · Notion · 1Pass' },
        { id: 'email',   x: 990, y: 200, label: 'Send welcome',   kind: 'action',  icon: 'mail', meta: 'Postmark · template' },
      ],
      edges: [
        ['trigger', 'ai'], ['ai', 'split'],
        ['split', 'slack', 'true'], ['split', 'okta', 'false'],
        ['slack', 'email'], ['okta', 'email'],
      ],
    },
    sec: {
      nodes: [
        { id: 'alert',   x: 60,  y: 220, label: 'SIEM alert',     kind: 'trigger', icon: 'shield',  meta: 'Wazuh · severity ≥ 4' },
        { id: 'enrich',  x: 290, y: 220, label: 'Enrich context', kind: 'ai',      icon: 'bot',     meta: 'VT · GreyNoise · CVE' },
        { id: 'score',   x: 520, y: 220, label: 'Risk score',     kind: 'logic',   icon: 'gauge',   meta: '0–100 · threshold 70' },
        { id: 'page',    x: 760, y: 140, label: 'Page on-call',   kind: 'action',  icon: 'bell',    meta: 'PagerDuty · P1' },
        { id: 'ticket',  x: 760, y: 310, label: 'Open ticket',    kind: 'action',  icon: 'ticket',  meta: 'Jira · auto-assign' },
      ],
      edges: [['alert', 'enrich'], ['enrich', 'score'], ['score', 'page', 'hi'], ['score', 'ticket', 'lo']],
    },
    sales: {
      nodes: [
        { id: 'lead',    x: 60,  y: 220, label: 'Lead form',       kind: 'trigger', icon: 'form',   meta: 'Webflow · webhook' },
        { id: 'clear',   x: 290, y: 220, label: 'Clearbit lookup', kind: 'ai',      icon: 'search', meta: 'firmographics' },
        { id: 'qualify', x: 520, y: 220, label: 'ICP fit?',        kind: 'logic',   icon: 'split',  meta: 'LLM scoring' },
        { id: 'crm',     x: 760, y: 140, label: 'Push to CRM',     kind: 'action',  icon: 'db',     meta: 'HubSpot · SDR' },
        { id: 'nurture', x: 760, y: 310, label: 'Nurture flow',    kind: 'action',  icon: 'mail',   meta: 'drip · 21d' },
      ],
      edges: [['lead', 'clear'], ['clear', 'qualify'], ['qualify', 'crm', 'yes'], ['qualify', 'nurture', 'no']],
    },
    care: {
      nodes: [
        { id: 'inbox',   x: 60,  y: 220, label: 'New email',       kind: 'trigger', icon: 'mail',   meta: 'support@ · IMAP' },
        { id: 'class',   x: 290, y: 220, label: 'Classify intent', kind: 'ai',      icon: 'bot',    meta: 'GPT · 12 labels' },
        { id: 'urgent',  x: 520, y: 220, label: 'Urgent?',         kind: 'logic',   icon: 'split',  meta: 'SLA · 2h' },
        { id: 'route',   x: 760, y: 140, label: 'Route to team',   kind: 'action',  icon: 'users',  meta: 'Slack DM + assign' },
        { id: 'reply',   x: 760, y: 310, label: 'Draft AI reply',  kind: 'action',  icon: 'pen',    meta: 'human-approved' },
      ],
      edges: [['inbox', 'class'], ['class', 'urgent'], ['urgent', 'route', 'yes'], ['urgent', 'reply', 'no']],
    },
  };

  // Icon SVG set (small, sharp)
  const ICONS = {
    form:   '<path d="M7 3h10v4H7zM6 8h12v13H6z"/><path d="M9 12h6M9 16h6" stroke-linecap="round"/>',
    bot:    '<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 4v4M8 14v2M16 14v2M2 14h2M20 14h2" stroke-linecap="round"/>',
    split:  '<path d="M16 3h5v5M3 3h5v5M12 22v-8a4 4 0 0 0-1.2-2.9L3 3M15 9l6-6" stroke-linecap="round" stroke-linejoin="round"/>',
    slack:  '<rect x="13" y="2" width="3" height="8" rx="1.5"/><rect x="8" y="14" width="3" height="8" rx="1.5"/><rect x="14" y="13" width="8" height="3" rx="1.5"/><rect x="2" y="8" width="8" height="3" rx="1.5"/>',
    key:    '<circle cx="8" cy="12" r="4"/><path d="M12 12h10M18 12v4M22 12v6" stroke-linecap="round"/>',
    mail:   '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7" stroke-linejoin="round"/>',
    shield: '<path d="M12 2 4 5v7c0 5 3.5 8 8 10 4.5-2 8-5 8-10V5Z" stroke-linejoin="round"/>',
    gauge:  '<path d="M12 14 8 8" stroke-linecap="round"/><circle cx="12" cy="14" r="8"/><path d="M4 14h2M18 14h2M12 4v2" stroke-linecap="round"/>',
    bell:   '<path d="M18 16V11a6 6 0 1 0-12 0v5l-2 3h16l-2-3zM10 21a2 2 0 0 0 4 0" stroke-linejoin="round"/>',
    ticket: '<path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4Z"/><path d="M12 5v14" stroke-dasharray="2 2"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.35-4.35" stroke-linecap="round"/>',
    db:     '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    users:  '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 11a4 4 0 0 0 0-8M22 21c0-3-2-5-5-5.5" stroke-linecap="round"/>',
    pen:    '<path d="M12 20h9M16 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" stroke-linejoin="round"/>',
  };

  const KIND_STYLES = {
    trigger: { accent: ORANGE, label: 'trigger' },
    ai:      { accent: '#8b5cf6', label: 'ai' },
    logic:   { accent: '#10b981', label: 'logic' },
    action:  { accent: '#60a5fa', label: 'action' },
  };

  const DESIGN_W = 1200;
  const DESIGN_H = 560;

  let currentTab = 'it';
  let nodes = JSON.parse(JSON.stringify(GRAPHS[currentTab].nodes));
  let edges = GRAPHS[currentTab].edges;

  const $nodes = document.getElementById('nodes');
  const $conn  = document.getElementById('connections');
  const $canvas = document.getElementById('canvas');
  if (!$nodes || !$conn || !$canvas) return;

  function getScales() {
    return {
      sx: $canvas.clientWidth / DESIGN_W,
      sy: $canvas.clientHeight / DESIGN_H,
    };
  }

  function renderNodes() {
    $nodes.innerHTML = '';
    const isMobile = $canvas.clientWidth < 640;
    if (isMobile) {
      $canvas.style.overflowX = 'auto';
      $canvas.style.overflowY = 'hidden';
      $nodes.style.width = DESIGN_W + 'px';
      $nodes.style.height = '100%';
      $nodes.style.transform = '';
      $nodes.style.transformOrigin = '';
    } else {
      $canvas.style.overflow = 'hidden';
      const { sx, sy } = getScales();
      $nodes.style.width = DESIGN_W + 'px';
      $nodes.style.height = DESIGN_H + 'px';
      $nodes.style.transform = `scale(${sx}, ${sy})`;
      $nodes.style.transformOrigin = 'top left';
    }
    nodes.forEach(n => {
      const style = KIND_STYLES[n.kind];
      const el = document.createElement('div');
      el.className = 'workflow-node absolute bg-[#0f1620] border border-white/10 rounded-lg shadow-lg select-none';
      el.style.left = n.x + 'px';
      el.style.top = n.y + 'px';
      el.style.width = '180px';
      el.dataset.id = n.id;
      el.innerHTML = `
        <div class="absolute top-0 left-0 w-[3px] h-full rounded-l-lg" style="background:${style.accent}"></div>
        <div class="p-4 pl-5">
          <div class="flex items-start justify-between mb-3">
            <div class="p-2 rounded-md border" style="background:${style.accent}14; border-color:${style.accent}33; color:${style.accent}">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">${ICONS[n.icon] || ''}</svg>
            </div>
            <div class="mono text-[9px] tracking-[0.14em] uppercase opacity-60" style="color:${style.accent}">${style.label}</div>
          </div>
          <div class="text-white text-sm font-medium leading-tight">${n.label}</div>
          <div class="mono text-[10px] text-white/45 mt-1.5 truncate">${n.meta}</div>
        </div>
      `;
      $nodes.appendChild(el);
      n._h = el.offsetHeight;
      makeDraggable(el, n);
    });
  }

  function renderEdges(activeIds) {
    const isMobile = $canvas.clientWidth < 640;
    $conn.setAttribute('viewBox', `0 0 ${DESIGN_W} ${DESIGN_H}`);
    if (isMobile) {
      $conn.style.width = DESIGN_W + 'px';
      $conn.style.height = '100%';
    } else {
      $conn.style.width = '';
      $conn.style.height = '';
    }
    const SVG_NS = 'http://www.w3.org/2000/svg';
    while ($conn.firstChild) $conn.removeChild($conn.firstChild);
    const el = (tag, attrs) => {
      const n = document.createElementNS(SVG_NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    };
    edges.forEach(([a, b, label]) => {
      const A = nodes.find(n => n.id === a);
      const B = nodes.find(n => n.id === b);
      if (!A || !B) return;
      const x1 = A.x + 180, y1 = A.y + (A._h || 90) / 2;
      const x2 = B.x,       y2 = B.y + (B._h || 90) / 2;
      const mx = (x1 + x2) / 2;
      const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
      const isActive = activeIds && activeIds.includes(a) && activeIds.includes(b);
      $conn.appendChild(el('path', { d, class: 'connection-line' + (isActive ? ' active' : '') }));
      $conn.appendChild(el('circle', { cx: x1, cy: y1, r: 5, fill: isActive ? ORANGE : '#0f1620', stroke: isActive ? ORANGE : '#475569', 'stroke-width': '1.5' }));
      $conn.appendChild(el('circle', { cx: x2, cy: y2, r: 5, fill: isActive ? ORANGE : '#0f1620', stroke: isActive ? ORANGE : '#475569', 'stroke-width': '1.5' }));
      if (label) {
        const lx = (x1 + x2) / 2 - 18, ly = (y1 + y2) / 2 - 8;
        $conn.appendChild(el('rect', { x: lx, y: ly, width: 36, height: 16, rx: 4, fill: '#0b0f16', stroke: '#334155' }));
        const t = el('text', { x: lx + 18, y: ly + 8, fill: '#94a3b8', 'font-size': 10, 'font-family': 'JetBrains Mono, monospace', 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
        t.textContent = label;
        $conn.appendChild(t);
      }
    });
  }

  function makeDraggable(el, n) {
    let startX, startY, origX, origY, dragging = false;
    const onDown = (ev) => {
      dragging = true;
      const p = ev.touches ? ev.touches[0] : ev;
      startX = p.clientX; startY = p.clientY; origX = n.x; origY = n.y;
      el.style.zIndex = 20;
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);
    };
    const onMove = (ev) => {
      if (!dragging) return;
      ev.preventDefault && ev.preventDefault();
      const p = ev.touches ? ev.touches[0] : ev;
      const { sx, sy } = $canvas.clientWidth < 640 ? { sx: 1, sy: 1 } : getScales();
      const dx = (p.clientX - startX) / sx;
      const dy = (p.clientY - startY) / sy;
      n.x = Math.max(0, Math.min(DESIGN_W - 180, origX + dx));
      n.y = Math.max(0, Math.min(DESIGN_H - 90, origY + dy));
      el.style.left = n.x + 'px'; el.style.top = n.y + 'px';
      renderEdges();
    };
    const onUp = () => {
      dragging = false; el.style.zIndex = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
    el.addEventListener('mousedown', onDown);
    el.addEventListener('touchstart', onDown, { passive: true });
  }

  // Tab switching
  function switchTab(t) {
    currentTab = t;
    nodes = JSON.parse(JSON.stringify(GRAPHS[t].nodes));
    edges = GRAPHS[t].edges;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('tab-active', b.dataset.tab === t));
    renderNodes();
    renderEdges();
  }
  document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));

  // Run animation
  function runFlow() {
    const sequence = [];
    const start = nodes[0].id;
    const visited = new Set([start]);
    sequence.push([start]);
    let frontier = [start];
    while (frontier.length) {
      const next = [];
      for (const id of frontier) {
        edges.forEach(([a, b]) => { if (a === id && !visited.has(b)) { visited.add(b); next.push(b); } });
      }
      if (!next.length) break;
      sequence.push([...frontier, ...next]);
      frontier = next;
    }
    let i = 0;
    const step = () => {
      if (i >= sequence.length) { setTimeout(() => renderEdges(), 800); return; }
      renderEdges(sequence[i]);
      // ping nodes
      sequence[i].forEach(id => {
        const el = $nodes.querySelector(`[data-id="${id}"]`);
        if (el) {
          el.animate([{ boxShadow: '0 0 0 0 rgba(247,146,38,0.6)' }, { boxShadow: '0 0 0 10px rgba(247,146,38,0)' }], { duration: 700 });
        }
      });
      i++;
      setTimeout(step, 520);
    };
    step();
  }
  const runBtn = document.getElementById('run-btn');
  if (runBtn) runBtn.addEventListener('click', runFlow);

  // Init + resize
  renderNodes();
  requestAnimationFrame(() => renderEdges());
  window.addEventListener('resize', () => { renderNodes(); renderEdges(); });
})();
