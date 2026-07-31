import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";
import AdminShell from "../../components/layout/AdminShell";
import api from "../../api/api";
import { getAdminPage } from "../../api/admin";
import { formatRs } from "../../utils/format";

export default function AdminProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    let mounted = true;
    getAdminPage("/admin/providers", getAdminHeaders())
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
    const ok = window.confirm(`Are you sure you want to ${action} ${provider.fullName}?`);
    if (!ok) return;
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
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Headline</th>
                  <th>Price</th>
                  <th>Location</th>
                  <th>Aadhaar</th>
                  <th>Selfie</th>
                  <th>Approved</th>
                  <th>KYC</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filtered.length ? (
                  filtered.map((provider) => (
                    <tr key={provider.id} className="transition hover:bg-black/5">
                      <td className="px-5 py-4 font-black text-black">{provider.fullName}{provider.accountDeleted ? <span className="mt-1 block text-[10px] uppercase tracking-wider text-rose-600">Deleted {formatDate(provider.deletedAt)}</span> : null}</td>
                      <td className="font-semibold text-black/65">{provider.email || "Not added"}</td>
                      <td className="font-semibold text-black/65">{provider.phone || "Not added"}</td>
                      <td className="font-semibold text-black/65">{provider.headline || "Not set"}</td>
                      <td className="font-semibold text-black/65">{provider.price ? `${formatRs(provider.price)}/hr` : "Not set"}</td>
                      <td className="font-semibold text-black/65">{provider.city || "Not set"}</td>
                      <td className="font-black text-black">{provider.aadhaarLast4 ? `**** ${provider.aadhaarLast4}` : "-"}</td>
                      <td>
                        {provider.referenceSelfie ? (
                          <button type="button" onClick={() => setPreviewImage(provider.referenceSelfie)} className="grid h-9 w-9 place-items-center rounded-full bg-black text-white">
                            <Eye size={16} />
                          </button>
                        ) : "-"}
                      </td>
                      <td>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${
                          provider.accountDeleted ? "bg-rose-50 text-rose-700" : provider.accountDisabled ? "bg-amber-50 text-amber-700" : provider.approved ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-black/65"
                        }`}>
                          {provider.accountDeleted ? "Account deleted" : provider.accountDisabled ? "Temporarily disabled" : provider.approved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td>
                        {provider.accountDeleted ? <span className="text-black/30">—</span> : <StatusPill status={provider.kycStatus?.toLowerCase() || "pending"} />}
                      </td>
                      <td>
                        {provider.accountDeleted ? <span className="inline-flex rounded-full bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-700">Deleted</span> : <button
                          type="button"
                          onClick={() => toggleBlock(provider)}
                          className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-black transition ${
                            provider.isBlocked
                              ? "bg-black/5 text-black/70 hover:bg-black/10"
                              : "bg-red-50 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          {provider.isBlocked ? "Unblock" : "Block"}
                        </button>}
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
      {previewImage ? <ImagePreview src={previewImage} onClose={() => setPreviewImage(null)} /> : null}
    </AdminShell>
  );
}

function ImagePreview({ src, onClose }) {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/55 p-4" onClick={onClose}>
      <div className="relative max-w-sm rounded-3xl bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black text-white"><X size={16} /></button>
        <img src={src} alt="Live selfie" className="max-h-[70vh] w-full rounded-2xl object-contain" />
      </div>
    </div>
  );
}

function getAdminHeaders() {
  return {};
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
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
