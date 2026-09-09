CREATE TYPE "TrainingFocus_new" AS ENUM ('tactics', 'positional', 'blunders', 'openings', 'endgames', 'rating', 'unknown');

ALTER TABLE "Onboarding" ALTER COLUMN "trainingFocus" DROP DEFAULT;

ALTER TABLE "Onboarding" ALTER COLUMN "trainingFocus" TYPE "TrainingFocus_new" USING (
  CASE
    WHEN "trainingFocus"::text = 'time' THEN 'unknown'::"TrainingFocus_new"
    ELSE "trainingFocus"::text::"TrainingFocus_new"
  END
);

DROP TYPE "TrainingFocus";

ALTER TYPE "TrainingFocus_new" RENAME TO "TrainingFocus";
