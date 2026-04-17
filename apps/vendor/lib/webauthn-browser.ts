function toBase64Url(uint8Array: Uint8Array): string {
  const binary = String.fromCharCode(...uint8Array)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function fromBase64Url(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

export function supportsWebAuthnInBrowser(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential
}

export function buildRegistrationCreationOptions(options: any): CredentialCreationOptions {
  return {
    publicKey: {
      ...options,
      challenge: fromBase64Url(options.challenge),
      user: {
        ...options.user,
        id: fromBase64Url(options.user.id),
      },
      excludeCredentials: Array.isArray(options.excludeCredentials)
        ? options.excludeCredentials.map((credential: any) => ({
            ...credential,
            id: fromBase64Url(credential.id),
          }))
        : [],
    },
  }
}

export function buildAuthenticationRequestOptions(options: any): CredentialRequestOptions {
  return {
    publicKey: {
      ...options,
      challenge: fromBase64Url(options.challenge),
      allowCredentials: Array.isArray(options.allowCredentials)
        ? options.allowCredentials.map((credential: any) => ({
            ...credential,
            id: fromBase64Url(credential.id),
          }))
        : [],
    },
  }
}

export function serializeCredentialId(credential: PublicKeyCredential): string {
  return toBase64Url(new Uint8Array(credential.rawId))
}

export function serializeAuthenticatorTransports(credential: PublicKeyCredential): string[] {
  const response = credential.response as AuthenticatorAttestationResponse
  if (!response?.getTransports) return []
  return response.getTransports().map((transport) => String(transport))
}

function serializeArrayBuffer(input: ArrayBuffer | null): string {
  if (!input) return ""
  return toBase64Url(new Uint8Array(input))
}

export function serializeRegistrationCredential(credential: PublicKeyCredential) {
  const response = credential.response as AuthenticatorAttestationResponse
  return {
    id: credential.id,
    rawId: serializeArrayBuffer(credential.rawId),
    type: credential.type,
    response: {
      attestationObject: serializeArrayBuffer(response.attestationObject),
      clientDataJSON: serializeArrayBuffer(response.clientDataJSON),
      transports: serializeAuthenticatorTransports(credential),
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  }
}

export function serializeAuthenticationCredential(credential: PublicKeyCredential) {
  const response = credential.response as AuthenticatorAssertionResponse
  return {
    id: credential.id,
    rawId: serializeArrayBuffer(credential.rawId),
    type: credential.type,
    response: {
      authenticatorData: serializeArrayBuffer(response.authenticatorData),
      clientDataJSON: serializeArrayBuffer(response.clientDataJSON),
      signature: serializeArrayBuffer(response.signature),
      userHandle: serializeArrayBuffer(response.userHandle),
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  }
}
