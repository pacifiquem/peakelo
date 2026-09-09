import { z } from 'zod';

export const timeControlSchema = z.enum(['bullet', 'blitz', 'rapid']);
export type TimeControl = z.infer<typeof timeControlSchema>;

export const planSchema = z.enum(['analysis', 'training']);
export type Plan = z.infer<typeof planSchema>;

export const gameSourceSchema = z.enum(['chesscom', 'lichess']);
export type GameSource = z.infer<typeof gameSourceSchema>;
