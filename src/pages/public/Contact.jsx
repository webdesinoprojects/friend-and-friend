import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import PublicNavbar from "../../components/layout/PublicNavbar";
import PublicFooter from "../../components/layout/PublicFooter";

const CONTACT_EMAIL = "support@buddybook.in";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [showToast, setShowToast] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const emailSubject = encodeURIComponent(
      form.subject || "New BuddyBOOK contact message"
    );

    const emailBody = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`
    );

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${emailSubject}&body=${emailBody}`;

    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
    }, 3500);

    setForm({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <div className="min-h-screen bg-[#e8e8e4] text-black">
      <PublicNavbar />

      <main className="relative overflow-hidden px-5 pt-32 pb-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(173,232,244,0.85),transparent_30%),radial-gradient(circle_at_88%_16%,rgba(255,255,255,0.90),transparent_32%),radial-gradient(circle_at_50%_95%,rgba(181,228,140,0.35),transparent_35%)]" />

        {/* SUCCESS TOAST */}
        {showToast && (
          <div className="fixed right-5 top-24 z-[99999] max-w-sm rounded-3xl border border-black/10 bg-white p-4 shadow-[0_25px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#b5e48c] text-black">
                <CheckCircle2 size={22} />
              </div>

              <div className="flex-1">
                <p className="text-sm font-black text-black">
                  Email is ready to send
                </p>
                <p className="mt-1 text-xs font-bold leading-5 text-black/60">
                  Your email app has opened with the message filled.
                </p>
              </div>

              <button
                onClick={() => setShowToast(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-[#e8e8e4] text-black transition hover:bg-black hover:text-white"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        <section className="relative mx-auto max-w-7xl">
          {/* TOP HEADING */}
          <div className="mx-auto mb-12 max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-black text-black shadow-sm">
              <MessageCircle size={16} />
              Contact BuddyBOOK
            </div>

            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-black md:text-6xl">
              Need help? Let’s talk
              <span className="mx-2 inline-block rounded-2xl bg-black px-4 py-1 text-white">
                directly.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-black/65 md:text-lg">
              Send questions, partnership requests, safety concerns or platform
              support messages directly to our email.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            {/* LEFT CONTACT INFO */}
            <div className="group relative transform-gpu overflow-hidden rounded-[2.4rem] border border-black/10 bg-white/80 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_45px_110px_rgba(0,0,0,0.18)] lg:hover:[transform:perspective(1200px)_rotateX(2deg)_rotateY(-3deg)_translateY(-8px)] md:p-7">
              <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#a2d2ff]/45 blur-3xl transition duration-500 group-hover:scale-125" />
              <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[#b5e48c]/35 blur-3xl transition duration-500 group-hover:scale-125" />

              <div className="relative z-10">
                <div className="rounded-[2rem] bg-black p-6 text-white">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#b5e48c] text-black">
                    <Mail size={26} />
                  </div>

                  <h2 className="mt-5 text-3xl font-black">
                    We usually reply fast.
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-white/70">
                    Tell us what you need. Your message will open inside your
                    email app, ready to send to BuddyBOOK.
                  </p>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                      Email us at
                    </p>
                    <p className="mt-1 break-all text-lg font-black text-[#a2d2ff]">
                      {CONTACT_EMAIL}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      icon: ShieldCheck,
                      title: "Safety support",
                      text: "Report issues or ask safety questions.",
                    },
                    {
                      icon: Clock,
                      title: "Quick response",
                      text: "Support messages are easy to review.",
                    },
                    {
                      icon: MapPin,
                      title: "Public meetups",
                      text: "Ask about safe activity planning.",
                    },
                    {
                      icon: Sparkles,
                      title: "Partnerships",
                      text: "Reach out for business ideas.",
                    },
                  ].map(({ icon: Icon, title, text }) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-black/10 bg-[#e8e8e4] p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]"
                    >
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-black text-white">
                        <Icon size={18} />
                      </div>
                      <p className="mt-3 text-sm font-black text-black">
                        {title}
                      </p>
                      <p className="mt-1 text-xs font-bold leading-5 text-black/55">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT CONTACT FORM */}
            <div className="group relative transform-gpu overflow-hidden rounded-[2.4rem] border border-black/10 bg-white/85 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.12)] backdrop-blur-xl ">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#a2d2ff]/45 blur-3xl transition duration-500 group-hover:scale-125" />

              <form onSubmit={handleSubmit} className="relative z-10">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-black/45">
                      Send message
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-black">
                      Write your message
                    </h2>
                  </div>

                  <div className="hidden rounded-2xl bg-[#b5e48c] px-4 py-2 text-xs font-black text-black sm:block">
                    Direct email
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-wide text-black/50">
                      Your name
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter your name"
                      className="w-full rounded-2xl border border-black/10 bg-[#e8e8e4] px-4 py-3 text-sm font-bold text-black outline-none transition focus:border-black focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-wide text-black/50">
                      Your email
                    </label>
                    <input
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      type="email"
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border border-black/10 bg-[#e8e8e4] px-4 py-3 text-sm font-bold text-black outline-none transition focus:border-black focus:bg-white"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-xs font-black uppercase tracking-wide text-black/50">
                    Subject
                  </label>
                  <input
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    placeholder="What is this about?"
                    className="w-full rounded-2xl border border-black/10 bg-[#e8e8e4] px-4 py-3 text-sm font-bold text-black outline-none transition focus:border-black focus:bg-white"
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-xs font-black uppercase tracking-wide text-black/50">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Write your message here..."
                    className="w-full resize-none rounded-[1.4rem] border border-black/10 bg-[#e8e8e4] px-4 py-3 text-sm font-bold leading-6 text-black outline-none transition focus:border-black focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-5 inline-flex w-full transform-gpu items-center justify-center gap-2 rounded-2xl bg-black px-6 py-4 text-sm font-black text-white shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-[#a2d2ff] hover:text-black"
                >
                  Send email
                  <Send size={17} />
                </button>

                <div className="mt-5 rounded-[1.4rem] border border-black/10 bg-[#f8f9fa] p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-white">
                      <ShieldCheck size={17} />
                    </div>

                    <div>
                      <p className="text-sm font-black text-black">
                        Your privacy matters
                      </p>
                      <p className="mt-1 text-xs font-bold leading-5 text-black/55">
                        This form creates an email draft. No message is stored
                        on this frontend page.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* BOTTOM SMALL CTA */}
          <div className="mt-8 rounded-[2rem] border border-black/10 bg-black p-5 text-white shadow-[0_25px_80px_rgba(0,0,0,0.20)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black text-[#a2d2ff]">
                  Need to create account?
                </p>
                <h3 className="mt-1 text-2xl font-black">
                  Join BuddyBOOK and start safely.
                </h3>
              </div>

              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-black transition hover:-translate-y-1 hover:scale-105 hover:bg-[#b5e48c]"
              >
                Create account
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}