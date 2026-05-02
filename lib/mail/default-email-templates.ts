import { prisma } from "@/root/lib/prisma"

export const EMAIL_TEMPLATE_KEYS = {
  welcome_customer: "welcome_customer",
  welcome_vendor: "welcome_vendor",
  welcome_driver: "welcome_driver",
  order_placed: "order_placed",
  admin_password_reset: "admin_password_reset",
  admin_account_suspended: "admin_account_suspended",
  admin_account_unsuspended: "admin_account_unsuspended",
} as const

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[keyof typeof EMAIL_TEMPLATE_KEYS]

/** Rows merged into DB when missing (admin Contenu UI + sending fallbacks). */
export const DEFAULT_EMAIL_TEMPLATE_ROWS = [
  {
    key: EMAIL_TEMPLATE_KEYS.welcome_customer,
    labelFr: "Bienvenue (client)",
    subjectFr: "Bienvenue sur AL-baz",
    bodyFr: "Bonjour {{name}},\n\nMerci de nous avoir rejoints.",
    subjectAr: "",
    bodyAr: "",
  },
  {
    key: EMAIL_TEMPLATE_KEYS.welcome_vendor,
    labelFr: "Bienvenue (vendeur)",
    subjectFr: "Votre compte vendeur Albaz est actif",
    bodyFr:
      "Bonjour {{name}},\n\n" +
      "Votre compte vendeur sur Albaz est maintenant ouvert. " +
      "Connectez-vous pour finaliser les informations de votre magasin et gérer vos commandes.\n\n" +
      "Bon vent !",
    subjectAr: "",
    bodyAr: "",
  },
  {
    key: EMAIL_TEMPLATE_KEYS.welcome_driver,
    labelFr: "Bienvenue (livreur)",
    subjectFr: "Votre compte livreur Albaz est actif",
    bodyFr:
      "Bonjour {{name}},\n\n" +
      "Votre compte livreur sur Albaz est maintenant actif. " +
      "Vous pouvez vous connecter pour accepter les courses et suivre vos livraisons.\n\n" +
      "Bonne route !",
    subjectAr: "",
    bodyAr: "",
  },
  {
    key: EMAIL_TEMPLATE_KEYS.order_placed,
    labelFr: "Commande passée",
    subjectFr: "Votre commande #{{orderId}}",
    bodyFr:
      "Bonjour {{name}},\n\nVotre commande a bien été enregistrée.",
    subjectAr: "",
    bodyAr: "",
  },
  {
    key: EMAIL_TEMPLATE_KEYS.admin_password_reset,
    labelFr: "Mot de passe réinitialisé par l’admin",
    subjectFr: "Votre mot de passe Albaz a été modifié",
    bodyFr:
      "Bonjour{{namePart}},\n\n" +
      "Un administrateur a réinitialisé le mot de passe de votre compte Albaz.\n\n" +
      "Pour votre sécurité, nous n’envoyons pas le nouveau mot de passe par e-mail. " +
      "Utilisez les identifiants que votre administrateur vous a communiqués pour vous connecter.\n\n" +
      "Si vous n’êtes pas à l’origine de ce changement, contactez le support immédiatement.",
    subjectAr: "",
    bodyAr: "",
  },
  {
    key: EMAIL_TEMPLATE_KEYS.admin_account_suspended,
    labelFr: "Compte suspendu (notification)",
    subjectFr: "Votre compte Albaz a été suspendu",
    bodyFr:
      "Bonjour{{namePart}},\n\n" +
      "Votre compte Albaz a été suspendu.{{reasonBlock}}\n" +
      "Si vous pensez qu’il s’agit d’une erreur, contactez le support.",
    subjectAr: "",
    bodyAr: "",
  },
  {
    key: EMAIL_TEMPLATE_KEYS.admin_account_unsuspended,
    labelFr: "Compte réactivé (notification)",
    subjectFr: "Votre compte Albaz est de nouveau actif",
    bodyFr:
      "Bonjour{{namePart}},\n\n" +
      "Votre compte Albaz a été réactivé. Vous pouvez à nouveau vous connecter.\n\n" +
      "Si vous n’êtes pas à l’origine de ce message, contactez le support.",
    subjectAr: "",
    bodyAr: "",
  },
] as const

const fallbackByKey = new Map(
  DEFAULT_EMAIL_TEMPLATE_ROWS.map((r) => [
    r.key,
    { subjectFr: r.subjectFr, bodyFr: r.bodyFr },
  ]),
)

let ensurePromise: Promise<void> | null = null

/** Inserts any known default template row that is not yet in the database. */
export function ensureDefaultEmailTemplates(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      const existing = new Set(
        (await prisma.emailTemplate.findMany({ select: { key: true } })).map(
          (t) => t.key,
        ),
      )
      const missing = DEFAULT_EMAIL_TEMPLATE_ROWS.filter(
        (t) => !existing.has(t.key),
      )
      if (missing.length > 0) {
        await prisma.emailTemplate.createMany({
          data: [...missing],
          skipDuplicates: true,
        })
      }
    })()
  }
  return ensurePromise
}

export function getStaticEmailTemplateFallback(key: string): {
  subjectFr: string
  bodyFr: string
} | undefined {
  return fallbackByKey.get(key)
}
