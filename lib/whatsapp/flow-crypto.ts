import crypto from 'crypto'

/** Decrypt WhatsApp Flow endpoint request body (see Meta Flows endpoint guide). */
export function decryptFlowRequestBody(
  body: { encrypted_aes_key: string; encrypted_flow_data: string; initial_vector: string },
  privateKeyPem: string,
): { decryptedBody: Record<string, unknown>; aesKeyBuffer: Buffer; initialVectorBuffer: Buffer } {
  const decryptedAesKey = crypto.privateDecrypt(
    {
      key: crypto.createPrivateKey(privateKeyPem),
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(body.encrypted_aes_key, 'base64'),
  )

  const flowDataBuffer = Buffer.from(body.encrypted_flow_data, 'base64')
  const initialVectorBuffer = Buffer.from(body.initial_vector, 'base64')

  const TAG_LENGTH = 16
  const encryptedBody = flowDataBuffer.subarray(0, -TAG_LENGTH)
  const authTag = flowDataBuffer.subarray(-TAG_LENGTH)

  const decipher = crypto.createDecipheriv('aes-128-gcm', decryptedAesKey, initialVectorBuffer)
  decipher.setAuthTag(authTag)

  const decryptedJSONString = Buffer.concat([decipher.update(encryptedBody), decipher.final()]).toString('utf8')

  return {
    decryptedBody: JSON.parse(decryptedJSONString) as Record<string, unknown>,
    aesKeyBuffer: decryptedAesKey,
    initialVectorBuffer,
  }
}

/** Encrypt Flow endpoint response (plaintext base64 for HTTP body). */
export function encryptFlowResponsePayload(
  response: Record<string, unknown>,
  aesKeyBuffer: Buffer,
  initialVectorBuffer: Buffer,
): string {
  const flippedIv = Buffer.from(initialVectorBuffer.map((b) => ~b))
  const cipher = crypto.createCipheriv('aes-128-gcm', aesKeyBuffer, flippedIv)
  return Buffer.concat([
    cipher.update(JSON.stringify(response), 'utf8'),
    cipher.final(),
    cipher.getAuthTag(),
  ]).toString('base64')
}
