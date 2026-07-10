import { Link } from "react-router-dom";
import PublicNavbar from "../../components/layout/PublicNavbar";
import PublicFooter from "../../components/layout/PublicFooter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fffaf3] text-black">
      <PublicNavbar />
      <main className="grid min-h-[70vh] place-items-center px-5 pt-28">
        <section className="max-w-xl rounded-3xl border border-[#eddac7] bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#d84e58]">404</p>
          <h1 className="mt-3 text-4xl font-black">Page not found</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#6b5d52]">
            This link is not valid or the page has moved.
          </p>
          <Link to="/#providers" className="mt-6 inline-flex rounded-2xl bg-black px-6 py-3 text-sm font-black text-white">
            Explore providers
          </Link>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
