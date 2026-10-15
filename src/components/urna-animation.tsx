import { Lottie } from "lottie-react";
import urna from "@/assets/urna.json";

export default function UrnaAnimation({ className }: { className?: string }) {
  return <Lottie animationData={urna} loop autoplay className={className} aria-hidden />;
}
