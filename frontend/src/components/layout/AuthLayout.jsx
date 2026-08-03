import { Link } from "react-router-dom";
import Logo from "../common/Logo";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,transparent_35%),#f8fafc]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-5 py-10">
        <div className="grid w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid-cols-2">
          <div className="hidden bg-gradient-to-br from-blue-600 to-violet-700 p-12 text-white lg:block">
            <div className="w-fit">
              <Logo size="large" />
            </div>

            <div className="mt-16">
              <h2 className="text-5xl font-black leading-tight">
                Safe social experiences start with trust.
              </h2>
              <p className="mt-5 text-lg leading-8 text-blue-100">
                One account. Common verification. User and provider profile
                options after login.
              </p>
            </div>
          </div>

          <div className="p-6 md:p-12">
            <Link to="/" className="mb-8 inline-block font-bold text-blue-600">
              ← Back to home
            </Link>

            <h1 className="text-4xl font-black text-slate-950">{title}</h1>
            <p className="mt-2 text-slate-600">{subtitle}</p>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
