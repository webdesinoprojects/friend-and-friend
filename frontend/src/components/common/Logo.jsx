import { Link } from "react-router-dom";

export default function Logo({ size = "navbar" }) {
  const goHome = () => {
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };
  return (
    <Link to="/" onClick={goHome} className="inline-flex shrink-0 items-center" aria-label="PPlusOne home">
      <img
        src="/home-navbar-logo.png"
        alt="PPlusOne"
        className={size === "large"
          ? "h-16 w-auto max-w-[7.5rem] object-contain sm:h-20 sm:max-w-[9.5rem]"
          : "h-10 w-auto max-w-[4rem] object-contain sm:h-12 sm:max-w-[4.75rem]"}
        width="833"
        height="629"
      />
    </Link>
  );
}
