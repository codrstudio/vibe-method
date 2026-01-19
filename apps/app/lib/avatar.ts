/**
 * Avatar utility - generates SVG avatars with initials
 */

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function generateAvatarSVG(name: string, size: number = 40): string {
  const initials = getInitials(name)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="100%" height="100%" fill="hsl(263 33% 52%)" rx="${size * 0.2}"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
          fill="hsl(0 0% 100%)" font-family="system-ui, sans-serif"
          font-size="${size * 0.4}" font-weight="600">
      ${initials}
    </text>
  </svg>`
}
