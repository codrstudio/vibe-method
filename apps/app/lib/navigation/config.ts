import type { NavigationConfig } from "./types"
import {
  mainAreaItems,
  settingsAreaItems,
  systemHealthAreaItems,
} from "./areas"

export const navigationConfig: NavigationConfig = {
  areas: {
    main: mainAreaItems,
    settings: settingsAreaItems,
    "system-health": systemHealthAreaItems,
  },
  areaPatterns: [
    { pattern: /^\/app\/system\/health/, area: "system-health" },
    { pattern: /^\/app\/settings/, area: "settings" },
    { pattern: /^\/app/, area: "main" },
  ],
}

export function getAreaFromPathname(
  pathname: string
): keyof NavigationConfig["areas"] {
  for (const { pattern, area } of navigationConfig.areaPatterns) {
    if (pattern.test(pathname)) {
      return area
    }
  }
  return "main"
}
