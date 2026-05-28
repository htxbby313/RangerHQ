const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const openclaw = require("./openclaw");

const PORT = Number(process.env.RANGER_HQ_PORT || 4147);
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "ranger-hq.local.json");
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

const ROOM_STATUSES = new Set(["ACTIVE", "PAUSED", "ARCHIVED", "SHUT_DOWN", "STAGING"]);
const APPROVAL_STATUSES = new Set(["PENDING", "APPROVED", "REJECTED", "ITERATE"]);

const ROOM_SEEDS = [
  ["command-room", "Command Room", "ACTIVE", "Central command, approvals, kill switch, project routing, and events.", "bright command center with warm orange light, wall monitors, routing boards, and approval console"],
  ["research-war-room", "Research / War Room", "ACTIVE", "Research, trend scans, competitor analysis, information gathering, and strategy.", "focused research room with maps, data boards, pinned research, terminals, and archive shelves"],
  ["creative-studio", "Forge / Creative Studio", "ACTIVE", "Design generation and creative production.", "colorful creative studio with drafting tables, design monitors, garment racks, swatches, plants, and print props"],
  ["shuqualak-store-room", "Etsy / Shuqualak Store Room", "ACTIVE", "Etsy product workflow and POD operations for Shuqualak Store.", "southern outdoors retail operations room with product shelves, packing table, listing board, shipping boxes, and POD station"],
  ["gunpowder-pearls-room", "Gunpowder & Pearls Room", "PAUSED", "Brand strategy, fashion drops, content, and campaigns.", "western glam operations room with boutique racks, hot pink and turquoise accents, pearl details, campaign board, and photo corner"],
  ["fiverr-services-room", "Fiverr / Services Room", "PAUSED", "Service offers, client workflows, consulting projects, and delivery tracking.", "small agency operations room with client board, offer packages, laptop stations, document stacks, and service pipeline"],
  ["publish-dispatch-room", "Publish / Dispatch Room", "PAUSED", "Final approval and controlled external publishing.", "controlled dispatch room with outgoing queue, approval lights, locked publish terminal, and launch console"],
  ["life-admin-room", "Life Admin Room", "PAUSED", "Personal organization, reminders, bills, planning, and household systems.", "warm organized planning room with calendar wall, filing cabinets, planner desk, paperwork trays, plants, and cozy lamp lighting"],
  ["school-nursing-room", "School / Nursing Room", "PAUSED", "Study, quizzes, school planning, nursing references, and submission gates.", "warm academic study room with desk, anatomy charts, bookshelves, whiteboard, flashcards, and nursing references"],
  ["mess-hall-break-room", "Mess Hall / Break Room", "ACTIVE", "Downtime and idle behavior space for workers between tasks.", "relaxed bright break room with tables, chairs, coffee station, vending, plants, and soft lighting"],
  ["future-projects-room", "Future Projects Room", "STAGING", "Parking lot for future ideas and upcoming modules.", "expansion room with blueprint boards, crates, empty workstations, coming-soon stations, and visible growth hooks"],
  ["agent-staging-bay", "Agent Staging Bay", "STAGING", "Generated agents wait here before approval and deployment.", "game-like unit deployment bay with inactive pods, construction crates, quarantine staging, approval terminals, and caution lighting"],
  ["archive-logs-room", "Archive / Logs Room", "ACTIVE", "Memory, logs, history, session summaries, and audit records.", "quiet secure archive with shelves, file cabinets, server racks, record terminals, and document storage"]
];

const PROJECT_SEEDS = [
  {
    slug: "shuqualak-store",
    name: "Shuqualak Store",
    type: "commerce",
    status: "ACTIVE",
    roomSlugs: ["shuqualak-store-room", "creative-studio", "research-war-room", "publish-dispatch-room"],
    agentSlugs: ["ranger", "nova", "forge", "dispatch", "qa"],
    workflows: ["trend_scan", "product_concept", "mockup_generation", "listing_draft", "approval_gate"],
    notes: "Etsy/POD project module for product research, concept drafting, QA, and approved publishing."
  },
  {
    slug: "gunpowder-pearls",
    name: "Gunpowder & Pearls",
    type: "brand",
    status: "PAUSED",
    roomSlugs: ["gunpowder-pearls-room", "creative-studio", "publish-dispatch-room"],
    agentSlugs: ["ranger", "forge", "dispatch", "qa"],
    workflows: ["campaign_planning", "drop_concepts", "content_calendar", "approval_gate"],
    notes: "Western glam brand strategy, campaign, and content module."
  },
  {
    slug: "fiverr-services",
    name: "Fiverr / Services",
    type: "services",
    status: "PAUSED",
    roomSlugs: ["fiverr-services-room", "research-war-room", "publish-dispatch-room"],
    agentSlugs: ["ranger", "admin", "nova", "qa"],
    workflows: ["offer_packaging", "client_brief", "delivery_queue", "approval_gate"],
    notes: "Service offers, consulting packages, client workflows, and delivery tracking."
  },
  {
    slug: "school-nursing",
    name: "School / Nursing",
    type: "education",
    status: "PAUSED",
    roomSlugs: ["school-nursing-room", "research-war-room"],
    agentSlugs: ["ranger", "scrubs", "nova", "qa"],
    workflows: ["study_plan", "quiz_review", "flashcards", "submission_gate"],
    notes: "Study support and nursing/school planning with hard approval gates for submissions."
  },
  {
    slug: "life-admin",
    name: "Life Admin",
    type: "personal_ops",
    status: "PAUSED",
    roomSlugs: ["life-admin-room"],
    agentSlugs: ["ranger", "admin", "qa"],
    workflows: ["calendar_review", "paperwork_queue", "reminders", "approval_gate"],
    notes: "Personal planning, household systems, reminders, paperwork, and organization."
  },
  {
    slug: "future-projects",
    name: "Future Projects",
    type: "parking_lot",
    status: "STAGING",
    roomSlugs: ["future-projects-room"],
    agentSlugs: ["ranger", "chronicle"],
    workflows: ["idea_capture", "project_scoping", "room_planning"],
    notes: "Expansion parking lot for future modules and upcoming workflows."
  }
];

const ROOM_SCENE = {
  "command-room": {
    type: "command",
    colorTheme: "#FF8A4A",
    furniture: ["command-desk", "wall-screens", "approval-console", "routing-board", "operations-map"],
    connectedSlugs: ["research-war-room", "creative-studio", "mess-hall-break-room"],
    doorPositions: [{ side: "south", x: 0.5 }, { side: "east", y: 0.5 }],
    hallwayConnections: ["main-hall", "east-operations-corridor"],
    zoomConfig: { cameraTarget: "command-center", perspective: "2.5d", lighting: "warm command glow" }
  },
  "research-war-room": {
    type: "research",
    colorTheme: "#F35DB4",
    furniture: ["data-boards", "maps", "radar-table", "archive-shelves", "pinned-research"],
    connectedSlugs: ["command-room", "creative-studio", "fiverr-services-room", "school-nursing-room"],
    doorPositions: [{ side: "west", y: 0.5 }, { side: "east", y: 0.5 }, { side: "south", x: 0.5 }],
    hallwayConnections: ["main-hall", "research-spur"],
    zoomConfig: { cameraTarget: "research-table", perspective: "2.5d", lighting: "focused magenta monitor glow" }
  },
  "creative-studio": {
    type: "creative",
    colorTheme: "#8D67FF",
    furniture: ["drafting-tables", "mockup-boards", "design-monitors", "garment-racks", "swatches", "plants"],
    connectedSlugs: ["command-room", "research-war-room", "shuqualak-store-room", "gunpowder-pearls-room"],
    doorPositions: [{ side: "west", y: 0.5 }, { side: "south", x: 0.5 }],
    hallwayConnections: ["creative-spine", "main-hall"],
    zoomConfig: { cameraTarget: "drafting-floor", perspective: "2.5d", lighting: "bright purple studio light" }
  },
  "shuqualak-store-room": {
    type: "commerce",
    colorTheme: "#FFC44D",
    furniture: ["product-shelves", "packing-table", "mockup-wall", "shipping-boxes", "listing-board", "pod-station"],
    connectedSlugs: ["creative-studio", "publish-dispatch-room", "mess-hall-break-room"],
    doorPositions: [{ side: "north", x: 0.5 }, { side: "east", y: 0.5 }],
    hallwayConnections: ["commerce-corridor"],
    zoomConfig: { cameraTarget: "packing-table", perspective: "2.5d", lighting: "warm retail work light" }
  },
  "gunpowder-pearls-room": {
    type: "brand",
    colorTheme: "#FF6FB5",
    furniture: ["boutique-racks", "campaign-board", "outfit-planning", "photo-corner", "pearl-table"],
    connectedSlugs: ["creative-studio", "publish-dispatch-room"],
    doorPositions: [{ side: "north", x: 0.5 }, { side: "east", y: 0.5 }],
    hallwayConnections: ["brand-corridor"],
    zoomConfig: { cameraTarget: "campaign-board", perspective: "2.5d", lighting: "hot pink western glam" }
  },
  "fiverr-services-room": {
    type: "services",
    colorTheme: "#36C4FF",
    furniture: ["client-board", "offer-packages", "service-pipeline", "laptop-stations", "document-stacks"],
    connectedSlugs: ["research-war-room", "publish-dispatch-room"],
    doorPositions: [{ side: "north", x: 0.5 }, { side: "east", y: 0.5 }],
    hallwayConnections: ["services-corridor"],
    zoomConfig: { cameraTarget: "client-board", perspective: "2.5d", lighting: "clean teal agency light" }
  },
  "publish-dispatch-room": {
    type: "dispatch",
    colorTheme: "#4AD88A",
    furniture: ["outgoing-queue", "approval-lights", "launch-console", "locked-publish-terminal", "warning-indicators"],
    connectedSlugs: ["shuqualak-store-room", "gunpowder-pearls-room", "fiverr-services-room", "archive-logs-room"],
    doorPositions: [{ side: "west", y: 0.5 }, { side: "south", x: 0.5 }],
    hallwayConnections: ["dispatch-corridor"],
    zoomConfig: { cameraTarget: "locked-terminal", perspective: "2.5d", lighting: "green approval gate glow" }
  },
  "life-admin-room": {
    type: "personal_ops",
    colorTheme: "#FF9F7E",
    furniture: ["calendar-wall", "filing-cabinets", "planner-desk", "sticky-notes", "paperwork-trays", "plants"],
    connectedSlugs: ["mess-hall-break-room", "school-nursing-room"],
    doorPositions: [{ side: "north", x: 0.5 }],
    hallwayConnections: ["human-ops-hall"],
    zoomConfig: { cameraTarget: "planner-desk", perspective: "2.5d", lighting: "cozy lamp light" }
  },
  "school-nursing-room": {
    type: "education",
    colorTheme: "#A26BFF",
    furniture: ["study-desk", "anatomy-charts", "bookshelves", "whiteboard", "flashcard-wall", "nursing-references"],
    connectedSlugs: ["research-war-room", "life-admin-room"],
    doorPositions: [{ side: "north", x: 0.5 }, { side: "west", y: 0.5 }],
    hallwayConnections: ["human-ops-hall"],
    zoomConfig: { cameraTarget: "study-desk", perspective: "2.5d", lighting: "warm academic light" }
  },
  "mess-hall-break-room": {
    type: "break_room",
    colorTheme: "#FF88D4",
    furniture: ["tables", "chairs", "coffee-station", "vending", "plants", "soft-lighting"],
    connectedSlugs: ["command-room", "shuqualak-store-room", "life-admin-room", "future-projects-room"],
    doorPositions: [{ side: "north", x: 0.5 }, { side: "east", y: 0.5 }],
    hallwayConnections: ["main-hall", "breakroom-loop"],
    zoomConfig: { cameraTarget: "coffee-station", perspective: "2.5d", lighting: "soft downtime glow" }
  },
  "future-projects-room": {
    type: "parking_lot",
    colorTheme: "#B47CFF",
    furniture: ["empty-workstations", "blueprint-boards", "crates", "coming-soon-stations", "expansion-hooks"],
    connectedSlugs: ["mess-hall-break-room", "agent-staging-bay"],
    doorPositions: [{ side: "north", x: 0.5 }, { side: "east", y: 0.5 }],
    hallwayConnections: ["expansion-hall"],
    zoomConfig: { cameraTarget: "blueprint-board", perspective: "2.5d", lighting: "violet expansion glow" }
  },
  "agent-staging-bay": {
    type: "staging",
    colorTheme: "#FF7B45",
    furniture: ["inactive-pods", "construction-crates", "quarantine-staging", "approval-terminals", "caution-lights"],
    connectedSlugs: ["future-projects-room", "archive-logs-room"],
    doorPositions: [{ side: "west", y: 0.5 }, { side: "east", y: 0.5 }],
    hallwayConnections: ["security-hall", "expansion-hall"],
    zoomConfig: { cameraTarget: "approval-pods", perspective: "2.5d", lighting: "amber staging caution" }
  },
  "archive-logs-room": {
    type: "archive",
    colorTheme: "#8FD7FF",
    furniture: ["archive-shelves", "file-cabinets", "server-racks", "record-terminals", "document-storage"],
    connectedSlugs: ["publish-dispatch-room", "agent-staging-bay"],
    doorPositions: [{ side: "west", y: 0.5 }],
    hallwayConnections: ["security-hall", "dispatch-corridor"],
    zoomConfig: { cameraTarget: "record-terminal", perspective: "2.5d", lighting: "quiet secure blue" }
  }
};

const AGENT_HOME = {
  ranger: "command-room",
  nova: "research-war-room",
  forge: "creative-studio",
  chronicle: "archive-logs-room",
  dispatch: "publish-dispatch-room",
  scrubs: "school-nursing-room",
  admin: "life-admin-room",
  qa: "agent-staging-bay"
};

const AGENT_LIVE_TASKS = {
  ranger: ["task-ranger-command", "Route incoming work and review approval gates", "orchestrating"],
  nova: ["task-nova-research", "Build structured briefs from live workflow requests", "researching"],
  forge: ["task-forge-build", "Produce assets from approved research briefs", "building"],
  chronicle: ["task-chronicle-logs", "Capture logs, memory, and session summaries", "recording"],
  dispatch: ["task-dispatch-publish", "Prepare approved work for controlled publishing", "scheduling"],
  scrubs: ["task-scrubs-study", "Prepare school and nursing study support", "reviewing"],
  admin: ["task-admin-life", "Organize life admin queues and reminders", "planning"],
  qa: ["task-qa-review", "Review staged work before approval", "checking"]
};

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function now() {
  return new Date().toISOString();
}

function liveTaskForAgent(slug, status) {
  const [taskId, taskLabel, phase] = AGENT_LIVE_TASKS[slug] || [`task-${slug}`, "Awaiting backend workflow assignment", "queued"];
  return {
    currentTaskId: taskId,
    currentTaskLabel: status === "ACTIVE" ? taskLabel : "Awaiting activation approval",
    currentPhase: status === "ACTIVE" ? phase : "awaiting_activation"
  };
}

function defaultState() {
  const rooms = ROOM_SEEDS.map(([slug, name, status, purpose, visualTheme]) => ({
    id: id("room"),
    slug,
    name,
    status,
    purpose,
    visualTheme,
    ...roomSceneDefaults(slug, [], [], []),
    createdAt: now(),
    updatedAt: now()
  }));

  const agents = [
    ["ranger", "Ranger", "ACTIVE", "Main command agent and trusted co-pilot"],
    ["nova", "Nova", "STAGING", "Research and ideation support"],
    ["forge", "Forge", "STAGING", "Builder agent"],
    ["chronicle", "Chronicle", "STAGING", "Logs, memory, and session summaries"],
    ["dispatch", "Dispatch", "STAGING", "Outbound drafts only"],
    ["scrubs", "Scrubs", "STAGING", "School and nursing support"],
    ["admin", "Admin", "STAGING", "Life admin support"],
    ["qa", "QA", "ACTIVE", "Reviewer and quality gate"]
  ].map(([slug, name, status, role]) => {
    const liveTask = liveTaskForAgent(slug, status);
    return {
      id: id("agent"),
      slug,
      name,
      status,
      role,
      authority: {
        mayDraft: ["agent_specs", "room_configs", "workflow_configs", "tool_policies", "prompt_templates", "json_schemas", "container_configs"],
        mayNot: ["activate_agents", "grant_permissions", "connect_external_apis", "publish_send_buy_delete", "bypass_staging_review"]
      },
      currentRoomId: rooms.find((room) => room.slug === AGENT_HOME[slug])?.id || null,
      assignedProjectIds: [],
      currentTask: liveTask.currentTaskLabel,
      ...liveTask,
      state: status === "ACTIVE" ? "working" : "idle",
      movementState: status === "ACTIVE" ? "working" : "idle",
      anchorId: `${AGENT_HOME[slug] || "room"}_anchor_1`,
      lastEventAt: now(),
      createdAt: now(),
      updatedAt: now()
    };
  });

  const projects = PROJECT_SEEDS.map((project) => ({
      id: id("project"),
      slug: project.slug,
      name: project.name,
      type: project.type,
      status: project.status,
      description: project.notes,
      assignedRoomIds: rooms.filter((room) => project.roomSlugs.includes(room.slug)).map((room) => room.id),
      assignedAgentIds: agents.filter((agent) => project.agentSlugs.includes(agent.slug)).map((agent) => agent.id),
      roomIds: rooms.filter((room) => project.roomSlugs.includes(room.slug)).map((room) => room.id),
      agentIds: agents.filter((agent) => project.agentSlugs.includes(agent.slug)).map((agent) => agent.id),
      workflows: project.workflows,
      linkedLocalPaths: [],
      integrations: [],
      approvals: [],
      events: [],
      notes: project.notes,
      createdAt: now(),
      updatedAt: now()
  }));

  hydrateSceneBindings({ rooms, agents, projects });

  return {
    meta: { version: 1, createdAt: now(), updatedAt: now() },
    killSwitch: { active: false, mode: "NORMAL", reason: "", updatedAt: now() },
    rooms,
    projects,
    agents,
    approvals: [],
    events: [
      event("system_initialized", "Ranger HQ local MVP initialized.", "INFO"),
      event("external_action_blocked", "External actions are blocked by default.", "WARN")
    ],
    tasks: []
  };
}

function event(type, message, severity = "INFO", payload = {}) {
  return { id: id("evt"), type, message, severity, payload, createdAt: now() };
}

function readState() {
  if (!fs.existsSync(DATA_FILE)) {
    const state = defaultState();
    writeState(state);
    return state;
  }

  const state = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  if (ensureStateShape(state)) writeState(state);
  return state;
}

function roomSceneDefaults(slug, connectedRoomIds = [], agents = [], projectIds = []) {
  const scene = ROOM_SCENE[slug] || {};
  return {
    type: scene.type || "general",
    connectedRoomIds,
    doorPositions: scene.doorPositions || [],
    hallwayConnections: scene.hallwayConnections || [],
    furniture: scene.furniture || [],
    agents,
    projectIds,
    colorTheme: scene.colorTheme || "#8D67FF",
    zoomConfig: scene.zoomConfig || { cameraTarget: "room-center", perspective: "2.5d", lighting: "warm operational glow" }
  };
}

function hydrateSceneBindings(state) {
  const roomBySlug = new Map(state.rooms.map((room) => [room.slug, room]));
  const projectsByRoomId = new Map();
  const agentsByRoomId = new Map();
  state.projects.forEach((project) => {
    (project.assignedRoomIds || project.roomIds || []).forEach((roomId) => {
      if (!projectsByRoomId.has(roomId)) projectsByRoomId.set(roomId, []);
      projectsByRoomId.get(roomId).push(project.id);
    });
  });

  state.agents.forEach((agent) => {
    const homeSlug = AGENT_HOME[agent.slug];
    const homeRoomId = homeSlug ? roomBySlug.get(homeSlug)?.id : null;
    const liveTask = liveTaskForAgent(agent.slug, agent.status);
    agent.currentRoomId ||= homeRoomId || null;
    agent.assignedProjectIds ||= state.projects
      .filter((project) => (project.assignedAgentIds || project.agentIds || []).includes(agent.id))
      .map((project) => project.id);
    agent.currentTaskId ||= liveTask.currentTaskId;
    agent.currentTaskLabel ||= liveTask.currentTaskLabel;
    agent.currentPhase ||= liveTask.currentPhase;
    agent.currentTask ||= agent.currentTaskLabel;
    agent.state ||= agent.status === "ACTIVE" ? "working" : "idle";
    agent.movementState ||= agent.status === "ACTIVE" ? "working" : "idle";
    agent.anchorId ||= `${homeSlug || "room"}_anchor_1`;
    agent.lastEventAt ||= now();
    if (agent.currentRoomId) {
      if (!agentsByRoomId.has(agent.currentRoomId)) agentsByRoomId.set(agent.currentRoomId, []);
      agentsByRoomId.get(agent.currentRoomId).push(agent.id);
    }
  });

  state.rooms.forEach((room) => {
    const scene = ROOM_SCENE[room.slug] || {};
    const connectedRoomIds = (scene.connectedSlugs || [])
      .map((slug) => roomBySlug.get(slug)?.id)
      .filter(Boolean);
    Object.assign(room, roomSceneDefaults(room.slug, connectedRoomIds, agentsByRoomId.get(room.id) || [], projectsByRoomId.get(room.id) || []));
  });
}

function ensureStateShape(state) {
  let changed = false;
  state.meta ||= { version: 1, createdAt: now(), updatedAt: now() };
  state.rooms ||= [];
  state.projects ||= [];
  state.agents ||= [];
  state.approvals ||= [];
  state.events ||= [];
  state.tasks ||= [];

  ROOM_SEEDS.forEach(([slug, name, status, purpose, visualTheme]) => {
    let room = state.rooms.find((item) => item.slug === slug);
    if (!room) {
      room = { id: id("room"), slug, name, status, purpose, visualTheme, createdAt: now(), updatedAt: now() };
      state.rooms.push(room);
      changed = true;
      return;
    }
    ["name", "purpose"].forEach((key) => {
      const value = { name, purpose }[key];
      if (!room[key]) {
        room[key] = value;
        changed = true;
      }
    });
    if (!room.visualTheme || room.visualTheme === "dark command space, industrial warehouse HQ, grounded southern operations") {
      room.visualTheme = visualTheme;
      changed = true;
    }
  });

  PROJECT_SEEDS.forEach((seed) => {
    let project = state.projects.find((item) => item.slug === seed.slug);
    const assignedRoomIds = state.rooms.filter((room) => seed.roomSlugs.includes(room.slug)).map((room) => room.id);
    const assignedAgentIds = state.agents.filter((agent) => seed.agentSlugs.includes(agent.slug)).map((agent) => agent.id);
    if (!project) {
      project = {
        id: id("project"),
        slug: seed.slug,
        name: seed.name,
        type: seed.type,
        status: seed.status,
        description: seed.notes,
        assignedRoomIds,
        assignedAgentIds,
        roomIds: assignedRoomIds,
        agentIds: assignedAgentIds,
        workflows: seed.workflows,
        linkedLocalPaths: [],
        integrations: [],
        approvals: [],
        events: [],
        notes: seed.notes,
        createdAt: now(),
        updatedAt: now()
      };
      state.projects.push(project);
      changed = true;
      return;
    }

    const defaults = {
      type: seed.type,
      assignedRoomIds: project.roomIds || assignedRoomIds,
      assignedAgentIds: project.agentIds || assignedAgentIds,
      roomIds: project.roomIds || assignedRoomIds,
      agentIds: project.agentIds || assignedAgentIds,
      workflows: seed.workflows,
      linkedLocalPaths: [],
      integrations: [],
      approvals: [],
      events: [],
      notes: project.description || seed.notes
    };
    Object.entries(defaults).forEach(([key, value]) => {
      if (project[key] === undefined) {
        project[key] = value;
        changed = true;
      }
    });
  });

  state.projects.forEach((project) => {
    const defaults = {
      type: "general",
      assignedRoomIds: project.roomIds || [],
      assignedAgentIds: project.agentIds || [],
      roomIds: project.assignedRoomIds || [],
      agentIds: project.assignedAgentIds || [],
      workflows: [],
      linkedLocalPaths: [],
      integrations: [],
      approvals: [],
      events: [],
      notes: project.description || ""
    };
    Object.entries(defaults).forEach(([key, value]) => {
      if (project[key] === undefined) {
        project[key] = value;
        changed = true;
      }
    });
  });

  state.rooms.forEach((room) => {
    ["type", "connectedRoomIds", "doorPositions", "hallwayConnections", "furniture", "agents", "projectIds", "colorTheme", "zoomConfig"].forEach((key) => {
      if (room[key] === undefined) changed = true;
    });
  });

  state.agents.forEach((agent) => {
    ["currentRoomId", "assignedProjectIds", "currentTask", "currentTaskId", "currentTaskLabel", "currentPhase", "state", "movementState", "anchorId", "lastEventAt"].forEach((key) => {
      if (agent[key] === undefined) changed = true;
    });
  });

  if (changed) pushEvent(state, "state_migrated", "Ranger HQ local data shape updated for pre-Unity room/project model.", "INFO");
  hydrateSceneBindings(state);
  return changed;
}

function writeState(state) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  state.meta.updatedAt = now();
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function pushEvent(state, type, message, severity = "INFO", payload = {}) {
  const next = event(type, message, severity, payload);
  state.events.unshift(next);
  state.events = state.events.slice(0, 250);
  return next;
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  res.end(JSON.stringify(data, null, 2));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
  });
}

function safePublicPath(urlPath) {
  const requested = urlPath === "/" ? "/index.html" : urlPath;
  const fullPath = path.normalize(path.join(FRONTEND_DIR, requested));
  if (!fullPath.startsWith(FRONTEND_DIR)) return null;
  return fullPath;
}

function serveStatic(req, res) {
  const filePath = safePublicPath(new URL(req.url, "http://localhost").pathname);
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return false;
  const ext = path.extname(filePath);
  const type = ext === ".css" ? "text/css" : ext === ".js" ? "text/javascript" : "text/html";
  res.writeHead(200, { "content-type": `${type}; charset=utf-8` });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

function summary(state) {
  return {
    system: state.killSwitch.active ? "SAFE_MODE" : "NORMAL",
    killSwitch: state.killSwitch,
    counts: {
      rooms: state.rooms.length,
      projects: state.projects.length,
      agents: state.agents.length,
      pendingApprovals: state.approvals.filter((approval) => approval.status === "PENDING").length,
      events: state.events.length
    },
    blockedAutonomy: ["publishing", "spending", "messaging", "account changes", "school submissions", "external writes", "agent activation", "tool permission changes"],
    requiredFlow: "Draft -> Stage -> Review -> Approve / Reject / Iterate -> Execute"
  };
}

function hqState(state) {
  return {
    summary: summary(state),
    killSwitch: state.killSwitch,
    rooms: state.rooms,
    projects: state.projects,
    agents: state.agents,
    approvals: state.approvals,
    events: state.events,
    tasks: state.tasks
  };
}

function createApproval(state, subjectType, subjectId, title, payload, requestedByAgentId = null) {
  const approval = {
    id: id("approval"),
    subjectType,
    subjectId,
    title,
    status: "PENDING",
    requestedByAgentId,
    reviewer: "Tay",
    decisionNote: "",
    payload,
    createdAt: now(),
    decidedAt: null
  };
  state.approvals.unshift(approval);
  pushEvent(state, "approval_requested", title, "WARN", { approvalId: approval.id, subjectType, subjectId });
  return approval;
}

function decideApproval(state, approvalId, status, decisionNote = "") {
  const approval = state.approvals.find((item) => item.id === approvalId);
  if (!approval) return null;
  approval.status = status;
  approval.decisionNote = String(decisionNote || "");
  approval.decidedAt = now();
  pushEvent(state, `approval_${status.toLowerCase()}`, `Approval ${status.toLowerCase()}: ${approval.title}`, status === "APPROVED" ? "INFO" : "WARN", { approvalId: approval.id });
  return approval;
}

function generateDailyReport(state, roomId = null) {
  const targetRooms = roomId
    ? state.rooms.filter((room) => room.id === roomId || room.slug === roomId)
    : state.rooms;
  const reportDate = new Date().toISOString().slice(0, 10);

  return targetRooms.map((room) => {
    const pendingApprovals = state.approvals.filter((approval) => approval.status === "PENDING" && (approval.subjectId === room.id || approval.payload?.roomId === room.id || approval.payload?.roomSlug === room.slug));
    const recentEvents = state.events.filter((item) => item.payload?.roomId === room.id || item.payload?.roomSlug === room.slug).slice(0, 8);
    const report = {
      roomId: room.id,
      roomSlug: room.slug,
      date: reportDate,
      summary: `${room.name} is ${room.status.toLowerCase()} with ${pendingApprovals.length} pending approval item${pendingApprovals.length === 1 ? "" : "s"}.`,
      completed: recentEvents.filter((item) => item.severity === "INFO").map((item) => item.message),
      pendingApprovals: pendingApprovals.map((approval) => ({ id: approval.id, title: approval.title, status: approval.status })),
      blockers: state.killSwitch.active ? ["HQ kill switch is active."] : [],
      risks: room.status === "ARCHIVED" ? ["Room is archived and should not run normal workflows."] : [],
      suggestedNextActions: pendingApprovals.length ? ["Review pending approvals before external action."] : ["Keep drafting internally; no external action without approval."],
      nextReportTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    room.dailyReport = report;
    room.updatedAt = now();
    return report;
  });
}

async function setKillSwitchState(state, active, reason = "") {
  state.killSwitch = {
    active: Boolean(active),
    mode: active ? "SAFE_MODE" : "NORMAL",
    reason: String(reason || ""),
    updatedAt: now()
  };
  pushEvent(
    state,
    active ? "kill_switch_triggered" : "kill_switch_cleared",
    active ? "Kill switch active. System is in SAFE_MODE." : "Kill switch cleared. System is in NORMAL mode.",
    active ? "CRITICAL" : "INFO",
    { reason: state.killSwitch.reason }
  );
  if (active) {
    state.rooms.forEach((room) => {
      if (room.status !== "ARCHIVED") {
        room.status = "PAUSED";
        room.updatedAt = now();
      }
    });
    state.agents.forEach((agent) => {
      if (agent.slug !== "ranger") {
        agent.state = "paused";
        agent.movementState = "paused";
        agent.currentTask = "Paused by HQ kill switch";
        agent.currentTaskLabel = agent.currentTask;
        agent.updatedAt = now();
      }
    });
    const stopResult = await openclaw.stop();
    pushEvent(state, "openclaw_stopped", "OpenClaw controlled gateway stopped by kill switch.", "CRITICAL", {
      ok: stopResult.ok,
      message: stopResult.message
    });
  }
  return state.killSwitch;
}

function roomPayload(body) {
  const name = String(body.name || "").trim();
  if (!name) throw new Error("Room name is required");
  const status = body.status || "ACTIVE";
  if (!ROOM_STATUSES.has(status)) throw new Error("Invalid room status");
  return {
    id: id("room"),
    slug: slugify(body.slug || name),
    name,
    status,
    purpose: String(body.purpose || ""),
    visualTheme: String(body.visualTheme || "dark command space, grounded operations"),
    ...roomSceneDefaults(slugify(body.slug || name)),
    createdAt: now(),
    updatedAt: now()
  };
}

function projectPayload(body) {
  const name = String(body.name || "").trim();
  if (!name) throw new Error("Project name is required");
  const status = body.status || "ACTIVE";
  if (!ROOM_STATUSES.has(status)) throw new Error("Invalid project status");
  return {
    id: id("project"),
    slug: slugify(body.slug || name),
    name,
    type: String(body.type || "general"),
    status,
    description: String(body.description || ""),
    assignedRoomIds: Array.isArray(body.assignedRoomIds) ? body.assignedRoomIds : Array.isArray(body.roomIds) ? body.roomIds : [],
    assignedAgentIds: Array.isArray(body.assignedAgentIds) ? body.assignedAgentIds : Array.isArray(body.agentIds) ? body.agentIds : [],
    roomIds: Array.isArray(body.roomIds) ? body.roomIds : Array.isArray(body.assignedRoomIds) ? body.assignedRoomIds : [],
    agentIds: Array.isArray(body.agentIds) ? body.agentIds : Array.isArray(body.assignedAgentIds) ? body.assignedAgentIds : [],
    workflows: Array.isArray(body.workflows) ? body.workflows : [],
    linkedLocalPaths: Array.isArray(body.linkedLocalPaths) ? body.linkedLocalPaths : [],
    integrations: Array.isArray(body.integrations) ? body.integrations : [],
    approvals: Array.isArray(body.approvals) ? body.approvals : [],
    events: Array.isArray(body.events) ? body.events : [],
    notes: String(body.notes || ""),
    createdAt: now(),
    updatedAt: now()
  };
}

async function handleApi(req, res, state, pathname) {
  if (req.method === "OPTIONS") return sendJson(res, 200, {});

  if (req.method === "GET" && pathname === "/hq/state") return sendJson(res, 200, hqState(state));
  if (req.method === "GET" && pathname === "/hq/rooms") return sendJson(res, 200, state.rooms);
  if (req.method === "GET" && pathname === "/hq/approvals") return sendJson(res, 200, state.approvals);
  const hqRoomMatch = pathname.match(/^\/hq\/rooms\/([^/]+)$/);
  if (req.method === "GET" && hqRoomMatch) {
    const room = state.rooms.find((item) => item.id === hqRoomMatch[1] || item.slug === hqRoomMatch[1]);
    return room ? sendJson(res, 200, room) : sendError(res, 404, "Room not found");
  }

  const hqApprovalDecisionMatch = pathname.match(/^\/hq\/approvals\/([^/]+)\/(approve|reject|more-info)$/);
  if (req.method === "POST" && hqApprovalDecisionMatch) {
    const body = await readBody(req);
    const statusByAction = {
      approve: "APPROVED",
      reject: "REJECTED",
      "more-info": "ITERATE"
    };
    const approval = decideApproval(state, hqApprovalDecisionMatch[1], statusByAction[hqApprovalDecisionMatch[2]], body.decisionNote || body.note || "");
    if (!approval) return sendError(res, 404, "Approval not found");
    writeState(state);
    return sendJson(res, 200, approval);
  }

  if (req.method === "POST" && pathname === "/hq/reports/generate") {
    const body = await readBody(req);
    const reports = generateDailyReport(state, body.roomId || body.roomSlug || null);
    if ((body.roomId || body.roomSlug) && reports.length === 0) return sendError(res, 404, "Room not found");
    pushEvent(state, "daily_report_generated", `${reports.length} daily report${reports.length === 1 ? "" : "s"} generated.`, "INFO");
    writeState(state);
    return sendJson(res, 201, reports.length === 1 ? reports[0] : reports);
  }

  if (req.method === "POST" && pathname === "/hq/kill-switch") {
    const body = await readBody(req);
    const killSwitch = await setKillSwitchState(state, true, body.reason || "HQ kill switch triggered");
    writeState(state);
    return sendJson(res, 200, killSwitch);
  }

  if (req.method === "POST" && pathname === "/hq/resume") {
    const body = await readBody(req);
    const killSwitch = await setKillSwitchState(state, false, body.reason || "HQ resumed by user");
    writeState(state);
    return sendJson(res, 200, killSwitch);
  }

  if (req.method === "GET" && pathname === "/summary") return sendJson(res, 200, summary(state));
  if (req.method === "GET" && pathname === "/rooms") return sendJson(res, 200, state.rooms);
  if (req.method === "GET" && pathname === "/projects") return sendJson(res, 200, state.projects);
  if (req.method === "GET" && pathname === "/events") return sendJson(res, 200, state.events);
  if (req.method === "GET" && pathname === "/agents") return sendJson(res, 200, state.agents);
  if (req.method === "GET" && pathname === "/approvals") return sendJson(res, 200, state.approvals);
  if (req.method === "GET" && pathname === "/openclaw/status") return sendJson(res, 200, await openclaw.status());

  const roomMatch = pathname.match(/^\/rooms\/([^/]+)$/);
  if (req.method === "GET" && roomMatch) {
    const room = state.rooms.find((item) => item.id === roomMatch[1] || item.slug === roomMatch[1]);
    return room ? sendJson(res, 200, room) : sendError(res, 404, "Room not found");
  }

  const projectMatch = pathname.match(/^\/projects\/([^/]+)$/);
  if (req.method === "GET" && projectMatch) {
    const project = state.projects.find((item) => item.id === projectMatch[1] || item.slug === projectMatch[1]);
    return project ? sendJson(res, 200, project) : sendError(res, 404, "Project not found");
  }

  if (req.method === "POST" && pathname === "/rooms") {
    const room = roomPayload(await readBody(req));
    state.rooms.unshift(room);
    pushEvent(state, "room_created", `Room created: ${room.name}`, "INFO", { roomId: room.id });
    writeState(state);
    return sendJson(res, 201, room);
  }

  if (req.method === "POST" && pathname === "/projects") {
    const project = projectPayload(await readBody(req));
    state.projects.unshift(project);
    pushEvent(state, "project_created", `Project created: ${project.name}`, "INFO", { projectId: project.id });
    writeState(state);
    return sendJson(res, 201, project);
  }

  if (req.method === "PATCH" && roomMatch) {
    const body = await readBody(req);
    const room = state.rooms.find((item) => item.id === roomMatch[1] || item.slug === roomMatch[1]);
    if (!room) return sendError(res, 404, "Room not found");
    if (body.status && !ROOM_STATUSES.has(body.status)) return sendError(res, 400, "Invalid room status");
    Object.assign(room, {
      name: body.name ?? room.name,
      status: body.status ?? room.status,
      purpose: body.purpose ?? room.purpose,
      visualTheme: body.visualTheme ?? room.visualTheme,
      updatedAt: now()
    });
    pushEvent(state, `room_${room.status.toLowerCase()}`, `Room updated: ${room.name} -> ${room.status}`, "INFO", { roomId: room.id });
    writeState(state);
    return sendJson(res, 200, room);
  }

  if (req.method === "PATCH" && projectMatch) {
    const body = await readBody(req);
    const project = state.projects.find((item) => item.id === projectMatch[1] || item.slug === projectMatch[1]);
    if (!project) return sendError(res, 404, "Project not found");
    if (body.status && !ROOM_STATUSES.has(body.status)) return sendError(res, 400, "Invalid project status");
    Object.assign(project, {
      name: body.name ?? project.name,
      type: body.type ?? project.type,
      status: body.status ?? project.status,
      description: body.description ?? project.description,
      assignedRoomIds: Array.isArray(body.assignedRoomIds) ? body.assignedRoomIds : Array.isArray(body.roomIds) ? body.roomIds : project.assignedRoomIds,
      assignedAgentIds: Array.isArray(body.assignedAgentIds) ? body.assignedAgentIds : Array.isArray(body.agentIds) ? body.agentIds : project.assignedAgentIds,
      roomIds: Array.isArray(body.roomIds) ? body.roomIds : project.roomIds,
      agentIds: Array.isArray(body.agentIds) ? body.agentIds : project.agentIds,
      workflows: Array.isArray(body.workflows) ? body.workflows : project.workflows,
      linkedLocalPaths: Array.isArray(body.linkedLocalPaths) ? body.linkedLocalPaths : project.linkedLocalPaths,
      integrations: Array.isArray(body.integrations) ? body.integrations : project.integrations,
      approvals: Array.isArray(body.approvals) ? body.approvals : project.approvals,
      events: Array.isArray(body.events) ? body.events : project.events,
      notes: body.notes ?? project.notes,
      updatedAt: now()
    });
    pushEvent(state, `project_${project.status.toLowerCase()}`, `Project updated: ${project.name} -> ${project.status}`, "INFO", { projectId: project.id });
    writeState(state);
    return sendJson(res, 200, project);
  }

  if (req.method === "POST" && pathname === "/agents/stage") {
    const body = await readBody(req);
    const name = String(body.name || "").trim();
    if (!name) return sendError(res, 400, "Agent name is required");
    const agent = {
      id: id("agent"),
      slug: slugify(body.slug || name),
      name,
      status: "STAGING",
      role: String(body.role || "Staged agent"),
      authority: body.authority || { mayDraft: [], mayNot: ["activate_agents", "external_actions"] },
      spec: body.spec || {},
      currentRoomId: body.currentRoomId || null,
      assignedProjectIds: Array.isArray(body.assignedProjectIds) ? body.assignedProjectIds : [],
      currentTaskId: String(body.currentTaskId || `task-${slug}`),
      currentTaskLabel: String(body.currentTaskLabel || body.currentTask || "awaiting activation approval"),
      currentPhase: String(body.currentPhase || "awaiting_activation"),
      currentTask: String(body.currentTask || body.currentTaskLabel || "awaiting activation approval"),
      state: String(body.state || "idle"),
      movementState: String(body.movementState || body.state || "idle"),
      anchorId: String(body.anchorId || "staging_anchor_1"),
      lastEventAt: now(),
      createdAt: now(),
      updatedAt: now()
    };
    state.agents.unshift(agent);
    const approval = createApproval(state, "agent", agent.id, `Review staged agent: ${agent.name}`, { agent });
    pushEvent(state, "agent_staged", `Agent staged: ${agent.name}`, "WARN", { agentId: agent.id, approvalId: approval.id });
    writeState(state);
    return sendJson(res, 201, { agent, approval });
  }

  if (req.method === "POST" && pathname === "/kill-switch") {
    const body = await readBody(req);
    await setKillSwitchState(state, Boolean(body.active), body.reason || "");
    writeState(state);
    return sendJson(res, 200, state.killSwitch);
  }

  if (req.method === "POST" && pathname === "/openclaw/launch") {
    if (state.killSwitch.active) {
      pushEvent(state, "openclaw_launch_blocked", "OpenClaw launch blocked by active kill switch.", "CRITICAL");
      writeState(state);
      return sendError(res, 423, "Kill switch active. OpenClaw launch blocked.");
    }

    const result = await openclaw.launch();
    pushEvent(
      state,
      result.ok ? "openclaw_launch_requested" : "openclaw_launch_failed",
      result.message,
      result.ok ? "INFO" : "CRITICAL",
      { controlledContainer: openclaw.CONTROLLED_CONTAINER }
    );
    writeState(state);
    return sendJson(res, result.ok ? 200 : 500, result);
  }

  if (req.method === "POST" && pathname === "/openclaw/stop") {
    const result = await openclaw.stop();
    pushEvent(state, "openclaw_stopped", result.message, "WARN", {
      controlledContainer: openclaw.CONTROLLED_CONTAINER
    });
    writeState(state);
    return sendJson(res, 200, result);
  }

  const approvalMatch = pathname.match(/^\/approvals\/([^/]+)$/);
  if (req.method === "PATCH" && approvalMatch) {
    const body = await readBody(req);
    const approval = state.approvals.find((item) => item.id === approvalMatch[1]);
    if (!approval) return sendError(res, 404, "Approval not found");
    if (!APPROVAL_STATUSES.has(body.status)) return sendError(res, 400, "Invalid approval status");
    decideApproval(state, approval.id, body.status, body.decisionNote || "");
    writeState(state);
    return sendJson(res, 200, approval);
  }

  if (req.method === "POST" && pathname === "/workflow/research-idea") {
    if (state.killSwitch.active) {
      pushEvent(state, "workflow_paused", "Research idea workflow blocked by active kill switch.", "CRITICAL");
      writeState(state);
      return sendError(res, 423, "Kill switch active. Workflow blocked.");
    }
    const body = await readBody(req);
    const idea = String(body.idea || "").trim();
    if (!idea) return sendError(res, 400, "Idea is required");
    const task = {
      id: id("task"),
      title: `Draft-only research concept: ${idea}`,
      status: "QA_REVIEWED",
      output: {
        idea,
        brandAlignment: "Pending Tay review",
        profitability: "Needs market validation",
        trendVelocity: "Needs current research before external action",
        marketSaturation: "Unknown until approved research pass",
        printViability: "Draft-only assessment",
        manufacturingConstraints: "Printify/Printful checks required before execution",
        readability: "QA should verify at product dimensions",
        audienceDemand: "Requires approved research",
        conversionPotential: "Draft estimate only",
        scalability: "Draft estimate only"
      },
      createdAt: now(),
      updatedAt: now()
    };
    state.tasks.unshift(task);
    const approval = createApproval(state, "task", task.id, `Approve or iterate concept: ${idea}`, { task });
    pushEvent(state, "draft_created", `Draft concept created for review: ${idea}`, "INFO", { taskId: task.id });
    pushEvent(state, "qa_passed", "QA completed for draft-only workflow. External execution remains blocked.", "INFO", { taskId: task.id });
    writeState(state);
    return sendJson(res, 201, { task, approval });
  }

  return sendError(res, 404, "Route not found");
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (!["GET", "POST", "PATCH", "OPTIONS"].includes(req.method)) return sendError(res, 405, "Method not allowed");

    const state = readState();
    if (url.pathname.startsWith("/api/")) {
      return handleApi(req, res, state, url.pathname.slice(4) || "/");
    }

    if (serveStatic(req, res)) return;
    return sendError(res, 404, "Not found");
  } catch (error) {
    return sendError(res, 500, error.message || "Server error");
  }
});

server.listen(PORT, () => {
  console.log(`Ranger HQ local API listening on http://localhost:${PORT}`);
});
