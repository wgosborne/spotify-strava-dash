-- CreateTable "public"."activities"
CREATE TABLE "public"."activities" (
    "id" SERIAL NOT NULL,
    "strava_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "distance" DECIMAL NOT NULL,
    "moving_time" INTEGER NOT NULL,
    "average_speed" DECIMAL NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "description" TEXT,
    "inserted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable "public"."app_tokens"
CREATE TABLE "public"."app_tokens" (
    "service" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_tokens_pkey" PRIMARY KEY ("service")
);

-- CreateTable "public"."plays"
CREATE TABLE "public"."plays" (
    "id" SERIAL NOT NULL,
    "track_name" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "played_at" TIMESTAMPTZ(6) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'spotify',
    "album_art_url" TEXT,
    "inserted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plays_pkey" PRIMARY KEY ("id")
);

-- CreateTable "public"."splits"
CREATE TABLE "public"."splits" (
    "id" SERIAL NOT NULL,
    "activity_id" BIGINT NOT NULL,
    "split_number" INTEGER NOT NULL,
    "distance" DECIMAL NOT NULL,
    "elapsed_time" INTEGER NOT NULL,
    "average_speed" DECIMAL NOT NULL,
    "start_offset_seconds" INTEGER NOT NULL,
    "inserted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "splits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activities_strava_id_key" ON "public"."activities"("strava_id");

-- CreateIndex
CREATE INDEX "plays_played_at_idx" ON "public"."plays"("played_at");

-- CreateIndex
CREATE UNIQUE INDEX "plays_track_played_unique" ON "public"."plays"("track_name", "artist", "played_at");

-- CreateIndex
CREATE UNIQUE INDEX "splits_activity_id_split_number_key" ON "public"."splits"("activity_id", "split_number");

-- CreateIndex (New - for performance optimization)
CREATE INDEX "splits_distance_average_speed_idx" ON "public"."splits"("distance", "average_speed");

-- CreateIndex (New - for performance optimization)
CREATE INDEX "splits_average_speed_idx" ON "public"."splits"("average_speed");

-- CreateIndex (New - for performance optimization)
CREATE INDEX "splits_activity_id_idx" ON "public"."splits"("activity_id");

-- AddForeignKey
ALTER TABLE "public"."splits" ADD CONSTRAINT "splits_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("strava_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
