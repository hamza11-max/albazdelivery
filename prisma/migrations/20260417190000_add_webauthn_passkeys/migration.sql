-- WebAuthn passkeys: credential lifecycle, challenge tracking, and audit events

CREATE TYPE "WebAuthnCredentialStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED');
CREATE TYPE "WebAuthnChallengePurpose" AS ENUM ('REGISTRATION', 'AUTHENTICATION');
CREATE TYPE "PasskeyAuditAction" AS ENUM (
  'REGISTRATION_OPTIONS_ISSUED',
  'REGISTRATION_COMPLETED_PENDING',
  'AUTH_OPTIONS_ISSUED',
  'AUTH_SUCCESS',
  'AUTH_FAILED',
  'ADMIN_APPROVED',
  'ADMIN_REJECTED',
  'ADMIN_REVOKED'
);

CREATE TABLE "WebAuthnCredential" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "credentialId" TEXT NOT NULL,
  "publicKey" TEXT NOT NULL,
  "counter" INTEGER NOT NULL DEFAULT 0,
  "transports" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "deviceType" TEXT,
  "backedUp" BOOLEAN NOT NULL DEFAULT false,
  "nickname" TEXT,
  "status" "WebAuthnCredentialStatus" NOT NULL DEFAULT 'PENDING',
  "approvedAt" TIMESTAMP(3),
  "approvedBy" TEXT,
  "revokedAt" TIMESTAMP(3),
  "revokedBy" TEXT,
  "revocationReason" TEXT,
  "lastUsedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WebAuthnCredential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebAuthnChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "challenge" TEXT NOT NULL,
  "purpose" "WebAuthnChallengePurpose" NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebAuthnChallenge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebAuthnPasskeyAuthGrant" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebAuthnPasskeyAuthGrant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PasskeyAuditLog" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT,
  "targetUserId" TEXT,
  "credentialId" TEXT,
  "action" "PasskeyAuditAction" NOT NULL,
  "details" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasskeyAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WebAuthnCredential_credentialId_key" ON "WebAuthnCredential"("credentialId");
CREATE INDEX "WebAuthnCredential_userId_idx" ON "WebAuthnCredential"("userId");
CREATE INDEX "WebAuthnCredential_status_idx" ON "WebAuthnCredential"("status");
CREATE INDEX "WebAuthnCredential_approvedAt_idx" ON "WebAuthnCredential"("approvedAt");
CREATE INDEX "WebAuthnCredential_revokedAt_idx" ON "WebAuthnCredential"("revokedAt");

CREATE UNIQUE INDEX "WebAuthnChallenge_challenge_key" ON "WebAuthnChallenge"("challenge");
CREATE INDEX "WebAuthnChallenge_userId_idx" ON "WebAuthnChallenge"("userId");
CREATE INDEX "WebAuthnChallenge_purpose_idx" ON "WebAuthnChallenge"("purpose");
CREATE INDEX "WebAuthnChallenge_expiresAt_idx" ON "WebAuthnChallenge"("expiresAt");
CREATE INDEX "WebAuthnChallenge_consumedAt_idx" ON "WebAuthnChallenge"("consumedAt");

CREATE UNIQUE INDEX "WebAuthnPasskeyAuthGrant_tokenHash_key" ON "WebAuthnPasskeyAuthGrant"("tokenHash");
CREATE INDEX "WebAuthnPasskeyAuthGrant_userId_idx" ON "WebAuthnPasskeyAuthGrant"("userId");
CREATE INDEX "WebAuthnPasskeyAuthGrant_expiresAt_idx" ON "WebAuthnPasskeyAuthGrant"("expiresAt");
CREATE INDEX "WebAuthnPasskeyAuthGrant_consumedAt_idx" ON "WebAuthnPasskeyAuthGrant"("consumedAt");

CREATE INDEX "PasskeyAuditLog_actorUserId_idx" ON "PasskeyAuditLog"("actorUserId");
CREATE INDEX "PasskeyAuditLog_targetUserId_idx" ON "PasskeyAuditLog"("targetUserId");
CREATE INDEX "PasskeyAuditLog_credentialId_idx" ON "PasskeyAuditLog"("credentialId");
CREATE INDEX "PasskeyAuditLog_action_idx" ON "PasskeyAuditLog"("action");
CREATE INDEX "PasskeyAuditLog_createdAt_idx" ON "PasskeyAuditLog"("createdAt");

ALTER TABLE "WebAuthnCredential"
  ADD CONSTRAINT "WebAuthnCredential_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
