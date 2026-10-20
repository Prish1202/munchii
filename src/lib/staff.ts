// Staff sign in with Outlet Code + Username. Auth needs an email, so we derive a
// private, deterministic address that is never shown or emailed.
export const staffEmail = (outletCode: string, username: string) =>
  `${outletCode.trim().toLowerCase()}.${username.trim().replace(/^@/, '').toLowerCase()}@staff.munchii.in`;

export const STAFF_USERNAME_RE = /^[a-z0-9_.]{3,20}$/;
