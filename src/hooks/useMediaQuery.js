import { useState, useEffect } from "react";

export default function useMediaQuery(query) {
  const getMatches = (q) => {
    if (typeof window !== "undefined") {
      return window.matchMedia(q).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState(getMatches(query));

  useEffect(() => {
    const matchMedia = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    if (matchMedia.addEventListener) {
      matchMedia.addEventListener("change", handler);
      return () => matchMedia.removeEventListener("change", handler);
    } else {
      // Safari < 14
      matchMedia.addListener(handler);
      return () => matchMedia.removeListener(handler);
    }
  }, [query]);

  return matches;
}
