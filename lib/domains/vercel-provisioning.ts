/**
 * Vercel Domains API client — adds and removes custom domains on a Vercel
 * project so that SSL certificates are issued and traffic is routed here.
 *
 * All functions are no-ops (they return `{ skipped: true }`) when the
 * required environment variables are missing, so local dev and tests don't
 * need Vercel credentials.
 *
 * Env vars:
 *  - VERCEL_API_TOKEN      — token with domain.write scope on the project
 *  - VERCEL_PROJECT_ID     — project id (prj_xxx) where domains should live
 *  - VERCEL_TEAM_ID        — optional (for team-owned projects)
 *
 * Docs: https://vercel.com/docs/rest-api/reference/endpoints/projects/add-a-domain-to-a-project
 */
export interface VercelProvisioningResult {
  ok: boolean
  skipped?: boolean
  alreadyExists?: boolean
  status?: number
  error?: string
  body?: unknown
}

const VERCEL_API_BASE = 'https://api.vercel.com'

function getCreds(): {
  token?: string
  projectId?: string
  teamId?: string
} {
  return {
    token: process.env.VERCEL_API_TOKEN,
    projectId: process.env.VERCEL_PROJECT_ID,
    teamId: process.env.VERCEL_TEAM_ID,
  }
}

function withTeamQuery(path: string, teamId?: string): string {
  if (!teamId) return path
  return `${path}${path.includes('?') ? '&' : '?'}teamId=${encodeURIComponent(teamId)}`
}

export async function addDomainToVercelProject(
  domain: string
): Promise<VercelProvisioningResult> {
  const { token, projectId, teamId } = getCreds()
  if (!token || !projectId) {
    return { ok: true, skipped: true }
  }
  if (!domain) {
    return { ok: false, error: 'Missing domain' }
  }

  const url = withTeamQuery(
    `${VERCEL_API_BASE}/v10/projects/${encodeURIComponent(projectId)}/domains`,
    teamId
  )

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    })
    const body = await response.json().catch(() => null)
    if (response.ok) {
      return { ok: true, status: response.status, body }
    }
    // 409 = domain already attached to the project — treat as success.
    const errorCode = (body as any)?.error?.code
    if (response.status === 409 || errorCode === 'domain_already_in_use_by_another_project') {
      return {
        ok: true,
        alreadyExists: true,
        status: response.status,
        body,
      }
    }
    return {
      ok: false,
      status: response.status,
      error: (body as any)?.error?.message || `HTTP ${response.status}`,
      body,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function removeDomainFromVercelProject(
  domain: string
): Promise<VercelProvisioningResult> {
  const { token, projectId, teamId } = getCreds()
  if (!token || !projectId) {
    return { ok: true, skipped: true }
  }
  if (!domain) {
    return { ok: false, error: 'Missing domain' }
  }

  const url = withTeamQuery(
    `${VERCEL_API_BASE}/v9/projects/${encodeURIComponent(
      projectId
    )}/domains/${encodeURIComponent(domain)}`,
    teamId
  )

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (response.ok) {
      return { ok: true, status: response.status }
    }
    // 404 = domain already gone — idempotent delete.
    if (response.status === 404) {
      return { ok: true, status: 404 }
    }
    const body = await response.json().catch(() => null)
    return {
      ok: false,
      status: response.status,
      error: (body as any)?.error?.message || `HTTP ${response.status}`,
      body,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
