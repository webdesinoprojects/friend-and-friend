import { Link } from "react-router-dom";
import Logo from "../common/Logo";

const footerGroups = [
  {
    title: "Platform",
    links: [
      ["Home", "/"],
      ["How it works", "/how-it-works"],
      ["Activities", "/activities"],
      ["Safety", "/safety"],
      ["Contact", "/contact"],
    ],
  },
  {
    title: "Account",
    links: [
      ["Sign up", "/register"],
      ["Login", "/login"],
      ["User account", "/register?role=user"],
      ["Provider account", "/register?role=provider"],
      ["Earn with BuddyBOOK", "/earn-with-buddybook"],
    ],
  },
  {
    title: "Quick access",
    links: [
      ["Explore providers", "/register?role=user"],
      ["Create provider profile", "/register?role=provider"],
      ["Safe meetups", "/safety"],
      ["Support", "/contact"],
      ["Start booking", "/register"],
    ],
  },
];

export default function PublicFooter() {
  return (
    <footer className="w-full bg-[#292622] px-5 py-10 text-[#f5efe7]">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-[1.2fr_2fr]">
          <div>
            <div className="w-fit rounded-[1.25rem] bg-[#fffaf5] p-3 shadow-[0_18px_45px_rgba(255,250,245,0.14)] ring-1 ring-white/35">
              <div className="rounded-2xl bg-white px-3 py-2 shadow-inner shadow-[#eaded3]/70">
                <Logo />
              </div>
            </div>

            <p className="mt-4 max-w-sm text-xs font-medium leading-6 text-[#d8c9bb]">
              BuddyBOOK helps people plan verified, platonic public meetups
              with safer booking, chat and support flows.
            </p>

            <a
              href="mailto:support@buddybook.in"
              className="mt-4 inline-block text-xs font-semibold text-[#fffaf5] underline-offset-4 hover:underline"
            >
              support@buddybook.in
            </a>
          </div>

          <div className="grid gap-7 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#fffaf5]">
                  {group.title}
                </h4>

                <div className="mt-4 grid gap-2.5">
                  {group.links.map(([label, to]) => (
                    <Link
                      key={label}
                      to={to}
                      className="w-fit text-xs font-semibold text-[#d8c9bb] underline-offset-4 transition hover:text-white hover:underline"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-3 border-t border-[#f5efe7]/12 pt-5 text-[11px] font-semibold text-[#b9aa9b] sm:flex-row sm:items-center sm:justify-between">
          <p>(c) {new Date().getFullYear()} BuddyBOOK. All rights reserved.</p>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/safety" className="hover:text-white">
              Safety
            </Link>
            <Link to="/contact" className="hover:text-white">
              Help
            </Link>
            <Link to="/activities" className="hover:text-white">
              Activities
            </Link>
            <Link to="/earn-with-buddybook" className="hover:text-white">
              Providers
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
