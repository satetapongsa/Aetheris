/**
 * Removes emoji and pictographic icons (incl. flags, keycaps, skin tones,
 * variation selectors and joiners) from AI text.
 */
const EMOJI =
  /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{FE0E}\u{200D}\u{20E3}]/gu;

export function stripEmoji(text: string): string {
  return text.replace(EMOJI, "");
}
