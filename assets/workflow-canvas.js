;(function () {
  // ─── Tab data ────────────────────────────────────────────────────────────
  const TABS = {
    it: {
      nodes: [
        { id: 'trigger', x: 60,  y: 190, label: 'New Hire Form',   sub: 'Trigger',        color: '#F79226', type: 'trigger' },
        { id: 'agent',   x: 300, y: 190, label: 'AI Agent',         sub: 'Route & Decide', color: '#8b5cf6', type: 'main'    },
        { id: 'slack',   x: 540, y: 90,  label: 'Add to Slack',     sub: '#team-channel',  color: '#10b981', type: 'main'    },
        { id: 'entra',   x: 540, y: 290, label: 'Update Profile',   sub: 'Entra ID',       color: '#3b82f6', type: 'main'    },
        { id: 't1',      x: 160, y: 380, label: 'Anthropic',        sub: 'Tool',           color: '#F79226', type: 'tool'    },
        { id: 't2',      x: 310, y: 380, label: 'Postgres',         sub: 'Tool',           color: '#3b82f6', type: 'tool'    },
        { id: 't3',      x: 460, y: 380, label: 'Jira',             sub: 'Tool',           color: '#6366f1', type: 'tool'    },
      ],
      edges: [
        { from: 'trigger', to: 'agent'  },
        { from: 'agent',   to: 'slack'  },
        { from: 'agent',   to: 'entra'  },
        { from: 'agent',   to: 't1'     },
        { from: 'agent',   to: 't2'     },
        { from: 'agent',   to: 't3'     },
      ],
    },
    sec: {
      nodes: [
        { id: 'alert',  x: 60,  y: 190, label: 'SIEM Alert',      sub: 'Trigger',        color: '#ef4444', type: 'trigger' },
        { id: 'ai',     x: 300, y: 190, label: 'Security AI',     sub: 'Enrich & Score', color: '#8b5cf6', type: 'main'    },
        { id: 'ticket', x: 540, y: 90,  label: 'Create Ticket',   sub: 'ServiceNow',     color: '#10b981', type: 'main'    },
        { id: 'page',   x: 540, y: 290, label: 'Page Team',       sub: 'PagerDuty',      color: '#F79226', type: 'main'    },
        { id: 't1',     x: 200, y: 380, label: 'VirusTotal',      sub: 'Tool',           color: '#ef4444', type: 'tool'    },
        { id: 't2',     x: 370, y: 380, label: 'Splunk',          sub: 'Tool',           color: '#F79226', type: 'tool'    },
      ],
      edges: [
        { from: 'alert',  to: 'ai'     },
        { from: 'ai',     to: 'ticket' },
        { from: 'ai',     to: 'page'   },
        { from: 'ai',     to: 't1'     },
        { from: 'ai',     to: 't2'     },
      ],
    },
    sales: {
      nodes: [
        { id: 'form',    x: 60,  y: 200, label: 'Inbound Form',   sub: 'Trigger',       color: '#F79226', type: 'trigger' },
        { id: 'qualify', x: 290, y: 200, label: 'AI Qualify',     sub: 'Score & Route', color: '#8b5cf6', type: 'main'    },
        { id: 'crm',     x: 530, y: 100, label: 'Update CRM',     sub: 'HubSpot',       color: '#10b981', type: 'main'    },
        { id: 'notify',  x: 530, y: 300, label: 'Notify Rep',     sub: 'Slack DM',      color: '#3b82f6', type: 'main'    },
        { id: 't1',      x: 280, y: 380, label: 'GPT-4',          sub: 'Tool',          color: '#10b981', type: 'tool'    },
      ],
      edges: [
        { from: 'form',    to: 'qualify' },
        { from: 'qualify', to: 'crm'     },
        { from: 'qualify', to: 'notify'  },
        { from: 'qualify', to: 't1'      },
      ],
    },
    care: {
      nodes: [
        { id: 'inbox',    x: 60,  y: 200, label: 'Support Inbox',   sub: 'Email Trigger',   color: '#F79226', type: 'trigger' },
        { id: 'classify', x: 290, y: 200, label: 'AI Classify',     sub: 'Label & Route',   color: '#8b5cf6', type: 'main'    },
        { id: 'urgent',   x: 530, y: 100, label: 'Urgent Queue',    sub: 'High Priority',   color: '#ef4444', type: 'main'    },
        { id: 'standard', x: 530, y: 300, label: 'Standard Queue',  sub: 'Normal Priority', color: '#10b981', type: 'main'    },
        { id: 't1',       x: 200, y: 380, label: 'Zendesk',         sub: 'Tool',            color: '#3b82f6', type: 'tool'    },
        { id: 't2',       x: 360, y: 380, label: 'Claude',          sub: 'Tool',            color: '#8b5cf6', type: 'tool'    },
      ],
      edges: [
        { from: 'inbox',    to: 'classify' },
        { from: 'classify', to: 'urgent'   },
        { from: 'classify', to: 'standard' },
        { from: 'classify', to: 't1'       },
        { from: 'classify', to: 't2'       },
      ],
    },
  }

  // ─── State ───────────────────────────────────────────────────────────────
  let activeTab = 'it'
  let nodePositions = {}
  let running = false

  // ─── DOM refs ────────────────────────────────────────────────────────────
  const canvas  = document.getElementById('wf-canvas')
  const svgEl   = document.getElementById('wf-connections')
  const nodesEl = document.getElementById('wf-nodes')
  const runBtn  = document.getElementById('wf-run-btn')
  const tabBtns = document.querySelectorAll('[data-wf-tab]')
  if (!canvas || !svgEl || !nodesEl) return

  // ─── Render ──────────────────────────────────────────────────────────────
  function render(tab) {
    activeTab = tab
    const data = TABS[tab]
    nodesEl.innerHTML = ''
    svgEl.innerHTML = ''
    nodePositions = {}

    const cw = canvas.offsetWidth || 800
    const ch = canvas.offsetHeight || 480
    const sx = cw / 700
    const sy = ch / 480

    data.nodes.forEach(n => {
      const px = n.x * sx
      const py = n.y * sy
      nodePositions[n.id] = { x: px, y: py }

      const el = document.createElement('div')
      const isTool = n.type === 'tool'
      const size = isTool ? 72 : 160

      el.id = 'wf-node-' + n.id
      el.dataset.nodeId = n.id
      el.style.cssText = `
        position:absolute;
        left:${px}px; top:${py}px;
        width:${size}px;
        transform:translate(-50%,-50%);
        cursor:grab;
        user-select:none;
      `

      if (isTool) {
        el.innerHTML = `
          <div style="
            width:${size}px; height:${size}px;
            border-radius:50%;
            background:${n.color}18;
            border:1.5px solid ${n.color}55;
            display:flex; flex-direction:column;
            align-items:center; justify-content:center;
            font-size:10px; text-align:center;
            color:#fff; line-height:1.3;
            transition:border-color .2s, box-shadow .2s;
          ">
            <div style="font-weight:600; font-size:11px;">${n.label}</div>
          </div>`
      } else {
        el.innerHTML = `
          <div style="
            border-left:3px solid ${n.color};
            background:#12171f;
            border-top:1px solid rgba(255,255,255,.08);
            border-right:1px solid rgba(255,255,255,.08);
            border-bottom:1px solid rgba(255,255,255,.08);
            border-radius:10px;
            padding:12px 14px;
            transition:border-color .2s, box-shadow .2s;
          ">
            <div style="font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:${n.color}; margin-bottom:5px; font-family:monospace;">${n.sub}</div>
            <div style="font-size:13px; font-weight:600; color:#fff; line-height:1.3;">${n.label}</div>
            <div style="margin-top:6px; display:flex; align-items:center; gap:5px;">
              <div style="width:6px;height:6px;border-radius:50%;background:${n.color};opacity:.7;"></div>
              <div style="font-size:9px;color:rgba(255,255,255,.4);font-family:monospace;">active</div>
            </div>
          </div>`
      }

      makeDraggable(el)
      nodesEl.appendChild(el)
    })

    drawEdges()
  }

  // ─── Draw edges ──────────────────────────────────────────────────────────
  function drawEdges() {
    svgEl.innerHTML = ''
    const data = TABS[activeTab]
    const w = canvas.offsetWidth || 800
    const h = canvas.offsetHeight || 480
    svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`)
    svgEl.setAttribute('width', '100%')
    svgEl.setAttribute('height', '100%')

    data.edges.forEach(edge => {
      const a = nodePositions[edge.from]
      const b = nodePositions[edge.to]
      if (!a || !b) return

      const dx = b.x - a.x
      const cx1 = a.x + dx * 0.5
      const cx2 = b.x - dx * 0.5

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', `M${a.x},${a.y} C${cx1},${a.y} ${cx2},${b.y} ${b.x},${b.y}`)
      path.setAttribute('fill', 'none')
      path.setAttribute('stroke', 'rgba(255,255,255,0.15)')
      path.setAttribute('stroke-width', '1.5')
      path.setAttribute('stroke-dasharray', '5 4')
      path.dataset.from = edge.from
      path.dataset.to = edge.to
      svgEl.appendChild(path)
    })
  }

  // ─── Drag ────────────────────────────────────────────────────────────────
  function makeDraggable(el) {
    let startX, startY, origLeft, origTop

    el.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      el.setPointerCapture(e.pointerId)
      el.style.cursor = 'grabbing'
      el.style.zIndex = '10'
      startX = e.clientX
      startY = e.clientY
      origLeft = parseFloat(el.style.left)
      origTop  = parseFloat(el.style.top)
    })

    el.addEventListener('pointermove', (e) => {
      if (!el.hasPointerCapture(e.pointerId)) return
      const newLeft = origLeft + (e.clientX - startX)
      const newTop  = origTop  + (e.clientY - startY)
      el.style.left = newLeft + 'px'
      el.style.top  = newTop  + 'px'
      nodePositions[el.dataset.nodeId] = { x: newLeft, y: newTop }
      drawEdges()
    })

    el.addEventListener('pointerup', (e) => {
      el.style.cursor = 'grab'
      el.style.zIndex = ''
      el.releasePointerCapture(e.pointerId)
    })
  }

  // ─── Run animation ───────────────────────────────────────────────────────
  function runWorkflow() {
    if (running) return
    running = true
    runBtn.textContent = 'Running\u2026'
    runBtn.disabled = true

    const paths = Array.from(svgEl.querySelectorAll('path'))
    let i = 0

    function animateNext() {
      if (i >= paths.length) {
        setTimeout(() => {
          paths.forEach(p => {
            p.setAttribute('stroke', 'rgba(255,255,255,0.15)')
            p.setAttribute('stroke-width', '1.5')
          })
          runBtn.innerHTML = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Run workflow'
          runBtn.disabled = false
          running = false
        }, 400)
        return
      }
      const p = paths[i]
      p.setAttribute('stroke', '#F79226')
      p.setAttribute('stroke-width', '2.5')
      setTimeout(() => {
        p.setAttribute('stroke', 'rgba(255,255,255,0.35)')
        i++
        animateNext()
      }, 180)
    }
    animateNext()
  }

  // ─── Tab switching ───────────────────────────────────────────────────────
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('wf-tab-active'))
      btn.classList.add('wf-tab-active')
      render(btn.dataset.wfTab)
    })
  })

  // ─── Run button ──────────────────────────────────────────────────────────
  if (runBtn) runBtn.addEventListener('click', runWorkflow)

  // ─── Redraw on resize ────────────────────────────────────────────────────
  window.addEventListener('resize', () => render(activeTab))

  // ─── Init ────────────────────────────────────────────────────────────────
  render('it')
})()
