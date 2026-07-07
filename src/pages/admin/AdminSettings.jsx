import { useEffect, useState } from "react";
import { Bell, Globe, Lock, Save, Server, ShieldAlert } from "lucide-react";
import api from "../../api/api";
import AdminShell from "../../components/layout/AdminShell";

const defaultSettings = {
  siteName: "BuddyBOOK",
  supportEmail: "support@buddybook.com",
  contactPhone: "+91 0000000000",
  enableNewRegistrations: true,
  maintenanceMode: false,
  emailNotifications: true,
  smsNotifications: false,
  showRatings: true,
  defaultLanguage: "English",
  currency: "INR",
};

export default function AdminSettings() {
  const [admin, setAdmin] = useState({});
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    try {
      setAdmin(JSON.parse(localStorage.getItem("buddybook_admin_user") || "{}"));
    } catch {
      setAdmin({});
    }

    api
      .get("/admin/content", getAdminHeaders())
      .then(({ data }) => {
        if (!mounted) return;
        const fetched = data?.data || data?.content || {};
        setSettings({ ...defaultSettings, ...(fetched.settings || {}) });
      })
      .catch(() => {
        if (mounted) setMessage("Login as admin again to manage settings.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const update = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const { data } = await api.put("/admin/content", { settings }, getAdminHeaders());
      const fetched = data?.data || {};
      setSettings({ ...defaultSettings, ...(fetched.settings || settings) });
      setMessage("Settings saved successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminShell title="Admin Settings" text="Manage your admin account and platform configuration.">
        <div className="h-72 animate-pulse rounded-2xl bg-black/5" />
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Admin Settings" text="Manage your admin account and platform configuration.">
      <form onSubmit={save} className="grid gap-6">
        <Section icon={Lock} title="Admin Account">
          <div className="grid gap-6 lg:grid-cols-2">
            <ReadOnlyField label="Full Name" value={admin.fullName || "Admin"} />
            <ReadOnlyField label="Email" value={admin.email || "admin@buddybook.com"} />
          </div>
          <p className="text-sm font-semibold text-black/50">
            Admin credentials are managed through environment configuration and cannot be changed here.
          </p>
        </Section>

        <Section icon={Globe} title="General">
          <div className="grid gap-6 lg:grid-cols-2">
            <TextField label="Site Name" value={settings.siteName} onChange={(v) => update("siteName", v)} />
            <TextField label="Support Email" value={settings.supportEmail} onChange={(v) => update("supportEmail", v)} />
            <TextField label="Contact Phone" value={settings.contactPhone} onChange={(v) => update("contactPhone", v)} />
            <TextField label="Default Language" value={settings.defaultLanguage} onChange={(v) => update("defaultLanguage", v)} />
            <TextField label="Currency" value={settings.currency} onChange={(v) => update("currency", v)} />
          </div>
        </Section>

        <Section icon={Server} title="Platform">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Toggle label="New Registrations" description="Allow new users to sign up" value={settings.enableNewRegistrations} onChange={(v) => update("enableNewRegistrations", v)} />
            <Toggle label="Maintenance Mode" description="Temporarily disable the site" value={settings.maintenanceMode} onChange={(v) => update("maintenanceMode", v)} />
            <Toggle label="Show Ratings" description="Display provider ratings publicly" value={settings.showRatings} onChange={(v) => update("showRatings", v)} />
          </div>
        </Section>

        <Section icon={Bell} title="Notifications">
          <div className="grid gap-4 sm:grid-cols-2">
            <Toggle label="Email Notifications" description="Send admin alerts by email" value={settings.emailNotifications} onChange={(v) => update("emailNotifications", v)} />
            <Toggle label="SMS Notifications" description="Send admin alerts by SMS" value={settings.smsNotifications} onChange={(v) => update("smsNotifications", v)} />
          </div>
        </Section>

        <Section icon={ShieldAlert} title="Danger Zone">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div>
              <p className="text-sm font-black text-red-700">Log out of admin panel</p>
              <p className="mt-1 text-sm font-semibold text-red-700/70">End your current admin session on this device.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("buddybook_admin_token");
                localStorage.removeItem("buddybook_admin_user");
                window.location.href = "/admin/login";
              }}
              className="rounded-2xl border border-red-300 bg-white px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100"
            >
              Log out
            </button>
          </div>
        </Section>

        {message ? (
          <p className="rounded-2xl bg-black/5 px-4 py-3 text-sm font-black text-black">{message}</p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black px-8 text-sm font-black text-white transition hover:bg-black/90 disabled:opacity-50 md:w-auto"
        >
          <Save size={17} /> {saving ? "Saving..." : "Save settings"}
        </button>
      </form>
    </AdminShell>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_14px_45px_rgba(0,0,0,0.04)]">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-black">
        <Icon size={18} /> {title}
      </h2>
      {children}
    </section>
  );
}

function TextField({ label, value, onChange }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-black/45">{label}</span>
      <input
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 text-sm font-bold outline-none transition focus:border-black focus:bg-white"
      />
    </label>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-black/45">{label}</span>
      <input
        value={value}
        readOnly
        className="h-12 w-full rounded-2xl border border-black/10 bg-black/5 px-4 text-sm font-bold text-black/60 outline-none"
      />
    </label>
  );
}

function Toggle({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-[#f7f7f5] p-4">
      <div className="min-w-0">
        <p className="text-sm font-black">{label}</p>
        <p className="mt-1 text-xs font-semibold text-black/50">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          value ? "bg-black" : "bg-black/15"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
            value ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function getAdminHeaders() {
  const token = localStorage.getItem("buddybook_admin_token") || localStorage.getItem("buddybook_token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}
