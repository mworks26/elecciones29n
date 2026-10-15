import { useEffect, useRef } from "react";
import urna from "@/assets/urna.json";

export default function UrnaAnimation({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let anim: { destroy: () => void } | undefined;
    let cancelled = false;
    void import("lottie-web").then(({ default: lottie }) => {
      if (cancelled || !ref.current) return;
      anim = lottie.loadAnimation({ container: ref.current, renderer: "svg", loop: true, autoplay: true, animationData: urna });
    });
    return () => { cancelled = true; anim?.destroy(); };
  }, []);
  return <div ref={ref} className={className} aria-hidden />;
}
