import { useEffect, useState } from "react";
import AdminShell from "../../components/layout/AdminShell";
import api from "../../api/api";

export default function AdminProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    api
      .get("/admin/providers", getAdminHeaders())
      .then(({ data }) => {
        if (mounted) setProviders(data?.data || []);
      })
      .catch(() => setProviders([]))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = providers.filter((provider) =>
    [provider.fullName, provider.email, provider.phone, provider.headline].join(" ").toLowerCase().includes(query.toLowerCase())
  );

  const toggleBlock = async (provider) => {
    const action = provider.isBlocked ? "unblock" : "block";
    try {
      await api.post(`/admin/providers/${provider.id}/${action}`, {}, getAdminHeaders());
      setProviders((current) =>
        current.map((item) => (item.id === provider.id ? { ...item, isBlocked: !item.isBlocked } : item))
      );
    } catch (error) {
      alert(error.response?.data?.message || `Could not ${action} provider.`);
    }
  };

  return (
    <AdminShell
      eyebrow="Provider Management"
      title="All Providers"
      text="Manage all service providers, their status and approvals."
    >
      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter providers by name, headline, or location..."
          className="h-12 w-full max-w-md rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold outline-none focus:border-black"
        />
      </div>

      <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_14px_45px_rgba(0,0,0,0.04)]">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-black/5" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-[#f7f7f5] text-xs font-black uppercase tracking-[0.16em] text-black/45">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th>Headline</th>
                  <th>Price</th>
                  <th>Location</th>
                  <th>Approved</th>
                  <th>KYC</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filtered.length ? (
                  filtered.map((provider) => (
                    <tr key={provider.id} className="transition hover:bg-black/5">
                      <td className="px-5 py-4 font-black text-black">{provider.fullName}</td>
                      <td className="font-semibold text-black/65">{provider.headline || "Not set"}</td>
                      <td className="font-semibold text-black/65">₹{provider.price || "Not set"}/hr</td>
                      <td className="font-semibold text-black/65">{provider.city || "Not set"}</td>
                      <td>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${
                          provider.approved ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-black/65"
                        }`}>
                          {provider.approved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td>
                        <StatusPill status={provider.kycStatus?.toLowerCase() || "pending"} />
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => toggleBlock(provider)}
                          className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-black transition ${
                            provider.isBlocked
                              ? "bg-black/5 text-black/70 hover:bg-black/10"
                              : "bg-red-50 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          {provider.isBlocked ? "Unblock" : "Block"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center text-sm font-black text-black/45">
                      No providers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function getAdminHeaders() {
  const token = localStorage.getItem("buddybook_admin_token") || localStorage.getItem("buddybook_token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

function StatusPill({ status }) {
  const isVerified = status === "verified" || status === "approved";
  const isRejected = status === "rejected";
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
      isVerified ? "bg-emerald-50 text-emerald-700" :
      isRejected ? "bg-red-50 text-red-700" :
      "bg-black/5 text-black/65"
    }`}>
      {status}
    </span>
  );
}