import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, LoaderCircle, Power, Trash2, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { deleteAccountPermanently, disableAccount, getAccountStatus, reactivateAccount } from "../../api/account";
import { clearProviderCaches } from "../../api/providers";
import { confirmAction, notify } from "../common/Feedback";

function clearAccountStorage() {
  [
    "buddybook_auth_user", "buddybook_token", "token", "buddybook_bookings",
    "buddybook_payments", "buddybook_reviews", "buddybook_watchlist",
    "buddybook_explore_providers_cache", "buddybook_my_provider_profile_cache",
    "buddybook_selected_provider",
  ].forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

function updateStoredAccount(status) {
  try {
    const user = JSON.parse(localStorage.getItem("buddybook_auth_user") || "null");
    if (!user) return;
    localStorage.setItem("buddybook_auth_user", JSON.stringify({ ...user, ...status }));
    window.dispatchEvent(new Event("buddybook:auth-changed"));
    window.dispatchEvent(new Event("buddybook:profile-updated"));
  } catch {
    // The backend remains authoritative if browser storage is unavailable.
  }
}

export default function AccountLifecyclePanel() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState("");
  const [deleteText, setDeleteText] = useState("");
  const [animation, setAnimation] = useState("");
  const disabled = Boolean(status?.accountDisabled);

  const refreshStatus = useCallback(async () => {
    try {
      const next = await getAccountStatus();
      setStatus(next);
      updateStoredAccount(next);
    } catch (error) {
      notify(error?.response?.data?.message || "Could not load account status.", "error");
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(refreshStatus, 0);
    return () => window.clearTimeout(initial);
  }, [refreshStatus]);

  const runAnimation = (name) => {
    setAnimation(name);
    window.setTimeout(() => setAnimation(""), 1800);
  };

  const toggleAccount = async () => {
    const action = disabled ? "reactivate" : "disable";
    const accepted = await confirmAction({
      title: disabled ? "Reactivate account now?" : "Disable account?",
      message: disabled
        ? "Your account and profile will become visible and usable immediately."
        : "Your account will remain inaccessible and hidden until you choose to reactivate it.",
      confirmLabel: disabled ? "Reactivate" : "Disable account",
      danger: !disabled,
    });
    if (!accepted) return;
    setBusy(action);
    try {
      const next = disabled ? await reactivateAccount() : await disableAccount();
      setStatus(next);
      updateStoredAccount(next);
      clearProviderCaches();
      runAnimation(disabled ? "enabled" : "disabled");
      notify(disabled ? "Account reactivated immediately." : "Account disabled until you reactivate it.", "success");
    } catch (error) {
      notify(error?.response?.data?.message || `Could not ${action} your account.`, "error");
    } finally {
      setBusy("");
    }
  };

  const permanentlyDelete = async () => {
    if (deleteText !== "DELETE") return;
    const accepted = await confirmAction({
      title: "Permanently delete account?",
      message: "This cannot be undone. Your profile, bookings, chats, reviews, verification and account data will be removed from the platform.",
      confirmLabel: "Delete forever",
      danger: true,
    });
    if (!accepted) return;
    setBusy("delete");
    try {
      await deleteAccountPermanently();
      runAnimation("deleted");
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
      clearProviderCaches();
      clearAccountStorage();
      window.dispatchEvent(new Event("buddybook:auth-changed"));
      navigate("/", { replace: true });
      notify("Your account was permanently deleted.", "success");
    } catch (error) {
      notify(error?.response?.data?.message || "Could not permanently delete your account.", "error");
      setBusy("");
    }
  };

  const animationContent = useMemo(() => {
    if (animation === "disabled") return { icon: Power, text: "Profile hidden until reactivated", color: "bg-rose-600" };
    if (animation === "enabled") return { icon: CheckCircle2, text: "Account active immediately", color: "bg-emerald-600" };
    if (animation === "deleted") return { icon: Trash2, text: "Deleting account securely", color: "bg-black" };
    return null;
  }, [animation]);

  return <>
    <style>{`@keyframes accountLifecycleIn{0%{opacity:0;transform:scale(.82) translateY(18px)}55%{transform:scale(1.04) translateY(0)}100%{opacity:1;transform:scale(1)}}@keyframes accountStatusPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.018)}}`}</style>
    {animationContent ? <div className="fixed inset-0 z-[100002] grid place-items-center bg-black/45 p-5 backdrop-blur-md"><div style={{ animation: "accountLifecycleIn .55s ease both" }} className={`${animationContent.color} grid min-h-52 w-full max-w-md place-items-center rounded-[2rem] p-8 text-center text-white shadow-2xl`}><div><animationContent.icon className="mx-auto" size={54} /><p className="mt-5 text-2xl font-black">{animationContent.text}</p></div></div></div> : null}

    <section className={`rounded-2xl border p-5 transition-all duration-500 ${disabled ? "border-rose-300 bg-rose-50" : "border-[#eddac7] bg-white"}`} style={animation ? { animation: "accountStatusPulse .65s ease" } : undefined}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black">Temporary account disable</h2>
          <p className="mt-1 text-sm font-semibold text-[#6b5d52]">Hide your account and profile until you choose to reactivate it.</p>
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${disabled ? "bg-rose-600 text-white" : "bg-emerald-50 text-emerald-700"}`}><Power size={20} /></span>
      </div>
      <div className={`mt-4 rounded-2xl p-4 ${disabled ? "bg-rose-600 text-white" : "bg-emerald-50 text-emerald-900"}`}>
        <p className="text-sm font-black">{disabled ? "Account disabled — profile is hidden" : "Account active — profile is visible"}</p>
        {disabled ? <p className="mt-1 text-sm font-black">It will stay disabled until you reactivate it.</p> : <p className="mt-1 text-xs font-bold opacity-75">You can use every available account feature.</p>}
      </div>
      <button type="button" disabled={Boolean(busy)} onClick={toggleAccount} className={`mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-white disabled:opacity-50 ${disabled ? "bg-emerald-600" : "bg-rose-600"}`}>
        {busy === "disable" || busy === "reactivate" ? <LoaderCircle className="animate-spin" size={16} /> : <Power size={16} />}
        {disabled ? "Reactivate immediately" : "Disable account"}
      </button>
    </section>

    <section className="rounded-2xl border border-rose-300 bg-white p-5">
      <div className="flex items-start gap-3"><TriangleAlert className="mt-0.5 shrink-0 text-rose-600" /><div><h2 className="text-lg font-black">Delete account permanently</h2><p className="mt-1 text-sm font-semibold text-[#6b5d52]">This removes your account and associated operational data. You must register again to return.</p></div></div>
      <input value={deleteText} onChange={(event) => setDeleteText(event.target.value)} disabled={busy === "delete"} placeholder="Type DELETE" className="mt-4 h-12 w-full rounded-xl border border-[#eddac7] bg-[#fffaf3] px-4 text-sm font-black outline-none focus:border-rose-600" />
      <button type="button" onClick={permanentlyDelete} disabled={deleteText !== "DELETE" || Boolean(busy)} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45">{busy === "delete" ? <LoaderCircle className="animate-spin" size={16} /> : <Trash2 size={16} />} Delete forever</button>
    </section>
  </>;
}
