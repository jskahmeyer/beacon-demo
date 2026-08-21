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
