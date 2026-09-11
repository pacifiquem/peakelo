import type { CourseSkillBand, PlayerRatingContext } from '@peakelo/shared';

const EMPHASIS: Record<CourseSkillBand, string> = {
  under400:
    'This student is Under 400 (Chess.com course skill range). Teach the rule that wins the game: hang less, take free pieces, checks, and why the center matters (e4/d4 occupy space). A paragraph on the center is allowed when the ply is about it. Do not assume opening names or long plans.',
  from400to1200:
    'This student is 400–1200 (Chess.com course skill range). Emphasize develop, castle, don\'t hang, and one-move tactics. Name the opening only if the stored book/opening field has it. The center can be a sentence, not a lecture, unless they ignored it and got punished.',
  from1200to1600:
    'This student is 1200–1600 (Chess.com course skill range). Assume they know e4/d4 occupy the center. Spend words on the plan, the opponent\'s idea, and 2–3 ply tactics. Skip "control the center" sermons.',
  from1600to2000:
    'This student is 1600–2000 (Chess.com course skill range). Skip fundamentals unless this ply is that fundamental failing. Name the typical plan and the concrete reply. One sentence max on development or the center.',
  over2000:
    'This student is Over 2000 (Chess.com course skill range). Do not lecture e4/d4, development, or castling. Name the idea and the line. If the ply is a one-move hang, say so bluntly and move on.',
};

export function levelGuidance(rating: PlayerRatingContext | null): string {
  if (!rating) {
    return 'No rating on this game. Teach from the board and the engine pass. Do not guess a rating or invent a player type.';
  }
  return [
    `This game's rating: ${rating.source} ${rating.timeControl} ${rating.rating}.`,
    `Chess.com course skill range ${rating.bandLabel} applied to that number (not converted across sites).`,
    EMPHASIS[rating.band],
  ].join(' ');
}
