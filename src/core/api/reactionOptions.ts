import type { ReactionType } from './types';

export const reactionOptions: { type: ReactionType; label: string; emoji: string }[] = [
  { type: 'LIKE', label: 'Нравится', emoji: '👍' },
  { type: 'DISLIKE', label: 'Не нравится', emoji: '👎' },
  { type: 'MELTING', label: 'Таю', emoji: '🫠' },
  { type: 'MINDBLOWN', label: 'Впечатляет', emoji: '🤯' },
  { type: 'CRYING', label: 'Грустно', emoji: '😭' },
  { type: 'THINKING', label: 'Есть над чем подумать', emoji: '🤔' },
  { type: 'HOT', label: 'Горячо', emoji: '🥵' },
  { type: 'FIRE', label: 'Огонь', emoji: '🔥' },
  { type: 'FROZEN', label: 'Холодно', emoji: '🥶' },
];
