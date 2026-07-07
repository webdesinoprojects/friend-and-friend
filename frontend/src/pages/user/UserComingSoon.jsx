import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Edit2,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import UserAppLayout from "../../components/users/UserAppLayout";

const fallbackAvatar =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop";

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("buddybook_auth_user") || "null");
  } catch {
    return null;
  }
}

function safely(value) {
  return value || "Not added yet";
}

function splitList(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildFormState(user) {
  return {
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city: user?.city || "",
    state: user?.state || "",
    gender: user?.gender || "",
    role: user?.role || "USER",
    preferredLanguage: user?.userProfile?.preferredLanguage || "",
    emergencyContact: user?.userProfile?.emergencyContact || "",
    interests: user?.userProfile?.interests || "",
    bio: user?.userProfile?.bio || "",
    profession: user?.providerProfile?.profession || "",
    education: user?.providerProfile?.education || "",
    height: user?.providerProfile?.height || "",
    hobbies: user?.providerProfile?.hobbies || "",
    hourlyPrice: user?.providerProfile?.hourlyPrice || "",
    availableCity: user?.providerProfile?.availableCity || "",
    providerLanguages: user?.providerProfile?.languages || "",
    availabilityDays: user?.providerProfile?.availabilityDays || "",
  };
}

export default function UserComingSoon({ title = "Profile" }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(() => buildFormState(user));
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    setForm(buildFormState(user));
  }, [user]);

  const activityTags = useMemo(
    () => splitList(user?.userProfile?.interests),
    [user]
  );

  const profileQuestions = user?.userProfile?.profileQuestions || [];
  const providerQuestions = user?.providerProfile?.profileQuestions || [];
  const userRoleLabel = user?.role === "PROVIDER" ? "Verified provider" : "User";

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!user) return;

    const nextUser = {
      ...user,
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      city: form.city,
      state: form.state,
      gender: form.gender,
      userProfile: {
        ...user.userProfile,
        preferredLanguage: form.preferredLanguage,
        emergencyContact: form.emergencyContact,
        interests: form.interests,
        bio: form.bio,
      },
      providerProfile:
        user.role === "PROVIDER"
          ? {
              ...user.providerProfile,
              profession: form.profession,
              education: form.education,
              height: form.height,
              hobbies: form.hobbies,
              hourlyPrice: form.hourlyPrice,
              availableCity: form.availableCity,
              languages: form.providerLanguages,
              availabilityDays: form.availabilityDays,
            }
          : user.providerProfile,
    };

    localStorage.setItem("buddybook_auth_user", JSON.stringify(nextUser));
    setUser(nextUser);
    setIsEditing(false);
    setSaveMessage("Profile changes saved locally.");
    window.dispatchEvent(new CustomEvent("buddybook:data-changed", { detail: "buddybook_auth_user" }));
  };

  if (!user) {
    return (
      <UserAppLayout title={title}>
        <section className="mx-auto max-w-4xl rounded-4xl border border-[#dbe0ff] bg-white p-8 shadow-[0_25px_80px_rgba(25,35,90,0.10)]">
          <div className="text-center">
            <h1 className="text-4xl font-black">Profile not available</h1>
            <p className="mt-4 text-sm font-semibold text-slate-600">
              Please login or register so your profile information can be displayed here.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#3f37ff] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#3f37ff]/20"
            >
              Go to Login
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </UserAppLayout>
    );
  }

  return (
    <UserAppLayout title={title} user={user}>
      <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-transparent bg-gradient-to-br from-[#eef4ff] via-[#eef4ff] to-white p-1 shadow-[0_25px_80px_rgba(25,35,90,0.08)]">
            <div className="rounded-[1.75rem] bg-white p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative h-28 w-28 overflow-hidden rounded-[1.75rem] bg-[#eef4ff] shadow-inner shadow-[#3f37ff]/10">
                  <img
                    src={user.userProfile?.avatar || user.avatar || fallbackAvatar}
                    alt={user.fullName || "BuddyBOOK user"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.26em] text-slate-500">{userRoleLabel}</p>
                  <h1 className="mt-2 text-3xl font-black text-[#0f172a]">{user.fullName}</h1>
                  <p className="mt-2 max-w-[20rem] text-sm leading-6 text-slate-700">
                    {safely(user.city)}, {safely(user.state)}
                  </p>
                </div>
                <div className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-4 py-2 text-sm font-black text-[#3f37ff]">
                  <CheckCircle2 size={16} className="text-[#3f37ff]" />
                  {user.kycStatus || "Pending verification"}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] bg-[#eef4ff] p-4 text-sm text-slate-700 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Email status</p>
                  <p className="mt-3 text-sm font-semibold text-[#0f172a]">{user.emailVerified ? "Verified" : "Not verified"}</p>
                </div>
                <div className="rounded-[1.5rem] bg-[#eef4ff] p-4 text-sm text-slate-700 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Phone status</p>
                  <p className="mt-3 text-sm font-semibold text-[#0f172a]">{user.mobileVerified ? "Verified" : "Not verified"}</p>
                </div>
                <div className="rounded-[1.5rem] bg-[#eef4ff] p-4 text-sm text-slate-700 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Interest tags</p>
                  <p className="mt-3 text-sm font-semibold text-[#0f172a]">{activityTags.length} added</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 rounded-[1.75rem] border border-[#dbe0ff] bg-white p-4 shadow-sm">
            <div className="rounded-[1.5rem] bg-[#eef4ff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Contact</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <div className="flex items-center gap-2 rounded-[1.5rem] bg-white p-4 shadow-sm">
                  <Mail size={16} className="text-[#3f37ff]" /> {safely(user.email)}
                </div>
                <div className="flex items-center gap-2 rounded-[1.5rem] bg-white p-4 shadow-sm">
                  <Phone size={16} className="text-[#3f37ff]" /> {safely(user.phone)}
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-[#eef4ff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Location</p>
              <p className="mt-3 text-sm font-semibold text-[#0f172a]">{safely(user.city)}, {safely(user.state)}</p>
            </div>

            <div className="rounded-[1.5rem] bg-[#eef4ff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Interests</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {activityTags.length ? (
                  activityTags.map((item) => (
                    <span key={item} className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-black text-[#3f37ff]">
                      {item}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No interests added yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-[#dbe0ff] bg-white p-6 shadow-[0_25px_80px_rgba(25,35,90,0.10)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">Profile dashboard</p>
                <h2 className="mt-2 text-3xl font-black text-[#0f172a]">Your profile overview</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
                  Keep your profile details up to date so your BuddyBOOK matches can connect with you quickly and confidently.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setSaveMessage("");
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#3f37ff] px-5 py-3 text-sm font-black text-white transition hover:bg-[#2d31c4]"
              >
                <Edit2 size={16} />
                Update profile
              </button>
            </div>

            {saveMessage ? (
              <div className="mt-6 rounded-[1.5rem] bg-[#eef4ff] p-4 text-sm font-semibold text-[#3f37ff] shadow-sm">
                {saveMessage}
              </div>
            ) : null}

            <div className="mt-6 grid gap-5">
              {isEditing ? (
                <div className="rounded-[1.75rem] border border-[#dbe0ff] bg-[#eef4ff] p-6 shadow-sm">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-black text-slate-700">Full name</label>
                      <input
                        value={form.fullName}
                        onChange={(event) => handleChange("fullName", event.target.value)}
                        className="mt-2 w-full rounded-[1.5rem] border border-[#dbe0ff] bg-white px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#3f37ff] focus:ring-2 focus:ring-[#eef4ff]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-black text-slate-700">Email</label>
                      <input
                        value={form.email}
                        onChange={(event) => handleChange("email", event.target.value)}
                        className="mt-2 w-full rounded-[1.5rem] border border-[#dbe0ff] bg-white px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#3f37ff] focus:ring-2 focus:ring-[#eef4ff]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-black text-slate-700">Phone</label>
                      <input
                        value={form.phone}
                        onChange={(event) => handleChange("phone", event.target.value)}
                        className="mt-2 w-full rounded-[1.5rem] border border-[#dbe0ff] bg-white px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#3f37ff] focus:ring-2 focus:ring-[#eef4ff]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-black text-slate-700">Preferred language</label>
                      <input
                        value={form.preferredLanguage}
                        onChange={(event) => handleChange("preferredLanguage", event.target.value)}
                        className="mt-2 w-full rounded-[1.5rem] border border-[#dbe0ff] bg-white px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#3f37ff] focus:ring-2 focus:ring-[#eef4ff]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="text-sm font-black text-slate-700">City</label>
                      <input
                        value={form.city}
                        onChange={(event) => handleChange("city", event.target.value)}
                        className="mt-2 w-full rounded-[1.5rem] border border-[#dbe0ff] bg-white px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#3f37ff] focus:ring-2 focus:ring-[#eef4ff]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-black text-slate-700">State</label>
                      <input
                        value={form.state}
                        onChange={(event) => handleChange("state", event.target.value)}
                        className="mt-2 w-full rounded-[1.5rem] border border-[#dbe0ff] bg-white px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#3f37ff] focus:ring-2 focus:ring-[#eef4ff]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-black text-slate-700">Gender</label>
                      <input
                        value={form.gender}
                        onChange={(event) => handleChange("gender", event.target.value)}
                        className="mt-2 w-full rounded-[1.5rem] border border-[#dbe0ff] bg-white px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#3f37ff] focus:ring-2 focus:ring-[#eef4ff]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-black text-slate-700">Emergency contact</label>
                      <input
                        value={form.emergencyContact}
                        onChange={(event) => handleChange("emergencyContact", event.target.value)}
                        className="mt-2 w-full rounded-[1.5rem] border border-[#dbe0ff] bg-white px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#3f37ff] focus:ring-2 focus:ring-[#eef4ff]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-black text-slate-700">Interests</label>
                      <input
                        value={form.interests}
                        onChange={(event) => handleChange("interests", event.target.value)}
                        className="mt-2 w-full rounded-[1.5rem] border border-[#dbe0ff] bg-white px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#3f37ff] focus:ring-2 focus:ring-[#eef4ff]"
                        placeholder="Movie, Cafe, Travel"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-black text-slate-700">Profile summary</label>
                    <textarea
                      rows={4}
                      value={form.bio}
                      onChange={(event) => handleChange("bio", event.target.value)}
                      className="mt-2 w-full rounded-[1.5rem] border border-[#dbe0ff] bg-white px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#3f37ff] focus:ring-2 focus:ring-[#eef4ff]"
                      placeholder="Write a short introduction about yourself"
                    />
                  </div>

                  {user.role === "PROVIDER" ? (
                    <div className="grid gap-4 rounded-[1.75rem] border border-[#dbe0ff] bg-white p-5">
                      <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Provider details</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-black text-slate-700">Profession</label>
                          <input
                            value={form.profession}
                            onChange={(event) => handleChange("profession", event.target.value)}
                            className="mt-2 w-full rounded-[1.5rem] border border-[#dbe0ff] bg-[#eef4ff] px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#3f37ff] focus:ring-2 focus:ring-[#eef4ff]"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-black text-slate-700">Education</label>
                          <input
                            value={form.education}
                            onChange={(event) => handleChange("education", event.target.value)}
                            className="mt-2 w-full rounded-[1.5rem] border border-[#dbe0ff] bg-[#eef4ff] px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#3f37ff] focus:ring-2 focus:ring-[#eef4ff]"
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-black text-slate-700">Height</label>
                          <input
                            value={form.height}
                            onChange={(event) => handleChange("height", event.target.value)}
                            className="mt-2 w-full rounded-[1.5rem] border border-[#dbe0ff] bg-[#eef4ff] px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#3f37ff] focus:ring-2 focus:ring-[#eef4ff]"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-black text-slate-700">Hobbies</label>
                          <input
                            value={form.hobbies}
                            onChange={(event) => handleChange("hobbies", event.target.value)}
                            className="mt-2 w-full rounded-[1.5rem] border border-[#dbe0ff] bg-[#eef4ff] px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#3f37ff] focus:ring-2 focus:ring-[#eef4ff]"
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-black text-slate-700">Hourly rate</label>
                          <input
                            value={form.hourlyPrice}
                            onChange={(event) => handleChange("hourlyPrice", event.target.value)}
                            className="mt-2 w-full rounded-[1.5rem] border border-[#dbe0ff] bg-[#eef4ff] px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#3f37ff] focus:ring-2 focus:ring-[#eef4ff]"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-black text-slate-700">Available city</label>
                          <input
                            value={form.availableCity}
                            onChange={(event) => handleChange("availableCity", event.target.value)}
                            className="mt-2 w-full rounded-[1.5rem] border border-[#dbe0ff] bg-[#eef4ff] px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#3f37ff] focus:ring-2 focus:ring-[#eef4ff]"
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-black text-slate-700">Languages</label>
                          <input
                            value={form.providerLanguages}
                            onChange={(event) => handleChange("providerLanguages", event.target.value)}
                            className="mt-2 w-full rounded-[1.5rem] border border-[#dbe0ff] bg-[#eef4ff] px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#3f37ff] focus:ring-2 focus:ring-[#eef4ff]"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-black text-slate-700">Availability days</label>
                          <input
                            value={form.availabilityDays}
                            onChange={(event) => handleChange("availabilityDays", event.target.value)}
                            className="mt-2 w-full rounded-[1.5rem] border border-[#dbe0ff] bg-[#eef4ff] px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#3f37ff] focus:ring-2 focus:ring-[#eef4ff]"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={handleSave}
                      className="inline-flex justify-center rounded-full bg-[#3f37ff] px-6 py-3 text-sm font-black text-white transition hover:bg-[#2d31c4]"
                    >
                      Save changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(buildFormState(user));
                        setIsEditing(false);
                        setSaveMessage("");
                      }}
                      className="inline-flex justify-center rounded-full border border-[#dbe0ff] bg-white px-6 py-3 text-sm font-black text-[#0f172a] transition hover:border-[#3f37ff]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-5">
                  <div className="rounded-[1.75rem] border border-[#dbe0ff] bg-[#eef4ff] p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">Basic information</p>
                      <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-black text-[#3f37ff]">{userRoleLabel}</span>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {[
                        ["Name", safely(user.fullName)],
                        ["Email", safely(user.email)],
                        ["Phone", safely(user.phone)],
                        ["Location", `${safely(user.city)}, ${safely(user.state)}`],
                        ["Gender", safely(user.gender)],
                        ["Language", safely(user.userProfile?.preferredLanguage)],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{label}</p>
                          <p className="mt-2 text-sm font-semibold text-[#0f172a]">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-[#dbe0ff] bg-[#eef4ff] p-6 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">Personal profile</p>
                    <p className="mt-4 text-sm leading-7 text-slate-700">{safely(user.userProfile?.bio)}</p>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Interests</p>
                        <p className="mt-2 text-sm font-semibold text-[#0f172a]">{safely(user.userProfile?.interests)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Emergency contact</p>
                        <p className="mt-2 text-sm font-semibold text-[#0f172a]">{safely(user.userProfile?.emergencyContact)}</p>
                      </div>
                    </div>
                  </div>

                  {user.role === "PROVIDER" ? (
                    <div className="rounded-[1.75rem] border border-[#dbe0ff] bg-[#eef4ff] p-6 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">Provider details</p>
                        <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-black text-[#3f37ff]">Live booking-ready</span>
                      </div>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        {[
                          ["Profession", safely(user.providerProfile?.profession)],
                          ["Education", safely(user.providerProfile?.education)],
                          ["Height", safely(user.providerProfile?.height)],
                          ["Hobbies", safely(user.providerProfile?.hobbies)],
                          ["Hourly rate", safely(user.providerProfile?.hourlyPrice)],
                          ["Available city", safely(user.providerProfile?.availableCity)],
                          ["Languages", safely(user.providerProfile?.languages)],
                          ["Availability", safely(user.providerProfile?.availabilityDays)],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{label}</p>
                            <p className="mt-2 text-sm font-semibold text-[#0f172a]">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {(profileQuestions.length || providerQuestions.length) && (
                    <div className="rounded-[1.75rem] border border-[#dbe0ff] bg-[#eef4ff] p-6 shadow-sm">
                      <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
                        {profileQuestions.length ? "Profile questions" : "Provider questions"}
                      </p>
                      <div className="mt-4 space-y-4">
                        {(profileQuestions.length ? profileQuestions : providerQuestions).map((item, index) => (
                          <div key={index} className="rounded-[1.5rem] bg-white p-4 shadow-sm">
                            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{item.question}</p>
                            <p className="mt-2 text-sm text-[#11153b]">{item.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </UserAppLayout>
  );
}








