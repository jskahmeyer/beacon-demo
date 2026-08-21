import { useEffect, useState } from "react";
import { SiteMetrics } from "./types";
import { fetchSites } from "./api";
import { ClientPrincipal, fetchCurrentUser } from "./auth";
import { SiteTable } from "./components/SiteTable";
import { SiteDetail } from "./components/SiteDetail";

export default function App() {
  const [sites, setSites] = useState<SiteMetrics[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<ClientPrincipal | null>(null);

  useEffect(() => {
    fetchSites()
      .then((data) => {
        setSites(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(() => setError("Couldn't load site data."))
      .finally(() => setLoading(false));

    fetchCurrentUser().then(setUser);
  }, []);

  const selectedSite = sites.find((s) => s.id === selectedId) ?? null;

  return (
    <>
      <header>
        <div className="header-inner">
          <div className="header-titles">
            <h1>Program Risk Monitor</h1>
            <p className="subtitle">Proof-of-concept dashboard — entirely synthetic data</p>
          </div>
          {user && (
            <div className="header-user">
              <span>{user.userDetails}</span>
              <a href="/.auth/logout">Sign out</a>
            </div>
          )}
        </div>
      </header>

      <div className="app">
        {loading && <p style={{ padding: "0 24px" }}>Loading sites…</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <div className="layout">
            <SiteTable sites={sites} selectedId={selectedId} onSelect={setSelectedId} />
            {selectedSite && <SiteDetail site={selectedSite} />}
          </div>
        )}
      </div>
    </>
  );
}
