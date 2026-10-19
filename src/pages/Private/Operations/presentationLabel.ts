/** Presentation-only fallback: never renames persisted variants or historical documents. */
export function presentationLabel(name: string, index = 0): string {
  if (!/nombre pendiente/i.test(name)) return name;
  const letter = name.match(/presentaci[oó]n\s+([A-Z])\b/i)?.[1].toUpperCase();
  return `Opción ${letter ? letter.charCodeAt(0) - 64 : index + 1}`;
}
