import { useEffect, useState } from "react";
// true quando a largura é de celular (<= 760px)
export function useIsMobile(bp = 760) {
  const [m, setM] = useState(typeof window !== "undefined" ? window.innerWidth <= bp : false);
  useEffect(() => {
    const onR = () => setM(window.innerWidth <= bp);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, [bp]);
  return m;
}
