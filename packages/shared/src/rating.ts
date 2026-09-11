import { z } from 'zod';

import { gameSourceSchema, timeControlSchema } from './enums';

export const courseSkillBandSchema = z.enum([
  'under400',
  'from400to1200',
  'from1200to1600',
  'from1600to2000',
  'over2000',
]);
export type CourseSkillBand = z.infer<typeof courseSkillBandSchema>;

export const COURSE_SKILL_BAND_LABEL: Record<CourseSkillBand, string> = {
  under400: 'Under 400',
  from400to1200: '400–1200',
  from1200to1600: '1200–1600',
  from1600to2000: '1600–2000',
  over2000: 'Over 2000',
};

export function parseEloValue(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const value = Math.round(raw);
    return value > 0 && value < 4000 ? value : null;
  }
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '?' || trimmed === '-') return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  return rounded > 0 && rounded < 4000 ? rounded : null;
}

export function courseSkillBand(rating: number): CourseSkillBand {
  if (rating < 400) return 'under400';
  if (rating < 1200) return 'from400to1200';
  if (rating < 1600) return 'from1200to1600';
  if (rating < 2000) return 'from1600to2000';
  return 'over2000';
}

export const playerRatingContextSchema = z.object({
  rating: z.number().int().positive(),
  source: gameSourceSchema,
  timeControl: timeControlSchema,
  band: courseSkillBandSchema,
  bandLabel: z.string(),
});
export type PlayerRatingContext = z.infer<typeof playerRatingContextSchema>;
