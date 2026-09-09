import { z } from 'zod';
import { authProviderSchema, gameSourceSchema } from './enums';
import { onboardingStateSchema } from './onboarding';

export const publicAccountSchema = z.object({
  provider: authProviderSchema,
  username: z.string().nullable(),
});
export type PublicAccount = z.infer<typeof publicAccountSchema>;

export const publicUserSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable(),
  displayName: z.string(),
  avatarUrl: z.string().url().nullable(),
  accounts: z.array(publicAccountSchema),
  gameSources: z.array(gameSourceSchema),
  onboarding: onboardingStateSchema,
});
export type PublicUser = z.infer<typeof publicUserSchema>;

export const authProvidersResponseSchema = z.object({
  providers: z.array(
    z.object({
      id: authProviderSchema,
      configured: z.boolean(),
    }),
  ),
});
export type AuthProvidersResponse = z.infer<typeof authProvidersResponseSchema>;

export const linkChesscomBodySchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(25)
    .regex(/^[A-Za-z0-9_-]+$/, 'Use the Chess.com username, not a URL'),
});
export type LinkChesscomBody = z.infer<typeof linkChesscomBodySchema>;

export const chessPlatformSchema = gameSourceSchema;

export function gameSourcesFromAccounts(
  accounts: Array<{ provider: string }>,
): Array<z.infer<typeof gameSourceSchema>> {
  const sources: Array<z.infer<typeof gameSourceSchema>> = [];
  if (accounts.some((account) => account.provider === 'lichess')) sources.push('lichess');
  if (accounts.some((account) => account.provider === 'chesscom')) sources.push('chesscom');
  return sources;
}
