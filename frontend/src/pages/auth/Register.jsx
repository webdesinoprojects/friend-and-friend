import { useEffect, useMemo, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import api from "../../api/api";
import Logo from "../../components/common/Logo";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Camera,
  CheckCircle2,
  ChevronDown,
  IdCard,
  Mail,
  Phone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

const steps = [
  { id: 1, title: "Account", icon: User },
  { id: 2, title: "Verify", icon: ShieldCheck },
  { id: 3, title: "Profile", icon: BadgeCheck },
];

const activityOptions = [
  "Movie",
  "Cafe",
  "Dinner",
  "Shopping",
  "Gaming",
  "City walk",
  "Gym",
  "Cricket",
  "Concert",
  "Event partner",
  "Study buddy",
  "Travel nearby",
  "Chill hangout",
  "Food exploring",
  "Photography",
];

const kycTypes = [
  {
    value: "AADHAAR",
    label: "Aadhaar Card",
    placeholder: "Enter Aadhaar last 4 digits",
    maxLength: 4,
  },
  {
    value: "PAN",
    label: "PAN Card",
    placeholder: "Enter PAN number",
    maxLength: 10,
  },
  {
    value: "PASSPORT",
    label: "Passport",
    placeholder: "Enter passport number",
    maxLength: 12,
  },
  {
    value: "DRIVING_LICENSE",
    label: "Driving Licence",
    placeholder: "Enter driving licence number",
    maxLength: 16,
  },
];

const profileQuestions = [
  "My friends call me",
  "My go-to fun place is",
  "The activity I never get bored of is",
  "A perfect weekend for me is",
  "People usually like me for",
  "My comfort meetup place is",
  "One thing I can talk about for hours is",
  "My favourite food plan is",
  "A vibe I bring to meetups is",
  "My safest public meetup preference is",
];

const emptyQuestions = [
  { question: "", answer: "" },
  { question: "", answer: "" },
  { question: "", answer: "" },
];

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const webcamRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [selfie, setSelfie] = useState(null);
  const [googleCredential, setGoogleCredential] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);

  const [selectedActivities, setSelectedActivities] = useState([]);
  const [userQuestionAnswers, setUserQuestionAnswers] = useState(emptyQuestions);
  const [providerQuestionAnswers, setProviderQuestionAnswers] =
    useState(emptyQuestions);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    mobileOtp: "",
    email: "",
    emailOtp: "",
    password: "",
    confirmPassword: "",
    profileImage: null,
    profileImagePreview: "",
    city: "",
    state: "",
    gender: "",

    documentType: "AADHAAR",
    documentNumber: "",
    kycFile: null,
    kycConsent: false,

    role: "",

    preferredLanguage: "",
    emergencyContact: "",

    profession: "",
    education: "",
    height: "",
    hobbies: "",
    hourlyPrice: "",
    availableCity: "",
    providerLanguages: "",
    availabilityDays: "",
    providerSafetyAgreement: false,
  });

  useEffect(() => {
    const storedProfile = sessionStorage.getItem("buddybook_google_profile");
    const googleProfile = location.state?.googleProfile;

    if (!storedProfile && !googleProfile) return;

    const parsedProfile = storedProfile ? JSON.parse(storedProfile) : {};
    const nextProfile = { ...parsedProfile, ...googleProfile };

    setGoogleCredential(nextProfile.credential || "");
    setEmailVerified(Boolean(nextProfile.email));
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || nextProfile.fullName || "",
      email: prev.email || nextProfile.email || "",
    }));
  }, [location.state]);

  const progress = useMemo(
    () => Math.round((currentStep / steps.length) * 100),
    [currentStep]
  );

  const activeStep = steps.find((step) => step.id === currentStep);
  const ActiveIcon = activeStep?.icon || User;

  const selectedKyc =
    kycTypes.find((item) => item.value === form.documentType) || kycTypes[0];

  const activeQuestions =
    form.role === "PROVIDER" ? providerQuestionAnswers : userQuestionAnswers;

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleActivity = (activity) => {
    setSelectedActivities((prev) =>
      prev.includes(activity)
        ? prev.filter((item) => item !== activity)
        : [...prev, activity]
    );
  };

  const updateQuestion = (index, key, value) => {
    const updater =
      form.role === "PROVIDER"
        ? setProviderQuestionAnswers
        : setUserQuestionAnswers;

    updater((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  };

  const buildProfileAnswers = (answers) => {
    return answers
      .filter((item) => item.question && item.answer)
      .map((item) => `${item.question}: ${item.answer}`)
      .join("\n");
  };

  const sendMobileOtp = async () => {
    try {
      if (!form.phone) {
        alert("Enter mobile number first");
        return;
      }

      const res = await api.post("/auth/send-mobile-otp", {
        phone: form.phone,
      });

      setMobileOtpSent(true);

      alert(
        res.data.demoOtp
          ? `Mobile OTP sent. Use ${res.data.demoOtp}`
          : res.data.message || "Mobile OTP sent"
      );
    } catch (error) {
      console.error("SEND_MOBILE_OTP_FRONTEND_ERROR:", error);
      alert(error.response?.data?.message || "Failed to send mobile OTP");
    }
  };

  const verifyMobileOtp = async () => {
    try {
      if (!form.phone || !form.mobileOtp) {
        alert("Enter phone and OTP first");
        return;
      }

      const res = await api.post("/auth/verify-mobile-otp", {
        phone: form.phone,
        otp: form.mobileOtp,
      });

      setMobileVerified(true);
      alert(res.data.message || "Mobile verified successfully");
    } catch (error) {
      console.error("VERIFY_MOBILE_OTP_FRONTEND_ERROR:", error);
      alert(error.response?.data?.message || "Mobile OTP verification failed");
    }
  };

  const sendEmailOtp = async () => {
    try {
      if (!form.email) {
        alert("Email is optional. Enter email first if you want to verify it.");
        return;
      }

      const res = await api.post("/auth/send-email-otp", {
        email: form.email,
      });

      setEmailOtpSent(true);

      alert(
        res.data.demoOtp
          ? `Email OTP sent. Use ${res.data.demoOtp}`
          : res.data.message || "Email OTP sent"
      );
    } catch (error) {
      console.error("SEND_EMAIL_OTP_FRONTEND_ERROR:", error);
      alert(error.response?.data?.message || "Failed to send email OTP");
    }
  };

  const verifyEmailOtp = async () => {
    try {
      if (!form.email || !form.emailOtp) {
        alert("Enter email and OTP first");
        return;
      }

      const res = await api.post("/auth/verify-email-otp", {
        email: form.email,
        otp: form.emailOtp,
      });

      setEmailVerified(true);
      alert(res.data.message || "Email verified successfully");
    } catch (error) {
      console.error("VERIFY_EMAIL_OTP_FRONTEND_ERROR:", error);
      alert(error.response?.data?.message || "Email OTP verification failed");
    }
  };

  const handleGoogleRegister = async (credentialResponse) => {
    try {
      setStepLoading(true);
      const res = await api.post("/auth/google/register-profile", {
        credential: credentialResponse.credential,
      });

      const profile = res.data.profile;
      setGoogleCredential(credentialResponse.credential);
      setEmailVerified(true);
      setEmailOtpSent(false);
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || profile.fullName || "",
        email: profile.email || prev.email,
        emailOtp: "",
      }));
      sessionStorage.setItem(
        "buddybook_google_profile",
        JSON.stringify({
          credential: credentialResponse.credential,
          ...profile,
        })
      );
    } catch (error) {
      console.error("GOOGLE_REGISTER_FRONTEND_ERROR:", error);
      alert(error.response?.data?.message || "Google verification failed");
    } finally {
      setStepLoading(false);
    }
  };

  const handleProfilePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("Profile photo must be 3 MB or smaller.");
      event.target.value = "";
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Only JPG, PNG and WebP images are allowed.");
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    updateField("profileImagePreview", previewUrl);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/auth/upload-profile-image", formData, {
        timeout: 60000,
      });
      updateField("profileImage", res.data.image);
    } catch (error) {
      updateField("profileImage", null);
      updateField("profileImagePreview", "");
      alert(error.response?.data?.message || "Profile photo upload failed.");
    } finally {
      event.target.value = "";
    }
  };

  const captureSelfie = () => {
    if (!webcamRef.current) {
      alert("Camera is not ready yet");
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      alert("Selfie capture failed. Please allow camera permission.");
      return;
    }

    setSelfie(imageSrc);
  };

  const validateQuestionAnswers = () => {
    const completed = activeQuestions.filter(
      (item) => item.question && item.answer.trim()
    );

    if (completed.length < 3) {
      alert("Please answer all 3 profile questions.");
      return false;
    }

    const uniqueQuestions = new Set(completed.map((item) => item.question));

    if (uniqueQuestions.size !== completed.length) {
      alert("Please choose different questions.");
      return false;
    }

    return true;
  };

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      if (!form.fullName || !form.phone || !form.city || !form.state || !form.gender) {
        alert("Please complete name, phone, city, state and gender.");
        return false;
      }

      if (!form.password || form.password.length < 6) {
        alert("Please create a password with at least 6 characters.");
        return false;
      }

      if (form.password !== form.confirmPassword) {
        alert("Passwords do not match.");
        return false;
      }

      if (!mobileVerified) {
        alert("Mobile verification is compulsory.");
        return false;
      }

      if (form.email && emailOtpSent && !emailVerified) {
        alert("Please verify email OTP or remove email.");
        return false;
      }
    }

    if (currentStep === 2) {
      if (!form.documentType || !form.documentNumber || !form.kycConsent) {
        alert("Please complete KYC details and accept consent.");
        return false;
      }

      if (!selfie) {
        alert("Please capture live selfie.");
        return false;
      }
    }

    if (currentStep === 3) {
      if (!form.role) {
        alert("Please choose User or Provider.");
        return false;
      }

      if (!validateQuestionAnswers()) return false;

      if (form.role === "USER") {
        if (selectedActivities.length === 0 || !form.emergencyContact) {
          alert("Please choose activities and add emergency contact.");
          return false;
        }
      }

      if (form.role === "PROVIDER") {
        if (
          !form.profession ||
          !form.education ||
          !form.height ||
          !form.hobbies ||
          !form.hourlyPrice ||
          !form.availableCity ||
          !form.providerSafetyAgreement
        ) {
          alert("Please complete provider details and safety agreement.");
          return false;
        }
      }
    }

    return true;
  };

  const nextStep = () => {
    if (!validateCurrentStep()) return;
    setStepLoading(true);
    window.setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
      setStepLoading(false);
    }, 900);
  };

  const prevStep = () => {
    setStepLoading(true);
    window.setTimeout(() => {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
      setStepLoading(false);
    }, 500);
  };

  const handleRegister = async () => {
    if (!validateCurrentStep()) return;

    try {
      setIsSubmitting(true);

      const activeAnswers =
        form.role === "PROVIDER" ? providerQuestionAnswers : userQuestionAnswers;

      const profileAnswersText = buildProfileAnswers(activeAnswers);
      const documentLast4 = form.documentNumber.slice(-4);

      const payload = {
        fullName: form.fullName,
        email: form.email || null,
        phone: form.phone,
        password: form.password,
        dob: null,
        gender: form.gender,
        city: form.city,
        state: form.state,
        role: form.role,
        googleCredential: googleCredential || undefined,
        profileImage: form.profileImage,

        aadhaarLast4: documentLast4,
        documentType: form.documentType,
        documentNumberLast4: documentLast4,
        kycConsent: form.kycConsent,
        referenceSelfie: selfie,
        profileImage: form.profileImage?.url || null,

        userProfile: {
          interests: selectedActivities.join(", "),
          preferredActivities: selectedActivities.join(", "),
          activityPreferences: selectedActivities.join(", "),
          preferredLanguage: form.preferredLanguage,
          bio: profileAnswersText,
          profileQuestions: activeAnswers,
          emergencyContact: form.emergencyContact,
        },

        providerProfile: {
          profession: form.profession,
          education: form.education,
          height: form.height,
          hobbies: form.hobbies,
          hourlyPrice: form.hourlyPrice,
          availableCity: form.availableCity,
          languages: form.providerLanguages,
          availabilityDays: form.availabilityDays,
          bio: profileAnswersText,
          profileQuestions: activeAnswers,
          providerSafetyAgreement: form.providerSafetyAgreement,
        },
      };

      const res = await api.post("/auth/register", payload);

      alert(res.data.message || "Registration successful");
      sessionStorage.removeItem("buddybook_google_profile");

      if (res.data.token) {
        localStorage.setItem("buddybook_token", res.data.token);
      }

      const nextUser = {
        ...res.data.user,
        gender: form.gender,
        documentType: form.documentType,
        aadhaarLast4: documentLast4,
        referenceSelfie: selfie,
        userProfile: {
          interests: selectedActivities.join(", "),
          preferredLanguage: form.preferredLanguage,
          bio: profileAnswersText,
          profileQuestions: activeAnswers,
          emergencyContact: form.emergencyContact,
        },
        providerProfile: {
          profession: form.profession,
          education: form.education,
          height: form.height,
          hobbies: form.hobbies,
          hourlyPrice: form.hourlyPrice,
          availableCity: form.availableCity,
          languages: form.providerLanguages,
          availabilityDays: form.availabilityDays,
          bio: profileAnswersText,
          profileQuestions: activeAnswers,
        },
      };

      localStorage.setItem("buddybook_auth_user", JSON.stringify(nextUser));

      navigate("/");
    } catch (error) {
      console.error("REGISTER_FRONTEND_ERROR:", error);
      alert(error.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[#f5f3ee] text-black">
      {stepLoading ? (
        <div className="absolute inset-0 z-50 grid place-items-center bg-white/70 backdrop-blur-sm">
          <div className="w-[220px] rounded-[1.5rem] border border-black/10 bg-white p-5 text-center shadow-[0_25px_80px_rgba(0,0,0,0.12)]">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-black/10 border-t-black" />
            <p className="mt-4 text-sm font-black">Preparing next step</p>
            <p className="mt-1 text-xs font-bold text-black/45">Saving progress locally</p>
          </div>
        </div>
      ) : null}
      <main className="grid h-screen overflow-hidden lg:grid-cols-[0.92fr_84px_1.08fr]">
        {/* LEFT SIDE FIXED IMAGE */}
        <aside className="relative hidden h-screen overflow-hidden bg-black lg:block">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&auto=format&fit=crop')] bg-cover bg-center opacity-80" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.28),rgba(0,0,0,0.88))]" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
            <div className="inline-block w-max rounded-2xl bg-white p-3 shadow-lg shadow-black/20">
              <Logo />
            </div>

            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] backdrop-blur-xl">
                <ShieldCheck size={15} className="text-[#b5e48c]" />
                Verified social meetups
              </div>

              <h1 className="mt-6 text-6xl font-black leading-[0.95] tracking-tight">
                Real people.
                <br />
                Safer plans.
                <br />
                Better company.
              </h1>

              <p className="mt-6 max-w-md text-base font-semibold leading-8 text-white/72">
                Join BuddyBOOK with mobile verification, KYC and live selfie checks
                before entering the community.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {["Mobile verified", "KYC checked", "Public meetups"].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl"
                >
                  <CheckCircle2 size={18} className="text-[#b5e48c]" />
                  <p className="mt-3 text-sm font-black">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER PROGRESS FIXED */}
        <div className="hidden h-screen border-x border-black/10 bg-[#fbfaf7] lg:flex lg:flex-col lg:items-center">
          <p className="mt-8 text-[10px] font-black uppercase tracking-[0.28em] text-black/35">
            Progress
          </p>

          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="relative flex h-[390px] w-4 items-end overflow-hidden rounded-full bg-black/10">
              <div
                className="w-full rounded-full bg-black transition-all duration-500"
                style={{ height: `${progress}%` }}
              />
            </div>

            <div className="mt-6 grid h-12 w-12 place-items-center rounded-2xl bg-black text-white shadow-lg">
              <ActiveIcon size={20} />
            </div>

            <p className="mt-3 text-sm font-black">{progress}%</p>
          </div>
        </div>

        {/* RIGHT SIDE FIXED CARD, INNER CONTENT SCROLLS */}
        <section className="flex h-screen items-center justify-center overflow-hidden bg-[#fbfaf7] px-4 py-4 md:px-6">
          <div className="flex h-full w-full max-w-[640px] flex-col rounded-[2rem] border border-black/10 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.10)]">
            {/* CARD HEADER FIXED */}
            <div className="shrink-0 border-b border-black/10 p-5 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#f5f3ee] px-4 py-2 text-xs font-black text-black">
                    <Sparkles size={15} />
                    BuddyBOOK registration
                  </div>

                  <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-black">
                    Create account
                  </h1>

                  <p className="mt-2 text-sm font-semibold text-black/55">
                    Step {currentStep} of {steps.length} · {activeStep?.title}
                  </p>
                </div>

                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black text-white">
                  <ActiveIcon size={20} />
                </div>
              </div>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-black/10 lg:hidden">
                <div
                  className="h-full rounded-full bg-black transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {steps.map(({ id, title, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCurrentStep(id)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-black transition ${
                      currentStep === id
                        ? "border-black bg-black text-white"
                        : id < currentStep
                        ? "border-black/10 bg-[#b5e48c] text-black"
                        : "border-black/10 bg-[#fbfaf7] text-black/45"
                    }`}
                  >
                    <Icon size={14} />
                    {title}
                  </button>
                ))}
              </div>
            </div>

            {/* ONLY THIS PART SCROLLS */}
            <div className="custom-scrollbar flex-1 overflow-y-auto p-5 md:p-7">
              {currentStep === 1 && (
                <div>
                  <SectionHeading
                    title="Basic details"
                    text="Create a password you can use later with email or phone login. Mobile verification is compulsory."
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Full name"
                      value={form.fullName}
                      onChange={(v) => updateField("fullName", v)}
                      placeholder="Enter your name"
                    />

                    <Select
                      label="Gender"
                      value={form.gender}
                      onChange={(v) => updateField("gender", v)}
                      options={["Male", "Female", "Other"]}
                    />

                    <Input
                      label="City"
                      value={form.city}
                      onChange={(v) => updateField("city", v)}
                      placeholder="Bengaluru"
                    />

                    <Input
                      label="State"
                      value={form.state}
                      onChange={(v) => updateField("state", v)}
                      placeholder="Karnataka"
                    />

                    <Input
                      label="Password"
                      type="password"
                      value={form.password}
                      onChange={(v) => updateField("password", v)}
                      placeholder="Minimum 6 characters"
                    />

                    <Input
                      label="Confirm password"
                      type="password"
                      value={form.confirmPassword}
                      onChange={(v) => updateField("confirmPassword", v)}
                      placeholder="Re-enter password"
                    />
                  </div>

                  <div className="mt-5 rounded-xl border border-black/10 bg-[#fffaf3] p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#ffeedd]">
                        {form.profileImagePreview || form.profileImage?.url ? (
                          <img
                            src={form.profileImagePreview || form.profileImage.url}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User size={28} className="text-black/45" />
                        )}
                      </div>
                      <div className="min-w-[220px] flex-1">
                        <p className="text-sm font-black text-black">Profile photo</p>
                        <p className="mt-1 text-xs font-bold text-black/45">
                          This appears in your user/provider workspace after registration.
                        </p>
                      </div>
                      <label className="inline-flex cursor-pointer rounded-lg bg-black px-5 py-3 text-sm font-black text-[#fffaf3]">
                        Upload photo
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleProfilePhoto}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-black/10 bg-[#fbfaf7] p-4">
                    <p className="mb-3 text-sm font-black text-black">
                      Verify email with Google
                    </p>
                    <GoogleLogin
                      onSuccess={handleGoogleRegister}
                      onError={() =>
                        alert("Google verification was cancelled or failed.")
                      }
                      text="signup_with"
                      shape="rectangular"
                      width="400"
                    />
                    {emailVerified && form.email ? (
                      <p className="mt-3 text-sm font-bold text-emerald-700">
                        {form.email} is verified.
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-4">
                    <VerifyBox
                      title="Mobile number"
                      hint="Required"
                      verified={mobileVerified}
                      icon={Phone}
                    >
                      <Input
                        label="Phone"
                        value={form.phone}
                        onChange={(v) => updateField("phone", v)}
                        placeholder="+91 98765 43210"
                      />

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={sendMobileOtp}
                          className="rounded-full bg-black px-5 py-3 text-sm font-black text-white"
                        >
                          Send OTP
                        </button>

                        {mobileOtpSent && (
                          <button
                            type="button"
                            onClick={verifyMobileOtp}
                            className="rounded-full bg-[#b5e48c] px-5 py-3 text-sm font-black text-black"
                          >
                            Verify
                          </button>
                        )}
                      </div>

                      {mobileOtpSent && (
                        <div className="mt-4">
                          <Input
                            label="Mobile OTP"
                            value={form.mobileOtp}
                            onChange={(v) => updateField("mobileOtp", v)}
                            placeholder="Enter OTP"
                          />
                        </div>
                      )}
                    </VerifyBox>

                    <VerifyBox
                      title="Email address"
                      hint="Optional"
                      verified={emailVerified}
                      icon={Mail}
                    >
                      <Input
                        label="Email"
                        type="email"
                        value={form.email}
                        onChange={(v) => updateField("email", v)}
                        placeholder="you@example.com"
                      />

                      {!googleCredential && !emailVerified ? (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={sendEmailOtp}
                            className="rounded-full bg-black px-5 py-3 text-sm font-black text-white"
                          >
                            Send OTP
                          </button>

                          {emailOtpSent && (
                            <button
                              type="button"
                              onClick={verifyEmailOtp}
                              className="rounded-full bg-[#b5e48c] px-5 py-3 text-sm font-black text-black"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      ) : null}

                      {emailOtpSent && !googleCredential && !emailVerified && (
                        <div className="mt-4">
                          <Input
                            label="Email OTP"
                            value={form.emailOtp}
                            onChange={(v) => updateField("emailOtp", v)}
                            placeholder="Enter OTP"
                          />
                        </div>
                      )}
                    </VerifyBox>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <SectionHeading
                    title="KYC and selfie"
                    text="Choose your document type, enter details and capture a live selfie."
                  />

                  <div className="grid gap-4">
                    <div className="rounded-[1.5rem] border border-black/10 bg-[#fbfaf7] p-5">
                      <div className="mb-5 flex items-center gap-3">
                        <IconBox icon={IdCard} />
                        <div>
                          <p className="text-sm font-black text-black">KYC document</p>
                          <p className="mt-1 text-xs font-semibold text-black/45">
                            Select one document type
                          </p>
                        </div>
                      </div>

                      <Select
                        label="Document type"
                        value={form.documentType}
                        onChange={(v) => {
                          updateField("documentType", v);
                          updateField("documentNumber", "");
                        }}
                        options={kycTypes}
                      />

                      <div className="mt-4">
                        <Input
                          label={selectedKyc.label}
                          value={form.documentNumber}
                          onChange={(v) => updateField("documentNumber", v)}
                          placeholder={selectedKyc.placeholder}
                          maxLength={selectedKyc.maxLength}
                        />
                      </div>

                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-bold text-black">
                          Upload document photo
                        </label>

                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            updateField("kycFile", e.target.files?.[0] || null)
                          }
                          className="w-full rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black outline-none file:mr-4 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
                        />
                      </div>

                      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[1.3rem] border border-black/10 bg-white p-4">
                        <input
                          type="checkbox"
                          checked={form.kycConsent}
                          onChange={(e) => updateField("kycConsent", e.target.checked)}
                          className="mt-1"
                        />

                        <span className="text-sm font-semibold leading-6 text-black/65">
                          I agree that BuddyBOOK can use my KYC details for account
                          safety and verification review.
                        </span>
                      </label>
                    </div>

                    <div className="rounded-[1.5rem] border border-black/10 bg-[#fbfaf7] p-5">
                      <div className="mb-5 flex items-center gap-3">
                        <IconBox icon={Camera} />
                        <div>
                          <p className="text-sm font-black text-black">Live selfie</p>
                          <p className="mt-1 text-xs font-semibold text-black/45">
                            Used for identity matching
                          </p>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-[1.4rem] border border-black/10 bg-black p-2">
                        <Webcam
                          ref={webcamRef}
                          audio={false}
                          screenshotFormat="image/jpeg"
                          videoConstraints={{ facingMode: "user" }}
                          className="h-[230px] w-full rounded-[1.1rem] object-cover"
                        />
                      </div>

                      {selfie ? (
                        <img
                          src={selfie}
                          alt="Captured selfie"
                          className="mt-4 h-[150px] w-full rounded-[1.2rem] object-cover"
                        />
                      ) : (
                        <div className="mt-4 grid h-[150px] place-items-center rounded-[1.2rem] border border-dashed border-black/20 bg-white text-center">
                          <div>
                            <Camera className="mx-auto" size={30} />
                            <p className="mt-2 text-xs font-black text-black">
                              No selfie captured
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={captureSelfie}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-black text-white"
                        >
                          <Camera size={17} />
                          Capture
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelfie(null)}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-black text-black"
                        >
                          <RotateCcw size={17} />
                          Retake
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <SectionHeading
                    title="Profile setup"
                    text="Choose your role first. Related fields and questions will appear after selection."
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <RoleCard
                      active={form.role === "USER"}
                      icon={User}
                      title="I am a User"
                      text="Book safe public meetups."
                      onClick={() => updateField("role", "USER")}
                    />

                    <RoleCard
                      active={form.role === "PROVIDER"}
                      icon={Briefcase}
                      title="I am a Provider"
                      text="Receive bookings and earn."
                      onClick={() => updateField("role", "PROVIDER")}
                    />
                  </div>

                  {!form.role && (
                    <div className="mt-5 rounded-[1.5rem] border border-black/10 bg-[#fbfaf7] p-5 text-center">
                      <p className="text-sm font-black text-black">
                        Select User or Provider to continue.
                      </p>
                    </div>
                  )}

                  {form.role === "USER" && (
                    <div className="mt-5 grid gap-5">
                      <div className="rounded-[1.5rem] border border-black/10 bg-[#fbfaf7] p-5">
                        <h3 className="text-lg font-black text-black">
                          User preferences
                        </h3>

                        <PillMultiSelect
                          options={activityOptions}
                          selected={selectedActivities}
                          onToggle={toggleActivity}
                        />

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <Input
                            label="Preferred language"
                            value={form.preferredLanguage}
                            onChange={(v) => updateField("preferredLanguage", v)}
                            placeholder="English, Hindi"
                          />

                          <Input
                            label="Emergency contact"
                            value={form.emergencyContact}
                            onChange={(v) => updateField("emergencyContact", v)}
                            placeholder="+91 98765 43210"
                          />
                        </div>
                      </div>

                      <QuestionSection
                        title="User profile questions"
                        answers={userQuestionAnswers}
                        onUpdate={updateQuestion}
                      />
                    </div>
                  )}

                  {form.role === "PROVIDER" && (
                    <div className="mt-5 grid gap-5">
                      <div className="rounded-[1.5rem] border border-black/10 bg-[#fbfaf7] p-5">
                        <h3 className="text-lg font-black text-black">
                          Provider details
                        </h3>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <Input label="Profession" value={form.profession} onChange={(v) => updateField("profession", v)} placeholder="Student, designer" />
                          <Input label="Education" value={form.education} onChange={(v) => updateField("education", v)} placeholder="Graduate" />
                          <Input label="Height" value={form.height} onChange={(v) => updateField("height", v)} placeholder="5'8" />
                          <Input label="Hobbies" value={form.hobbies} onChange={(v) => updateField("hobbies", v)} placeholder="Movies, cafes" />
                          <Input label="Hourly price" value={form.hourlyPrice} onChange={(v) => updateField("hourlyPrice", v)} placeholder="₹600/hr" />
                          <Input label="Available city" value={form.availableCity} onChange={(v) => updateField("availableCity", v)} placeholder="Bengaluru" />
                          <Input label="Languages" value={form.providerLanguages} onChange={(v) => updateField("providerLanguages", v)} placeholder="English, Hindi" />
                          <Input label="Availability days" value={form.availabilityDays} onChange={(v) => updateField("availabilityDays", v)} placeholder="Mon, Wed, Sat" />
                        </div>

                        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[1.5rem] border border-black/10 bg-white p-5">
                          <input
                            type="checkbox"
                            checked={form.providerSafetyAgreement}
                            onChange={(e) =>
                              updateField("providerSafetyAgreement", e.target.checked)
                            }
                            className="mt-1"
                          />

                          <span className="text-sm font-semibold leading-6 text-black/65">
                            I agree to BuddyBOOK safety rules, public meetup policy,
                            in-app chat policy and admin review guidelines.
                          </span>
                        </label>
                      </div>

                      <QuestionSection
                        title="Provider profile questions"
                        answers={providerQuestionAnswers}
                        onUpdate={updateQuestion}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CARD FOOTER FIXED */}
            <div className="shrink-0 border-t border-black/10 p-5 md:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>

                {currentStep < steps.length ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-black/20"
                  >
                    Continue
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-black/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Creating account..." : "Register Securely"}
                    <CheckCircle2 size={16} />
                  </button>
                )}
              </div>

              <p className="mt-5 text-center text-sm font-semibold text-black/55">
                Already registered?{" "}
                <Link to="/login" className="font-black text-black underline">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SectionHeading({ title, text }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-black text-black md:text-3xl">{title}</h2>
      {text && (
        <p className="mt-2 text-sm font-semibold leading-6 text-black/55">
          {text}
        </p>
      )}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", maxLength }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-black">{label}</label>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-black/10 bg-white px-5 py-4 text-sm font-semibold text-black outline-none transition placeholder:text-black/25 focus:border-black"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-black">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-full border border-black/10 bg-white px-5 py-4 pr-11 text-sm font-semibold text-black outline-none transition focus:border-black"
        >
          <option value="">Select</option>
          {options.map((item) => {
            const optionValue = typeof item === "string" ? item : item.value;
            const optionLabel = typeof item === "string" ? item : item.label;

            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>

        <ChevronDown
          size={17}
          className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-black/35"
        />
      </div>
    </div>
  );
}

function IconBox({ icon: Icon }) {
  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-black text-white">
      <Icon size={20} />
    </div>
  );
}

function VerifyBox({ title, hint, verified, icon: Icon, children }) {
  return (
    <div className="rounded-[1.5rem] border border-black/10 bg-[#fbfaf7] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconBox icon={Icon} />

          <div>
            <p className="text-sm font-black text-black">{title}</p>
            <p className="mt-1 text-xs font-semibold text-black/45">{hint}</p>
          </div>
        </div>

        {verified && (
          <CheckCircle2 size={22} className="shrink-0 text-emerald-600" />
        )}
      </div>

      {children}
    </div>
  );
}

function RoleCard({ active, icon: Icon, title, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-[1.7rem] border p-5 text-left transition ${
        active
          ? "border-black bg-black text-white"
          : "border-black/10 bg-[#fbfaf7] text-black hover:border-black"
      }`}
    >
      <div
        className={`grid h-12 w-12 place-items-center rounded-2xl ${
          active ? "bg-white text-black" : "bg-black text-white"
        }`}
      >
        <Icon size={23} />
      </div>

      <h3 className="mt-5 text-xl font-black">{title}</h3>

      <p
        className={`mt-2 text-sm font-semibold leading-6 ${
          active ? "text-white/65" : "text-black/55"
        }`}
      >
        {text}
      </p>
    </button>
  );
}

function PillMultiSelect({ options, selected, onToggle }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {options.map((item) => {
        const active = selected.includes(item);

        return (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={`rounded-full border px-4 py-2 text-sm font-black transition ${
              active
                ? "border-black bg-black text-white"
                : "border-black/10 bg-white text-black hover:border-black"
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

function QuestionSection({ title, answers, onUpdate }) {
  return (
    <div className="rounded-[1.5rem] border border-black/10 bg-[#fbfaf7] p-5">
      <h3 className="text-lg font-black text-black">{title}</h3>
      <p className="mt-1 text-sm font-semibold text-black/50">
        Choose any 3 different questions and write honest short answers.
      </p>

      <div className="mt-5 grid gap-4">
        {answers.map((item, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-[1.3rem] border border-black/10 bg-white p-4"
          >
            <Select
              label={`Question ${index + 1}`}
              value={item.question}
              onChange={(v) => onUpdate(index, "question", v)}
              options={profileQuestions}
            />

            <Input
              label="Your answer"
              value={item.answer}
              onChange={(v) => onUpdate(index, "answer", v)}
              placeholder="Write a short real answer"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
