import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Siren,
  Sparkles,
  X,
} from "lucide-react";
import PublicNavbar from "../../components/layout/PublicNavbar";
import PublicFooter from "../../components/layout/PublicFooter";
import api from "../../api/api";

const CONTACT_EMAIL = "yashraj.webdesino@gmail.com";
const CONTACT_PHONE = "+91 9999999999";
const CONTACT_LOCATION = "India";

const contactInfo = [
  {
    icon: Phone,
    title: "Phone Number",
    text: CONTACT_PHONE,
  },
  {
    icon: Mail,
    title: "Email Address",
    text: CONTACT_EMAIL,
  },
  {
    icon: MapPin,
    title: "Our Location",
    text: CONTACT_LOCATION,
  },
];

const services = [
  "General support",
  "Safety concern",
  "Account verification",
  "Provider partnership",
  "Booking or payment issue",
];

const emergencyContacts = [
  { label: "Ambulance", number: "108" },
  { label: "Women helpline", number: "1091" },
  { label: "Local police", number: "100" },
];

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: services[0],
    message: "",
  });

  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setToast(null);

    try {
      const { data } = await api.post("/contact", form);
      setToast({
        type: "success",
        title: "Message sent successfully",
        text: data?.message || "Your message has been sent to BuddyBOOK support.",
      });

      setForm({
        name: "",
        email: "",
        phone: "",
        service: services[0],
        message: "",
      });
    } catch (error) {
      setToast({
        type: "error",
        title: "Message could not be sent",
        text:
          error.response?.data?.message ||
          "Please try again in a moment or email us directly.",
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setToast(null);
      }, 4500);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf3] text-[#17120f]">
      <PublicNavbar />

      <main className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-5 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(224,140,76,0.20),transparent_31%),radial-gradient(circle_at_12%_22%,rgba(255,255,255,0.92),transparent_28%),radial-gradient(circle_at_88%_70%,rgba(244,173,117,0.30),transparent_30%)]" />
        <div className="pointer-events-none absolute -top-28 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-[#e08c4c]/12 blur-3xl" />

        {toast && (
          <div className="fixed right-5 top-24 z-[99999] max-w-sm rounded-[1.4rem] bg-white p-4 shadow-[0_24px_80px_rgba(80,45,30,0.22)]">
            <div className="flex items-start gap-3">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                toast.type === "success" ? "bg-[#ecfdf3] text-[#16815f]" : "bg-[#ffeedd] text-[#e08c4c]"
              }`}>
                {toast.type === "success" ? <CheckCircle2 size={22} /> : <X size={22} />}
              </div>

              <div className="flex-1">
                <p className="text-sm font-black text-[#17120f]">
                  {toast.title}
                </p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#75665b]">
                  {toast.text}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setToast(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-[#fff7ef] text-[#17120f] transition hover:bg-[#17120f] hover:text-white"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        <section className="relative mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">


            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-[#17120f] sm:text-5xl lg:text-6xl">
              Contact{" "}
              <span className="rounded-2xl bg-[#e08c4c] px-4 py-1 text-black">
                BuddyBOOK
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-[#75665b]">
              Have questions about safe meetups, provider verification,
              bookings, payments or partnerships? Send us a message directly.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <aside className="rounded-[1.8rem] bg-white p-6 shadow-[0_24px_90px_rgba(80,45,30,0.10)] sm:p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-black text-[#17120f]">
                  Contact Information
                </h2>
                <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-[#75665b]">
                  Our team is available for support, safety concerns and
                  BuddyBOOK business enquiries.
                </p>
              </div>

              <div className="grid gap-0">
                {contactInfo.map(({ icon: Icon, title, text }, index) => (
                  <div
                    key={title}
                    className={`flex items-center gap-5 py-6 ${
                      index !== contactInfo.length - 1
                        ? "border-b border-[#ead7c7]"
                        : ""
                    }`}
                  >
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#ffeedd] text-[#e08c4c]">
                      <Icon size={24} />
                    </div>

                    <div>
                      <p className="text-lg font-black text-[#2a211d]">
                        {title}
                      </p>
                      <p className="mt-1 break-all text-sm font-bold text-[#75665b]">
                        {text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[1.5rem] bg-[#17120f] p-5 text-white">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e08c4c]">
                    <ShieldCheck size={21} />
                  </div>
                  <div>
                    <p className="text-sm font-black">Safety first</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-white/64">
                      For urgent safety reports, include booking ID, user name
                      and the meetup location in your message.
                    </p>
                  </div>
                </div>
                <div className="mt-4 border-t border-white/15 pt-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#f4ad75]"><Siren size={16} /> SOS / Emergency contacts</div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-1">
                    {emergencyContacts.map((contact) => (
                      <a key={contact.number} href={`tel:${contact.number}`} aria-label={`Call ${contact.label} at ${contact.number}`} className="group flex min-w-0 flex-col items-center justify-center rounded-xl border border-red-400 bg-red-600 px-2 py-2.5 text-center text-white transition hover:-translate-y-0.5 hover:bg-red-700 sm:flex-row sm:justify-start sm:gap-3 sm:px-3 sm:text-left">
                        <Phone size={15} className="shrink-0" />
                        <span className="mt-1 text-[9px] font-black leading-tight sm:mt-0 sm:text-[11px]">{contact.label}<span className="block text-xs text-white">{contact.number}</span></span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            <section className="relative overflow-hidden rounded-[1.8rem] bg-[#fffaf6] p-6 shadow-[0_24px_90px_rgba(80,45,30,0.10)] sm:p-8 lg:p-10">
              <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 translate-x-1/3 -translate-y-1/3 rounded-full bg-[#e08c4c]/12 blur-2xl" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 -translate-x-1/3 translate-y-1/3 rounded-full bg-white blur-2xl" />

              <form onSubmit={handleSubmit} className="relative z-10">
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#17120f] shadow-sm">
                    <Sparkles size={16} className="text-[#e08c4c]" />
                    Get In Touch
                  </div>

                  <h2 className="mt-5 text-3xl font-black tracking-tight text-[#17120f] sm:text-4xl">
                    Get In Touch
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[#75665b]">
                    Fill out the form and it will be delivered directly to the
                    BuddyBOOK support inbox in a formatted email.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Name"
                    className="h-14 w-full rounded-none border border-[#ead7c7] bg-[#fff6ea] px-4 text-sm font-bold text-[#17120f] outline-none transition placeholder:text-[#9a8575] focus:border-[#e08c4c] focus:bg-white"
                  />

                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    type="email"
                    placeholder="Email Address"
                    className="h-14 w-full rounded-none border border-[#ead7c7] bg-[#fff6ea] px-4 text-sm font-bold text-[#17120f] outline-none transition placeholder:text-[#9a8575] focus:border-[#e08c4c] focus:bg-white"
                  />

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="Phone Number"
                    className="h-14 w-full rounded-none border border-[#ead7c7] bg-[#fff6ea] px-4 text-sm font-bold text-[#17120f] outline-none transition placeholder:text-[#9a8575] focus:border-[#e08c4c] focus:bg-white"
                  />

                  <select
                    name="service"
                    value={form.service}
                    onChange={handleChange}
                    className="h-14 w-full rounded-none border border-[#ead7c7] bg-[#fff6ea] px-4 text-sm font-bold text-[#17120f] outline-none transition focus:border-[#e08c4c] focus:bg-white"
                  >
                    {services.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  placeholder="Message"
                  className="mt-4 w-full resize-none rounded-none border border-[#ead7c7] bg-[#fff6ea] px-4 py-4 text-sm font-bold leading-6 text-[#17120f] outline-none transition placeholder:text-[#9a8575] focus:border-[#e08c4c] focus:bg-white"
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-5 inline-flex items-center gap-3 rounded-full bg-[#e08c4c] px-7 py-4 text-sm font-black text-white shadow-[0_18px_45px_rgba(224,140,76,0.28)] transition hover:-translate-y-1 hover:bg-[#17120f]"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#e08c4c]">
                    <Send size={16} />
                  </span>
                </button>

                <div className="mt-6 flex items-start gap-3 rounded-[1.3rem] bg-white p-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ffeedd] text-[#e08c4c]">
                    <MessageCircle size={18} />
                  </div>

                  <p className="text-xs font-bold leading-5 text-[#75665b]">
                    Messages are sent securely through BuddyBOOK backend using
                    Resend, then delivered to the support email inbox.
                  </p>
                </div>
              </form>
            </section>
          </div>

          <div className="mt-8 rounded-[1.8rem] bg-[#17120f] p-5 text-white shadow-[0_24px_80px_rgba(23,18,15,0.20)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black text-[#f4ad75]">
                  Need to create an account?
                </p>
                <h3 className="mt-1 text-2xl font-black">
                  Join BuddyBOOK and start safely.
                </h3>
              </div>

              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#17120f] transition hover:-translate-y-1 hover:bg-[#ffeedd]"
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
