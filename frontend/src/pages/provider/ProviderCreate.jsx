import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Camera,
  CalendarDays,
  CheckCircle2,
  ImagePlus,
  IndianRupee,
  Languages,
  MapPin,
  Save,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";
import {
  getMyProviderProfile,
  saveMyProviderProfile,
  uploadProviderImages,
} from "../../api/providers";

const emptyForm = {
  headline: "",
  profession: "",
  age: "",
  education: "",
  height: "",
  hobbies: "",
  hourlyPrice: "",
  availableCity: "",
  languages: "",
  availabilityDays: "",
  activities: "",
  bio: "",
  profileImages: [],
  providerSafetyAgreement: true,
};

const serviceOptions = [
  ["Coffee meetup", 450],
  ["Cafe hopping", 550],
  ["City walk", 700],
  ["Shopping companion", 650],
  ["Movie partner", 600],
  ["Dinner plan", 800],
  ["Gaming session", 500],
  ["Fitness buddy", 700],
  ["Study buddy", 400],
  ["Event partner", 900],
  ["Concert buddy", 1000],
  ["Food exploring", 750],
  ["Photography walk", 850],
  ["Bookstore visit", 450],
  ["Museum visit", 650],
  ["Local travel", 950],
  ["Cricket companion", 600],
  ["Language practice", 500],
  ["Pet-friendly walk", 550],
  ["Weekend hangout", 900],
];

const dayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ProviderCreate() {
  const [user, setUser] = useState(() => readUser());
  const [form, setForm] = useState(emptyForm);
  const [slot, setSlot] = useState({ day: "Sat", date: "", time: "17:00" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    getMyProviderProfile()
      .then(({ provider }) => {
        if (!mounted || !provider) return;
        setForm(providerToForm(provider));
        setUser(provider.user || readUser());
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const completion = useMemo(() => getCompletion(form), [form]);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const selectedActivities = useMemo(
    () =>
      String(form.activities || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [form.activities]
  );

  const toggleService = (name, price) => {
    const exists = selectedActivities.includes(name);
    const next = exists
      ? selectedActivities.filter((item) => item !== name)
      : [...selectedActivities, name];
    setForm((current) => ({
      ...current,
      activities: next.join(", "),
      hourlyPrice: current.hourlyPrice || String(price),
    }));
  };

  const addAvailabilitySlot = () => {
    const label = `${slot.day}${slot.date ? ` ${slot.date}` : ""} ${slot.time}`;
    const current = String(form.availabilityDays || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (current.includes(label)) return;
    updateField("availabilityDays", [...current, label].join(", "));
  };

  const handleImages = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, 4);
    if (!files.length) return;

    if (files.some((file) => file.size > 3 * 1024 * 1024)) {
      setMessage({ type: "error", text: "Each image must be 3 MB or smaller." });
      event.target.value = "";
      return;
    }

    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setMessage({ type: "error", text: "Only JPG, PNG and WebP images are allowed." });
      event.target.value = "";
      return;
    }

    const previewImages = files.map((file) => ({
      previewUrl: URL.createObjectURL(file),
      uploading: true,
      url: "",
      thumbnailUrl: "",
      fileId: "",
    }));

    setMessage({ type: "success", text: "Uploading photos..." });
    setForm((current) => ({
      ...current,
      profileImages: [...current.profileImages, ...previewImages].slice(0, 4),
    }));

    try {
      const uploadedImages = await uploadProviderImages(files);
      setForm((current) => {
        const keptImages = current.profileImages.filter((image) => !image.uploading);
        return {
          ...current,
          profileImages: [...keptImages, ...uploadedImages].slice(0, 4),
        };
      });
      setMessage({ type: "success", text: "Photos uploaded. You can publish now." });
    } catch (error) {
      setForm((current) => ({
        ...current,
        profileImages: current.profileImages.filter((image) => !image.uploading),
      }));
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Photo upload failed.",
      });
    } finally {
      previewImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      event.target.value = "";
    }
  };

  const removeImage = (index) => {
    setForm((current) => ({
      ...current,
      profileImages: current.profileImages.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage(null);

    const required = [
      "headline",
      "profession",
      "age",
      "hourlyPrice",
      "availableCity",
      "languages",
      "availabilityDays",
      "activities",
      "bio",
    ];

    if (required.some((field) => !String(form[field] || "").trim())) {
      setMessage({ type: "error", text: "Complete all profile fields before publishing." });
      return;
    }

    if (form.profileImages.length !== 4) {
      setMessage({ type: "error", text: "Upload exactly 4 profile photos before publishing." });
      return;
    }

    if (form.profileImages.some((image) => image?.uploading || !getImageUrl(image))) {
      setMessage({ type: "error", text: "Wait for all image uploads to finish before publishing." });
      return;
    }

    try {
      setSaving(true);
      const result = await saveMyProviderProfile({
        ...form,
        profileQuestions: mergeProfileQuestions(form.profileQuestions, {
          age: form.age,
        }),
        approved: true,
        providerSafetyAgreement: true,
      });
      if (result.rawProvider) setForm(providerToForm(result.rawProvider));
      setMessage({ type: "success", text: "Profile published. Users can now find you in Explore." });
      window.dispatchEvent(new Event("buddybook:providers-changed"));
      window.dispatchEvent(new Event("buddybook:data-changed"));
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to publish provider profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell type="provider">
      <div className="min-h-screen bg-[#fff7ed] text-black">
        <section className="relative overflow-hidden rounded-[1.5rem] border border-[#eddac7] bg-[#fffaf3] p-7 text-black shadow-sm">
          <div className="relative z-10 max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e08c4c]">
              Profile builder
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              Create a profile users want to book
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#6b5d52]">
              Turn your activities, photos and availability into a polished public BuddyBOOK listing.
            </p>
          </div>
          <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border-[34px] border-white/10" />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <form onSubmit={submit} className="rounded-2xl border border-[#eddac7] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0dfcf] pb-4">
              <div>
                <h2 className="text-2xl font-black">Public provider profile</h2>
                <p className="mt-1 text-sm font-bold text-[#6b5d52]">
                  Keep it specific, friendly and easy to scan.
                </p>
              </div>
              <span className="rounded-2xl bg-[#ffeedd] px-4 py-3 text-sm font-black text-black">
                {completion}% complete
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Profile headline" name="headline" value={form.headline} onChange={updateField} placeholder="Friendly city companion for safe public plans" />
              <Field label="Profession" name="profession" value={form.profession} onChange={updateField} placeholder="Photographer, student, consultant..." />
              <Field label="Age" name="age" value={form.age} onChange={updateField} placeholder="24" />
              <Field label="Hourly price" name="hourlyPrice" value={form.hourlyPrice} onChange={updateField} placeholder="700" />
              <Field label="Available city" name="availableCity" value={form.availableCity} onChange={updateField} placeholder="Pune" />
              <Field label="Languages" name="languages" value={form.languages} onChange={updateField} placeholder="Hindi, English, Marathi" />
              <Field label="Education / experience" name="education" value={form.education} onChange={updateField} placeholder="Graduate, 2 years hosting" />
              <Field label="Height" name="height" value={form.height} onChange={updateField} placeholder="5'7&quot;" />
              <Field label="Hobbies" name="hobbies" value={form.hobbies} onChange={updateField} placeholder="Reading, fitness, food exploring" wide />
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-[#eddac7] bg-[#fffaf3] p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-black text-[#fffaf3]">
                  <IndianRupee size={18} />
                </span>
                <div>
                  <h3 className="font-black">Services and activity prices</h3>
                  <p className="mt-1 text-xs font-bold text-[#6b5d52]">Choose from 20 common activities. Selected services are saved to your public profile.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {serviceOptions.map(([name, price]) => {
                  const active = selectedActivities.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleService(name, price)}
                      className={`rounded-xl border px-3 py-3 text-left text-xs font-black transition ${
                        active
                          ? "border-black bg-black text-[#fffaf3]"
                          : "border-[#eddac7] bg-white text-black hover:bg-[#ffeedd]"
                      }`}
                    >
                      <span className="block">{name}</span>
                      <span className={`mt-1 block ${active ? "text-[#fffaf3]/70" : "text-[#8b7563]"}`}>Rs {price}/hr</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-[#eddac7] bg-[#fffaf3] p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-black text-[#fffaf3]">
                  <CalendarDays size={18} />
                </span>
                <div>
                  <h3 className="font-black">Availability calendar</h3>
                  <p className="mt-1 text-xs font-bold text-[#6b5d52]">Add date and time slots here. This replaces the separate availability panel.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[110px_1fr_1fr_auto]">
                <select
                  value={slot.day}
                  onChange={(event) => setSlot((current) => ({ ...current, day: event.target.value }))}
                  className="h-12 rounded-xl border border-[#eddac7] bg-white px-3 text-sm font-bold outline-none focus:border-black"
                >
                  {dayOptions.map((day) => <option key={day}>{day}</option>)}
                </select>
                <input
                  type="date"
                  value={slot.date}
                  onChange={(event) => setSlot((current) => ({ ...current, date: event.target.value }))}
                  className="h-12 rounded-xl border border-[#eddac7] bg-white px-3 text-sm font-bold outline-none focus:border-black"
                />
                <input
                  type="time"
                  value={slot.time}
                  onChange={(event) => setSlot((current) => ({ ...current, time: event.target.value }))}
                  className="h-12 rounded-xl border border-[#eddac7] bg-white px-3 text-sm font-bold outline-none focus:border-black"
                />
                <button type="button" onClick={addAvailabilitySlot} className="rounded-xl bg-black px-5 py-3 text-sm font-black text-[#fffaf3]">
                  Add
                </button>
              </div>
              <input
                value={form.availabilityDays}
                onChange={(event) => updateField("availabilityDays", event.target.value)}
                placeholder="Mon 2026-06-27 17:00, Sat 2026-06-28 18:30"
                className="mt-3 h-12 w-full rounded-xl border border-[#eddac7] bg-white px-4 text-sm font-bold outline-none focus:border-black"
              />
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-[#625a86]">Bio</span>
                <textarea
                  value={form.bio}
                  onChange={(event) => updateField("bio", event.target.value)}
                  rows={5}
                  placeholder="Write a warm, clear bio. Mention public meetup comfort, activities and what users can book you for."
                  className="min-h-[130px] rounded-2xl border border-[#eddac7] bg-[#fffaf3] p-4 text-sm font-bold leading-6 outline-none transition focus:border-black focus:bg-white"
                />
              </label>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#d9bfaa] bg-[#fffaf3] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-black">Profile photos</h3>
                  <p className="mt-1 text-xs font-bold text-[#6b5d52]">
                    Exactly 4 photos are required. The first photo is used in Explore.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-black text-[#fffaf3] shadow-[0_16px_32px_rgba(0,0,0,0.16)]">
                  <UploadCloud size={16} />
                  Upload photos
                  <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
                </label>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#eddac7] bg-white">
                    {form.profileImages[index] ? (
                      <>
                        <img src={getImageSrc(form.profileImages[index])} alt={`Provider upload ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                        {form.profileImages[index]?.uploading ? (
                          <span className="absolute left-2 top-2 rounded-full bg-black px-3 py-1 text-[10px] font-black text-[#fffaf3]">
                            Uploading
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-2 top-2 rounded-full bg-white/92 px-3 py-1 text-[10px] font-black text-black"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <div className="grid h-full place-items-center text-center text-[#9a91c1]">
                        <div>
                          <ImagePlus size={24} className="mx-auto" />
                          <p className="mt-2 text-xs font-black">Photo {index + 1}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {message ? (
              <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-black ${
                message.type === "success" ? "bg-[#e8f6ef] text-[#16815f]" : "bg-[#fff1f1] text-[#c03545]"
              }`}>
                {message.text}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-6 py-4 text-sm font-black text-[#fffaf3] shadow-[0_18px_40px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={17} />
              {saving ? "Publishing..." : "Publish profile"}
            </button>
          </form>

          <aside className="grid h-max gap-5">
            <div className="rounded-2xl border border-[#eddac7] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black">Live preview</h2>
                <BadgeCheck size={20} className="text-[#e08c4c]" />
              </div>
              <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-[#eddac7]">
                <div className="h-56 bg-[#ffeedd]">
                  {form.profileImages[0] ? (
                    <img src={getImageSrc(form.profileImages[0])} alt="Profile preview" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="grid h-full place-items-center text-[#8f85bd]">
                      <Camera size={34} />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black">{user?.fullName || "Your name"}</h3>
                      <p className="mt-1 text-sm font-bold text-[#6b5d52]">
                        {form.headline || form.profession || "Provider headline"}
                      </p>
                    </div>
                    <CheckCircle2 size={18} className="text-[#e08c4c]" />
                  </div>
                <div className="mt-4 grid gap-2 text-sm font-bold text-[#5d4a3c]">
                    <span>{form.age ? `${form.age} years old` : "Age"}</span>
                    <span className="inline-flex items-center gap-2"><MapPin size={15} /> {form.availableCity || user?.city || "City"}</span>
                    <span className="inline-flex items-center gap-2"><Languages size={15} /> {form.languages || "Languages"}</span>
                    <span className="inline-flex items-center gap-2"><IndianRupee size={15} /> {form.hourlyPrice || "0"}/hr</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#eddac7] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black">Builder checklist</h2>
              <div className="mt-4 grid gap-3">
                <Checklist done={Boolean(form.headline && form.bio)} label="Clear headline and bio" />
                <Checklist done={Boolean(form.age)} label="Age added" />
                <Checklist done={Boolean(form.activities && form.hourlyPrice)} label="Activities and pricing" />
                <Checklist done={Boolean(form.availableCity && form.availabilityDays)} label="City and availability" />
                <Checklist done={form.profileImages.length === 4} label="Four profile photos" />
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#ffeedd]">
                <div className="h-full rounded-full bg-black" style={{ width: `${completion}%` }} />
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}

function Field({ label, name, value, onChange, placeholder, wide = false }) {
  return (
    <label className={`grid gap-2 ${wide ? "md:col-span-2" : ""}`}>
      <span className="text-xs font-black uppercase tracking-[0.12em] text-[#8b7563]">{label}</span>
      <input
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        placeholder={placeholder}
        className="h-12 rounded-2xl border border-[#eddac7] bg-[#fffaf3] px-4 text-sm font-bold outline-none transition focus:border-black focus:bg-white"
      />
    </label>
  );
}

function Checklist({ done, label }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#fffaf3] p-3">
      <span className={`grid h-9 w-9 place-items-center rounded-2xl ${done ? "bg-[#e8f6ef] text-[#16815f]" : "bg-[#ffeedd] text-black"}`}>
        {done ? <CheckCircle2 size={17} /> : <Sparkles size={17} />}
      </span>
      <p className="text-sm font-black">{label}</p>
    </div>
  );
}

function providerToForm(provider) {
  return {
    ...emptyForm,
    headline: provider.headline || "",
    profession: provider.profession || "",
    age: getProfileQuestion(provider.profileQuestions, "age") || provider.age || "",
    education: provider.education || "",
    height: provider.height || "",
    hobbies: provider.hobbies || "",
    hourlyPrice: provider.hourlyPrice || "",
    availableCity: provider.availableCity || "",
    languages: provider.languages || "",
    availabilityDays: provider.availabilityDays || "",
    activities: provider.activities || provider.hobbies || "",
    bio: provider.bio || "",
    profileImages: Array.isArray(provider.profileImages)
      ? provider.profileImages.filter((image) => getImageUrl(image))
      : [],
    profileQuestions: Array.isArray(provider.profileQuestions) ? provider.profileQuestions : [],
    providerSafetyAgreement: Boolean(provider.providerSafetyAgreement),
  };
}

function getCompletion(form) {
  const checks = [
    form.headline,
    form.profession,
    form.age,
    form.hourlyPrice,
    form.availableCity,
    form.languages,
    form.availabilityDays,
    form.activities,
    form.bio,
    form.providerSafetyAgreement,
    form.profileImages.length === 4,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function getProfileQuestion(profileQuestions, key) {
  if (!Array.isArray(profileQuestions)) return "";
  const match = profileQuestions.find((item) => item?.key === key || item?.question === key);
  return String(match?.answer || "").trim();
}

function mergeProfileQuestions(existing, values) {
  const map = new Map();
  (Array.isArray(existing) ? existing : []).forEach((item) => {
    const key = item?.key || item?.question;
    if (key) map.set(key, item);
  });

  Object.entries(values).forEach(([key, answer]) => {
    map.set(key, { key, question: key, answer: String(answer || "").trim() });
  });

  return Array.from(map.values()).filter((item) => item.answer);
}

function getImageUrl(image) {
  if (!image) return "";
  if (typeof image === "string") {
    return image.startsWith("data:image/") ? "" : image;
  }
  return image.url || image.thumbnailUrl || image.previewUrl || "";
}

function getImageSrc(image) {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.previewUrl || image.thumbnailUrl || image.url || "";
}

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("buddybook_auth_user") || "null");
  } catch {
    return null;
  }
}
