export interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
}

export async function fetchCurrentUser(): Promise<ClientPrincipal | null> {
  const res = await fetch("/.auth/me");
  if (!res.ok) return null;
  const { clientPrincipal } = await res.json();
  return clientPrincipal ?? null;
}

// SWA's /.auth/logout only clears its own session cookie — it doesn't end
// the underlying Entra ID session, so a plain logout redirect immediately
// gets silently re-authenticated via SSO. Chaining through Microsoft's own
// logout endpoint clears that session too before returning to the site.
export function getLogoutUrl(): string {
  const siteRoot = `${window.location.origin}/`;
  const aadLogout = `https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(
    siteRoot
  )}`;
  return `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(aadLogout)}`;
}
