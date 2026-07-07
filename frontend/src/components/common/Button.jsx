export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}