import { redirect } from "next/navigation"

/** Legacy nested URL; canonical login is `/login`. */
export default function LegacyLoginPathRedirect() {
  redirect("/login")
}
