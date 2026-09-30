import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('tr', 'en', 'de', 'ru');
  CREATE TYPE "public"."enum_reservations_payments_method" AS ENUM('office_cash', 'office_card', 'bank_transfer');
  CREATE TYPE "public"."enum_reservations_status" AS ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled', 'no_show');
  CREATE TYPE "public"."enum_reservations_payment_status" AS ENUM('unpaid', 'partial', 'paid', 'refunded');
  CREATE TYPE "public"."enum_reservations_source" AS ENUM('web', 'mobile', 'phone', 'walk_in', 'corporate');
  CREATE TYPE "public"."enum_reservations_preferred_payment_method" AS ENUM('office', 'bank_transfer');
  CREATE TYPE "public"."enum_reservations_pricing_currency" AS ENUM('EUR', 'TRY', 'USD', 'GBP');
  CREATE TYPE "public"."enum_reservations_display_currency" AS ENUM('EUR', 'TRY', 'USD', 'GBP');
  CREATE TYPE "public"."enum_customers_id_document_type" AS ENUM('national_id', 'passport');
  CREATE TYPE "public"."enum_handovers_damages_area" AS ENUM('front', 'rear', 'left', 'right', 'roof', 'interior', 'windshield', 'wheels', 'other');
  CREATE TYPE "public"."enum_handovers_type" AS ENUM('pickup', 'return');
  CREATE TYPE "public"."enum_handovers_fuel_level" AS ENUM('empty', 'quarter', 'half', 'three_quarters', 'full');
  CREATE TYPE "public"."enum_penalties_type" AS ENUM('toll', 'traffic_fine', 'damage', 'fuel', 'extra_km', 'late_return', 'other');
  CREATE TYPE "public"."enum_penalties_status" AS ENUM('open', 'charged', 'paid', 'waived');
  CREATE TYPE "public"."enum_corporate_requests_status" AS ENUM('new', 'contacted', 'quoted', 'won', 'lost');
  CREATE TYPE "public"."enum_vehicle_models_features" AS ENUM('air_conditioning', 'bluetooth', 'navigation', 'cruise_control', 'parking_sensors', 'rear_camera', 'apple_carplay', 'android_auto', 'sunroof', 'heated_seats', 'usb', 'isofix');
  CREATE TYPE "public"."enum_vehicle_models_transmission" AS ENUM('manual', 'automatic');
  CREATE TYPE "public"."enum_vehicle_models_fuel_type" AS ENUM('petrol', 'diesel', 'hybrid', 'electric', 'lpg');
  CREATE TYPE "public"."enum_vehicles_status" AS ENUM('active', 'maintenance', 'inactive', 'sold');
  CREATE TYPE "public"."enum_vehicle_blocks_reason" AS ENUM('maintenance', 'repair', 'inspection', 'other');
  CREATE TYPE "public"."enum_locations_opening_hours_day" AS ENUM('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');
  CREATE TYPE "public"."enum_extras_pricing_type" AS ENUM('per_day', 'per_rental');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('tr', 'en', 'de', 'ru');
  CREATE TYPE "public"."enum_faqs_category" AS ENUM('booking', 'payment', 'requirements', 'insurance', 'other');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'staff');
  CREATE TYPE "public"."enum_settings_display_currencies" AS ENUM('EUR', 'TRY', 'USD', 'GBP');
  CREATE TYPE "public"."enum_settings_bank_accounts_currency" AS ENUM('EUR', 'TRY', 'USD', 'GBP');
  CREATE TYPE "public"."enum_settings_base_currency" AS ENUM('EUR', 'TRY', 'USD', 'GBP');
  CREATE TYPE "public"."enum_exchange_rates_rates_currency" AS ENUM('EUR', 'TRY', 'USD', 'GBP');
  CREATE TYPE "public"."enum_exchange_rates_base_currency" AS ENUM('EUR', 'TRY', 'USD', 'GBP');
  CREATE TABLE "reservations_additional_drivers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"full_name" varchar NOT NULL,
  	"license_number" varchar,
  	"birth_date" varchar
  );
  
  CREATE TABLE "reservations_extras" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"extra_id" integer NOT NULL,
  	"quantity" numeric DEFAULT 1 NOT NULL,
  	"name" varchar,
  	"unit_price" numeric,
  	"charged_days" numeric,
  	"total" numeric
  );
  
  CREATE TABLE "reservations_payments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"amount" numeric NOT NULL,
  	"method" "enum_reservations_payments_method" NOT NULL,
  	"paid_at" timestamp(3) with time zone NOT NULL,
  	"reference" varchar,
  	"proof_id" integer
  );
  
  CREATE TABLE "reservations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar,
  	"status" "enum_reservations_status" DEFAULT 'pending' NOT NULL,
  	"payment_status" "enum_reservations_payment_status" DEFAULT 'unpaid' NOT NULL,
  	"source" "enum_reservations_source" DEFAULT 'phone' NOT NULL,
  	"locale" varchar DEFAULT 'tr',
  	"customer_id" integer NOT NULL,
  	"vehicle_model_id" integer NOT NULL,
  	"vehicle_id" integer,
  	"pickup_location_id" integer NOT NULL,
  	"return_location_id" integer NOT NULL,
  	"pickup_at" timestamp(3) with time zone NOT NULL,
  	"return_at" timestamp(3) with time zone NOT NULL,
  	"flight_number" varchar,
  	"preferred_payment_method" "enum_reservations_preferred_payment_method" DEFAULT 'office' NOT NULL,
  	"customer_note" varchar,
  	"internal_note" varchar,
  	"recalculate_price" boolean DEFAULT false,
  	"pricing_currency" "enum_reservations_pricing_currency",
  	"pricing_rental_days" numeric,
  	"pricing_base_total" numeric,
  	"pricing_extras_total" numeric,
  	"pricing_transfer_fee" numeric,
  	"pricing_discount" numeric DEFAULT 0,
  	"pricing_total" numeric,
  	"pricing_deposit" numeric,
  	"pricing_daily_breakdown" jsonb,
  	"display_currency" "enum_reservations_display_currency",
  	"display_rate" numeric,
  	"display_total" numeric,
  	"paid_total" numeric DEFAULT 0,
  	"confirmed_at" timestamp(3) with time zone,
  	"cancelled_at" timestamp(3) with time zone,
  	"cancel_reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "customers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"full_name" varchar,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"country" varchar,
  	"birth_date" varchar,
  	"preferred_locale" varchar,
  	"id_document_type" "enum_customers_id_document_type",
  	"id_document_number" varchar,
  	"license_number" varchar,
  	"license_country" varchar,
  	"license_issued_at" varchar,
  	"address" varchar,
  	"privacy_accepted_at" timestamp(3) with time zone,
  	"marketing_consent" boolean DEFAULT false,
  	"marketing_consent_at" timestamp(3) with time zone,
  	"is_blacklisted" boolean DEFAULT false,
  	"blacklist_reason" varchar,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "handovers_damages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"area" "enum_handovers_damages_area" NOT NULL,
  	"description" varchar NOT NULL,
  	"is_new" boolean DEFAULT false,
  	"photo_id" integer
  );
  
  CREATE TABLE "handovers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reservation_id" integer NOT NULL,
  	"type" "enum_handovers_type" NOT NULL,
  	"performed_at" timestamp(3) with time zone NOT NULL,
  	"mileage_km" numeric NOT NULL,
  	"fuel_level" "enum_handovers_fuel_level" NOT NULL,
  	"notes" varchar,
  	"performed_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "handovers_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"documents_id" integer
  );
  
  CREATE TABLE "penalties" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_penalties_type" NOT NULL,
  	"status" "enum_penalties_status" DEFAULT 'open' NOT NULL,
  	"vehicle_id" integer NOT NULL,
  	"reservation_id" integer,
  	"amount" numeric NOT NULL,
  	"occurred_at" timestamp(3) with time zone NOT NULL,
  	"document_id" integer,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "corporate_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_corporate_requests_status" DEFAULT 'new' NOT NULL,
  	"locale" varchar,
  	"company_name" varchar NOT NULL,
  	"tax_number" varchar,
  	"contact_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"country" varchar,
  	"vehicle_count" numeric NOT NULL,
  	"start_date" varchar NOT NULL,
  	"duration_months" numeric NOT NULL,
  	"notes" varchar,
  	"privacy_accepted_at" timestamp(3) with time zone,
  	"internal_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "corporate_requests_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"vehicle_categories_id" integer
  );
  
  CREATE TABLE "vehicle_models_features" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_vehicle_models_features",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "vehicle_models_rate_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"min_days" numeric NOT NULL,
  	"daily_rate" numeric NOT NULL
  );
  
  CREATE TABLE "vehicle_models" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"is_active" boolean DEFAULT true,
  	"is_featured" boolean DEFAULT false,
  	"sort_order" numeric DEFAULT 0,
  	"brand" varchar NOT NULL,
  	"model" varchar NOT NULL,
  	"category_id" integer NOT NULL,
  	"transmission" "enum_vehicle_models_transmission" NOT NULL,
  	"fuel_type" "enum_vehicle_models_fuel_type" NOT NULL,
  	"seats" numeric DEFAULT 5 NOT NULL,
  	"doors" numeric DEFAULT 4 NOT NULL,
  	"large_bags" numeric DEFAULT 1 NOT NULL,
  	"small_bags" numeric DEFAULT 1 NOT NULL,
  	"min_driver_age" numeric DEFAULT 21 NOT NULL,
  	"min_license_years" numeric DEFAULT 2 NOT NULL,
  	"daily_km_limit" numeric,
  	"extra_km_fee" numeric,
  	"deposit" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "vehicle_models_locales" (
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "vehicle_models_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "vehicles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"plate" varchar NOT NULL,
  	"vehicle_model_id" integer NOT NULL,
  	"location_id" integer NOT NULL,
  	"status" "enum_vehicles_status" DEFAULT 'active' NOT NULL,
  	"year" numeric,
  	"color" varchar,
  	"vin" varchar,
  	"mileage_km" numeric DEFAULT 0,
  	"insurance_expires_at" timestamp(3) with time zone,
  	"casco_expires_at" timestamp(3) with time zone,
  	"inspection_expires_at" timestamp(3) with time zone,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "vehicle_blocks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"vehicle_id" integer NOT NULL,
  	"reason" "enum_vehicle_blocks_reason" NOT NULL,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"ends_at" timestamp(3) with time zone NOT NULL,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "vehicle_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"is_active" boolean DEFAULT true,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "vehicle_categories_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "locations_opening_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" "enum_locations_opening_hours_day" NOT NULL,
  	"opens_at" varchar NOT NULL,
  	"closes_at" varchar NOT NULL
  );
  
  CREATE TABLE "locations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"is_active" boolean DEFAULT true,
  	"sort_order" numeric DEFAULT 0,
  	"allows_pickup" boolean DEFAULT true,
  	"allows_return" boolean DEFAULT true,
  	"city" varchar NOT NULL,
  	"country" varchar DEFAULT 'TR',
  	"phone" varchar NOT NULL,
  	"whatsapp" varchar,
  	"email" varchar,
  	"latitude" numeric,
  	"longitude" numeric,
  	"time_zone" varchar DEFAULT 'Europe/Istanbul' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "locations_locales" (
  	"name" varchar NOT NULL,
  	"address" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "seasons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"start_date" varchar NOT NULL,
  	"end_date" varchar NOT NULL,
  	"adjustment_percent" numeric NOT NULL,
  	"priority" numeric DEFAULT 0 NOT NULL,
  	"min_rental_days" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "seasons_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"vehicle_categories_id" integer
  );
  
  CREATE TABLE "extras" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"is_active" boolean DEFAULT true,
  	"sort_order" numeric DEFAULT 0,
  	"pricing_type" "enum_extras_pricing_type" DEFAULT 'per_day' NOT NULL,
  	"price" numeric NOT NULL,
  	"max_quantity" numeric DEFAULT 1 NOT NULL,
  	"max_charge_days" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "extras_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "transfer_fees" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from_location_id" integer NOT NULL,
  	"to_location_id" integer NOT NULL,
  	"fee" numeric NOT NULL,
  	"bidirectional" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar,
  	"content" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__pages_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_pages_v_locales" (
  	"version_title" varchar,
  	"version_content" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"category" "enum_faqs_category" DEFAULT 'booking' NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faqs_locales" (
  	"question" varchar NOT NULL,
  	"answer" jsonb NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'staff' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"locations_id" integer
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"reservations_id" integer,
  	"customers_id" integer,
  	"handovers_id" integer,
  	"penalties_id" integer,
  	"corporate_requests_id" integer,
  	"vehicle_models_id" integer,
  	"vehicles_id" integer,
  	"vehicle_blocks_id" integer,
  	"vehicle_categories_id" integer,
  	"locations_id" integer,
  	"seasons_id" integer,
  	"extras_id" integer,
  	"transfer_fees_id" integer,
  	"pages_id" integer,
  	"faqs_id" integer,
  	"media_id" integer,
  	"documents_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "settings_display_currencies" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_settings_display_currencies",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "settings_bank_accounts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"bank_name" varchar NOT NULL,
  	"account_holder" varchar NOT NULL,
  	"iban" varchar NOT NULL,
  	"currency" "enum_settings_bank_accounts_currency" NOT NULL
  );
  
  CREATE TABLE "settings_notification_emails" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL
  );
  
  CREATE TABLE "settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"company_name" varchar DEFAULT 'Rent a Car' NOT NULL,
  	"legal_name" varchar,
  	"tax_office" varchar,
  	"tax_number" varchar,
  	"mersis_number" varchar,
  	"phone" varchar,
  	"whatsapp" varchar,
  	"email" varchar,
  	"address" varchar,
  	"social_links_instagram" varchar,
  	"social_links_facebook" varchar,
  	"social_links_x" varchar,
  	"social_links_youtube" varchar,
  	"base_currency" "enum_settings_base_currency" DEFAULT 'EUR' NOT NULL,
  	"reservation_rules_min_lead_time_hours" numeric DEFAULT 2 NOT NULL,
  	"reservation_rules_min_rental_days" numeric DEFAULT 1 NOT NULL,
  	"reservation_rules_max_rental_days" numeric DEFAULT 60 NOT NULL,
  	"reservation_rules_max_advance_days" numeric DEFAULT 365 NOT NULL,
  	"reservation_rules_grace_minutes" numeric DEFAULT 60 NOT NULL,
  	"reservation_rules_buffer_minutes" numeric DEFAULT 60 NOT NULL,
  	"reservation_rules_self_cancel_cutoff_hours" numeric DEFAULT 24 NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "settings_locales" (
  	"cancellation_policy" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "exchange_rates_rates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"currency" "enum_exchange_rates_rates_currency" NOT NULL,
  	"rate" numeric NOT NULL
  );
  
  CREATE TABLE "exchange_rates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"base_currency" "enum_exchange_rates_base_currency",
  	"source" varchar,
  	"fetched_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "reservations_additional_drivers" ADD CONSTRAINT "reservations_additional_drivers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reservations_extras" ADD CONSTRAINT "reservations_extras_extra_id_extras_id_fk" FOREIGN KEY ("extra_id") REFERENCES "public"."extras"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reservations_extras" ADD CONSTRAINT "reservations_extras_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reservations_payments" ADD CONSTRAINT "reservations_payments_proof_id_documents_id_fk" FOREIGN KEY ("proof_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reservations_payments" ADD CONSTRAINT "reservations_payments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reservations" ADD CONSTRAINT "reservations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reservations" ADD CONSTRAINT "reservations_vehicle_model_id_vehicle_models_id_fk" FOREIGN KEY ("vehicle_model_id") REFERENCES "public"."vehicle_models"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reservations" ADD CONSTRAINT "reservations_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reservations" ADD CONSTRAINT "reservations_pickup_location_id_locations_id_fk" FOREIGN KEY ("pickup_location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reservations" ADD CONSTRAINT "reservations_return_location_id_locations_id_fk" FOREIGN KEY ("return_location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "handovers_damages" ADD CONSTRAINT "handovers_damages_photo_id_documents_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "handovers_damages" ADD CONSTRAINT "handovers_damages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."handovers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "handovers" ADD CONSTRAINT "handovers_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "handovers" ADD CONSTRAINT "handovers_performed_by_id_users_id_fk" FOREIGN KEY ("performed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "handovers_rels" ADD CONSTRAINT "handovers_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."handovers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "handovers_rels" ADD CONSTRAINT "handovers_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "penalties" ADD CONSTRAINT "penalties_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "penalties" ADD CONSTRAINT "penalties_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "penalties" ADD CONSTRAINT "penalties_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "corporate_requests_rels" ADD CONSTRAINT "corporate_requests_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."corporate_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "corporate_requests_rels" ADD CONSTRAINT "corporate_requests_rels_vehicle_categories_fk" FOREIGN KEY ("vehicle_categories_id") REFERENCES "public"."vehicle_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vehicle_models_features" ADD CONSTRAINT "vehicle_models_features_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."vehicle_models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vehicle_models_rate_tiers" ADD CONSTRAINT "vehicle_models_rate_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vehicle_models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_category_id_vehicle_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."vehicle_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vehicle_models_locales" ADD CONSTRAINT "vehicle_models_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vehicle_models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vehicle_models_rels" ADD CONSTRAINT "vehicle_models_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."vehicle_models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vehicle_models_rels" ADD CONSTRAINT "vehicle_models_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_vehicle_model_id_vehicle_models_id_fk" FOREIGN KEY ("vehicle_model_id") REFERENCES "public"."vehicle_models"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vehicle_blocks" ADD CONSTRAINT "vehicle_blocks_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vehicle_categories_locales" ADD CONSTRAINT "vehicle_categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vehicle_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_opening_hours" ADD CONSTRAINT "locations_opening_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_locales" ADD CONSTRAINT "locations_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seasons_rels" ADD CONSTRAINT "seasons_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seasons_rels" ADD CONSTRAINT "seasons_rels_vehicle_categories_fk" FOREIGN KEY ("vehicle_categories_id") REFERENCES "public"."vehicle_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "extras_locales" ADD CONSTRAINT "extras_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."extras"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "transfer_fees" ADD CONSTRAINT "transfer_fees_from_location_id_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "transfer_fees" ADD CONSTRAINT "transfer_fees_to_location_id_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "faqs_locales" ADD CONSTRAINT "faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reservations_fk" FOREIGN KEY ("reservations_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_handovers_fk" FOREIGN KEY ("handovers_id") REFERENCES "public"."handovers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_penalties_fk" FOREIGN KEY ("penalties_id") REFERENCES "public"."penalties"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_corporate_requests_fk" FOREIGN KEY ("corporate_requests_id") REFERENCES "public"."corporate_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vehicle_models_fk" FOREIGN KEY ("vehicle_models_id") REFERENCES "public"."vehicle_models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vehicles_fk" FOREIGN KEY ("vehicles_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vehicle_blocks_fk" FOREIGN KEY ("vehicle_blocks_id") REFERENCES "public"."vehicle_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vehicle_categories_fk" FOREIGN KEY ("vehicle_categories_id") REFERENCES "public"."vehicle_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_seasons_fk" FOREIGN KEY ("seasons_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_extras_fk" FOREIGN KEY ("extras_id") REFERENCES "public"."extras"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_transfer_fees_fk" FOREIGN KEY ("transfer_fees_id") REFERENCES "public"."transfer_fees"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settings_display_currencies" ADD CONSTRAINT "settings_display_currencies_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settings_bank_accounts" ADD CONSTRAINT "settings_bank_accounts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settings_notification_emails" ADD CONSTRAINT "settings_notification_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settings_locales" ADD CONSTRAINT "settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exchange_rates_rates" ADD CONSTRAINT "exchange_rates_rates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."exchange_rates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "reservations_additional_drivers_order_idx" ON "reservations_additional_drivers" USING btree ("_order");
  CREATE INDEX "reservations_additional_drivers_parent_id_idx" ON "reservations_additional_drivers" USING btree ("_parent_id");
  CREATE INDEX "reservations_extras_order_idx" ON "reservations_extras" USING btree ("_order");
  CREATE INDEX "reservations_extras_parent_id_idx" ON "reservations_extras" USING btree ("_parent_id");
  CREATE INDEX "reservations_extras_extra_idx" ON "reservations_extras" USING btree ("extra_id");
  CREATE INDEX "reservations_payments_order_idx" ON "reservations_payments" USING btree ("_order");
  CREATE INDEX "reservations_payments_parent_id_idx" ON "reservations_payments" USING btree ("_parent_id");
  CREATE INDEX "reservations_payments_proof_idx" ON "reservations_payments" USING btree ("proof_id");
  CREATE UNIQUE INDEX "reservations_code_idx" ON "reservations" USING btree ("code");
  CREATE INDEX "reservations_status_idx" ON "reservations" USING btree ("status");
  CREATE INDEX "reservations_payment_status_idx" ON "reservations" USING btree ("payment_status");
  CREATE INDEX "reservations_customer_idx" ON "reservations" USING btree ("customer_id");
  CREATE INDEX "reservations_vehicle_model_idx" ON "reservations" USING btree ("vehicle_model_id");
  CREATE INDEX "reservations_vehicle_idx" ON "reservations" USING btree ("vehicle_id");
  CREATE INDEX "reservations_pickup_location_idx" ON "reservations" USING btree ("pickup_location_id");
  CREATE INDEX "reservations_return_location_idx" ON "reservations" USING btree ("return_location_id");
  CREATE INDEX "reservations_pickup_at_idx" ON "reservations" USING btree ("pickup_at");
  CREATE INDEX "reservations_return_at_idx" ON "reservations" USING btree ("return_at");
  CREATE INDEX "reservations_updated_at_idx" ON "reservations" USING btree ("updated_at");
  CREATE INDEX "reservations_created_at_idx" ON "reservations" USING btree ("created_at");
  CREATE INDEX "customers_full_name_idx" ON "customers" USING btree ("full_name");
  CREATE UNIQUE INDEX "customers_email_idx" ON "customers" USING btree ("email");
  CREATE INDEX "customers_is_blacklisted_idx" ON "customers" USING btree ("is_blacklisted");
  CREATE INDEX "customers_updated_at_idx" ON "customers" USING btree ("updated_at");
  CREATE INDEX "customers_created_at_idx" ON "customers" USING btree ("created_at");
  CREATE INDEX "handovers_damages_order_idx" ON "handovers_damages" USING btree ("_order");
  CREATE INDEX "handovers_damages_parent_id_idx" ON "handovers_damages" USING btree ("_parent_id");
  CREATE INDEX "handovers_damages_photo_idx" ON "handovers_damages" USING btree ("photo_id");
  CREATE INDEX "handovers_reservation_idx" ON "handovers" USING btree ("reservation_id");
  CREATE INDEX "handovers_performed_by_idx" ON "handovers" USING btree ("performed_by_id");
  CREATE INDEX "handovers_updated_at_idx" ON "handovers" USING btree ("updated_at");
  CREATE INDEX "handovers_created_at_idx" ON "handovers" USING btree ("created_at");
  CREATE INDEX "handovers_rels_order_idx" ON "handovers_rels" USING btree ("order");
  CREATE INDEX "handovers_rels_parent_idx" ON "handovers_rels" USING btree ("parent_id");
  CREATE INDEX "handovers_rels_path_idx" ON "handovers_rels" USING btree ("path");
  CREATE INDEX "handovers_rels_documents_id_idx" ON "handovers_rels" USING btree ("documents_id");
  CREATE INDEX "penalties_status_idx" ON "penalties" USING btree ("status");
  CREATE INDEX "penalties_vehicle_idx" ON "penalties" USING btree ("vehicle_id");
  CREATE INDEX "penalties_reservation_idx" ON "penalties" USING btree ("reservation_id");
  CREATE INDEX "penalties_document_idx" ON "penalties" USING btree ("document_id");
  CREATE INDEX "penalties_updated_at_idx" ON "penalties" USING btree ("updated_at");
  CREATE INDEX "penalties_created_at_idx" ON "penalties" USING btree ("created_at");
  CREATE INDEX "corporate_requests_status_idx" ON "corporate_requests" USING btree ("status");
  CREATE INDEX "corporate_requests_updated_at_idx" ON "corporate_requests" USING btree ("updated_at");
  CREATE INDEX "corporate_requests_created_at_idx" ON "corporate_requests" USING btree ("created_at");
  CREATE INDEX "corporate_requests_rels_order_idx" ON "corporate_requests_rels" USING btree ("order");
  CREATE INDEX "corporate_requests_rels_parent_idx" ON "corporate_requests_rels" USING btree ("parent_id");
  CREATE INDEX "corporate_requests_rels_path_idx" ON "corporate_requests_rels" USING btree ("path");
  CREATE INDEX "corporate_requests_rels_vehicle_categories_id_idx" ON "corporate_requests_rels" USING btree ("vehicle_categories_id");
  CREATE INDEX "vehicle_models_features_order_idx" ON "vehicle_models_features" USING btree ("order");
  CREATE INDEX "vehicle_models_features_parent_idx" ON "vehicle_models_features" USING btree ("parent_id");
  CREATE INDEX "vehicle_models_rate_tiers_order_idx" ON "vehicle_models_rate_tiers" USING btree ("_order");
  CREATE INDEX "vehicle_models_rate_tiers_parent_id_idx" ON "vehicle_models_rate_tiers" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "vehicle_models_slug_idx" ON "vehicle_models" USING btree ("slug");
  CREATE INDEX "vehicle_models_is_active_idx" ON "vehicle_models" USING btree ("is_active");
  CREATE INDEX "vehicle_models_category_idx" ON "vehicle_models" USING btree ("category_id");
  CREATE INDEX "vehicle_models_updated_at_idx" ON "vehicle_models" USING btree ("updated_at");
  CREATE INDEX "vehicle_models_created_at_idx" ON "vehicle_models" USING btree ("created_at");
  CREATE UNIQUE INDEX "vehicle_models_locales_locale_parent_id_unique" ON "vehicle_models_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "vehicle_models_rels_order_idx" ON "vehicle_models_rels" USING btree ("order");
  CREATE INDEX "vehicle_models_rels_parent_idx" ON "vehicle_models_rels" USING btree ("parent_id");
  CREATE INDEX "vehicle_models_rels_path_idx" ON "vehicle_models_rels" USING btree ("path");
  CREATE INDEX "vehicle_models_rels_media_id_idx" ON "vehicle_models_rels" USING btree ("media_id");
  CREATE UNIQUE INDEX "vehicles_plate_idx" ON "vehicles" USING btree ("plate");
  CREATE INDEX "vehicles_vehicle_model_idx" ON "vehicles" USING btree ("vehicle_model_id");
  CREATE INDEX "vehicles_location_idx" ON "vehicles" USING btree ("location_id");
  CREATE INDEX "vehicles_status_idx" ON "vehicles" USING btree ("status");
  CREATE INDEX "vehicles_updated_at_idx" ON "vehicles" USING btree ("updated_at");
  CREATE INDEX "vehicles_created_at_idx" ON "vehicles" USING btree ("created_at");
  CREATE INDEX "vehicle_blocks_vehicle_idx" ON "vehicle_blocks" USING btree ("vehicle_id");
  CREATE INDEX "vehicle_blocks_starts_at_idx" ON "vehicle_blocks" USING btree ("starts_at");
  CREATE INDEX "vehicle_blocks_ends_at_idx" ON "vehicle_blocks" USING btree ("ends_at");
  CREATE INDEX "vehicle_blocks_updated_at_idx" ON "vehicle_blocks" USING btree ("updated_at");
  CREATE INDEX "vehicle_blocks_created_at_idx" ON "vehicle_blocks" USING btree ("created_at");
  CREATE UNIQUE INDEX "vehicle_categories_slug_idx" ON "vehicle_categories" USING btree ("slug");
  CREATE INDEX "vehicle_categories_is_active_idx" ON "vehicle_categories" USING btree ("is_active");
  CREATE INDEX "vehicle_categories_updated_at_idx" ON "vehicle_categories" USING btree ("updated_at");
  CREATE INDEX "vehicle_categories_created_at_idx" ON "vehicle_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "vehicle_categories_locales_locale_parent_id_unique" ON "vehicle_categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "locations_opening_hours_order_idx" ON "locations_opening_hours" USING btree ("_order");
  CREATE INDEX "locations_opening_hours_parent_id_idx" ON "locations_opening_hours" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "locations_slug_idx" ON "locations" USING btree ("slug");
  CREATE INDEX "locations_is_active_idx" ON "locations" USING btree ("is_active");
  CREATE INDEX "locations_updated_at_idx" ON "locations" USING btree ("updated_at");
  CREATE INDEX "locations_created_at_idx" ON "locations" USING btree ("created_at");
  CREATE UNIQUE INDEX "locations_locales_locale_parent_id_unique" ON "locations_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "seasons_is_active_idx" ON "seasons" USING btree ("is_active");
  CREATE INDEX "seasons_start_date_idx" ON "seasons" USING btree ("start_date");
  CREATE INDEX "seasons_end_date_idx" ON "seasons" USING btree ("end_date");
  CREATE INDEX "seasons_updated_at_idx" ON "seasons" USING btree ("updated_at");
  CREATE INDEX "seasons_created_at_idx" ON "seasons" USING btree ("created_at");
  CREATE INDEX "seasons_rels_order_idx" ON "seasons_rels" USING btree ("order");
  CREATE INDEX "seasons_rels_parent_idx" ON "seasons_rels" USING btree ("parent_id");
  CREATE INDEX "seasons_rels_path_idx" ON "seasons_rels" USING btree ("path");
  CREATE INDEX "seasons_rels_vehicle_categories_id_idx" ON "seasons_rels" USING btree ("vehicle_categories_id");
  CREATE UNIQUE INDEX "extras_slug_idx" ON "extras" USING btree ("slug");
  CREATE INDEX "extras_is_active_idx" ON "extras" USING btree ("is_active");
  CREATE INDEX "extras_updated_at_idx" ON "extras" USING btree ("updated_at");
  CREATE INDEX "extras_created_at_idx" ON "extras" USING btree ("created_at");
  CREATE UNIQUE INDEX "extras_locales_locale_parent_id_unique" ON "extras_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "transfer_fees_from_location_idx" ON "transfer_fees" USING btree ("from_location_id");
  CREATE INDEX "transfer_fees_to_location_idx" ON "transfer_fees" USING btree ("to_location_id");
  CREATE INDEX "transfer_fees_updated_at_idx" ON "transfer_fees" USING btree ("updated_at");
  CREATE INDEX "transfer_fees_created_at_idx" ON "transfer_fees" USING btree ("created_at");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "faqs_is_active_idx" ON "faqs" USING btree ("is_active");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE UNIQUE INDEX "faqs_locales_locale_parent_id_unique" ON "faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "documents_updated_at_idx" ON "documents" USING btree ("updated_at");
  CREATE INDEX "documents_created_at_idx" ON "documents" USING btree ("created_at");
  CREATE UNIQUE INDEX "documents_filename_idx" ON "documents" USING btree ("filename");
  CREATE INDEX "documents_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "documents" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX "users_rels_locations_id_idx" ON "users_rels" USING btree ("locations_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_reservations_id_idx" ON "payload_locked_documents_rels" USING btree ("reservations_id");
  CREATE INDEX "payload_locked_documents_rels_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("customers_id");
  CREATE INDEX "payload_locked_documents_rels_handovers_id_idx" ON "payload_locked_documents_rels" USING btree ("handovers_id");
  CREATE INDEX "payload_locked_documents_rels_penalties_id_idx" ON "payload_locked_documents_rels" USING btree ("penalties_id");
  CREATE INDEX "payload_locked_documents_rels_corporate_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("corporate_requests_id");
  CREATE INDEX "payload_locked_documents_rels_vehicle_models_id_idx" ON "payload_locked_documents_rels" USING btree ("vehicle_models_id");
  CREATE INDEX "payload_locked_documents_rels_vehicles_id_idx" ON "payload_locked_documents_rels" USING btree ("vehicles_id");
  CREATE INDEX "payload_locked_documents_rels_vehicle_blocks_id_idx" ON "payload_locked_documents_rels" USING btree ("vehicle_blocks_id");
  CREATE INDEX "payload_locked_documents_rels_vehicle_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("vehicle_categories_id");
  CREATE INDEX "payload_locked_documents_rels_locations_id_idx" ON "payload_locked_documents_rels" USING btree ("locations_id");
  CREATE INDEX "payload_locked_documents_rels_seasons_id_idx" ON "payload_locked_documents_rels" USING btree ("seasons_id");
  CREATE INDEX "payload_locked_documents_rels_extras_id_idx" ON "payload_locked_documents_rels" USING btree ("extras_id");
  CREATE INDEX "payload_locked_documents_rels_transfer_fees_id_idx" ON "payload_locked_documents_rels" USING btree ("transfer_fees_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("documents_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "settings_display_currencies_order_idx" ON "settings_display_currencies" USING btree ("order");
  CREATE INDEX "settings_display_currencies_parent_idx" ON "settings_display_currencies" USING btree ("parent_id");
  CREATE INDEX "settings_bank_accounts_order_idx" ON "settings_bank_accounts" USING btree ("_order");
  CREATE INDEX "settings_bank_accounts_parent_id_idx" ON "settings_bank_accounts" USING btree ("_parent_id");
  CREATE INDEX "settings_notification_emails_order_idx" ON "settings_notification_emails" USING btree ("_order");
  CREATE INDEX "settings_notification_emails_parent_id_idx" ON "settings_notification_emails" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "settings_locales_locale_parent_id_unique" ON "settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "exchange_rates_rates_order_idx" ON "exchange_rates_rates" USING btree ("_order");
  CREATE INDEX "exchange_rates_rates_parent_id_idx" ON "exchange_rates_rates" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "reservations_additional_drivers" CASCADE;
  DROP TABLE "reservations_extras" CASCADE;
  DROP TABLE "reservations_payments" CASCADE;
  DROP TABLE "reservations" CASCADE;
  DROP TABLE "customers" CASCADE;
  DROP TABLE "handovers_damages" CASCADE;
  DROP TABLE "handovers" CASCADE;
  DROP TABLE "handovers_rels" CASCADE;
  DROP TABLE "penalties" CASCADE;
  DROP TABLE "corporate_requests" CASCADE;
  DROP TABLE "corporate_requests_rels" CASCADE;
  DROP TABLE "vehicle_models_features" CASCADE;
  DROP TABLE "vehicle_models_rate_tiers" CASCADE;
  DROP TABLE "vehicle_models" CASCADE;
  DROP TABLE "vehicle_models_locales" CASCADE;
  DROP TABLE "vehicle_models_rels" CASCADE;
  DROP TABLE "vehicles" CASCADE;
  DROP TABLE "vehicle_blocks" CASCADE;
  DROP TABLE "vehicle_categories" CASCADE;
  DROP TABLE "vehicle_categories_locales" CASCADE;
  DROP TABLE "locations_opening_hours" CASCADE;
  DROP TABLE "locations" CASCADE;
  DROP TABLE "locations_locales" CASCADE;
  DROP TABLE "seasons" CASCADE;
  DROP TABLE "seasons_rels" CASCADE;
  DROP TABLE "extras" CASCADE;
  DROP TABLE "extras_locales" CASCADE;
  DROP TABLE "transfer_fees" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_locales" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "faqs_locales" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "documents" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "users_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "settings_display_currencies" CASCADE;
  DROP TABLE "settings_bank_accounts" CASCADE;
  DROP TABLE "settings_notification_emails" CASCADE;
  DROP TABLE "settings" CASCADE;
  DROP TABLE "settings_locales" CASCADE;
  DROP TABLE "exchange_rates_rates" CASCADE;
  DROP TABLE "exchange_rates" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_reservations_payments_method";
  DROP TYPE "public"."enum_reservations_status";
  DROP TYPE "public"."enum_reservations_payment_status";
  DROP TYPE "public"."enum_reservations_source";
  DROP TYPE "public"."enum_reservations_preferred_payment_method";
  DROP TYPE "public"."enum_reservations_pricing_currency";
  DROP TYPE "public"."enum_reservations_display_currency";
  DROP TYPE "public"."enum_customers_id_document_type";
  DROP TYPE "public"."enum_handovers_damages_area";
  DROP TYPE "public"."enum_handovers_type";
  DROP TYPE "public"."enum_handovers_fuel_level";
  DROP TYPE "public"."enum_penalties_type";
  DROP TYPE "public"."enum_penalties_status";
  DROP TYPE "public"."enum_corporate_requests_status";
  DROP TYPE "public"."enum_vehicle_models_features";
  DROP TYPE "public"."enum_vehicle_models_transmission";
  DROP TYPE "public"."enum_vehicle_models_fuel_type";
  DROP TYPE "public"."enum_vehicles_status";
  DROP TYPE "public"."enum_vehicle_blocks_reason";
  DROP TYPE "public"."enum_locations_opening_hours_day";
  DROP TYPE "public"."enum_extras_pricing_type";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum__pages_v_published_locale";
  DROP TYPE "public"."enum_faqs_category";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_settings_display_currencies";
  DROP TYPE "public"."enum_settings_bank_accounts_currency";
  DROP TYPE "public"."enum_settings_base_currency";
  DROP TYPE "public"."enum_exchange_rates_rates_currency";
  DROP TYPE "public"."enum_exchange_rates_base_currency";`)
}
