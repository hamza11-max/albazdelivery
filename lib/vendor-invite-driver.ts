import { prisma } from "./prisma"
import {
  ForbiddenError,
  ValidationError,
} from "./errors"
import { checkFeatureAccess } from "./featureGate"
import { emitNotificationSent } from "./events"

/**
 * Vendor-initiated link: find an existing DRIVER account and open a PENDING row
 * with `connectionSource` = VENDOR_INVITED.
 */
export async function inviteDriverForVendor(opts: {
  vendorId: string
  vendorDisplayName: string | null | undefined
  email?: string | null
  phone?: string | null
}): Promise<{ created: boolean; alreadyPending: boolean; connectionId: string }> {
  const fleetOk = await checkFeatureAccess(opts.vendorId, "driverFleetManagement")
  if (!fleetOk) {
    throw new ForbiddenError(
      "Driver invitations require Professional plan or higher."
    )
  }

  const emailNorm = opts.email?.trim().toLowerCase() || ""
  const phoneNorm = opts.phone?.trim() || ""
  if (!emailNorm && !phoneNorm) {
    throw new ValidationError("Provide the driver email or phone number.")
  }
  if (emailNorm && phoneNorm) {
    throw new ValidationError("Provide either email or phone, not both.")
  }

  const driver = emailNorm
    ? await prisma.user.findFirst({
        where: {
          email: emailNorm,
          role: "DRIVER",
          status: "APPROVED",
        },
        select: { id: true, name: true },
      })
    : await prisma.user.findFirst({
        where: {
          phone: phoneNorm,
          role: "DRIVER",
          status: "APPROVED",
        },
        select: { id: true, name: true },
      })

  if (!driver) {
    throw new ValidationError(
      "No approved driver account found for that email or phone."
    )
  }

  if (driver.id === opts.vendorId) {
    throw new ValidationError("Invalid driver identifier.")
  }

  const existing = await prisma.driverVendorConnection.findUnique({
    where: {
      driverId_vendorId: { driverId: driver.id, vendorId: opts.vendorId },
    },
  })

  if (existing?.status === "ACCEPTED") {
    throw new ValidationError("This driver is already connected to your store.")
  }

  if (existing?.status === "PENDING") {
    if (existing.connectionSource === "DRIVER_REQUESTED") {
      throw new ValidationError(
        "This driver already sent a connection request. Accept or reject it first."
      )
    }
    return {
      created: false,
      alreadyPending: true,
      connectionId: existing.id,
    }
  }

  if (existing?.status === "REJECTED") {
    const updated = await prisma.driverVendorConnection.update({
      where: { id: existing.id },
      data: {
        status: "PENDING",
        connectionSource: "VENDOR_INVITED",
        requestedAt: new Date(),
        respondedAt: null,
      },
    })
    await notifyDriverOfVendorInvite({
      driverId: driver.id,
      vendorName:
        opts.vendorDisplayName?.trim() || "Un commerçant",
    })
    return {
      created: true,
      alreadyPending: false,
      connectionId: updated.id,
    }
  }

  const createdConn = await prisma.driverVendorConnection.create({
    data: {
      driverId: driver.id,
      vendorId: opts.vendorId,
      status: "PENDING",
      connectionSource: "VENDOR_INVITED",
    },
  })

  await notifyDriverOfVendorInvite({
    driverId: driver.id,
    vendorName: opts.vendorDisplayName?.trim() || "Un commerçant",
  })

  return {
    created: true,
    alreadyPending: false,
    connectionId: createdConn.id,
  }
}

async function notifyDriverOfVendorInvite(args: {
  driverId: string
  vendorName: string
}) {
  const notification = await prisma.notification.create({
    data: {
      recipientId: args.driverId,
      recipientRole: "DRIVER",
      type: "SYSTEM",
      title: "Invitation commerçant",
      message: `${args.vendorName} vous invite à vous connecter.`,
      actionUrl: "/driver?tab=vendors",
    },
  })
  emitNotificationSent(notification)
}
