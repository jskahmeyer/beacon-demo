import { useEffect, useState } from "react";
import { SiteMetrics } from "./types";
import { fetchSites } from "./api";
import { ClientPrincipal, fetchCurrentUser, getLogoutUrl } from "./auth";
import { SiteTable } from "./components/SiteTable";
import { SiteDetail } from "./components/SiteDetail";
import { LogInIcon, LogOutIcon } from "./components/icons";

// SWA's /.auth/* endpoints only exist once deployed — there's no real auth
// to check against local `npm run dev`. Stubbing a signed-in user in dev
// mode lets the rest of the app be tested locally; import.meta.env.DEV is
// statically false in production builds, so this branch is dead-code-
// eliminated and can never ship enabled.
const DEV_USER: ClientPrincipal = {
  identityProvider: "dev",
  userId: "local-dev",
  userDetails: "Local Dev User",
  userRoles: ["authenticated"],
};

export default function App() {
  const [sites, setSites] = useState<SiteMetrics[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<ClientPrincipal | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const resolveUser = import.meta.env.DEV ? Promise.resolve(DEV_USER) : fetchCurrentUser();

    resolveUser.then((currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      fetchSites()
        .then((data) => {
          setSites(data);
          if (data.length > 0) setSelectedId(data[0].id);
        })
        .catch(() => setError("Couldn't load site data."))
        .finally(() => setLoading(false));
    });
  }, []);

  const selectedSite = sites.find((s) => s.id === selectedId) ?? null;

  const handleActionUpdate = (
    siteId: string,
    actionStatus: SiteMetrics["actionStatus"],
    actionUpdatedAt: string
  ) => {
    setSites((prev) =>
      prev.map((s) => (s.id === siteId ? { ...s, actionStatus, actionUpdatedAt } : s))
    );
  };

  if (!authChecked) return null;

  if (!user) {
    return (
      <main className="signin-screen">
        <div className="signin-card">
          <h1>Program Risk Monitor</h1>
          <p className="subtitle">Sign in with your Microsoft account to continue.</p>
          <a className="signin-button" href="/.auth/login/aad">
            <LogInIcon className="btn-icon" />
            Sign in with Microsoft
          </a>
        </div>
      </main>
    );
  }

  return (
    <>
      <header>
        <div className="header-inner">
          <div className="header-titles">
            <h1>Program Risk Monitor</h1>
            <p className="subtitle">Proof-of-concept dashboard</p>
          </div>
          {user && (
            <div className="header-user">
              <span>{user.userDetails}</span>
              <a className="signout-link" href={getLogoutUrl()}>
                <LogOutIcon className="btn-icon" />
                Sign out
              </a>
            </div>
          )}
        </div>
      </header>

      <main className="app">
        {loading && <p style={{ padding: "0 24px" }}>Loading sites…</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <div className="layout">
            <SiteTable sites={sites} selectedId={selectedId} onSelect={setSelectedId} />
            {selectedSite && <SiteDetail site={selectedSite} onActionUpdate={handleActionUpdate} />}
          </div>
        )}
      </main>
    </>
  );
}
