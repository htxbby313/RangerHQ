# OpenClaw Provider Swap

OpenClaw is currently configured with:

```text
anthropic/claude-opus-4-7
```

That model must be replaced before Ranger HQ relies on OpenClaw for live routing.

## Apply A New Provider

Use the guarded script so the API key is stored in OpenClaw auth profile storage and the model is both selected and allowlisted.

OpenAI example:

```powershell
$env:OPENAI_API_KEY = "..."
.\scripts\configure-openclaw-provider.ps1 -Provider openai -Model openai/gpt-5.1
```

OpenRouter example:

```powershell
$env:OPENROUTER_API_KEY = "..."
.\scripts\configure-openclaw-provider.ps1 -Provider openrouter -Model openrouter/claude-sonnet
```

The script updates:

- `C:\Users\colem\.openclaw\openclaw.json`
- `C:\Users\colem\.openclaw\agents\main\agent\auth-profiles.json`

It creates timestamped backups before writing either file.

## Validate

```powershell
npm run check
node --check backend\openclaw.js
node -e "require('./backend/openclaw').status().then(s=>console.log(JSON.stringify({model:s.configured.primaryModel,allowlisted:s.configured.allowlistedModels,auth:s.authProfiles.providers,warnings:s.warnings},null,2)))"
```

Expected result:

- `model` is not Opus.
- `allowlisted` includes the same model.
- `auth` includes the selected provider.
- `warnings` does not include the Opus warning.

## Restart

Docker Desktop or the VPS Docker daemon must be running.

```powershell
.\scripts\openclaw-stop.ps1
.\scripts\openclaw-launch.ps1
docker ps --filter "name=RangerHQ-openclaw"
docker logs RangerHQ-openclaw --tail 100
```

Do not reuse the legacy `RangerHQ` container for live workflows.
