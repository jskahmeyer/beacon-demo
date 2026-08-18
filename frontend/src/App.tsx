import { useEffect, useState } from "react";
import { SiteMetrics } from "./types";
import { fetchSites } from "./api";
import { SiteTable } from "./components/SiteTable";
import { SiteDetail } from "./components/SiteDetail";

export default function App() {
  const [sites, setSites] = useState<SiteMetrics[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSites()
      .then((data) => {
        setSites(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(() => setError("Couldn't load site data."))
      .finally(() => setLoading(false));
  }, []);

  const selectedSite = sites.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="app">
      <header>
        <h1>Program Risk Monitor</h1>
        <p className="subtitle">Proof-of-concept dashboard — entirely synthetic data</p>
      </header>

      {loading && <p style={{ padding: "0 24px" }}>Loading sites…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="layout">
          <SiteTable sites={sites} selectedId={selectedId} onSelect={setSelectedId} />
          {selectedSite && <SiteDetail site={selectedSite} />}
        </div>
      )}
    </div>
  );
}
