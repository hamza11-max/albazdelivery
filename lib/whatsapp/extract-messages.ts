type MetaChangeValue = {
  messaging_product?: string
  metadata?: { phone_number_id?: string; display_phone_number?: string }
  contacts?: { wa_id?: string; profile?: { name?: string } }[]
  messages?: {
    from?: string
    id?: string
    type?: string
    interactive?: {
      type?: string
      nfm_reply?: { response_json?: string; body?: string; name?: string }
    }
  }[]
}

export type ParsedInboundFlowReply = {
  phoneNumberId: string
  messageId: string
  customerWaId: string
  customerName?: string
  responseJson: string
}

/** Walk Meta webhook payload for WhatsApp business account entries. */
export function extractFlowRepliesFromWebhookBody(body: unknown): ParsedInboundFlowReply[] {
  const out: ParsedInboundFlowReply[] = []
  if (!body || typeof body !== 'object') {
    return out
  }
  const entries = (body as { entry?: unknown[] }).entry
  if (!Array.isArray(entries)) {
    return out
  }

  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] }).changes
    if (!Array.isArray(changes)) {
      continue
    }
    for (const change of changes) {
      const value = (change as { value?: MetaChangeValue }).value
      if (!value?.metadata?.phone_number_id || !Array.isArray(value.messages)) {
        continue
      }
      const phoneNumberId = value.metadata.phone_number_id
      const waIdFromContact = value.contacts?.[0]?.wa_id
      const profileName = value.contacts?.[0]?.profile?.name

      for (const msg of value.messages) {
        if (!msg?.id || !msg.from) {
          continue
        }
        if (msg.type !== 'interactive' || msg.interactive?.type !== 'nfm_reply') {
          continue
        }
        const responseJson = msg.interactive?.nfm_reply?.response_json
        if (!responseJson || typeof responseJson !== 'string') {
          continue
        }
        out.push({
          phoneNumberId,
          messageId: msg.id,
          customerWaId: msg.from || waIdFromContact || '',
          customerName: profileName,
          responseJson,
        })
      }
    }
  }

  return out
}
