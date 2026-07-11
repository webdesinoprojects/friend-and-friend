import { useEffect, useState } from "react";
import { AlignLeft, ArrowDown, ArrowUp, Eye, Image, ListFilter, PanelLeft, Quote, Save, Type } from "lucide-react";
import api from "../../api/api";
import AdminShell from "../../components/layout/AdminShell";
import ImageField from "../../components/admin/ImageField";

const tabs = [
  ["homepage", "Homepage"],
  ["stats", "Stats"],
  ["filters", "Filters & Cards"],
  ["testimonials", "Testimonials"],
  ["userPanel", "User Panel"],
  ["providerPanel", "Provider Panel"],
  ["pages", "Other Pages"],
];

const fieldGroups = {
  homepage: [
    ["heroTitle", "Hero title", "text"],
    ["heroHighlight", "Hero highlight", "text"],
    ["heroImage", "Hero image URL", "text"],
    ["communityTitle", "Community title", "text"],
    ["trustTitle", "Trust title", "text"],
  ],
  stats: [
    ["statVerifiedMembers", "Verified members number", "text"],
    ["statVerifiedMembersLabel", "Verified members label", "text"],
    ["statPlansCreated", "Plans created number", "text"],
    ["statPlansCreatedLabel", "Plans created label", "text"],
    ["statAverageRating", "Average rating number", "text"],
    ["statAverageRatingLabel", "Average rating label", "text"],
  ],
  filters: [
    ["filterSectionTitle", "Provider section title", "text"],
    ["filterUsernameLabel", "Username filter label", "text"],
    ["filterLocationLabel", "Location filter label", "text"],
    ["filterStateLabel", "State filter label", "text"],
    ["filterActivityLabel", "Activity filter label", "text"],
    ["filterSortLabel", "Sort label", "text"],
    ["filterPrivacyLabel", "Privacy label", "text"],
    ["filterGenderLabel", "Gender label", "text"],
    ["filterMaxPriceLabel", "Max price label", "text"],
    ["providerCardPrimaryCta", "Provider card button text", "text"],
    ["providerCardBadgeText", "Provider card badge text", "text"],
    ["providerCardPriceSuffix", "Provider card price suffix", "text"],
  ],
  userPanel: [
    ["userPanelTitle", "User panel title", "text"],
    ["userPanelWelcomeText", "Welcome text", "text"],
    ["userDashboardTitle", "Dashboard provider title", "text"],
    ["userWatchlistTitle", "Watchlist title", "text"],
    ["userBookingsTitle", "Bookings title", "text"],
  ],
  providerPanel: [
    ["providerPanelTitle", "Provider panel title", "text"],
    ["providerDashboardTitle", "Provider dashboard title", "text"],
    ["providerProfileTitle", "Provider profile title", "text"],
    ["providerEarningsTitle", "Provider earnings title", "text"],
  ],
  pages: [
    ["aboutUsText", "About Us Content", "textarea"],
    ["termsText", "Terms & Conditions", "textarea"],
    ["privacyText", "Privacy Policy", "textarea"],
  ],
};

const emptyTestimonial = { name: "", role: "", rating: "5", image: "", text: "", published: true };
const CONTENT_CACHE_KEY = "buddybook_site_content_preview";

export default function AdminContent() {
  const [content, setContent] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("homepage");

  useEffect(() => {
    let mounted = true;
    api
      .get("/admin/content", getAdminHeaders())
      .then(({ data }) => {
        if (mounted) setContent(data?.data || data?.content || data || {});
      })
      .catch(() => {
        if (mounted) {
          const cached = readCachedContent();
          if (cached) setContent(cached);
          setMessage(cached ? "Showing your locally saved website content." : "Login as admin again to manage content.");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (key, value) => {
    setContent((current) => ({ ...current, [key]: value }));
  };

  const updateTestimonial = (index, key, value) => {
    setContent((current) => {
      const testimonials = normalizeTestimonials(current.testimonials);
      testimonials[index] = { ...testimonials[index], [key]: value };
      return { ...current, testimonials };
    });
  };

  const addTestimonial = () => {
    setContent((current) => ({
      ...current,
      testimonials: normalizeTestimonials(current.testimonials).length >= 15
        ? normalizeTestimonials(current.testimonials)
        : [...normalizeTestimonials(current.testimonials), emptyTestimonial],
    }));
  };

  const removeTestimonial = (index) => {
    setContent((current) => ({
      ...current,
      testimonials: normalizeTestimonials(current.testimonials).filter((_, itemIndex) => itemIndex !== index),
    }));
  };
  const moveTestimonial = (index, direction) => setContent((current) => { const rows=[...normalizeTestimonials(current.testimonials)]; const target=index+direction; if(target<0||target>=rows.length)return current; [rows[index],rows[target]]=[rows[target],rows[index]]; return {...current,testimonials:rows}; });

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const nextContent = { ...content, updatedAt: new Date().toISOString(), _previewUpdatedAt: Date.now() };
    setContent(nextContent);
    localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(nextContent));
    window.dispatchEvent(new CustomEvent("buddybook:content-updated", { detail: nextContent }));

    try {
      const { data } = await api.put("/admin/content", nextContent, getAdminHeaders());
      const savedContent = data?.data || nextContent;
      setContent(savedContent);
      localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(savedContent));
      setMessage("Website content saved successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Saved for local preview. Deploy the backend migration to sync it for everyone.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      title="Content Management"
      text="Edit homepage, filters, profile cards, testimonials, user panel and provider panel content."
    >
      <div className="mb-6 flex flex-wrap gap-3">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`rounded-full px-5 py-2.5 text-sm font-black transition ${
              activeTab === key ? "bg-black text-white" : "bg-white text-black/60 hover:bg-black/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={save} className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_14px_45px_rgba(0,0,0,0.04)]">
        {loading ? (
          <div className="h-72 animate-pulse rounded-2xl bg-black/5" />
        ) : activeTab === "testimonials" ? (
          <TestimonialsEditor
            testimonials={normalizeTestimonials(content.testimonials)}
            onAdd={addTestimonial}
            onRemove={removeTestimonial}
            onChange={updateTestimonial}
            onMessage={setMessage}
            onMove={moveTestimonial}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {(fieldGroups[activeTab] || []).map(([key, label, type]) =>
              key === "heroImage" ? (
                <ImageField
                  key={key}
                  label={label}
                  value={content[key] || ""}
                  onChange={(value) => updateField(key, value)}
                  onMessage={setMessage}
                />
              ) : (
                <ContentField
                  key={key}
                  fieldKey={key}
                  label={label}
                  type={type}
                  value={content[key] || ""}
                  onChange={updateField}
                />
              )
            )}
          </div>
        )}

        {message ? (
          <p className="mt-6 rounded-2xl bg-black/5 px-4 py-3 text-sm font-black text-black">
            {message}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3"><a href="/" target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-2 rounded-2xl border border-black/10 bg-white px-6 text-sm font-black"><Eye size={17}/>Preview homepage</a><button
          type="submit"
          disabled={saving || loading}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black px-8 text-sm font-black text-white transition hover:bg-black/90 disabled:opacity-50 md:w-auto"
        >
          <Save size={17} /> {saving ? "Saving..." : "Save website content"}
        </button></div>
      </form>
    </AdminShell>
  );
}

function readCachedContent() {
  try { return JSON.parse(localStorage.getItem(CONTENT_CACHE_KEY) || "null"); } catch { return null; }
}

function ContentField({ fieldKey, label, type, value, onChange }) {
  const Icon = getIcon(fieldKey, type);

  return (
    <label className={type === "textarea" ? "lg:col-span-2" : ""}>
      <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-black/45">
        <Icon size={15} /> {label}
      </span>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(event) => onChange(fieldKey, event.target.value)}
          rows={6}
          className="w-full resize-y rounded-2xl border border-black/10 bg-[#f7f7f5] p-4 text-sm font-bold leading-6 outline-none transition focus:border-black focus:bg-white"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(fieldKey, event.target.value)}
          className="h-12 w-full rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 text-sm font-bold outline-none transition focus:border-black focus:bg-white"
        />
      )}
    </label>
  );
}

function TestimonialsEditor({ testimonials, onAdd, onRemove, onChange, onMessage, onMove }) {
  const [dragIndex, setDragIndex] = useState(null);
  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Testimonials</h2>
          <p className="mt-1 text-sm font-semibold text-black/50">Add and organise up to 15 testimonials ({testimonials.length}/15).</p>
        </div>
        <button type="button" onClick={onAdd} disabled={testimonials.length >= 15} className="rounded-2xl bg-black px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45">
          {testimonials.length >= 15 ? "Maximum reached" : "Add testimonial"}
        </button>
      </div>

      {testimonials.map((item, index) => (
        <div key={index} draggable onDragStart={()=>setDragIndex(index)} onDragOver={(event)=>event.preventDefault()} onDrop={()=>{if(dragIndex!==null&&dragIndex!==index)onMove(dragIndex,index-dragIndex);setDragIndex(null);}} className="grid cursor-grab gap-4 rounded-2xl border border-black/10 bg-[#f7f7f5] p-4 active:cursor-grabbing lg:grid-cols-2">
          <ContentField fieldKey="name" label="Name" type="text" value={item.name} onChange={(key, value) => onChange(index, key, value)} />
          <ContentField fieldKey="role" label="Role / city" type="text" value={item.role || item.city || ""} onChange={(key, value) => onChange(index, key, value)} />
          <ContentField fieldKey="rating" label="Rating" type="text" value={item.rating || "5"} onChange={(key, value) => onChange(index, key, value)} />
          <ImageField
            label="Profile Image"
            hideUrl
            value={item.image || ""}
            onChange={(value) => onChange(index, "image", value)}
            onMessage={onMessage}
          />
          <ContentField fieldKey="text" label="Testimonial text" type="textarea" value={item.text} onChange={(key, value) => onChange(index, key, value)} />
          <label className="flex items-center gap-3 text-sm font-black"><input type="checkbox" checked={item.published !== false} onChange={(event)=>onChange(index,"published",event.target.checked)} className="h-5 w-5"/>Published on homepage</label>
          <div className="flex gap-2"><button type="button" onClick={()=>onMove(index,-1)} disabled={!index} className="rounded-xl border bg-white p-3 disabled:opacity-30" aria-label="Move up"><ArrowUp size={17}/></button><button type="button" onClick={()=>onMove(index,1)} disabled={index===testimonials.length-1} className="rounded-xl border bg-white p-3 disabled:opacity-30" aria-label="Move down"><ArrowDown size={17}/></button></div>
          <button type="button" onClick={() => onRemove(index)} className="w-fit rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-black text-black">
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

function normalizeTestimonials(value) {
  return Array.isArray(value) && value.length ? value : [emptyTestimonial];
}

function getIcon(key, type) {
  if (type === "textarea") return AlignLeft;
  if (key.toLowerCase().includes("image")) return Image;
  if (key.toLowerCase().includes("filter") || key.toLowerCase().includes("card")) return ListFilter;
  if (key.toLowerCase().includes("panel")) return PanelLeft;
  if (key.toLowerCase().includes("testimonial")) return Quote;
  return Type;
}

function getAdminHeaders() {
  const token = localStorage.getItem("buddybook_admin_token") || localStorage.getItem("buddybook_token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}
