import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  CheckCircle2,
  Edit3,
  Heart,
  Languages,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  User,
} from "lucide-react";
import UserAppLayout from "../../components/users/UserAppLayout";
import api from "../../api/api";
import { getReceivedReviews } from "../../utils/userFlowStorage";

const fallbackAvatar =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&auto=format&fit=crop";

export default function UserProfile() {
  const [user, setUser] = useState(() => readUser());
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => userToForm(readUser()));
  const reviews = getReceivedReviews("USER");

  useEffect(() => {
    let mounted = true;
    api
      .get("/auth/me")
      .then((response) => {
        const nextUser =
          response.data?.user || response.data?.data?.user || response.data?.data;
        if (!mounted || !nextUser) return;
        setUser((current) => ({ ...current, ...nextUser }));
        setForm(userToForm({ ...readUser(), ...nextUser }));
        localStorage.setItem("buddybook_auth_user", JSON.stringify({ ...readUser(), ...nextUser }));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const profile = user?.userProfile || {};
  const interests = useMemo(
    () =>
      String(profile.interests || profile.preferredActivities || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [profile.interests, profile.preferredActivities]
  );
  const avatar = user?.profileImage || user?.avatar || profile.avatar || fallbackAvatar;
  const averageRating = reviews.length
    ? (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1)
    : "New";

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const saveProfile = async () => {
    try {
      setSaving(true);
      const payload = {
        fullName: form.fullName,
        email: form.email,
        city: form.city,
        state: form.state,
        gender: form.gender,
        userProfile: {
          bio: form.bio,
          interests: form.interests,
          preferredActivities: form.preferredActivities,
          preferredLanguage: form.preferredLanguage,
          emergencyContact: form.emergencyContact,
        },
      };
      const response = await api.patch("/auth/me", payload);
      const nextUser = response.data?.user || response.data?.data || { ...user, ...payload, userProfile: payload.userProfile };
      setUser(nextUser);
      localStorage.setItem("buddybook_auth_user", JSON.stringify(nextUser));
      setEditing(false);
    } catch (error) {
      alert(error.response?.data?.message || "Profile could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <UserAppLayout title="Profile" user={user}>
      <section className="min-h-full rounded-[1.5rem] border border-[#eddac7] bg-[#fffaf3] p-4 shadow-sm lg:p-6">
        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="h-max rounded-2xl border border-[#eddac7] bg-white p-5">
            <img
              src={avatar}
              alt={user?.fullName || "User profile"}
              className="h-44 w-44 rounded-[1.5rem] object-cover shadow-[0_18px_42px_rgba(0,0,0,0.12)]"
            />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-black">{user?.fullName || "BuddyBOOK User"}</h2>
              <button type="button" onClick={() => setEditing((value) => !value)} className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-2 text-[10px] font-black text-[#fffaf3]">
                <Edit3 size={12} /> {editing ? "Close" : "Edit"}
              </button>
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm font-bold text-[#6b5d52]">
              <MapPin size={16} /> {user?.city || "City not added"}{user?.state ? `, ${user.state}` : ""}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <StatusTile icon={Mail} label="Email status" value={user?.emailVerified || user?.email ? "Verified" : "Pending"} />
              <StatusTile icon={Phone} label="Phone status" value={user?.mobileVerified || user?.phone ? "Verified" : "Pending"} />
              <StatusTile icon={Heart} label="Interest tags" value={`${interests.length} added`} />
              <StatusTile icon={Star} label="Rating" value={averageRating} />
            </div>
          </aside>

          <div className="grid gap-5">
            <Panel title="Registered Details" icon={User}>
              {editing ? (
                <EditableProfileForm form={form} onChange={updateForm} onSave={saveProfile} saving={saving} phone={user?.phone} aadhaarLast4={user?.aadhaarLast4} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Full name" value={user?.fullName} />
                  <Info label="Phone" value={user?.phone} />
                  <Info label="Email" value={user?.email || "Optional email not added"} />
                  <Info label="Gender" value={user?.gender} />
                  <Info label="Document type" value={user?.documentType || "KYC document"} />
                  <Info label="Document last 4" value={user?.aadhaarLast4 ? `**** ${user.aadhaarLast4}` : "Saved securely"} />
                  <Info label="Emergency contact" value={profile.emergencyContact} />
                  <Info label="Preferred language" value={profile.preferredLanguage} />
                </div>
              )}
            </Panel>

            <Panel title="Interests And Preferences" icon={BadgeCheck}>
              <div className="flex flex-wrap gap-2">
                {(interests.length ? interests : ["Movie", "Cafe", "City walk", "Food exploring", "Shopping"]).map((item) => (
                  <span key={item} className="rounded-full border border-[#eddac7] bg-[#ffeedd] px-4 py-2 text-sm font-black text-black">
                    {item}
                  </span>
                ))}
              </div>
            </Panel>

            <Panel title="Profile Answers" icon={Languages}>
              <div className="grid gap-3">
                {normalizeQuestions(profile.profileQuestions, profile.bio).map((item, index) => (
                  <div key={`${item.question}-${index}`} className="rounded-2xl bg-[#fffaf3] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#e08c4c]">{item.question}</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-black">{item.answer}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Safety Verification" icon={ShieldCheck}>
              <div className="grid gap-3 sm:grid-cols-3">
                {["Mobile verified", "Email verified", "KYC submitted"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#fffaf3] p-4">
                    <CheckCircle2 size={19} className="text-[#e08c4c]" />
                    <p className="text-sm font-black text-black">{item}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </section>
    </UserAppLayout>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-[#eddac7] bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-black text-[#fffaf3]">
          <Icon size={18} />
        </span>
        <h3 className="text-lg font-black text-black">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function StatusTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-[#fffaf3] p-4">
      <Icon size={18} className="text-[#e08c4c]" />
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#8b7563]">{label}</p>
      <p className="mt-1 text-sm font-black text-black">{value}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#fffaf3] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8b7563]">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-black">{value || "Not added"}</p>
    </div>
  );
}

function EditableProfileForm({ form, onChange, onSave, saving, phone, aadhaarLast4 }) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <EditField label="Full name" value={form.fullName} onChange={(value) => onChange("fullName", value)} />
        <Info label="Phone" value={phone || "Not added"} />
        <EditField label="Email" value={form.email} onChange={(value) => onChange("email", value)} />
        <EditField label="Gender" value={form.gender} onChange={(value) => onChange("gender", value)} />
        <EditField label="City" value={form.city} onChange={(value) => onChange("city", value)} />
        <EditField label="State" value={form.state} onChange={(value) => onChange("state", value)} />
        <Info label="Document last 4" value={aadhaarLast4 ? `**** ${aadhaarLast4}` : "Saved securely"} />
        <EditField label="Emergency contact" value={form.emergencyContact} onChange={(value) => onChange("emergencyContact", value)} />
        <EditField label="Preferred language" value={form.preferredLanguage} onChange={(value) => onChange("preferredLanguage", value)} />
        <EditField label="Interests" value={form.interests} onChange={(value) => onChange("interests", value)} />
        <EditField label="Preferred activities" value={form.preferredActivities} onChange={(value) => onChange("preferredActivities", value)} wide />
      </div>
      <label className="grid gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8b7563]">Bio</span>
        <textarea
          value={form.bio}
          onChange={(event) => onChange("bio", event.target.value)}
          className="min-h-[110px] rounded-2xl border border-[#eddac7] bg-[#fffaf3] p-4 text-sm font-bold outline-none focus:border-black"
        />
      </label>
      <button type="button" onClick={onSave} disabled={saving} className="w-max rounded-2xl bg-black px-5 py-3 text-sm font-black text-[#fffaf3] disabled:opacity-50">
        {saving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}

function EditField({ label, value, onChange, wide }) {
  return (
    <label className={`grid gap-2 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8b7563]">{label}</span>
      <input
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl border border-[#eddac7] bg-[#fffaf3] px-4 text-sm font-bold outline-none focus:border-black"
      />
    </label>
  );
}

function normalizeQuestions(questions, bio) {
  if (Array.isArray(questions) && questions.length) {
    return questions.filter((item) => item.question && item.answer);
  }
  if (bio) {
    return String(bio)
      .split("\n")
      .map((line) => {
        const [question, ...answer] = line.split(":");
        return { question: question || "About me", answer: answer.join(":").trim() || line };
      })
      .filter((item) => item.answer);
  }
  return [{ question: "Profile note", answer: "Complete your registration details to enrich this section." }];
}

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("buddybook_auth_user") || "null");
  } catch {
    return null;
  }
}

function userToForm(user) {
  const profile = user?.userProfile || {};
  return {
    fullName: user?.fullName || "",
    email: user?.email || "",
    city: user?.city || "",
    state: user?.state || "",
    gender: user?.gender || "",
    bio: profile.bio || "",
    interests: profile.interests || "",
    preferredActivities: profile.preferredActivities || profile.activityPreferences || "",
    preferredLanguage: profile.preferredLanguage || "",
    emergencyContact: profile.emergencyContact || "",
  };
}
