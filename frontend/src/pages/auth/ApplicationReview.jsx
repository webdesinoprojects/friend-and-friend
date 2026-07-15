import { Link } from "react-router-dom";
import { Check, Clock3, Mail, MoreHorizontal, ShieldCheck, X } from "lucide-react";
import heroImage from "../../assets/buddybook-friends-hero.webp";
import Logo from "../../components/common/Logo";

export default function ApplicationReview() {
  return (
    <main className="relative h-screen overflow-hidden bg-[#fffaf4] text-[#0f1e3b] [background-image:linear-gradient(rgba(226,140,75,.075)_1px,transparent_1px),linear-gradient(90deg,rgba(226,140,75,.075)_1px,transparent_1px)] [background-size:48px_48px]">
      <header className="absolute inset-x-0 top-0 z-20 mx-auto flex h-[68px] max-w-[1500px] items-center justify-between px-[5vw]">
        <Link to="/" aria-label="BuddyBOOK home" className="rounded-full bg-white/90 px-3 py-2 shadow-sm backdrop-blur"><Logo /></Link>
        <Link to="/login" className="rounded-full border border-[#efc5a4] bg-white/95 px-5 py-2.5 text-sm font-black shadow-sm transition hover:bg-black hover:text-white">Back to login</Link>
      </header>

      <span className="absolute left-[34%] top-[7.5%] h-3 w-3 rounded-full bg-[#f47e83]" />
      <span className="absolute left-[40%] top-[40%] text-2xl text-[#72b992]">⌘</span>
      <span className="absolute bottom-[7%] left-[45%] h-3 w-3 rounded-full bg-[#a6cdb7]" />
      <span className="absolute right-[6%] top-[20%] text-3xl text-[#f4a061]">☆</span>

      <section className="mx-auto grid h-full max-w-[1500px] grid-cols-[.93fr_1.07fr] items-center gap-[4.5vw] px-[5vw] pt-[62px]">
        <div className="min-w-0 self-center origin-center [@media(max-height:700px)]:scale-[.88]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#efb885] bg-white/90 px-4 py-2 text-[clamp(11px,1vw,14px)] font-black text-[#dd782f] shadow-sm">
            <ShieldCheck size={18} /> Verification in progress
          </div>

          <h1 className="mt-[clamp(14px,2.2vh,24px)] text-[clamp(36px,4vw,64px)] font-black leading-[.98] tracking-[-.04em]">
            Your application is
            <span className="block text-[#df7b31]">being reviewed</span>
          </h1>

          <p className="mt-[clamp(10px,1.8vh,20px)] text-[clamp(14px,1.35vw,21px)] font-semibold leading-[1.45] text-[#293750]">
            Our admin team is verifying your details to keep<br />
            BuddyBOOK safe and trusted for everyone.<br />
            This usually takes a short while.
          </p>

          <div className="mt-[clamp(10px,1.8vh,18px)] overflow-hidden rounded-2xl border border-[#dfe2e7] bg-white/95 px-5 shadow-[0_14px_38px_rgba(50,40,30,.10)]">
            <ProgressRow icon={Check} color="bg-[#2a9668]" title="Profile submitted" text="We've received your application." badge="Completed" badgeStyle="bg-[#eaf8f1] text-[#218158]" />
            <ProgressRow icon={Clock3} color="bg-[#ffa436]" title="Documents under review" text="Our team is checking your details." badge="In progress" badgeStyle="bg-[#fff4e8] text-[#e1792f]" />
            <ProgressRow icon={MoreHorizontal} color="bg-[#a9aaad]" title="Admin approval pending" text="Final approval is in queue." badge="Pending" badgeStyle="bg-[#f0f0f1] text-[#777b82]" last />
          </div>

          <div className="mt-[clamp(10px,1.7vh,17px)] flex items-center gap-5 rounded-2xl border border-[#efb27f] bg-white/55 px-5 py-[clamp(10px,1.6vh,16px)] shadow-sm">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-[#efbd92] text-[#df7b31]"><ShieldCheck size={30} /></span>
            <div className="space-y-2 text-[clamp(12px,1.05vw,15px)] font-semibold leading-5">
              <p className="flex items-start gap-2"><Check size={19} className="shrink-0 text-[#218b61]" /><span><b className="text-[#218b61]">If approved,</b> you can log in with your ID and start using BuddyBOOK.</span></p>
              <p className="flex items-start gap-2"><X size={19} className="shrink-0 text-[#f04452]" /><span><b className="text-[#f04452]">If rejected,</b> please re-upload or refill the required details to get verified.</span></p>
            </div>
          </div>

          <div className="mt-[clamp(10px,1.7vh,18px)] flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#efc7a7] bg-white text-[#df7b31] shadow-md"><Mail size={23} /></span>
            <div><p className="text-[clamp(12px,1vw,15px)] font-black">You will be notified once your verification is complete.</p><p className="mt-1 text-[clamp(11px,.9vw,13px)] font-semibold text-[#667085]">Please keep your registered mobile number and email active.</p></div>
          </div>
        </div>

        <div className="relative flex h-full items-center justify-end py-[6vh] [@media(max-height:700px)]:scale-[.9]">
          <div className="relative aspect-[.92] w-full max-w-[650px] overflow-hidden rounded-[48%_48%_1.25rem_1.25rem] shadow-[0_28px_75px_rgba(51,30,16,.18)]">
            <img src={heroImage} alt="A boy and girl enjoying a friendly meetup" className="h-full w-full object-cover object-[70%_center]" />
          </div>
        </div>
      </section>
    </main>
  );
}

function ProgressRow({ icon: Icon, color, title, text, badge, badgeStyle, last }) {
  return <div className={`flex items-center gap-4 py-[clamp(8px,1.25vh,13px)] ${last ? "" : "border-b border-black/7"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${color}`}><Icon size={19} /></span><div className="min-w-0 flex-1"><p className="text-[clamp(12px,1.05vw,15px)] font-black">{title}</p><p className="text-[clamp(10px,.9vw,13px)] font-semibold text-black/45">{text}</p></div><span className={`rounded-full px-3 py-1 text-[clamp(9px,.8vw,11px)] font-black ${badgeStyle}`}>{badge}</span></div>;
}
