import type { FastifyInstance } from 'fastify';
import { PUBLIC_REVIEW_RATE_MAX, PUBLIC_REVIEW_RATE_WINDOW, publicReviewRequestSchema } from '@peakelo/shared';
import { getPublicReview, startPublicReview, type PreviewDeps } from './service';

export async function previewRoutes(app: FastifyInstance, opts: PreviewDeps = {}) {
  const rateLimit = { max: PUBLIC_REVIEW_RATE_MAX, timeWindow: PUBLIC_REVIEW_RATE_WINDOW };

  app.post('/public/reviews', { config: { rateLimit } }, async (request) => {
    const body = publicReviewRequestSchema.parse(request.body ?? {});
    return startPublicReview(body.url, opts);
  });

  app.get<{ Params: { id: string } }>('/public/reviews/:id', async (request) => {
    return getPublicReview(request.params.id);
  });
}
