CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE lifecycle_status AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED', 'SHUT_DOWN', 'STAGING');
CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ITERATE');
CREATE TYPE kill_switch_mode AS ENUM ('NORMAL', 'SAFE_MODE');

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status lifecycle_status NOT NULL DEFAULT 'ACTIVE',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status lifecycle_status NOT NULL DEFAULT 'ACTIVE',
  purpose TEXT NOT NULL DEFAULT '',
  visual_theme TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_rooms (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, room_id)
);

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status lifecycle_status NOT NULL DEFAULT 'STAGING',
  role TEXT NOT NULL DEFAULT '',
  authority JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_agents (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  pod_role TEXT NOT NULL,
  PRIMARY KEY (project_id, agent_id, pod_role)
);

CREATE TABLE agent_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  spec JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agent_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tool_policy_id UUID,
  workspace_access TEXT NOT NULL DEFAULT 'none',
  external_actions_allowed BOOLEAN NOT NULL DEFAULT false,
  can_activate_agents BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agent_pods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lead_agent_id UUID REFERENCES agents(id),
  qa_agent_id UUID REFERENCES agents(id),
  dispatch_agent_id UUID REFERENCES agents(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT qa_not_lead CHECK (qa_agent_id IS NULL OR lead_agent_id IS NULL OR qa_agent_id <> lead_agent_id)
);

CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status lifecycle_status NOT NULL DEFAULT 'STAGING',
  draft_only BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  required_status TEXT NOT NULL,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (workflow_id, step_order)
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL,
  subject_id UUID,
  title TEXT NOT NULL,
  status approval_status NOT NULL DEFAULT 'PENDING',
  requested_by_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  reviewer TEXT NOT NULL DEFAULT 'Tay',
  decision_note TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'INFO',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tool_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  policy JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE kill_switch_state (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT false,
  mode kill_switch_mode NOT NULL DEFAULT 'NORMAL',
  reason TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id)
);

CREATE TABLE session_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE files_touched_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'Ranger HQ',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO kill_switch_state (id, active, mode) VALUES (true, false, 'NORMAL')
ON CONFLICT (id) DO NOTHING;

