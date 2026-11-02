export function calculateReadingTime(content: string): { minutes: number; wordCount: number; text: string } {
  if (!content) {
    return { minutes: 1, wordCount: 0, text: '1 мин чтения' };
  }

  // Strip markdown formatting for accurate word count
  const clean = content
    .replace(/[#*`_~[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = clean.length > 0 ? clean.split(/\s+/).length : 0;
  // Average reading speed: 180 words per minute
  const minutes = Math.max(1, Math.ceil(words / 180));

  return {
    minutes,
    wordCount: words,
    text: `${minutes} мин чтения`,
  };
}
