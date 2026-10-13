-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateTable
CREATE TABLE "APP_USER" (
    "user_id" BIGSERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100),
    "dob" DATE,
    "address" VARCHAR(255),
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "disabilityType" VARCHAR(100),

    CONSTRAINT "APP_USER_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "LOCATION" (
    "location_id" BIGSERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "address" VARCHAR(255),
    "latitude" DECIMAL(10,6),
    "longitude" DECIMAL(10,6),
    "geom" geography(Point, 4326),
    "description" VARCHAR(1000),
    "contact" VARCHAR(100),
    "rating" DECIMAL(3,2),
    "lastUpdated" TIMESTAMPTZ,
    "accessibilityScore" DECIMAL(3,2),
    "status" VARCHAR(20) DEFAULT 'pending',
    "flagCount" INTEGER DEFAULT 0,

    CONSTRAINT "LOCATION_pkey" PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "ACCESSIBILITY_FEATURE" (
    "feature_id" BIGSERIAL NOT NULL,
    "location_id" BIGINT NOT NULL,
    "wheelchairAccessible" BOOLEAN DEFAULT false,
    "accessibleRestrooms" BOOLEAN DEFAULT false,
    "accessibleParking" BOOLEAN DEFAULT false,
    "rampAccess" BOOLEAN DEFAULT false,
    "elevatorAccess" BOOLEAN DEFAULT false,
    "visualAudioAssistance" BOOLEAN DEFAULT false,
    "wideDoorways" BOOLEAN DEFAULT false,
    "levelSurfaces" BOOLEAN DEFAULT false,

    CONSTRAINT "ACCESSIBILITY_FEATURE_pkey" PRIMARY KEY ("feature_id")
);

-- CreateTable
CREATE TABLE "USER_LOCATION" (
    "user_location_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "location_id" BIGINT NOT NULL,

    CONSTRAINT "USER_LOCATION_pkey" PRIMARY KEY ("user_location_id")
);

-- CreateTable
CREATE TABLE "CONTRIBUTION" (
    "contribution_id" BIGSERIAL NOT NULL,
    "location_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "media_urls" TEXT[],
    "comment" TEXT,
    "feature_snapshot" JSONB,
    "status" VARCHAR(20) DEFAULT 'pending',
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" BIGINT,
    "reviewed_at" TIMESTAMPTZ,

    CONSTRAINT "CONTRIBUTION_pkey" PRIMARY KEY ("contribution_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "APP_USER_username_key" ON "APP_USER"("username");

-- CreateIndex
CREATE UNIQUE INDEX "APP_USER_email_key" ON "APP_USER"("email");

-- AddForeignKey
ALTER TABLE "ACCESSIBILITY_FEATURE" ADD CONSTRAINT "ACCESSIBILITY_FEATURE_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "LOCATION"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "USER_LOCATION" ADD CONSTRAINT "USER_LOCATION_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "APP_USER"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "USER_LOCATION" ADD CONSTRAINT "USER_LOCATION_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "LOCATION"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CONTRIBUTION" ADD CONSTRAINT "CONTRIBUTION_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "LOCATION"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CONTRIBUTION" ADD CONSTRAINT "CONTRIBUTION_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "APP_USER"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CONTRIBUTION" ADD CONSTRAINT "CONTRIBUTION_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "APP_USER"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
