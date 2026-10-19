"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ContentProtectionProps {
  children: ReactNode;
}

export function ContentProtection({ children }: ContentProtectionProps) {
  const protectedArea = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (protectedArea.current?.contains(e.target as Node)) e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (protectedArea.current?.contains(document.activeElement) &&
          (e.ctrlKey || e.metaKey) && ["c", "a", "x"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (protectedArea.current?.contains(e.target as Node)) e.preventDefault();
    };

    const handleSelectStart = (e: Event) => {
      if (protectedArea.current?.contains(e.target as Node)) e.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("selectstart", handleSelectStart);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("selectstart", handleSelectStart);
    };
  }, []);

  return <div ref={protectedArea}>{children}</div>;
}
