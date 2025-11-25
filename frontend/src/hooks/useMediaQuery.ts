import { useEffect, useState } from "react";

export default function useMediaQuery(query: string) {
  const [matchMedia, setMatchMedia] = useState(true);
  useEffect(() => {
    if (!window) return;
    if (window.matchMedia(query).matches) {
      setMatchMedia(true);
    } else {
      setMatchMedia(false);
    }
  }, [query]);
  return matchMedia;
}
