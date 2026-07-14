import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../api/api";
import Logo from "../../components/common/Logo";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = getSafeRedirect(
    new URLSearchParams(location.search).get("redirect") || location.state?.redirect
  );

  const [form, setForm] = useState({
    identifier: "",
    password: "",
    phone: "",
    otp: "",
  });

  const [loginMode, setLoginMode] = useState("password");
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const goToDashboard = (user) => {
    const disabled = Boolean(user?.accountDisabled && user?.disabledUntil && new Date(user.disabledUntil).getTime() > Date.now());
    if (disabled) {
      navigate(user.role === "PROVIDER" ? "/app/provider/settings" : "/app/user/settings");
      return;
    }
    navigate(redirectTo);
  };

  const completeAuth = (data) => {
    if (data.token) {
      localStorage.setItem("buddybook_token", data.token);
    }

    localStorage.setItem("buddybook_auth_user", JSON.stringify(data.user));
    goToDashboard(data.user);
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setIsLoading(true);
      const res = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });

      completeAuth(res.data);
    } catch (error) {
      const data = error.response?.data;

      if (data?.needsRegistration) {
        sessionStorage.setItem(
          "buddybook_google_profile",
          JSON.stringify({
            credential: credentialResponse.credential,
            ...data.profile,
          })
        );
        navigate("/register", { state: { googleProfile: data.profile } });
        return;
      }

      console.error("GOOGLE_LOGIN_FRONTEND_ERROR:", error);
      alert(data?.message || "Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!form.identifier || !form.password) {
      alert("Please enter email/phone and password.");
      return;
    }

    try {
      setIsLoading(true);
      const identifier = form.identifier.trim();

      const res = await api.post("/auth/login", {
        ...(identifier.includes("@") ? { email: identifier } : { phone: identifier }),
        password: form.password,
      });

      completeAuth(res.data);
    } catch (error) {
      console.error("LOGIN_FRONTEND_ERROR:", error);
      alert(error.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const sendLoginOtp = async () => {
    if (!form.phone.trim()) {
      alert("Please enter your registered mobile number.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post("/auth/send-login-mobile-otp", {
        phone: form.phone.trim(),
      });
      setOtpSent(true);
      alert(res.data?.message || "OTP sent. Use 1234 for demo login.");
    } catch (error) {
      console.error("SEND_LOGIN_OTP_FRONTEND_ERROR:", error);
      alert(error.response?.data?.message || "Failed to send login OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    if (!form.phone.trim() || !form.otp.trim()) {
      alert("Please enter mobile number and OTP.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post("/auth/login-mobile-otp", {
        phone: form.phone.trim(),
        otp: form.otp.trim(),
      });

      completeAuth(res.data);
    } catch (error) {
      console.error("LOGIN_OTP_FRONTEND_ERROR:", error);
      alert(error.response?.data?.message || "OTP login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f4ef] text-black">
      <main className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        {/* LEFT IMAGE PANEL */}
        <aside className="relative hidden min-h-screen overflow-hidden bg-black lg:block">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&auto=format&fit=crop')] bg-cover bg-center opacity-80" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.25),rgba(0,0,0,0.88))]" />
          <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:9px_9px]" />

          <div className="relative z-10 flex min-h-screen flex-col justify-between p-10 text-white">
            <div className="inline-block w-max rounded-none bg-white p-3 shadow-sm">
              <Logo />
            </div>

            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 rounded-none border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] backdrop-blur-xl">
                <ShieldCheck size={15} className="text-[#b5e48c]" />
                Welcome back
              </div>

              <h1 className="mt-6 text-6xl font-black leading-[0.95] tracking-tight">
                Continue your
                <br />
                safe social
                <br />
                journey.
              </h1>

              <p className="mt-6 max-w-md text-base font-semibold leading-8 text-white/72">
                Login to manage your profile, bookings, payments, saved buddies
                and verified meetup activity.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {["Verified users", "Safe bookings", "Real profiles"].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-none border border-white/15 bg-white/10 p-4 backdrop-blur-xl"
                  >
                    <Sparkles size={18} className="text-[#b5e48c]" />
                    <p className="mt-3 text-sm font-black">{item}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </aside>

        {/* RIGHT LOGIN PANEL */}
        <section className="flex min-h-screen items-center justify-center overflow-y-auto bg-[#fbfaf7] px-4 py-8 sm:px-6 sm:py-10">
          <div className="w-full max-w-[480px]">
            <div className="mb-8 lg:hidden">
              <div className="inline-block rounded-none bg-white p-3 shadow-sm">
                <Logo />
              </div>
            </div>

            <div className="border border-black/10 bg-white p-6 shadow-sm md:p-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-none bg-[#f5f3ee] px-4 py-2 text-xs font-black text-black">
                  <ShieldCheck size={15} />
                  Secure account login
                </div>

                <h1 className="mt-5 text-3xl font-black leading-tight text-black">
                  Login to your account
                </h1>

                <p className="mt-3 text-sm font-semibold leading-6 text-black/55">
                  Login with the password you created during registration, or use
                  mobile OTP for older accounts.
                </p>
              </div>

              {/* GOOGLE LOGIN */}
              <div className="mt-7 overflow-hidden rounded-none border border-black/10 bg-white p-2">
                <div className="login-google [&>div]:w-full [&>div]:max-w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={() => alert("Google login was cancelled or failed.")}
                    text="continue_with"
                    shape="rectangular"
                    width="400"
                  />
                </div>
              </div>

              {/* OR DIVIDER */}
              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-black/10" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-black/35">
                  Or
                </span>
                <div className="h-px flex-1 bg-black/10" />
              </div>

              <div className="mb-5 grid grid-cols-2 rounded-none bg-[#f5f3ee] p-1">
                <button
                  type="button"
                  onClick={() => setLoginMode("password")}
                  className={`rounded-none px-4 py-3 text-sm font-black transition ${
                    loginMode === "password" ? "bg-black text-white shadow-sm" : "text-black/55"
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode("otp")}
                  className={`rounded-none px-4 py-3 text-sm font-black transition ${
                    loginMode === "otp" ? "bg-black text-white shadow-sm" : "text-black/55"
                  }`}
                >
                  Mobile OTP
                </button>
              </div>

              {loginMode === "password" ? (
              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-black">
                    Email or mobile number
                  </label>

                  <div className="flex items-center gap-3 rounded-none border border-black/10 bg-[#fbfaf7] px-5 py-4 focus-within:border-black focus-within:bg-white">
                    <Mail size={18} className="text-black/35" />
                    <input
                      value={form.identifier}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          identifier: e.target.value,
                        }))
                      }
                      placeholder="you@example.com or +91..."
                      className="w-full bg-transparent text-sm font-semibold text-black outline-none placeholder:text-black/25"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-black">
                    Password
                  </label>

                  <div className="flex items-center gap-3 rounded-none border border-black/10 bg-[#fbfaf7] px-5 py-4 focus-within:border-black focus-within:bg-white">
                    <Lock size={18} className="text-black/35" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      placeholder="Enter password"
                      className="w-full bg-transparent text-sm font-semibold text-black outline-none placeholder:text-black/25"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-black/55"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              ) : (
                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-black">
                      Registered mobile number
                    </label>
                    <div className="flex items-center gap-3 rounded-none border border-black/10 bg-[#fbfaf7] px-5 py-4 focus-within:border-black focus-within:bg-white">
                      <Phone size={18} className="text-black/35" />
                      <input
                        value={form.phone}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="+91 9999999999"
                        className="w-full bg-transparent text-sm font-semibold text-black outline-none placeholder:text-black/25"
                      />
                    </div>
                  </div>

                  {otpSent ? (
                    <div>
                      <label className="mb-2 block text-sm font-bold text-black">
                        OTP
                      </label>
                      <div className="flex items-center gap-3 rounded-none border border-black/10 bg-[#fbfaf7] px-5 py-4 focus-within:border-black focus-within:bg-white">
                        <Lock size={18} className="text-black/35" />
                        <input
                          value={form.otp}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, otp: e.target.value }))
                          }
                          placeholder="Use 1234 for demo"
                          className="w-full bg-transparent text-sm font-semibold text-black outline-none placeholder:text-black/25"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                <label className="flex cursor-pointer items-center gap-2 font-semibold text-black/55">
                  <input type="checkbox" className="rounded-none border-black/20" />
                  Remember me
                </label>

                <button
                  type="button"
                  className="font-black text-black underline"
                  onClick={() => alert("Forgot password flow will be added later.")}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="button"
                onClick={loginMode === "password" ? handleLogin : otpSent ? handleOtpLogin : sendLoginOtp}
                disabled={isLoading}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-none bg-black px-7 py-4 text-sm font-black text-white shadow-sm transition hover:bg-[#3f37ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? "Please wait..."
                  : loginMode === "password"
                    ? "Login to existing account"
                    : otpSent
                      ? "Verify OTP and login"
                      : "Send login OTP"}
                <ArrowRight size={17} />
              </button>

              <p className="mt-6 text-center text-sm font-semibold text-black/55">
                New to BuddyBOOK?{" "}
                <Link to="/register" className="font-black text-black underline">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <style>{`.login-google > div{width:100% !important;max-width:100% !important}`}</style>
    </div>
  );
}

function getSafeRedirect(value) {
  if (!value || typeof value !== "string") return "/";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}
