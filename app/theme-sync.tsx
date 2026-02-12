"use client";

import { useEffect } from "react";

export default function ThemeSync() {
  useEffect(() => {
    const rootElement = document.documentElement;
    const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const resolveTheme = (): "dark" | "light" => {
      const devToolsPortal = document.querySelector<HTMLElement>("nextjs-portal");

      if (devToolsPortal?.classList.contains("dark")) {
        return "dark";
      }

      if (devToolsPortal?.classList.contains("light")) {
        return "light";
      }

      return systemThemeQuery.matches ? "dark" : "light";
    };

    const syncTheme = () => {
      rootElement.dataset.theme = resolveTheme();
    };

    const portalClassObserver = new MutationObserver(() => {
      syncTheme();
    });

    const watchPortalClass = () => {
      portalClassObserver.disconnect();

      const devToolsPortal = document.querySelector<HTMLElement>("nextjs-portal");

      if (devToolsPortal) {
        portalClassObserver.observe(devToolsPortal, {
          attributes: true,
          attributeFilter: ["class"],
        });
      }
    };

    const portalMountObserver = new MutationObserver(() => {
      watchPortalClass();
      syncTheme();
    });

    watchPortalClass();
    syncTheme();

    portalMountObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const handleSystemThemeChange = () => {
      const devToolsPortal = document.querySelector<HTMLElement>("nextjs-portal");
      const hasPreference =
        devToolsPortal?.classList.contains("dark") ||
        devToolsPortal?.classList.contains("light");

      if (!hasPreference) {
        syncTheme();
      }
    };

    systemThemeQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      portalClassObserver.disconnect();
      portalMountObserver.disconnect();
      systemThemeQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  return null;
}
