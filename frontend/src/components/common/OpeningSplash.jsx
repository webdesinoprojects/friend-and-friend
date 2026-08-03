import { useEffect, useState } from "react";

let openingShown = false;

export default function OpeningSplash({ children }) {
  const [visible, setVisible] = useState(() => {
    if (openingShown) return false;
    openingShown = true;
    return true;
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return children;

  return (
    <div className="opening-splash fixed inset-0 z-[9999] grid min-h-[100dvh] place-items-center overflow-hidden bg-white">
      <video
        src="/PPlusOne-opening.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        controls={false}
        aria-label="PPlusOne opening animation"
        className="pointer-events-none h-auto max-h-[72dvh] w-[82vw] max-w-[640px] select-none object-contain sm:w-[68vw] lg:w-[48vw]"
      />
      <style>{`
        .opening-splash { animation: openingReveal .3s ease-out both; }
        .opening-splash video { animation: openingVideoIn .45s ease-out both; }
        @keyframes openingReveal { from { opacity: 0; } to { opacity: 1; } }
        @keyframes openingVideoIn { from { opacity: 0; transform: scale(.985); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
