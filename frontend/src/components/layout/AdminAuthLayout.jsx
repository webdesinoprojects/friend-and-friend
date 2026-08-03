import { Link } from "react-router-dom";
import Logo from "../common/Logo";

export default function AdminAuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-[#fffaf3] text-black">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center px-5 py-10">
        <div className="w-full rounded-[2rem] border border-[#eddac7] bg-white p-8 shadow-lg">
          <Link to="/" className="mb-6 inline-block text-sm font-black text-black/65">
            ← Back to home
          </Link>

          <div className="mb-6 w-fit">
            <Logo size="large" />
          </div>

          <h1 className="text-3xl font-black text-black">{title}</h1>
          <p className="mt-2 text-sm text-black/65">{subtitle}</p>

          {children}
        </div>
      </div>
    </div>
  );
}
