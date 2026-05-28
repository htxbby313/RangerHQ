const api = (path, options = {}) =>
  fetch(`/api${path}`, {
    headers: { "content-type": "application/json" },
    ...options
  }).then(async (response) => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  });

const state = {
  summary: null,
  rooms: [],
  projects: [],
  agents: [],
  approvals: [],
  events: [],
  openclaw: null,
  zoomModuleIndex: null
};

const baseModules = [
  {
    roomId: "command",
    backendSlug: "command-room",
    displayName: "Command Room",
    commandRole: { name: "Ranger", rank: "HQ Command Sergeant", slug: "ranger" },
    description: "Ranger command, approvals, routing, and kill-switch oversight.",
    color: "#FF8A4A",
    icon: "shield",
    upgrade: 3,
    activity: "Routing approvals",
    equipment: ["command-desk", "wall-screens", "routing-board", "operations-map"],
    kpis: ["Approvals", "Routes", "Active Rooms"]
  },
  {
    roomId: "research",
    backendSlug: "research-war-room",
    displayName: "Research / War Room",
    commandRole: { name: "Nova", rank: "Master Sergeant", slug: "nova" },
    description: "Maps, data boards, source review, and strategic synthesis.",
    color: "#F35DB4",
    icon: "scope",
    upgrade: 2,
    activity: "Reading signals",
    equipment: ["map-wall", "radar-table", "archive-shelf", "pinned-research"],
    kpis: ["Sources", "Signals", "Briefs"]
  },
  {
    roomId: "forge",
    backendSlug: "creative-studio",
    displayName: "Forge / Creative Studio",
    commandRole: { name: "Forge", rank: "Master Sergeant", slug: "forge" },
    description: "Creative Studio build room for designs, mockups, and production drafts.",
    color: "#8D67FF",
    icon: "tools",
    upgrade: 2,
    activity: "Building assets",
    equipment: ["design-rig", "print-table", "mockup-wall", "swatch-board", "plant"],
    kpis: ["Builds", "Mockups", "QA"]
  },
  {
    roomId: "etsy",
    backendSlug: "shuqualak-store-room",
    displayName: "Etsy / Shuqualak Store",
    commandRole: { name: "Store Specialist", rank: "Specialist", slug: null },
    description: "Shuqualak Store commerce room for POD concepts and listing prep.",
    color: "#FFC44D",
    icon: "store",
    upgrade: 1,
    activity: "Preparing listings",
    equipment: ["merch-rack", "packing-table", "listing-terminal", "shipping-boxes"],
    kpis: ["Ideas", "Listings", "Approvals"]
  },
  {
    roomId: "gunpowder-pearls",
    backendSlug: "gunpowder-pearls-room",
    displayName: "Gunpowder & Pearls",
    commandRole: { name: "Pearls Lead", rank: "Specialist", slug: null },
    description: "Western glam brand room for drops, campaigns, content, and outfit planning.",
    color: "#FF6FB5",
    icon: "sparkle",
    upgrade: 1,
    activity: "Planning drops",
    equipment: ["boutique-rack", "campaign-board", "photo-corner", "pearl-table"],
    kpis: ["Campaigns", "Drops", "Approvals"]
  },
  {
    roomId: "fiverr",
    backendSlug: "fiverr-services-room",
    displayName: "Fiverr / Services",
    commandRole: { name: "Admin", rank: "Master Sergeant", slug: "admin" },
    description: "Service offers, client workflows, consulting packages, and delivery tracking.",
    color: "#36C4FF",
    icon: "brief",
    upgrade: 1,
    activity: "Packaging offers",
    equipment: ["client-board", "offer-packages", "service-pipeline", "laptop-station"],
    kpis: ["Offers", "Clients", "Tasks"]
  },
  {
    roomId: "publish",
    backendSlug: "publish-dispatch-room",
    displayName: "Publish / Dispatch",
    commandRole: { name: "Dispatch", rank: "Master Sergeant", slug: "dispatch" },
    description: "Outbound publishing gate. Drafts wait here until explicit approval.",
    color: "#4AD88A",
    icon: "uplink",
    upgrade: 1,
    activity: "Holding drafts",
    equipment: ["publish-gate", "review-console", "broadcast-mast", "approval-lights"],
    kpis: ["Drafts", "Blocked", "Ready"]
  },
  {
    roomId: "life-admin",
    backendSlug: "life-admin-room",
    displayName: "Life Admin",
    commandRole: { name: "Admin", rank: "Master Sergeant", slug: "admin" },
    description: "Personal organization, reminders, bills, planning, and household systems.",
    color: "#FF9F7E",
    icon: "calendar",
    upgrade: 1,
    activity: "Planning week",
    equipment: ["calendar-wall", "filing-cabinet", "planner-desk", "paper-trays", "plant"],
    kpis: ["Plans", "Files", "Tasks"]
  },
  {
    roomId: "school-nursing",
    backendSlug: "school-nursing-room",
    displayName: "School / Nursing",
    commandRole: { name: "Scrubs", rank: "Master Sergeant", slug: "scrubs" },
    description: "Study, quizzes, school planning, nursing references, and submission gates.",
    color: "#A26BFF",
    icon: "medical",
    upgrade: 1,
    activity: "Study block",
    equipment: ["study-desk", "anatomy-chart", "bookshelf", "flashcard-wall"],
    kpis: ["Quizzes", "Notes", "Reviews"]
  },
  {
    roomId: "mess-hall",
    backendSlug: "mess-hall-break-room",
    displayName: "Mess Hall / Break Room",
    commandRole: { name: "Quartermaster", rank: "Specialist", slug: null },
    description: "Downtime and idle behavior space for workers between tasks.",
    color: "#FF88D4",
    icon: "coffee",
    upgrade: 1,
    activity: "Downtime",
    equipment: ["break-table", "coffee-station", "vending-machine", "soft-lamps", "plant"],
    kpis: ["Idle", "Breaks", "Morale"]
  },
  {
    roomId: "future",
    backendSlug: "future-projects-room",
    displayName: "Future Projects",
    commandRole: { name: "Expansion Lead", rank: "Specialist", slug: null },
    description: "Parking lot for future ideas, blueprint boards, crates, and expansion hooks.",
    color: "#B47CFF",
    icon: "cube",
    upgrade: 0,
    activity: "Reserved",
    equipment: ["empty-bay", "blueprint-board", "sealed-crate", "coming-soon-station"],
    kpis: ["Planned", "Hooks", "Empty"]
  },
  {
    roomId: "staging",
    backendSlug: "agent-staging-bay",
    displayName: "Agent Staging Bay",
    commandRole: { name: "QA", rank: "Staff Sergeant", slug: "qa" },
    description: "Generated agents wait here before approval and deployment.",
    color: "#FF7B45",
    icon: "staging",
    upgrade: 0,
    activity: "Awaiting approval",
    equipment: ["quarantine-pods", "caution-floor", "inactive-stations", "approval-terminal"],
    kpis: ["Staged", "Waiting", "Approvals"]
  },
  {
    roomId: "archive",
    backendSlug: "archive-logs-room",
    displayName: "Archive / Logs",
    commandRole: { name: "Chronicle", rank: "Master Sergeant", slug: "chronicle" },
    description: "Memory, logs, history, session summaries, and audit records.",
    color: "#8FD7FF",
    icon: "archive",
    upgrade: 0,
    activity: "Indexing logs",
    equipment: ["server-rack", "log-shelves", "archive-terminal", "file-cabinets"],
    kpis: ["Logs", "Files", "Events"]
  }
];

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusClass(value) {
  return String(value || "").toLowerCase();
}

function roomFor(module) {
  return state.rooms.find((room) => room.slug === module.backendSlug) || null;
}

function moduleAgents(module) {
  const room = roomFor(module);
  if (!room) return [];
  const explicit = new Set(room.agentIds || []);
  const projectAgents = new Set();
  state.projects.forEach((project) => {
    if ((project.assignedRoomIds || project.roomIds || []).includes(room.id)) {
      (project.assignedAgentIds || project.agentIds || []).forEach((agentId) => projectAgents.add(agentId));
    }
  });

  const fallback = {
    command: ["ranger"],
    research: ["nova"],
    forge: ["forge"],
    etsy: [],
    "gunpowder-pearls": [],
    fiverr: ["admin"],
    publish: ["dispatch"],
    "life-admin": ["admin"],
    "school-nursing": ["scrubs"],
    "mess-hall": [],
    future: [],
    staging: ["qa"],
    archive: ["chronicle"]
  };

  return state.agents.filter(
    (agent) => explicit.has(agent.id) || projectAgents.has(agent.id) || (fallback[module.roomId] || []).includes(agent.slug)
  );
}

function modulePersonnel(module, agents) {
  const commanderSlug = module.commandRole?.slug;
  const commanderAgent = commanderSlug ? agents.find((agent) => agent.slug === commanderSlug) : null;
  const commander = {
    name: commanderAgent?.name || module.commandRole?.name || "Room Lead",
    rank: module.commandRole?.rank || "Command Sergeant",
    slug: commanderSlug
  };

  const specialists = agents
    .filter((agent) => agent.slug !== commanderSlug && agent.slug !== "ranger")
    .map((agent) => ({
      name: agent.name,
      rank: agent.slug === "qa" ? "Staff Sergeant" : "Specialist",
      slug: agent.slug
    }));

  if (module.roomId === "command" && !specialists.some((person) => person.slug === "qa")) {
    const qa = state.agents.find((agent) => agent.slug === "qa");
    if (qa) specialists.push({ name: qa.name, rank: "Staff Sergeant", slug: "qa" });
  }

  if (module.roomId === "etsy") {
    specialists.push({ name: "Listing Operator", rank: "Specialist", slug: "listing-operator" });
  }
  if (module.roomId === "gunpowder-pearls") {
    specialists.push({ name: "Content Stylist", rank: "Specialist", slug: "content-stylist" });
  }
  if (module.roomId === "mess-hall") {
    specialists.push({ name: "Off-Duty Worker", rank: "Specialist", slug: "off-duty-worker" });
  }

  return [commander, ...specialists];
}

function moduleStatus(module) {
  if (module.locked) return "LOCKED";
  return roomFor(module)?.status || "STAGING";
}

function metricValue(module, metric, agents) {
  if (metric === "Approvals") return state.approvals.filter((approval) => approval.status === "PENDING").length;
  if (metric === "Active Rooms") return state.rooms.filter((room) => room.status === "ACTIVE").length;
  if (metric === "Staged") return state.agents.filter((agent) => agent.status === "STAGING").length;
  if (metric === "Blocked") return state.summary?.killSwitch?.active ? 1 : 0;
  if (metric === "Logs") return state.events.length;
  if (["Routes", "Sources", "Signals", "Briefs", "Builds", "Mockups", "QA", "Ideas", "Listings", "Offers", "Clients", "Campaigns", "Drops", "Plans", "Files", "Tasks", "Drafts", "Ready", "Quizzes", "Notes", "Reviews", "Idle", "Breaks", "Morale", "Planned", "Hooks"].includes(metric)) {
    return Math.max(agents.length, 1);
  }
  return module.locked ? "--" : agents.length;
}

function moduleProjects(module) {
  const room = roomFor(module);
  if (!room) return [];
  return state.projects.filter((project) =>
    (project.assignedRoomIds || project.roomIds || []).includes(room.id)
  );
}

function renderSummary() {
  const summary = state.summary;
  if (!summary) return;

  $("#systemMode").textContent = summary.system;
  $("#systemMode").className = `hud-chip ${summary.system === "SAFE_MODE" ? "alert" : "ok"}`;
  $("#approvalMode").textContent = `${summary.counts.pendingApprovals} approvals`;
  $("#approvalMode").className = `hud-chip ${summary.counts.pendingApprovals ? "warn" : "ok"}`;
  $("#killBanner").hidden = !summary.killSwitch.active;
  $("#killReason").textContent = summary.killSwitch.reason || "Kill switch active.";
}

function renderOpenClaw() {
  const data = state.openclaw || {};
  const controlled = data.controlledContainer || {};
  const gateway = data.gateway || {};
  const dockerOk = controlled.running && controlled.healthy === "healthy";

  $("#openclawMode").textContent = gateway.reachable ? "OpenClaw online" : "OpenClaw offline";
  $("#openclawMode").className = `hud-chip ${gateway.reachable ? "ok" : "warn"}`;
  $("#dockerMode").textContent = dockerOk ? "Docker healthy" : "Docker check";
  $("#dockerMode").className = `hud-chip ${dockerOk ? "ok" : "warn"}`;
  $("#openclawStatus").textContent = `${gateway.reachable ? "reachable" : "offline"} / ${controlled.healthy || "unknown"}`;
}

function iconFor(type) {
  const icons = {
    shield: ["polygon(50% 5%, 86% 18%, 78% 72%, 50% 94%, 22% 72%, 14% 18%)", "R"],
    scope: ["circle(50% 50% at 50% 50%)", "+"],
    tools: ["polygon(15% 25%, 30% 10%, 90% 70%, 75% 90%)", ""],
    store: ["polygon(15% 25%, 85% 25%, 78% 88%, 22% 88%)", "E"],
    brief: ["polygon(18% 28%, 82% 28%, 82% 82%, 18% 82%)", "fi"],
    uplink: ["polygon(50% 10%, 86% 82%, 14% 82%)", ""],
    cube: ["polygon(50% 8%, 86% 28%, 86% 72%, 50% 92%, 14% 72%, 14% 28%)", ""],
    sparkle: ["polygon(50% 2%, 62% 34%, 96% 50%, 62% 66%, 50% 98%, 38% 66%, 4% 50%, 38% 34%)", ""],
    calendar: ["polygon(16% 20%, 84% 20%, 84% 88%, 16% 88%)", ""],
    medical: ["polygon(38% 12%, 62% 12%, 62% 38%, 88% 38%, 88% 62%, 62% 62%, 62% 88%, 38% 88%, 38% 62%, 12% 62%, 12% 38%, 38% 38%)", ""],
    coffee: ["polygon(18% 28%, 70% 28%, 70% 76%, 18% 76%)", ""],
    staging: ["polygon(16% 18%, 84% 18%, 84% 84%, 16% 84%)", ""],
    archive: ["polygon(18% 18%, 82% 18%, 82% 82%, 18% 82%)", ""],
    lock: ["polygon(24% 42%, 76% 42%, 76% 88%, 24% 88%)", ""]
  };
  return icons[type] || icons.cube;
}

function renderEquipment(module) {
  return (module.equipment || [])
    .map((item, index) => `<span class="equipment mini-prop ${item}" data-slot="${index}"></span>`)
    .join("");
}

function rankClass(rank) {
  if (rank.includes("HQ")) return "hq-command";
  if (rank.includes("Master")) return "master-sergeant";
  if (rank.includes("Staff")) return "staff-sergeant";
  return "specialist";
}

function renderWorkers(personnel) {
  return personnel
    .slice(0, 4)
    .map((person, index) => {
      const left = 17 + index * 21;
      return `
        <span class="worker route-${index % 4} ${rankClass(person.rank)}" style="left:${left}%;animation-delay:${index * 0.42}s;" title="${escapeHtml(`${person.rank} ${person.name}`)}">
          <i class="worker-head"></i>
          <i class="worker-body"></i>
          <b>${escapeHtml(person.name.slice(0, 1))}</b>
        </span>
      `;
    })
    .join("");
}

function renderUpgradePips(level) {
  return Array.from({ length: 3 })
    .map((_, index) => `<i class="${index < level ? "filled" : ""}"></i>`)
    .join("");
}

function renderProjectPanel(projects, personnel) {
  const project = projects[0];
  if (!project) {
    return `
      <aside class="zoom-project-panel">
        <p class="eyebrow">Project Binding</p>
        <h3>Ready for Project</h3>
        <span class="project-note">This room is prepared for a live project module.</span>
      </aside>
    `;
  }

  const workflows = (project.workflows || []).slice(0, 5).map((workflow) => `<li>${escapeHtml(workflow.replaceAll("_", " "))}</li>`).join("");
  const agentList = personnel.slice(0, 5).map((person) => `<li>${escapeHtml(person.name)} <em>${escapeHtml(person.rank)}</em></li>`).join("");
  const linkedPaths = (project.linkedLocalPaths || []).length ? project.linkedLocalPaths.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("") : "<li>local paths not linked yet</li>";

  return `
    <aside class="zoom-project-panel">
      <p class="eyebrow">Project Module / ${escapeHtml(project.status || "LOCAL")}</p>
      <h3>${escapeHtml(project.name)}</h3>
      <span class="project-type">${escapeHtml(project.type || "general")}</span>
      <p>${escapeHtml(project.notes || project.description || "Local project state prepared for this room.")}</p>
      <div class="project-panel-grid">
        <section>
          <strong>Workflows</strong>
          <ul>${workflows || "<li>workflow slots ready</li>"}</ul>
        </section>
        <section>
          <strong>Assigned Agents</strong>
          <ul>${agentList || "<li>no visible agents assigned</li>"}</ul>
        </section>
        <section>
          <strong>Linked Files</strong>
          <ul>${linkedPaths}</ul>
        </section>
      </div>
    </aside>
  `;
}

function renderRooms() {
  $("#rooms").innerHTML = baseModules
    .map((module, index) => {
      const status = moduleStatus(module);
      const agents = moduleAgents(module);
      const personnel = modulePersonnel(module, agents);
      const projects = moduleProjects(module);
      const [clip, text] = iconFor(module.icon);
      const kpis = module.kpis
        .map(
          (metric) => `
            <span>
              <strong>${escapeHtml(metricValue(module, metric, agents))}</strong>
              <em>${escapeHtml(metric)}</em>
            </span>
          `
        )
        .join("");
      const commander = personnel[0];

      return `
        <article
          class="module-room ${statusClass(status)}"
          data-module-index="${index}"
          data-room-id="${escapeHtml(module.roomId)}"
          style="--room-color:${module.color};"
          tabindex="0"
        >
          <div class="neon-frame"></div>
          <div class="module-label">
            <div>
              <h2>${escapeHtml(module.displayName)}</h2>
              <p>${escapeHtml(status)}</p>
            </div>
            <span class="upgrade-pips" title="Room upgrade level">${renderUpgradePips(module.upgrade || 0)}</span>
          </div>
          <div class="factory-room-map">
            <span class="map-light"></span>
            <span class="map-icon" style="clip-path:${clip};">${escapeHtml(text)}</span>
            ${renderEquipment(module)}
            <span class="door-label north"></span>
            <span class="door-label south"></span>
            <span class="door-sign">${escapeHtml(module.displayName)}</span>
            <span class="door-status ${statusClass(status)}"></span>
            <span class="room-door left"></span>
            <span class="room-door right"></span>
            <span class="room-door top"></span>
            <span class="room-door bottom"></span>
            ${renderWorkers(personnel)}
          </div>
          <div class="chain-label">
            <strong>${escapeHtml(commander.rank)}</strong>
            <span>${escapeHtml(commander.name)}</span>
          </div>
          <div class="project-zone">
            <strong>${escapeHtml(projects[0]?.name || "No live project")}</strong>
            <span>${escapeHtml(projects[0]?.type || module.activity)}</span>
          </div>
          <div class="kpi-row">${kpis}</div>
        </article>
      `;
    })
    .join("");
}

function renderZoomRoom() {
  const overlay = $("#zoomRoom");
  if (state.zoomModuleIndex === null) {
    overlay.hidden = true;
    return;
  }

  const module = baseModules[state.zoomModuleIndex];
  const room = roomFor(module);
  const status = moduleStatus(module);
  const agents = moduleAgents(module);
  const personnel = modulePersonnel(module, agents);
  const projects = moduleProjects(module);
  const [clip, text] = iconFor(module.icon);

  overlay.hidden = false;
  overlay.style.setProperty("--room-color", module.color);
  $("#zoomRoomScene").innerHTML = `
    <div class="zoom-backdrop"></div>
    <div class="zoom-header">
      <div class="room-icon" style="clip-path:${clip};">${escapeHtml(text)}</div>
      <div>
        <p class="eyebrow">Zoom View / ${escapeHtml(status)}</p>
        <h2>${escapeHtml(module.displayName)}</h2>
        <span>${escapeHtml(room?.purpose || module.description)}</span>
      </div>
    </div>
    <div class="zoom-depth">
      <div class="zoom-wall">
        ${renderEquipment(module)}
        <span class="zoom-glow"></span>
      </div>
      <div class="zoom-midground">
        <span class="station main-station"></span>
        <span class="station side-station"></span>
        <span class="station storage-station"></span>
      </div>
      <div class="zoom-floor">
        ${personnel
          .map(
            (person, index) => `
              <span class="zoom-worker route-${index % 4} ${rankClass(person.rank)}" style="left:${18 + index * 18}%;animation-delay:${index * 0.35}s;">
                <i class="worker-head"></i>
                <i class="worker-body"></i>
                <b>${escapeHtml(person.name)}</b>
                <em>${escapeHtml(person.rank)}</em>
              </span>
            `
          )
          .join("")}
      </div>
    </div>
    <div class="zoom-status">
      <span><strong>${escapeHtml(module.activity)}</strong><em>Current activity</em></span>
      <span><strong>${personnel.length}</strong><em>Visible workers</em></span>
      <span><strong>${escapeHtml(projects[0]?.name || "Ready for project")}</strong><em>Project module</em></span>
    </div>
    ${renderProjectPanel(projects, personnel)}
  `;
}

function showHover(moduleIndex, target) {
  const module = baseModules[moduleIndex];
  const room = roomFor(module);
  const status = moduleStatus(module);
  const agents = moduleAgents(module);
  const personnel = modulePersonnel(module, agents);
  const hud = $("#roomHoverHud");
  const rect = target.getBoundingClientRect();
  const stageRect = $(".base-stage").getBoundingClientRect();

  $("#hoverTitle").textContent = module.displayName;
  $("#hoverInfo").textContent = `${status} / ${personnel[0].rank}: ${personnel[0].name} / ${personnel.length - 1} specialists / ${room?.purpose || module.description}`;
  hud.style.setProperty("--room-color", module.color);
  hud.style.left = `${rect.left - stageRect.left + rect.width / 2}px`;
  hud.style.top = `${rect.top - stageRect.top + 16}px`;
  hud.hidden = false;
}

function hideHover() {
  $("#roomHoverHud").hidden = true;
}

function renderApprovals() {
  $("#approvals").textContent = state.approvals.map((approval) => approval.title).join(" | ");
}

function renderEvents() {
  $("#events").innerHTML = state.events
    .slice(0, 14)
    .map((event) => `<span><strong>${escapeHtml(event.type)}</strong> ${escapeHtml(event.message)}</span>`)
    .join("");
}

function renderProjects() {
  $("#projects").textContent = state.projects.map((project) => project.name).join(", ");
}

function renderAgents() {
  $("#agents").textContent = state.agents.map((agent) => agent.name).join(", ");
}

function render() {
  renderSummary();
  renderOpenClaw();
  renderRooms();
  renderZoomRoom();
  renderApprovals();
  renderEvents();
  renderProjects();
  renderAgents();
}

async function load() {
  const [summary, rooms, projects, agents, approvals, events, openclaw] = await Promise.all([
    api("/summary"),
    api("/rooms"),
    api("/projects"),
    api("/agents"),
    api("/approvals"),
    api("/events"),
    api("/openclaw/status")
  ]);
  Object.assign(state, { summary, rooms, projects, agents, approvals, events, openclaw });
  render();
}

async function postForm(form, path, mapper) {
  const data = Object.fromEntries(new FormData(form));
  await api(path, { method: "POST", body: JSON.stringify(mapper(data)) });
  form.reset();
  await load();
}

$("#roomForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await postForm(event.currentTarget, "/rooms", (data) => ({
    name: data.name,
    purpose: "New room. Configure scope, policy, and approval path before live use."
  }));
});

$("#projectForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await postForm(event.currentTarget, "/projects", (data) => ({
    name: data.name,
    description: "New project module. Attach rooms, agents, workflows, permissions, and logs."
  }));
});

$("#agentForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await postForm(event.currentTarget, "/agents/stage", (data) => ({
    name: data.name,
    role: data.role,
    spec: { source: "Agent Staging Bay", liveWorkflows: false, externalTools: false }
  }));
});

$("#ideaForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await postForm(event.currentTarget, "/workflow/research-idea", (data) => ({ idea: data.idea }));
});

$("#triggerKill").addEventListener("click", async () => {
  await api("/kill-switch", {
    method: "POST",
    body: JSON.stringify({ active: true, reason: "Manual trigger from Command HUD" })
  });
  await load();
});

$("#clearKill").addEventListener("click", async () => {
  await api("/kill-switch", {
    method: "POST",
    body: JSON.stringify({ active: false, reason: "Manual clear from Command HUD" })
  });
  await load();
});

$("#launchOpenClaw").addEventListener("click", async () => {
  await api("/openclaw/launch", { method: "POST", body: "{}" });
  await load();
});

$("#stopOpenClaw").addEventListener("click", async () => {
  await api("/openclaw/stop", { method: "POST", body: "{}" });
  await load();
});

document.addEventListener("pointerover", (event) => {
  const room = event.target.closest("[data-module-index]");
  if (!room) return;
  showHover(Number(room.dataset.moduleIndex), room);
});

document.addEventListener("click", (event) => {
  const room = event.target.closest("[data-module-index]");
  if (!room) return;
  state.zoomModuleIndex = Number(room.dataset.moduleIndex);
  hideHover();
  renderZoomRoom();
});

$("#zoomClose").addEventListener("click", () => {
  state.zoomModuleIndex = null;
  renderZoomRoom();
});

document.addEventListener("pointerout", (event) => {
  if (event.target.closest("[data-module-index]")) hideHover();
});

document.addEventListener("focusin", (event) => {
  const room = event.target.closest("[data-module-index]");
  if (!room) return;
  showHover(Number(room.dataset.moduleIndex), room);
});

document.addEventListener("focusout", (event) => {
  if (event.target.closest("[data-module-index]")) hideHover();
});

load().catch((error) => {
  document.body.insertAdjacentHTML("afterbegin", `<div class="kill-banner"><strong>API Error</strong><span>${escapeHtml(error.message)}</span></div>`);
});
