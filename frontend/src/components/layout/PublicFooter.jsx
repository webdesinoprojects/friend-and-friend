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
      ["Earn with PPlusOne", "/earn-with-PPlusOne"],
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
    <footer className="w-full bg-[#57524d] px-5 py-7 text-[#f5efe7] sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-[1.2fr_2fr]">
          <div>
            <div className="w-fit">
              <Logo size="large" />
            </div>

            <p className="mt-4 max-w-sm text-xs font-medium leading-6 text-[#d8c9bb]">
              PPlusOne helps people plan verified, platonic public meetups
              with safer booking, chat and support flows.
            </p>

            <a
              href="mailto:support@PPlusOne.in"
              className="mt-4 inline-block text-xs font-semibold text-[#fffaf5] underline-offset-4 hover:underline"
            >
              support@PPlusOne.in
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

        <div className="mt-7 flex flex-col gap-3 border-t border-[#f5efe7]/12 pt-4 text-[11px] font-semibold text-[#b9aa9b] sm:mt-9 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
          <p>(c) {new Date().getFullYear()} PPlusOne. All rights reserved.</p>

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
            <Link to="/earn-with-PPlusOne" className="hover:text-white">
              Providers
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
