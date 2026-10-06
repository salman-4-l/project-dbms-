export function isAdminAuthenticated(): boolean {
  return true
}

export function loginAdmin(): boolean {
  return true
}

export function logoutAdmin(): void {
  // no-op: admin access is no longer gated by a password
}
