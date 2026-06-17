import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Menu,
  ShieldCheck,
  Sparkles,
  UserRoundPlus,
  X,
} from "lucide-react";
import Logo from "../common/Logo";

const navItems = [
  { label: "How it works", to: "/how-it-works" },
  { label: "Explore", to: "/activities" },
  { label: "Safety", to: "/safety" },
  { label: "Contact", to: "/contact" },
];

export default function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="fixed left-0 right-0 top-4 z-[9999] px-4">
      <div className="relative z-[9999] mx-auto max-w-7xl">
        {/* MAIN NAVBAR */}
        <div className="overflow-hidden rounded-full border-2 border-black bg-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.14)] backdrop-blur-2xl">
          <div className="mx-auto px-4 sm:px-5">
            <div className="flex h-16 items-center justify-between gap-4">
              {/* LOGO */}
              <div className="rounded-full bg-white/30 px-2 py-1 shadow-sm backdrop-blur-2xl">
                <Logo />
              </div>

              {/* DESKTOP NAV */}
              <nav className="hidden items-center rounded-full border border-black/70 bg-white/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_14px_35px_rgba(0,0,0,0.08)] md:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="group relative overflow-hidden rounded-full px-4 py-2.5 text-sm font-bold text-black transition duration-300 hover:text-black"
                  >
                    <span className="pointer-events-none absolute inset-0 scale-90 rounded-full bg-gradient-to-r from-[#e8e8e4] to-[#e9ecef] opacity-0 transition duration-300 group-hover:scale-100 group-hover:opacity-100" />

                    <span className="relative z-10">{item.label}</span>

                    <span className="pointer-events-none absolute bottom-1 left-5 right-5 h-0.5 scale-x-0 rounded-full bg-black transition duration-300 group-hover:scale-x-100" />
                  </Link>
                ))}
              </nav>

              {/* DESKTOP RIGHT ACTIONS */}
              <div className="hidden items-center gap-3 md:flex">
                <div className="hidden items-center gap-2 rounded-full border border-black/10 bg-[#b5e48c] px-4 py-0.5 text-xs font-black uppercase tracking-wide text-black shadow-sm lg:flex">
                  <ShieldCheck size={15} />
                  Verified Safety
                </div>

                <Link
                  to="/login"
                  className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-black text-black transition hover:bg-[#e9ecef] hover:shadow-sm"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="group relative overflow-hidden rounded-full bg-black px-6 py-3 text-sm font-black text-white shadow-[0_16px_35px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(0,0,0,0.28)]"
                >
                  <span className="absolute inset-0 bg-black" />
                  <span className="absolute inset-0 bg-gradient-to-r from-[#f8f7ff]/25 via-[#caf0f8]/20 to-[#e8e8e4]/25 opacity-0 transition duration-300 group-hover:opacity-100" />
                  <span className="absolute -left-8 top-0 h-full w-8 rotate-12 bg-white/40 transition duration-700 group-hover:left-[120%]" />

                  <span className="relative z-10 flex items-center gap-2">
                    Sign Up
                    <ArrowRight
                      size={16}
                      className="transition group-hover:translate-x-0.5"
                    />
                  </span>
                </Link>
              </div>

              {/* MOBILE MENU BUTTON */}
              <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="grid h-12 w-12 place-items-center rounded-full border border-black bg-white text-black shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#caf0f8] md:hidden"
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE MENU */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] rounded-[2rem] border-2 border-black bg-gradient-to-br from-[#caf0f8] via-white to-[#f8f7ff] p-4 shadow-2xl backdrop-blur-xl md:hidden">
            <div className="grid gap-3">
              <div className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-black text-black">
                  <Sparkles size={17} />
                  Safe, verified and platonic meetups
                </div>

                <p className="mt-1 text-sm leading-6 text-black/65">
                  Book trusted people for movies, dinner, shopping, gaming, city
                  tours and more.
                </p>
              </div>

              <nav className="grid gap-2 rounded-[1.5rem] border border-black/10 bg-white p-2 shadow-sm">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={closeMenu}
                    className="rounded-full bg-[#e9ecef] px-4 py-3 text-sm font-black text-black transition hover:bg-[#e8e8e4]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="rounded-full border border-black/15 bg-white px-4 py-3 text-center text-sm font-black text-black shadow-sm transition hover:bg-[#caf0f8]"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="rounded-full bg-black px-4 py-3 text-center text-sm font-black text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    Join Now
                    <UserRoundPlus size={16} />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}