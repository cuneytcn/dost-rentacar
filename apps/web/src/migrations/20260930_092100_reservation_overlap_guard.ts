import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Hand-written: Payload can't express exclusion constraints.
 * A vehicle can never be assigned to two capacity-holding reservations with overlapping periods,
 * even if application checks are bypassed or race. Half-open ranges allow back-to-back rentals.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE EXTENSION IF NOT EXISTS btree_gist;

    ALTER TABLE "reservations"
      ADD CONSTRAINT "reservations_vehicle_no_overlap"
      EXCLUDE USING gist (
        "vehicle_id" WITH =,
        tstzrange("pickup_at", "return_at", '[)') WITH &&
      )
      WHERE ("vehicle_id" IS NOT NULL AND "status" IN ('pending', 'confirmed', 'active'));

    ALTER TABLE "reservations"
      ADD CONSTRAINT "reservations_valid_period" CHECK ("return_at" > "pickup_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "reservations" DROP CONSTRAINT IF EXISTS "reservations_valid_period";
    ALTER TABLE "reservations" DROP CONSTRAINT IF EXISTS "reservations_vehicle_no_overlap";
  `)
}
