import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    placeholder: "Enter 12-digit Aadhaar number",
    maxLength: 12,
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
  "What's your ideal day out?",
  "What kind of conversations do you enjoy?",
  "What are your favorite hobbies?",
  "What type of people do you enjoy spending time with?",
  "What's something you're passionate about?",
  "What makes hanging out with you fun?",
  "What's your favorite weekend activity?",
  "How would your friends describe you?",
  "What kind of vibe do you bring?",
  "What's your perfect coffee meetup like?",
  "What's your favorite local spot?",
  "What's something you're always excited to do?",
  "What's your idea of a great first meetup?",
  "What do you enjoy doing in your free time?",
  "If we met for lunch, what kind of place would you choose?",
  "What's your favorite place to spend an afternoon?",
  "What's a topic you genuinely enjoy talking about?",
  "If someone books time with you, what can they expect?",
];

const emptyQuestions = [
  { question: "", answer: "" },
  { question: "", answer: "" },
  { question: "", answer: "" },
];
const REGISTRATION_DRAFT_KEY = "buddybook_registration_draft";
const identityOptions = [
  "Lesbian", "Gay", "Bisexual", "Transgender", "Queer", "Non-binary",
  "Genderfluid", "Agender", "Bigender", "Genderqueer", "Gender non-conforming",
  "Trans man", "Trans woman", "Intersex",
];

export default function Register() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const formScrollRef = useRef(null);
  const draftReadyRef = useRef(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [editingApplication, setEditingApplication] = useState(false);
  const [existingDocumentUrl, setExistingDocumentUrl] = useState("");
  const [selfie, setSelfie] = useState(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);
  const [notice, setNotice] = useState(null);

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
    aadhaarOtp: "",
    kycFile: null,
    kycConsent: false,

    role: "",

    preferredLanguage: "",
    emergencyContact: "",

    profession: "",
    education: "",
    height: "",
    hobbies: "",
    providerSafetyAgreement: false,
    ageConfirmed: false,
    safetyAccepted: false,
  });

  const notify = (message, type = "info") => {
    setNotice({ message, type });
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setNotice(null), 3200);
  };

  const progress = useMemo(
    () => Math.round((currentStep / steps.length) * 100),
    [currentStep]
  );

  const activeStep = steps.find((step) => step.id === currentStep);
  const ActiveIcon = activeStep?.icon || User;

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(REGISTRATION_DRAFT_KEY) || "null");
      if (!draft) return;
      setForm((current) => ({ ...current, ...draft.form, profileImage: draft.form?.profileImage || null, kycFile: null }));
      setCurrentStep(draft.currentStep || 1);
      setSelectedActivities(draft.selectedActivities || []);
      setUserQuestionAnswers(draft.userQuestionAnswers || emptyQuestions);
      setProviderQuestionAnswers(draft.providerQuestionAnswers || emptyQuestions);
      setSelfie(draft.selfie || null);
    } catch {
      localStorage.removeItem(REGISTRATION_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    if (!draftReadyRef.current) {
      draftReadyRef.current = true;
      return;
    }
    const safeForm = { ...form, kycFile: null };
    localStorage.setItem(REGISTRATION_DRAFT_KEY, JSON.stringify({
      form: safeForm, currentStep, selectedActivities, userQuestionAnswers, providerQuestionAnswers, selfie,
    }));
  }, [form, currentStep, selectedActivities, userQuestionAnswers, providerQuestionAnswers, selfie]);

  useEffect(() => {
    formScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [currentStep]);

  const selectedKyc =
    kycTypes.find((item) => item.value === form.documentType) || kycTypes[0];

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("edit")) return;
    api.get("/auth/application").then(({ data }) => {
      const item = data.data;
      const profile = item.role === "PROVIDER" ? item.providerProfile : item.userProfile;
      const questions = Array.isArray(profile?.profileQuestions) && profile.profileQuestions.length ? profile.profileQuestions : emptyQuestions;
      setEditingApplication(true);
      setExistingDocumentUrl(item.kycVerification?.documentUrl || "");
      setMobileVerified(Boolean(item.mobileVerified));
      setEmailVerified(Boolean(item.emailVerified));
      setSelfie(item.referenceSelfie || null);
      setSelectedActivities(String(profile?.interests || profile?.activities || "").split(",").map(v => v.trim()).filter(Boolean));
      if (item.role === "PROVIDER") setProviderQuestionAnswers(questions); else setUserQuestionAnswers(questions);
      setForm((prev) => ({ ...prev,
        fullName: item.fullName || "", phone: item.phone || "", email: item.email || "", city: item.city || "", state: item.state || "", gender: item.gender || "", role: item.role || "",
        documentType: item.kycVerification?.documentType || "AADHAAR", documentNumber: item.kycVerification?.documentNumber || "", kycConsent: Boolean(item.kycVerification?.consentAccepted),
        profileImage: item.profileImage ? { url: item.profileImage } : null, profileImagePreview: item.profileImage || "", preferredLanguage: profile?.preferredLanguage || "", emergencyContact: profile?.emergencyContact || "",
        profession: profile?.profession || "", education: profile?.education || "", height: profile?.height || "", hobbies: profile?.hobbies || "", providerSafetyAgreement: Boolean(profile?.providerSafetyAgreement),
      }));
    }).catch(() => setNotice({ message: "Sign in again to edit your application.", type: "error" }));
  }, []);

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
      if (!/^\d{10}$/.test(form.phone)) {
        notify("Enter a valid 10-digit mobile number first.");
        return;
      }

      const res = await api.post("/auth/send-mobile-otp", {
        phone: form.phone,
      });

      setMobileOtpSent(true);

      notify(
        res.data.demoOtp
          ? `Mobile OTP sent. Use ${res.data.demoOtp}`
          : res.data.message || "Mobile OTP sent"
      );
    } catch (error) {
      console.error("SEND_MOBILE_OTP_FRONTEND_ERROR:", error);
      notify(error.response?.data?.message || "Failed to send mobile OTP");
    }
  };

  const verifyMobileOtp = async () => {
    try {
      if (!form.phone || !form.mobileOtp) {
        notify("Enter phone and OTP first");
        return;
      }

      const res = await api.post("/auth/verify-mobile-otp", {
        phone: form.phone,
        otp: form.mobileOtp,
      });

      setMobileVerified(true);
      notify(res.data.message || "Mobile verified successfully");
    } catch (error) {
      console.error("VERIFY_MOBILE_OTP_FRONTEND_ERROR:", error);
      notify(error.response?.data?.message || "Mobile OTP verification failed");
    }
  };

  const sendEmailOtp = async () => {
    try {
      if (!form.email) {
        notify("Enter your email address first. Email verification is required.");
        return;
      }

      const res = await api.post("/auth/send-email-otp", {
        email: form.email,
      });

      setEmailOtpSent(true);

      notify(
        res.data.demoOtp
          ? `Email OTP sent. Use ${res.data.demoOtp}`
          : res.data.message || "Email OTP sent"
      );
    } catch (error) {
      console.error("SEND_EMAIL_OTP_FRONTEND_ERROR:", error);
      notify(error.response?.data?.message || "Failed to send email OTP");
    }
  };

  const verifyEmailOtp = async () => {
    try {
      if (!form.email || !form.emailOtp) {
        notify("Enter email and OTP first");
        return;
      }

      const res = await api.post("/auth/verify-email-otp", {
        email: form.email,
        otp: form.emailOtp,
      });

      setEmailVerified(true);
      notify(res.data.message || "Email verified successfully");
    } catch (error) {
      console.error("VERIFY_EMAIL_OTP_FRONTEND_ERROR:", error);
      notify(error.response?.data?.message || "Email OTP verification failed");
    }
  };

  const sendAadhaarOtp = async () => {
    try {
      if (!/^\d{12}$/.test(form.documentNumber)) return notify("Enter exactly 12 Aadhaar digits first.");
      const res = await api.post("/auth/send-aadhaar-otp", { aadhaar: form.documentNumber });
      setAadhaarOtpSent(true);
      notify(`Aadhaar demo OTP generated. Use ${res.data.demoOtp}`);
    } catch (error) {
      notify(error.response?.data?.message || "Failed to generate Aadhaar demo OTP.");
    }
  };

  const verifyAadhaarOtp = async () => {
    try {
      if (!form.aadhaarOtp) return notify("Enter the generated Aadhaar demo OTP.");
      const res = await api.post("/auth/verify-aadhaar-otp", { aadhaar: form.documentNumber, otp: form.aadhaarOtp });
      setAadhaarVerified(true);
      notify(res.data.message || "Aadhaar demo OTP verified.");
    } catch (error) {
      notify(error.response?.data?.message || "Aadhaar demo OTP verification failed.");
    }
  };

  const handleProfilePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      notify("Profile photo must be 3 MB or smaller.");
      event.target.value = "";
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      notify("Only JPG, PNG and WebP images are allowed.");
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
      notify(error.response?.data?.message || "Profile photo upload failed.");
    } finally {
      event.target.value = "";
    }
  };

  const captureSelfie = () => {
    if (!webcamRef.current) {
      notify("Camera is not ready yet");
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      notify("Selfie capture failed. Please allow camera permission.");
      return;
    }

    setSelfie(imageSrc);
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        notify("Camera needs a secure (HTTPS) connection to work.", "error");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      stream.getTracks().forEach((track) => track.stop());
      setCameraStarted(true);
    } catch {
      notify("Camera permission is required to capture your live selfie.", "error");
    }
  };

  const validateQuestionAnswers = () => {
    const completed = activeQuestions.filter(
      (item) => item.question && item.answer.trim()
    );

    if (completed.length < 3) {
      notify("Please answer all 3 profile questions.");
      return false;
    }

    const uniqueQuestions = new Set(completed.map((item) => item.question));

    if (uniqueQuestions.size !== completed.length) {
      notify("Please choose different questions.");
      return false;
    }

    return true;
  };

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      if (!form.fullName || !form.email || !form.phone || !form.city || !form.state || !form.gender) {
        notify("Please complete name, email, phone, city, state and gender.");
        return false;
      }

      if (!form.profileImage?.url) {
        notify("Profile photo is required before continuing.");
        return false;
      }

      if (!/^\d{10}$/.test(form.phone)) {
        notify("Mobile number must contain exactly 10 digits.");
        return false;
      }

      if (!editingApplication && (!form.password || form.password.length < 6)) {
        notify("Please create a password with at least 6 characters.");
        return false;
      }

      if (!editingApplication && form.password !== form.confirmPassword) {
        notify("Passwords do not match.");
        return false;
      }

      if (!mobileVerified) {
        notify("Mobile verification is compulsory.");
        return false;
      }

      if (!emailVerified) {
        notify("Email OTP verification is compulsory.");
        return false;
      }
    }

    if (currentStep === 2) {
      if (!form.documentType || !form.documentNumber || (!form.kycFile && !existingDocumentUrl) || !form.kycConsent) {
        notify("Please complete KYC details and accept consent.");
        return false;
      }

      if (form.documentType === "AADHAAR" && !/^\d{12}$/.test(form.documentNumber)) {
        notify("Aadhaar number must contain exactly 12 digits.");
        return false;
      }

      if (form.documentType === "AADHAAR" && !aadhaarVerified) {
        notify("Generate and verify the Aadhaar demo OTP.");
        return false;
      }

      if (!selfie) {
        notify("Please capture live selfie.");
        return false;
      }
    }

    if (currentStep === 3) {
      if (!form.role) {
        notify("Please choose User or Provider.");
        return false;
      }

      if (!validateQuestionAnswers()) return false;
      if (!form.ageConfirmed || !form.safetyAccepted) {
        notify("Confirm that you are 18+ and that you have read the Safety page.");
        return false;
      }

      if (form.role === "USER") {
        if (selectedActivities.length === 0 || !form.emergencyContact) {
          notify("Please choose activities and add emergency contact.");
          return false;
        }
      }

      if (form.role === "PROVIDER") {
        if (
          !form.profession ||
          !form.education ||
          !form.height ||
          !form.hobbies
        ) {
          notify("Please complete provider details.");
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
      let documentUrl = existingDocumentUrl;
      if (form.kycFile) {
        const documentForm = new FormData();
        documentForm.append("document", form.kycFile);
        const documentResponse = await api.post("/auth/upload-kyc-document", documentForm, { timeout: 60000 });
        documentUrl = documentResponse.data?.document?.url;
      }
      if (!documentUrl) throw new Error("Identity document upload did not return a file URL.");

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
        aadhaarLast4: documentLast4,
        documentType: form.documentType,
        documentNumber: form.documentNumber,
        documentNumberLast4: documentLast4,
        documentUrl,
        kycConsent: form.kycConsent,
        referenceSelfie: selfie,
        profileImage: form.profileImage?.url || null,
        ageConfirmed: form.ageConfirmed,
        safetyAccepted: form.safetyAccepted,

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
          bio: profileAnswersText,
          profileQuestions: activeAnswers,
          providerSafetyAgreement: true,
        },
      };

      const res = editingApplication
        ? await api.patch("/auth/application", payload)
        : await api.post("/auth/register", payload);

      notify(res.data.message || "Registration successful");
      localStorage.removeItem(REGISTRATION_DRAFT_KEY);

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
          bio: profileAnswersText,
          profileQuestions: activeAnswers,
        },
      };

      localStorage.removeItem("buddybook_auth_user");
      localStorage.setItem("buddybook_pending_application", JSON.stringify(editingApplication ? res.data.data : nextUser));
      navigate("/application-review");
    } catch (error) {
      console.error("REGISTER_FRONTEND_ERROR:", error);
      notify(error.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f5f3ee] text-black">
      {notice ? (
        <div className="fixed right-4 top-4 z-[100] max-w-sm rounded-none border border-black/10 bg-white p-4 shadow-2xl">
          <p className={`text-sm font-black ${notice.type === "error" ? "text-rose-600" : notice.type === "success" ? "text-emerald-700" : "text-black"}`}>
            {notice.message}
          </p>
        </div>
      ) : null}
      {stepLoading ? (
        <div className="absolute inset-0 z-50 grid place-items-center bg-white/70 backdrop-blur-sm">
          <div className="w-[220px] rounded-none border border-black/10 bg-white p-5 text-center shadow-[0_25px_80px_rgba(0,0,0,0.12)]">
            <div className="mx-auto h-9 w-9 animate-spin rounded-none border-4 border-black/10 border-t-black" />
            <p className="mt-4 text-sm font-black">Preparing next step</p>
            <p className="mt-1 text-xs font-bold text-black/45">Saving progress locally</p>
          </div>
        </div>
      ) : null}
      <main className="grid min-h-screen lg:h-screen lg:overflow-hidden lg:grid-cols-[0.92fr_1.08fr]">
        {/* LEFT SIDE FIXED IMAGE */}
        <aside className="relative hidden h-screen overflow-hidden bg-black lg:block">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&auto=format&fit=crop')] bg-cover bg-center opacity-80" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.28),rgba(0,0,0,0.88))]" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
            <div className="inline-block w-max rounded-none bg-white p-3 shadow-lg shadow-black/20">
              <Logo />
            </div>

            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 rounded-none border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] backdrop-blur-xl">
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
                  className="rounded-none border border-white/15 bg-white/10 p-4 backdrop-blur-xl"
                >
                  <CheckCircle2 size={18} className="text-[#b5e48c]" />
                  <p className="mt-3 text-sm font-black">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* RIGHT SIDE FIXED CARD, INNER CONTENT SCROLLS */}
        <section className="flex min-h-screen items-start justify-center overflow-y-auto bg-[#fbfaf7] px-4 py-4 md:items-center md:h-screen md:px-6 lg:overflow-hidden lg:px-[4.5rem] lg:py-4 xl:px-[6.75rem] 2xl:px-36">
          <div className="flex min-h-0 w-full max-w-[640px] flex-col border border-black/10 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.10)] md:h-full lg:h-[calc(100vh-2rem)] lg:max-w-[780px]">
            {/* CARD HEADER FIXED */}
            <div className="shrink-0 border-b border-black/10 p-5 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>


                  <h1 className=" text-4xl font-black leading-tight tracking-tight text-black">
                    Create account
                  </h1>

                  <p className="mt-2 text-sm font-semibold text-black/55">
                    Step {currentStep} of {steps.length} · {activeStep?.title}
                  </p>
                </div>

                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-none bg-black text-white">
                  <ActiveIcon size={20} />
                </div>
              </div>

              <div className="mt-6 h-2 overflow-hidden rounded-none bg-black/10 lg:hidden">
                <div
                  className="h-full rounded-none bg-black transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {steps.map(({ id, title, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCurrentStep(id)}
                    className={`flex shrink-0 items-center gap-2 rounded-none border px-4 py-2.5 text-xs font-black transition ${
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

              <div className="mt-5 hidden lg:block">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/45">
                    Registration progress
                  </p>
                  <p className="text-xs font-black text-black">{progress}% complete</p>
                </div>
                <div className="relative h-3 overflow-hidden rounded-full bg-black/10 shadow-inner">
                  <div
                    className="registration-progress relative h-full overflow-hidden rounded-full bg-black shadow-[0_4px_14px_rgba(0,0,0,0.22)] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  >
                    <span className="absolute inset-y-0 w-16 -skew-x-12 bg-white/35 blur-[1px]" />
                  </div>
                </div>
              </div>
            </div>

            {/* ONLY THIS PART SCROLLS */}
            <div ref={formScrollRef} className="custom-scrollbar flex-1 overflow-y-auto p-5 md:p-7 lg:pb-10">
              {currentStep === 1 && (
                <div>


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
                      options={["Male", "Female", "Others", ...(identityOptions.includes(form.gender) ? [form.gender] : [])]}
                    />
                    {form.gender === "Others" ? (
                      <div className="sm:col-span-2 rounded-none border border-black/10 bg-[#fbfaf7] p-4">
                        <p className="mb-3 text-sm font-black">Choose your identity</p>
                        <PillMultiSelect options={identityOptions} selected={identityOptions.includes(form.gender) ? [form.gender] : []} onToggle={(value) => updateField("gender", value)} />
                      </div>
                    ) : null}

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

                  <div className="mt-5 rounded-none border border-black/10 bg-[#fffaf3] p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-none bg-[#ffeedd]">
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
                        <p className="text-sm font-black text-black">Profile photo <span className="text-rose-600">*</span></p>
                        <p className="mt-1 text-xs font-bold text-black/45">
                          Required for every account. This appears in your user/provider workspace after registration.
                        </p>
                      </div>
                      <label className="inline-flex cursor-pointer rounded-none bg-black px-5 py-3 text-sm font-black text-[#fffaf3]">
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

                  <div className="mt-5 grid gap-4">
                    <VerifyBox
                      title="Mobile number"
                      hint="Required"
                      verified={mobileVerified}
                      icon={Phone}
                    >
                      <Input
                        label="Mobile number"
                        value={form.phone}
                        onChange={(v) => {
                          updateField("phone", v.replace(/\D/g, "").slice(0, 10));
                          setMobileVerified(false);
                          setMobileOtpSent(false);
                        }}
                        placeholder="Enter 10-digit number"
                        maxLength={10}
                        inputMode="numeric"
                      />

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={sendMobileOtp}
                          className="rounded-none bg-black px-5 py-3 text-sm font-black text-white"
                        >
                          Send OTP
                        </button>

                        {mobileOtpSent && (
                          <button
                            type="button"
                            onClick={verifyMobileOtp}
                            disabled={mobileVerified}
                            className="group relative overflow-hidden rounded-xl border-2 border-black bg-[#b5e48c] px-7 py-3 text-sm font-black text-black shadow-[0_12px_30px_rgba(111,171,70,0.3)] transition duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-black hover:text-white disabled:translate-y-0 disabled:bg-emerald-600 disabled:text-white"
                          >
                            <span className="relative inline-flex items-center gap-2"><CheckCircle2 size={18} />{mobileVerified ? "Mobile verified" : "Verify mobile now"}</span>
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

                      {!emailVerified ? (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={sendEmailOtp}
                            className="rounded-none bg-black px-5 py-3 text-sm font-black text-white"
                          >
                            Send OTP
                          </button>

                          {emailOtpSent && (
                            <button
                              type="button"
                              onClick={verifyEmailOtp}
                              className="rounded-none bg-[#b5e48c] px-5 py-3 text-sm font-black text-black"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      ) : null}

                      {emailOtpSent && !emailVerified && (
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
                    <div className="rounded-none border border-black/10 bg-[#fbfaf7] p-5">
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
                          updateField("aadhaarOtp", "");
                          setAadhaarOtpSent(false);
                          setAadhaarVerified(false);
                        }}
                        options={kycTypes}
                      />

                      <div className="mt-4">
                        <Input
                          label={selectedKyc.label}
                          value={form.documentNumber}
                          onChange={(v) => {
                            updateField("documentNumber", form.documentType === "AADHAAR" ? v.replace(/\D/g, "").slice(0, 12) : v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, selectedKyc.maxLength));
                            setAadhaarOtpSent(false);
                            setAadhaarVerified(false);
                          }}
                          placeholder={selectedKyc.placeholder}
                          maxLength={selectedKyc.maxLength}
                          inputMode={form.documentType === "AADHAAR" ? "numeric" : "text"}
                        />
                      </div>

                      {form.documentType === "AADHAAR" ? <div className="mt-4 rounded-none border border-black/10 bg-white p-4">
                        <div className="flex flex-wrap gap-3">
                          <button type="button" onClick={sendAadhaarOtp} disabled={aadhaarVerified} className="rounded-none bg-black px-4 py-3 text-xs font-black text-white disabled:opacity-50">Generate Aadhaar demo OTP</button>
                          {aadhaarOtpSent ? <span className="self-center text-xs font-bold text-emerald-700">Demo OTP generated</span> : null}
                        </div>
                        {aadhaarOtpSent ? <div className="mt-3 flex flex-col gap-3 sm:flex-row"><div className="flex-1"><Input label="Aadhaar demo OTP" value={form.aadhaarOtp} onChange={(v)=>updateField("aadhaarOtp",v.replace(/\D/g,"").slice(0,4))} placeholder="Enter 4-digit OTP" maxLength={4} inputMode="numeric"/></div><button type="button" onClick={verifyAadhaarOtp} disabled={aadhaarVerified} className="min-h-12 self-end rounded-none bg-emerald-600 px-5 text-sm font-black text-white disabled:opacity-50">{aadhaarVerified ? "Verified" : "Verify OTP"}</button></div> : null}
                      </div> : null}

                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-bold text-black">
                          Upload identity proof with your photo <span className="text-rose-600">*</span>
                        </label>

                        <input
                          type="file"
                          accept="image/*,.pdf"
                          required
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
                            if (file && (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024)) {
                              e.target.value = "";
                              updateField("kycFile", null);
                              notify("Upload a JPG, PNG, WebP or PDF up to 5 MB.", "error");
                              return;
                            }
                            updateField("kycFile", file);
                          }}
                          className="w-full rounded-none border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black outline-none file:mr-4 file:rounded-none file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
                        />
                        <p className="mt-2 text-xs font-semibold text-black/45">Required. The uploaded ID proof must clearly show your photograph. JPG, PNG, WebP or PDF, up to 5 MB.</p>
                        {form.kycFile ? <p className="mt-2 truncate text-xs font-black text-emerald-700">Selected: {form.kycFile.name}</p> : null}
                      </div>

                      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-none border border-black/10 bg-white p-4">
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

                    <div className="rounded-none border border-black/10 bg-[#fbfaf7] p-5">
                      <div className="mb-5 flex items-center gap-3">
                        <IconBox icon={Camera} />
                        <div>
                          <p className="text-sm font-black text-black">Live selfie</p>
                          <p className="mt-1 text-xs font-semibold text-black/45">
                            Used for identity matching
                          </p>
                        </div>
                      </div>

                      <div className="mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-none border border-black/10 bg-black p-2">
                        {cameraStarted ? (
                          <Webcam
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: "user" }}
                            playsInline
                            className="h-full w-full rounded-none object-cover"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={startCamera}
                            className="grid h-full w-full place-items-center gap-2 text-center text-white"
                          >
                            <Camera size={28} />
                            <span className="text-xs font-black">Tap to enable camera</span>
                          </button>
                        )}
                      </div>

                      {selfie ? (
                        <img
                          src={selfie}
                          alt="Captured selfie"
                          className="mx-auto mt-4 aspect-square w-full max-w-[200px] rounded-none object-cover"
                        />
                      ) : (
                        <div className="mx-auto mt-4 grid aspect-square w-full max-w-[200px] place-items-center rounded-none border border-dashed border-black/20 bg-white text-center">
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
                          className="inline-flex items-center justify-center gap-2 rounded-none bg-black px-5 py-3 text-sm font-black text-white"
                        >
                          <Camera size={17} />
                          Capture
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelfie(null)}
                          className="inline-flex items-center justify-center gap-2 rounded-none border border-black/10 bg-white px-5 py-3 text-sm font-black text-black"
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
                    <div className="mt-5 rounded-none border border-black/10 bg-[#fbfaf7] p-5 text-center">
                      <p className="text-sm font-black text-black">
                        Select User or Provider to continue.
                      </p>
                    </div>
                  )}

                  {form.role ? <div className="mt-5 rounded-none border border-black/10 bg-[#fbfaf7] p-5">
                    <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={form.ageConfirmed} onChange={(event) => updateField("ageConfirmed", event.target.checked)} className="mt-1"/><span className="text-sm font-semibold">I confirm that I am 18 years of age or older.</span></label>
                    <label className="mt-4 flex cursor-pointer items-start gap-3"><input type="checkbox" checked={form.safetyAccepted} onChange={(event) => updateField("safetyAccepted", event.target.checked)} className="mt-1"/><span className="text-sm font-semibold">I agree to BuddyBOOK safety rules, public meetup policy, in-app chat policy and admin review guidelines.  <Link to="/safety" target="_blank" className="text-blue-500 underline">Safety page</Link>.</span></label>
                  </div> : null}

                  {form.role === "USER" && (
                    <div className="mt-5 grid gap-5">
                      <div className="rounded-none border border-black/10 bg-[#fbfaf7] p-5">
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
                            placeholder="+91 9999999999"
                          />
                        </div>
                      </div>

                      <QuestionSection
                        title="Help people get to know you"
                        answers={userQuestionAnswers}
                        onUpdate={updateQuestion}
                      />
                    </div>
                  )}

                  {form.role === "PROVIDER" && (
                    <div className="mt-5 grid gap-5">
                      <div className="rounded-none border border-black/10 bg-[#fbfaf7] p-5">
                        <h3 className="text-lg font-black text-black">
                          Provider details
                        </h3>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <Input label="Profession" value={form.profession} onChange={(v) => updateField("profession", v)} placeholder="Student, designer" />
                          <Input label="Education" value={form.education} onChange={(v) => updateField("education", v)} placeholder="Graduate" />
                          <Input label="Height" value={form.height} onChange={(v) => updateField("height", v)} placeholder="5'8" />
                          <Input label="Hobbies" value={form.hobbies} onChange={(v) => updateField("hobbies", v)} placeholder="Movies, cafes" />
                        </div>

                      </div>

                      <QuestionSection
                        title="Help people get to know you"
                        answers={providerQuestionAnswers}
                        onUpdate={updateQuestion}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CARD FOOTER FIXED */}
            <div className="shrink-0 border-t border-black/10 p-5 md:p-7 lg:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="inline-flex items-center justify-center gap-2 rounded-none border border-black/10 bg-white px-6 py-3 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40 lg:py-2.5"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>

                {currentStep < steps.length ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex items-center justify-center gap-2 rounded-none bg-black px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-black/20 lg:py-2.5"
                  >
                    Continue
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-none bg-black px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-black/20 disabled:cursor-not-allowed disabled:opacity-60 lg:py-2.5"
                  >
                    {isSubmitting ? "Creating account..." : "Register Securely"}
                    <CheckCircle2 size={16} />
                  </button>
                )}
              </div>

              <p className="mt-5 text-center text-sm font-semibold text-black/55 lg:mt-3">
                Already registered?{" "}
                <Link to="/login" className="font-black text-black underline">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <style>{`
        @media (min-width: 1024px) {
          .registration-progress > span {
            animation: registrationProgressShine 2.2s ease-in-out infinite;
          }
        }
        @keyframes registrationProgressShine {
          from { left: -5rem; }
          to { left: calc(100% + 1rem); }
        }
        @media (prefers-reduced-motion: reduce) {
          .registration-progress > span { animation: none; }
        }
      `}</style>
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

function Input({ label, value, onChange, placeholder, type = "text", maxLength, inputMode }) {
  return (
    <div>
      {label ? <label className="mb-2 block text-sm font-bold text-black">{label}</label> : null}
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-none border border-black/10 bg-white px-5 py-4 text-sm font-semibold text-black outline-none transition placeholder:text-black/25 focus:border-black"
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
          className="w-full appearance-none rounded-none border border-black/10 bg-white px-5 py-4 pr-11 text-sm font-semibold text-black outline-none transition focus:border-black"
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
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-none bg-black text-white">
      <Icon size={20} />
    </div>
  );
}

function VerifyBox({ title, hint, verified, icon: Icon, children }) {
  return (
    <div className="rounded-none border border-black/10 bg-[#fbfaf7] p-5">
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
      className={`relative rounded-none border p-5 text-left transition ${
        active
          ? "border-black bg-black text-white"
          : "border-black/10 bg-[#fbfaf7] text-black hover:border-black"
      }`}
    >
      <div
        className={`grid h-12 w-12 place-items-center rounded-none ${
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
            className={`rounded-none border px-4 py-2 text-sm font-black transition ${
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

function QuestionSelect({ value, onChange, selectedQuestions }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex w-full items-center justify-between gap-3 rounded-none border border-black/10 bg-white px-5 py-4 text-left text-sm font-semibold text-black">
        <span className="min-w-0 truncate">{value || "Select"}</span>
        <span aria-hidden="true" className={`shrink-0 transition ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open ? <div className="absolute inset-x-0 top-[calc(100%+0.25rem)] z-50 max-h-60 overflow-y-auto overscroll-contain border border-black/10 bg-white p-1 shadow-xl">
        {profileQuestions.map((question) => {
          const unavailable = question !== value && selectedQuestions.includes(question);
          return <button key={question} type="button" disabled={unavailable} onClick={() => { onChange(question); setOpen(false); }} className={`block w-full px-4 py-3 text-left text-sm font-semibold ${unavailable ? "cursor-not-allowed text-black/25" : "hover:bg-[#fbfaf7]"} ${value === question ? "bg-[#fff0df] font-black" : ""}`}>{question}</button>;
        })}
      </div> : null}
    </div>
  );
}

function QuestionSection({ title, answers, onUpdate }) {
  return (
    <div className="rounded-none border border-black/10 bg-[#fbfaf7] p-5">
      <h3 className="text-lg font-black text-black">{title}</h3>
      <p className="mt-1 text-sm font-semibold text-black/50">
      Answer any 3 questions to show your personality and what it's like to spend time with you.      </p>

      <div className="mt-5 grid gap-4">
        {answers.map((item, index) => (
          <details
            key={index}
            className="group rounded-none border border-black/10 bg-white"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-black text-black">
              <span className="min-w-0 truncate">{`Question ${index + 1}`}</span>
              <span aria-hidden="true" className="shrink-0 transition group-open:rotate-180">▼</span>
            </summary>
            <div className="grid gap-3 border-t border-black/10 p-4">
              <QuestionSelect value={item.question} selectedQuestions={answers.map((answer) => answer.question).filter(Boolean)} onChange={(v) => onUpdate(index, "question", v)} />
              <Input label="Your answer" value={item.answer} onChange={(v) => onUpdate(index, "answer", v)} placeholder="Write a short real answer" />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
