import { resolveCname, resolveTxt } from 'node:dns/promises'
import { buildVerificationHost } from './utils'

export interface DomainVerificationResult {
  verified: boolean
  reason?: string
  txtMatched?: boolean
  cnameMatched?: boolean
}

export function getExpectedCnameTarget(): string {
  return (process.env.CUSTOM_DOMAIN_CNAME_TARGET || '').trim().toLowerCase()
}

export function getDomainVerificationInstructions(domain: string, token: string) {
  const txtHost = buildVerificationHost(domain)
  const cnameTarget = getExpectedCnameTarget() || 'cname.yourplatform.example'

  return {
    token,
    records: [
      {
        type: 'TXT',
        host: txtHost,
        value: token,
        purpose: 'domain ownership verification',
      },
      {
        type: 'CNAME',
        host: domain,
        value: cnameTarget,
        purpose: 'traffic routing',
      },
    ],
  }
}

export async function verifyDomainOwnership(domain: string, token: string): Promise<DomainVerificationResult> {
  const txtHost = buildVerificationHost(domain)
  const expectedCname = getExpectedCnameTarget()

  let txtMatched = false
  let cnameMatched = false

  try {
    const txtRecords = await resolveTxt(txtHost)
    txtMatched = txtRecords.some((record) => record.join('').trim() === token)
  } catch {
    // Ignore DNS lookup errors; they simply mean not verified yet.
  }

  if (expectedCname) {
    try {
      const cnameRecords = await resolveCname(domain)
      cnameMatched = cnameRecords.some((record) => record.trim().toLowerCase() === expectedCname)
    } catch {
      // Ignore DNS lookup errors; they simply mean not verified yet.
    }
  } else {
    // If no CNAME target configured, TXT proof alone is enough.
    cnameMatched = true
  }

  if (txtMatched && cnameMatched) {
    return { verified: true, txtMatched: true, cnameMatched: true }
  }

  return {
    verified: false,
    reason: 'DNS records not ready yet. Add/propagate TXT and CNAME then retry verification.',
    txtMatched,
    cnameMatched,
  }
}
