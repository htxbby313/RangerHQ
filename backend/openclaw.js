const { execFile } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");

const CONTROLLED_CONTAINER = process.env.RANGER_HQ_OPENCLAW_CONTAINER || "RangerHQ-openclaw";
const LEGACY_CONTAINER = "RangerHQ";
const IMAGE = process.env.RANGER_HQ_OPENCLAW_IMAGE || "openclaw:latest";
const NPM_CACHE_VOLUME = process.env.RANGER_HQ_OPENCLAW_NPM_CACHE_VOLUME || "rangerhq-openclaw-npm-cache";
const HOST_CONFIG_DIR = process.env.OPENCLAW_CONFIG_DIR || path.join(os.homedir(), ".openclaw");
const HOST_CONFIG_FILE = path.join(HOST_CONFIG_DIR, "openclaw.json");
const HOST_CONFIG_BACKUP_FILE = path.join(HOST_CONFIG_DIR, "openclaw.json.rangerhq-backup");
const HOST_AUTH_PROFILES_FILE = path.join(HOST_CONFIG_DIR, "agents", "main", "agent", "auth-profiles.json");
const GATEWAY_PORT = Number(process.env.OPENCLAW_GATEWAY_PORT || 18789);

function execDocker(args, options = {}) {
  return new Promise((resolve) => {
    execFile("docker", args, { timeout: options.timeout || 30000 }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        code: error?.code ?? 0,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function objectKeys(value) {
  return value && typeof value === "object" ? Object.keys(value) : [];
}

function summarizeAuthProfiles() {
  if (!fs.existsSync(HOST_AUTH_PROFILES_FILE)) {
    return {
      exists: false,
      path: HOST_AUTH_PROFILES_FILE,
      providers: []
    };
  }

  try {
    const authProfiles = readJson(HOST_AUTH_PROFILES_FILE);
    return {
      exists: true,
      path: HOST_AUTH_PROFILES_FILE,
      providers: objectKeys(authProfiles.profiles)
        .map((profileName) => authProfiles.profiles[profileName]?.provider)
        .filter(Boolean)
        .sort()
    };
  } catch (error) {
    return {
      exists: true,
      path: HOST_AUTH_PROFILES_FILE,
      providers: [],
      error: error.message
    };
  }
}

function summarizeConfig() {
  if (!fs.existsSync(HOST_CONFIG_FILE)) {
    return {
      exists: false,
      path: HOST_CONFIG_FILE,
      valid: false,
      reason: "OpenClaw host config file not found"
    };
  }

  try {
    const config = readJson(HOST_CONFIG_FILE);
    const primaryModel = config.agents?.defaults?.model?.primary;
    const allowlistedModels = objectKeys(config.agents?.defaults?.models);
    const configAuthProviders = objectKeys(config.auth?.profiles)
      .map((profileName) => config.auth.profiles[profileName]?.provider)
      .filter(Boolean)
      .sort();
    const enabledPlugins = objectKeys(config.plugins?.entries)
      .filter((pluginName) => config.plugins.entries[pluginName]?.enabled)
      .sort();

    return {
      exists: true,
      path: HOST_CONFIG_FILE,
      valid: true,
      gatewayMode: config.gateway?.mode,
      gatewayBind: config.gateway?.bind,
      gatewayPort: config.gateway?.port,
      tailscaleMode: config.gateway?.tailscale?.mode,
      agentSandboxMode: config.agents?.defaults?.sandbox?.mode,
      agentSandboxBackend: config.agents?.defaults?.sandbox?.backend,
      workspaceAccess: config.agents?.defaults?.sandbox?.workspaceAccess,
      agentDockerNetwork: config.agents?.defaults?.sandbox?.docker?.network,
      agentReadOnlyRoot: config.agents?.defaults?.sandbox?.docker?.readOnlyRoot,
      agentCapDrop: config.agents?.defaults?.sandbox?.docker?.capDrop || [],
      agentPidsLimit: config.agents?.defaults?.sandbox?.docker?.pidsLimit,
      agentMemory: config.agents?.defaults?.sandbox?.docker?.memory,
      agentCpus: config.agents?.defaults?.sandbox?.docker?.cpus,
      primaryModel,
      allowlistedModels,
      configAuthProviders,
      enabledPlugins,
      usesOpus: typeof primaryModel === "string" && primaryModel.toLowerCase().includes("opus"),
      primaryModelAllowlisted: allowlistedModels.includes(primaryModel)
    };
  } catch (error) {
    return {
      exists: true,
      path: HOST_CONFIG_FILE,
      valid: false,
      reason: error.message
    };
  }
}

async function inspectContainer(name) {
  const result = await execDocker(["inspect", name]);
  if (!result.ok) {
    return {
      exists: false,
      name,
      error: result.stderr || result.stdout
    };
  }

  try {
    const [info] = JSON.parse(result.stdout);
    return {
      exists: true,
      name,
      id: info.Id,
      image: info.Config?.Image,
      status: info.State?.Status,
      running: Boolean(info.State?.Running),
      healthy: info.State?.Health?.Status || null,
      exitCode: info.State?.ExitCode,
      startedAt: info.State?.StartedAt,
      finishedAt: info.State?.FinishedAt,
      networkMode: info.HostConfig?.NetworkMode,
      readOnlyRoot: Boolean(info.HostConfig?.ReadonlyRootfs),
      capDrop: info.HostConfig?.CapDrop || [],
      pidsLimit: info.HostConfig?.PidsLimit,
      memory: info.HostConfig?.Memory,
      nanoCpus: info.HostConfig?.NanoCpus,
      securityOpt: info.HostConfig?.SecurityOpt || [],
      mounts: (info.Mounts || []).map((mount) => ({
        type: mount.Type,
        source: mount.Source,
        destination: mount.Destination,
        mode: mount.Mode,
        rw: mount.RW
      })),
      ports: info.NetworkSettings?.Ports || {}
    };
  } catch (error) {
    return {
      exists: true,
      name,
      error: error.message
    };
  }
}

function checkGatewayTcp() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port: GATEWAY_PORT });
    socket.setTimeout(2500);
    socket.on("connect", () => {
      socket.destroy();
      resolve({ reachable: true });
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ reachable: false, error: "timeout" });
    });
    socket.on("error", (error) => resolve({ reachable: false, error: error.message }));
  });
}

function controlledRunArgs() {
  return [
    "run",
    "-d",
    "--name",
    CONTROLLED_CONTAINER,
    "--user",
    "nodejs",
    "--workdir",
    "/app",
    "--read-only",
    "--cap-drop",
    "ALL",
    "--pids-limit",
    "256",
    "--memory",
    "1g",
    "--cpus",
    "1",
    "--security-opt",
    "no-new-privileges:true",
    "--health-cmd",
    `wget -O- http://127.0.0.1:${GATEWAY_PORT} || exit 1`,
    "--health-interval",
    "30s",
    "--health-timeout",
    "5s",
    "--health-start-period",
    "90s",
    "--health-retries",
    "5",
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,size=128m",
    "--mount",
    `type=volume,source=${NPM_CACHE_VOLUME},target=/home/nodejs/.npm`,
    "--mount",
    `type=bind,source=${HOST_CONFIG_DIR},target=/home/nodejs/.openclaw`,
    "-p",
    `127.0.0.1:${GATEWAY_PORT}:${GATEWAY_PORT}`,
    IMAGE,
    "npx",
    "openclaw",
    "gateway",
    "--port",
    String(GATEWAY_PORT),
    "--bind",
    "lan"
  ];
}

function backupHostConfig() {
  if (!fs.existsSync(HOST_CONFIG_FILE)) return;
  if (!fs.existsSync(HOST_CONFIG_BACKUP_FILE)) {
    fs.copyFileSync(HOST_CONFIG_FILE, HOST_CONFIG_BACKUP_FILE);
  }
}

async function prepareNpmCacheVolume() {
  await execDocker(["volume", "create", NPM_CACHE_VOLUME], { timeout: 30000 });
  return execDocker(
    [
      "run",
      "--rm",
      "--network",
      "none",
      "--user",
      "root",
      "--mount",
      `type=volume,source=${NPM_CACHE_VOLUME},target=/home/nodejs/.npm`,
      "--entrypoint",
      "sh",
      IMAGE,
      "-lc",
      "mkdir -p /home/nodejs/.npm && chown -R 1001:65533 /home/nodejs/.npm"
    ],
    { timeout: 60000 }
  );
}

async function status() {
  const [controlled, legacy, gateway] = await Promise.all([
    inspectContainer(CONTROLLED_CONTAINER),
    inspectContainer(LEGACY_CONTAINER),
    checkGatewayTcp()
  ]);
  const configured = summarizeConfig();
  const authProfiles = summarizeAuthProfiles();

  return {
    configured,
    authProfiles,
    gateway: {
      port: GATEWAY_PORT,
      url: `http://127.0.0.1:${GATEWAY_PORT}`,
      reachable: gateway.reachable,
      statusCode: null,
      error: gateway.error || null
    },
    controlledContainer: controlled,
    legacyContainer: legacy,
    warnings: [
      ...(configured.usesOpus ? ["OpenClaw primary model still references Opus; reconfigure before launch."] : []),
      ...(configured.valid && !configured.primaryModelAllowlisted ? ["OpenClaw primary model is not present in agents.defaults.models allowlist."] : []),
      ...(configured.valid && configured.configAuthProviders.length === 0 ? ["OpenClaw config has no model auth providers configured."] : []),
      ...(authProfiles.exists && authProfiles.providers.length === 0 ? ["OpenClaw auth profile file has no usable provider profiles."] : []),
      ...(legacy.exists ? ["Legacy container RangerHQ exists; do not reuse it for live workflows."] : []),
      ...(controlled.exists && !controlled.readOnlyRoot ? ["Controlled container is not read-only. Recreate it."] : []),
      ...(controlled.exists && controlled.networkMode !== "bridge" ? ["Controlled gateway container has unexpected network mode."] : [])
    ]
  };
}

async function launch() {
  const config = summarizeConfig();
  if (!config.valid) {
    return {
      ok: false,
      message: config.reason || "OpenClaw config is invalid",
      status: await status()
    };
  }

  const current = await inspectContainer(CONTROLLED_CONTAINER);
  if (current.exists && current.running) {
    return {
      ok: true,
      message: `${CONTROLLED_CONTAINER} is already running`,
      status: await status()
    };
  }

  if (current.exists) {
    await execDocker(["rm", CONTROLLED_CONTAINER], { timeout: 30000 });
  }

  backupHostConfig();
  const cachePrep = await prepareNpmCacheVolume();
  if (!cachePrep.ok) {
    return {
      ok: false,
      message: "OpenClaw npm cache volume preparation failed",
      docker: cachePrep,
      status: await status()
    };
  }

  const result = await execDocker(controlledRunArgs(), { timeout: 60000 });
  return {
    ok: result.ok,
    message: result.ok ? `${CONTROLLED_CONTAINER} launch requested` : "OpenClaw launch failed",
    docker: result,
    status: await status()
  };
}

async function stop() {
  const current = await inspectContainer(CONTROLLED_CONTAINER);
  if (!current.exists) {
    return {
      ok: true,
      message: `${CONTROLLED_CONTAINER} does not exist`,
      status: await status()
    };
  }

  if (current.running) {
    await execDocker(["stop", "--time", "3", CONTROLLED_CONTAINER], { timeout: 15000 });
  }

  return {
    ok: true,
    message: `${CONTROLLED_CONTAINER} stopped`,
    status: await status()
  };
}

module.exports = {
  CONTROLLED_CONTAINER,
  LEGACY_CONTAINER,
  GATEWAY_PORT,
  status,
  launch,
  stop
};
