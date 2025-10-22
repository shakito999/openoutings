


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."day_slot" AS ENUM (
    'morning',
    'noon',
    'afternoon',
    'evening'
);


ALTER TYPE "public"."day_slot" OWNER TO "postgres";


CREATE TYPE "public"."difficulty_level" AS ENUM (
    'beginner',
    'easy',
    'moderate',
    'intermediate',
    'advanced',
    'expert'
);


ALTER TYPE "public"."difficulty_level" OWNER TO "postgres";


CREATE TYPE "public"."gender_restriction" AS ENUM (
    'none',
    'male',
    'female',
    'other'
);


ALTER TYPE "public"."gender_restriction" OWNER TO "postgres";


CREATE TYPE "public"."recurrence_pattern" AS ENUM (
    'none',
    'daily',
    'weekly',
    'biweekly',
    'monthly'
);


ALTER TYPE "public"."recurrence_pattern" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_event"("p_event_id" bigint, "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_host_id uuid;
BEGIN
  -- Check if user is the host
  SELECT host_id INTO v_host_id
  FROM public.events
  WHERE id = p_event_id;
  
  IF v_host_id != p_user_id THEN
    RAISE EXCEPTION 'Only the event host can cancel the event';
  END IF;
  
  -- Cancel the event
  UPDATE public.events
  SET 
    is_cancelled = true,
    cancelled_at = NOW(),
    cancelled_by = p_user_id
  WHERE id = p_event_id;
  
  RETURN true;
END;
$$;


ALTER FUNCTION "public"."cancel_event"("p_event_id" bigint, "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_review_profanity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  profanity_words text[] := ARRAY['spam', 'fake', 'scam'];
  word text;
BEGIN
  IF NEW.review_text IS NOT NULL THEN
    FOREACH word IN ARRAY profanity_words
    LOOP
      IF LOWER(NEW.review_text) LIKE '%' || word || '%' THEN
        NEW.is_flagged := true;
        NEW.flag_reasons := ARRAY['Auto-flagged: Potential inappropriate content'];
        EXIT;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_review_profanity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_events"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  old_event RECORD;
  photo_path TEXT;
BEGIN
  -- Find events that ended more than 30 days ago
  FOR old_event IN 
    SELECT id 
    FROM public.events 
    WHERE ends_at < NOW() - INTERVAL '30 days'
       OR (starts_at < NOW() - INTERVAL '30 days' AND ends_at IS NULL)
  LOOP
    -- Delete photos from storage for this event
    FOR photo_path IN 
      SELECT storage_path 
      FROM public.event_photos 
      WHERE event_id = old_event.id
    LOOP
      -- Note: Storage deletion needs to be done via Supabase client
      -- The photos will be orphaned but can be cleaned separately
      RAISE NOTICE 'Event % photo marked for deletion: %', old_event.id, photo_path;
    END LOOP;
    
    -- Delete the event (cascade will handle related records)
    DELETE FROM public.events WHERE id = old_event.id;
    
    RAISE NOTICE 'Deleted old event: %', old_event.id;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_events"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_events"() IS 'Call this function daily via Edge Function or pg_cron to delete events older than 30 days. Photos should be deleted from storage bucket separately.';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_qr_scan_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.qr_code_id IS NOT NULL THEN
    UPDATE public.event_qr_codes
    SET scan_count = scan_count + 1
    WHERE id = NEW.qr_code_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_qr_scan_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_attendees_on_event_cancel"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only trigger when is_cancelled changes to true
  IF NEW.is_cancelled = true AND (OLD.is_cancelled IS NULL OR OLD.is_cancelled = false) THEN
    -- Notify all attendees except the host
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_event_id
    )
    SELECT 
      ea.user_id,
      'event_cancelled',
      'Събитие отменено',
      'Събитието "' || NEW.title || '" беше отменено',
      NEW.id
    FROM event_attendees ea
    WHERE ea.event_id = NEW.id
      AND ea.user_id != NEW.host_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_attendees_on_event_cancel"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_host_on_event_join"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  event_record RECORD;
  joiner_name text;
BEGIN
  -- Get event details
  SELECT e.*, p.full_name as host_name
  INTO event_record
  FROM events e
  JOIN profiles p ON e.host_id = p.id
  WHERE e.id = NEW.event_id;
  
  -- Get joiner's name
  SELECT full_name INTO joiner_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Don't notify if host is joining their own event
  IF event_record.host_id != NEW.user_id THEN
    -- Create notification for event host
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_event_id,
      related_user_id
    ) VALUES (
      event_record.host_id,
      'event_joined',
      'Нов участник в събитието',
      COALESCE(joiner_name, 'Някой') || ' се присъедини към "' || event_record.title || '"',
      NEW.event_id,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_host_on_event_join"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_user_on_follow"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  follower_name text;
BEGIN
  -- Get follower's name
  SELECT full_name INTO follower_name
  FROM profiles
  WHERE id = NEW.follower_id;
  
  -- Create notification for the followed user
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_user_id
  ) VALUES (
    NEW.following_id,
    'new_follower',
    'Нов последовател',
    COALESCE(follower_name, 'Някой') || ' започна да те следва',
    NEW.follower_id
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_user_on_follow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_review_stats"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.profile_review_stats;
END;
$$;


ALTER FUNCTION "public"."refresh_review_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_review_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_review_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."availability_polls" (
    "id" bigint NOT NULL,
    "creator_id" "uuid",
    "title" "text" NOT NULL,
    "starts_on" "date" NOT NULL,
    "ends_on" "date" NOT NULL,
    "slug" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."availability_polls" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."availability_polls_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."availability_polls_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."availability_polls_id_seq" OWNED BY "public"."availability_polls"."id";



CREATE TABLE IF NOT EXISTS "public"."buddy_matches" (
    "id" bigint NOT NULL,
    "event_id" bigint NOT NULL,
    "user_id_1" "uuid" NOT NULL,
    "user_id_2" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "compatibility_score" numeric(5,2),
    "user_1_accepted" boolean DEFAULT false,
    "user_2_accepted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "buddy_matches_compatibility_score_check" CHECK ((("compatibility_score" >= (0)::numeric) AND ("compatibility_score" <= (100)::numeric))),
    CONSTRAINT "buddy_matches_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "different_users" CHECK (("user_id_1" <> "user_id_2")),
    CONSTRAINT "ordered_user_ids" CHECK (("user_id_1" < "user_id_2"))
);


ALTER TABLE "public"."buddy_matches" OWNER TO "postgres";


COMMENT ON TABLE "public"."buddy_matches" IS 'Stores buddy match relationships between users for specific events';



COMMENT ON COLUMN "public"."buddy_matches"."compatibility_score" IS 'Calculated compatibility score from 0-100';



CREATE SEQUENCE IF NOT EXISTS "public"."buddy_matches_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."buddy_matches_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."buddy_matches_id_seq" OWNED BY "public"."buddy_matches"."id";



CREATE TABLE IF NOT EXISTS "public"."buddy_preferences" (
    "user_id" "uuid" NOT NULL,
    "enabled" boolean DEFAULT true,
    "preferred_age_min" integer,
    "preferred_age_max" integer,
    "preferred_gender" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "buddy_preferences_preferred_age_max_check" CHECK ((("preferred_age_max" >= 18) AND ("preferred_age_max" <= 100))),
    CONSTRAINT "buddy_preferences_preferred_age_min_check" CHECK ((("preferred_age_min" >= 18) AND ("preferred_age_min" <= 100))),
    CONSTRAINT "buddy_preferences_preferred_gender_check" CHECK (("preferred_gender" = ANY (ARRAY['any'::"text", 'male'::"text", 'female'::"text", 'non-binary'::"text", 'other'::"text"]))),
    CONSTRAINT "valid_age_range" CHECK ((("preferred_age_max" IS NULL) OR ("preferred_age_min" IS NULL) OR ("preferred_age_max" >= "preferred_age_min")))
);


ALTER TABLE "public"."buddy_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."buddy_preferences" IS 'Stores user preferences for buddy matching algorithm';



CREATE TABLE IF NOT EXISTS "public"."event_attendees" (
    "event_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_attendees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_checkins" (
    "id" bigint NOT NULL,
    "event_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "checked_in_at" timestamp with time zone DEFAULT "now"(),
    "check_in_method" character varying(20) DEFAULT 'qr_code'::character varying,
    "qr_code_id" "uuid"
);


ALTER TABLE "public"."event_checkins" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."event_checkins_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."event_checkins_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."event_checkins_id_seq" OWNED BY "public"."event_checkins"."id";



CREATE TABLE IF NOT EXISTS "public"."event_interests" (
    "event_id" bigint NOT NULL,
    "interest_id" bigint NOT NULL
);


ALTER TABLE "public"."event_interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_photos" (
    "id" bigint NOT NULL,
    "event_id" bigint,
    "storage_path" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_photos" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."event_photos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."event_photos_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."event_photos_id_seq" OWNED BY "public"."event_photos"."id";



CREATE TABLE IF NOT EXISTS "public"."event_qr_codes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_id" bigint NOT NULL,
    "code" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "scan_count" integer DEFAULT 0
);


ALTER TABLE "public"."event_qr_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" bigint NOT NULL,
    "host_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone,
    "capacity" integer,
    "gender" "public"."gender_restriction" DEFAULT 'none'::"public"."gender_restriction",
    "address" "text",
    "lat" double precision,
    "lng" double precision,
    "is_paid" boolean DEFAULT false,
    "price_cents" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_recurring" boolean DEFAULT false,
    "recurrence_pattern" "public"."recurrence_pattern" DEFAULT 'none'::"public"."recurrence_pattern",
    "recurrence_end_date" "date",
    "parent_event_id" bigint,
    "is_cancelled" boolean DEFAULT false,
    "cancelled_at" timestamp with time zone,
    "cancelled_by" "uuid",
    "tips" "text",
    "difficulty" "public"."difficulty_level" DEFAULT 'beginner'::"public"."difficulty_level",
    CONSTRAINT "events_capacity_check" CHECK (("capacity" > 0))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


COMMENT ON COLUMN "public"."events"."tips" IS 'Tips, suggestions, requirements, or good-to-have items for the event (e.g., "Bring 100 leva spending money", "Wear warm clothes and suitable hiking shoes")';



COMMENT ON COLUMN "public"."events"."difficulty" IS 'Difficulty/fitness level required for the event to help participants gauge if it suits them';



CREATE SEQUENCE IF NOT EXISTS "public"."events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."events_id_seq" OWNED BY "public"."events"."id";



CREATE TABLE IF NOT EXISTS "public"."feature_flags" (
    "id" integer NOT NULL,
    "feature_name" character varying(50) NOT NULL,
    "is_enabled" boolean DEFAULT false,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feature_flags" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."feature_flags_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."feature_flags_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."feature_flags_id_seq" OWNED BY "public"."feature_flags"."id";



CREATE TABLE IF NOT EXISTS "public"."interests" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."interests" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."interests_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."interests_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."interests_id_seq" OWNED BY "public"."interests"."id";



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "related_event_id" bigint,
    "related_user_id" "uuid",
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['event_joined'::"text", 'event_reminder_24h'::"text", 'event_reminder_1h'::"text", 'event_cancelled'::"text", 'event_updated'::"text", 'new_follower'::"text", 'new_event_from_following'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


ALTER TABLE "public"."notifications" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."poll_slots" (
    "id" bigint NOT NULL,
    "poll_id" bigint,
    "on_date" "date" NOT NULL,
    "slot" "public"."day_slot" NOT NULL
);


ALTER TABLE "public"."poll_slots" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."poll_slots_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."poll_slots_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."poll_slots_id_seq" OWNED BY "public"."poll_slots"."id";



CREATE TABLE IF NOT EXISTS "public"."poll_votes" (
    "slot_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "preference" smallint DEFAULT 1
);


ALTER TABLE "public"."poll_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" bigint NOT NULL,
    "event_id" bigint NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "reviewee_id" "uuid" NOT NULL,
    "overall_rating" integer NOT NULL,
    "friendliness_rating" integer,
    "communication_rating" integer,
    "reliability_rating" integer,
    "review_text" "text",
    "is_verified_attendee" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "can_edit_until" timestamp with time zone DEFAULT ("now"() + '48:00:00'::interval),
    "is_flagged" boolean DEFAULT false,
    "flag_count" integer DEFAULT 0,
    "flag_reasons" "text"[],
    "is_hidden" boolean DEFAULT false,
    "moderator_notes" "text",
    "response_text" "text",
    "response_at" timestamp with time zone,
    "reviewer_ip_hash" "text",
    CONSTRAINT "reviews_check" CHECK (("reviewer_id" <> "reviewee_id")),
    CONSTRAINT "reviews_communication_rating_check" CHECK ((("communication_rating" >= 1) AND ("communication_rating" <= 5))),
    CONSTRAINT "reviews_friendliness_rating_check" CHECK ((("friendliness_rating" >= 1) AND ("friendliness_rating" <= 5))),
    CONSTRAINT "reviews_overall_rating_check" CHECK ((("overall_rating" >= 1) AND ("overall_rating" <= 5))),
    CONSTRAINT "reviews_reliability_rating_check" CHECK ((("reliability_rating" >= 1) AND ("reliability_rating" <= 5))),
    CONSTRAINT "reviews_review_text_check" CHECK ((("length"("review_text") >= 10) AND ("length"("review_text") <= 1000)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."profile_review_stats" AS
 SELECT "reviewee_id" AS "profile_id",
    "count"(*) AS "total_reviews",
    "avg"("overall_rating") AS "average_rating",
    "count"(*) FILTER (WHERE ("is_verified_attendee" = true)) AS "verified_reviews",
    "count"(*) FILTER (WHERE ("overall_rating" = 5)) AS "five_star_count",
    "count"(*) FILTER (WHERE ("overall_rating" = 4)) AS "four_star_count",
    "count"(*) FILTER (WHERE ("overall_rating" = 3)) AS "three_star_count",
    "count"(*) FILTER (WHERE ("overall_rating" = 2)) AS "two_star_count",
    "count"(*) FILTER (WHERE ("overall_rating" = 1)) AS "one_star_count",
    "max"("created_at") AS "last_reviewed_at"
   FROM "public"."reviews"
  WHERE ("is_hidden" = false)
  GROUP BY "reviewee_id"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."profile_review_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "full_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "bio" "text",
    "cover_url" "text",
    "onboarding_completed" boolean DEFAULT false,
    "birth_date" "date",
    "gender" "text",
    "show_age" boolean DEFAULT false,
    "show_gender" boolean DEFAULT false,
    CONSTRAINT "birth_date_reasonable" CHECK ((("birth_date" IS NULL) OR (("birth_date" >= '1900-01-01'::"date") AND ("birth_date" <= CURRENT_DATE)))),
    CONSTRAINT "profiles_gender_check" CHECK (("gender" = ANY (ARRAY['male'::"text", 'female'::"text", 'non-binary'::"text", 'other'::"text", 'prefer-not-to-say'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."birth_date" IS 'User birth date for age-based matching and personalization. Optional field.';



COMMENT ON COLUMN "public"."profiles"."gender" IS 'User gender identity. Optional field.';



COMMENT ON COLUMN "public"."profiles"."show_age" IS 'Whether to display age publicly on profile.';



COMMENT ON COLUMN "public"."profiles"."show_gender" IS 'Whether to display gender publicly on profile.';



CREATE TABLE IF NOT EXISTS "public"."review_flags" (
    "id" bigint NOT NULL,
    "review_id" bigint NOT NULL,
    "flagger_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "additional_info" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved" boolean DEFAULT false,
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "resolution_notes" "text"
);


ALTER TABLE "public"."review_flags" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."review_flags_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."review_flags_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."review_flags_id_seq" OWNED BY "public"."review_flags"."id";



CREATE TABLE IF NOT EXISTS "public"."review_votes" (
    "id" bigint NOT NULL,
    "review_id" bigint NOT NULL,
    "voter_id" "uuid" NOT NULL,
    "is_helpful" boolean NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."review_votes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."review_votes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."review_votes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."review_votes_id_seq" OWNED BY "public"."review_votes"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."reviews_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."reviews_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."reviews_id_seq" OWNED BY "public"."reviews"."id";



CREATE TABLE IF NOT EXISTS "public"."user_follows" (
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_follows_check" CHECK (("follower_id" <> "following_id"))
);


ALTER TABLE "public"."user_follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_interests" (
    "user_id" "uuid" NOT NULL,
    "interest_id" bigint NOT NULL
);


ALTER TABLE "public"."user_interests" OWNER TO "postgres";


ALTER TABLE ONLY "public"."availability_polls" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."availability_polls_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."buddy_matches" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."buddy_matches_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."event_checkins" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."event_checkins_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."event_photos" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."event_photos_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."events_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."feature_flags" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."feature_flags_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."interests" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."interests_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."poll_slots" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."poll_slots_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."review_flags" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."review_flags_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."review_votes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."review_votes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."reviews" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."reviews_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."availability_polls"
    ADD CONSTRAINT "availability_polls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."availability_polls"
    ADD CONSTRAINT "availability_polls_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."buddy_matches"
    ADD CONSTRAINT "buddy_matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."buddy_preferences"
    ADD CONSTRAINT "buddy_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."event_attendees"
    ADD CONSTRAINT "event_attendees_pkey" PRIMARY KEY ("event_id", "user_id");



ALTER TABLE ONLY "public"."event_checkins"
    ADD CONSTRAINT "event_checkins_event_id_user_id_key" UNIQUE ("event_id", "user_id");



ALTER TABLE ONLY "public"."event_checkins"
    ADD CONSTRAINT "event_checkins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_interests"
    ADD CONSTRAINT "event_interests_pkey" PRIMARY KEY ("event_id", "interest_id");



ALTER TABLE ONLY "public"."event_photos"
    ADD CONSTRAINT "event_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_qr_codes"
    ADD CONSTRAINT "event_qr_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."event_qr_codes"
    ADD CONSTRAINT "event_qr_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_feature_name_key" UNIQUE ("feature_name");



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interests"
    ADD CONSTRAINT "interests_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."interests"
    ADD CONSTRAINT "interests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."poll_slots"
    ADD CONSTRAINT "poll_slots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."poll_slots"
    ADD CONSTRAINT "poll_slots_poll_id_on_date_slot_key" UNIQUE ("poll_id", "on_date", "slot");



ALTER TABLE ONLY "public"."poll_votes"
    ADD CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("slot_id", "user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."review_flags"
    ADD CONSTRAINT "review_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_flags"
    ADD CONSTRAINT "review_flags_review_id_flagger_id_key" UNIQUE ("review_id", "flagger_id");



ALTER TABLE ONLY "public"."review_votes"
    ADD CONSTRAINT "review_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_votes"
    ADD CONSTRAINT "review_votes_review_id_voter_id_key" UNIQUE ("review_id", "voter_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_event_id_reviewer_id_reviewee_id_key" UNIQUE ("event_id", "reviewer_id", "reviewee_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."buddy_matches"
    ADD CONSTRAINT "unique_buddy_match" UNIQUE ("event_id", "user_id_1", "user_id_2");



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_pkey" PRIMARY KEY ("follower_id", "following_id");



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_pkey" PRIMARY KEY ("user_id", "interest_id");



CREATE INDEX "idx_buddy_matches_event" ON "public"."buddy_matches" USING "btree" ("event_id");



CREATE INDEX "idx_buddy_matches_status" ON "public"."buddy_matches" USING "btree" ("status");



CREATE INDEX "idx_buddy_matches_user1" ON "public"."buddy_matches" USING "btree" ("user_id_1");



CREATE INDEX "idx_buddy_matches_user2" ON "public"."buddy_matches" USING "btree" ("user_id_2");



CREATE INDEX "idx_buddy_preferences_enabled" ON "public"."buddy_preferences" USING "btree" ("enabled") WHERE ("enabled" = true);



CREATE INDEX "idx_checkins_event" ON "public"."event_checkins" USING "btree" ("event_id");



CREATE INDEX "idx_checkins_user" ON "public"."event_checkins" USING "btree" ("user_id");



CREATE INDEX "idx_events_cancelled" ON "public"."events" USING "btree" ("is_cancelled") WHERE ("is_cancelled" = false);



CREATE INDEX "idx_events_parent" ON "public"."events" USING "btree" ("parent_event_id") WHERE ("parent_event_id" IS NOT NULL);



CREATE INDEX "idx_events_recurring" ON "public"."events" USING "btree" ("is_recurring") WHERE ("is_recurring" = true);



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_user_id_is_read" ON "public"."notifications" USING "btree" ("user_id", "is_read");



CREATE UNIQUE INDEX "idx_one_active_qr_per_event" ON "public"."event_qr_codes" USING "btree" ("event_id") WHERE ("is_active" = true);



CREATE UNIQUE INDEX "idx_profile_review_stats" ON "public"."profile_review_stats" USING "btree" ("profile_id");



CREATE INDEX "idx_profiles_birth_date" ON "public"."profiles" USING "btree" ("birth_date") WHERE ("birth_date" IS NOT NULL);



CREATE INDEX "idx_profiles_onboarding" ON "public"."profiles" USING "btree" ("onboarding_completed") WHERE ("onboarding_completed" = false);



CREATE INDEX "idx_qr_codes_event" ON "public"."event_qr_codes" USING "btree" ("event_id");



CREATE INDEX "idx_review_flags_unresolved" ON "public"."review_flags" USING "btree" ("resolved") WHERE ("resolved" = false);



CREATE INDEX "idx_reviews_created" ON "public"."reviews" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_reviews_event" ON "public"."reviews" USING "btree" ("event_id");



CREATE INDEX "idx_reviews_flagged" ON "public"."reviews" USING "btree" ("is_flagged") WHERE ("is_flagged" = true);



CREATE INDEX "idx_reviews_reviewee" ON "public"."reviews" USING "btree" ("reviewee_id");



CREATE INDEX "idx_reviews_reviewer" ON "public"."reviews" USING "btree" ("reviewer_id");



CREATE INDEX "idx_user_follows_follower" ON "public"."user_follows" USING "btree" ("follower_id");



CREATE INDEX "idx_user_follows_following" ON "public"."user_follows" USING "btree" ("following_id");



CREATE OR REPLACE TRIGGER "auto_flag_reviews" BEFORE INSERT ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."check_review_profanity"();



CREATE OR REPLACE TRIGGER "count_qr_scans" AFTER INSERT ON "public"."event_checkins" FOR EACH ROW EXECUTE FUNCTION "public"."increment_qr_scan_count"();



CREATE OR REPLACE TRIGGER "trigger_notify_host_on_join" AFTER INSERT ON "public"."event_attendees" FOR EACH ROW EXECUTE FUNCTION "public"."notify_host_on_event_join"();



CREATE OR REPLACE TRIGGER "trigger_notify_on_event_cancel" AFTER UPDATE ON "public"."events" FOR EACH ROW WHEN (("new"."is_cancelled" = true)) EXECUTE FUNCTION "public"."notify_attendees_on_event_cancel"();



CREATE OR REPLACE TRIGGER "trigger_notify_on_follow" AFTER INSERT ON "public"."user_follows" FOR EACH ROW EXECUTE FUNCTION "public"."notify_user_on_follow"();



CREATE OR REPLACE TRIGGER "update_reviews_updated_at" BEFORE UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_review_updated_at"();



ALTER TABLE ONLY "public"."availability_polls"
    ADD CONSTRAINT "availability_polls_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."buddy_matches"
    ADD CONSTRAINT "buddy_matches_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."buddy_matches"
    ADD CONSTRAINT "buddy_matches_user_id_1_fkey" FOREIGN KEY ("user_id_1") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."buddy_matches"
    ADD CONSTRAINT "buddy_matches_user_id_2_fkey" FOREIGN KEY ("user_id_2") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."buddy_preferences"
    ADD CONSTRAINT "buddy_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_attendees"
    ADD CONSTRAINT "event_attendees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_attendees"
    ADD CONSTRAINT "event_attendees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_checkins"
    ADD CONSTRAINT "event_checkins_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_checkins"
    ADD CONSTRAINT "event_checkins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_interests"
    ADD CONSTRAINT "event_interests_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_interests"
    ADD CONSTRAINT "event_interests_interest_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "public"."interests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_photos"
    ADD CONSTRAINT "event_photos_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_qr_codes"
    ADD CONSTRAINT "event_qr_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_qr_codes"
    ADD CONSTRAINT "event_qr_codes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_parent_event_id_fkey" FOREIGN KEY ("parent_event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_event_id_fkey" FOREIGN KEY ("related_event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_user_id_fkey" FOREIGN KEY ("related_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."poll_slots"
    ADD CONSTRAINT "poll_slots_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "public"."availability_polls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."poll_votes"
    ADD CONSTRAINT "poll_votes_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "public"."poll_slots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."poll_votes"
    ADD CONSTRAINT "poll_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_flags"
    ADD CONSTRAINT "review_flags_flagger_id_fkey" FOREIGN KEY ("flagger_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_flags"
    ADD CONSTRAINT "review_flags_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."review_flags"
    ADD CONSTRAINT "review_flags_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_votes"
    ADD CONSTRAINT "review_votes_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_votes"
    ADD CONSTRAINT "review_votes_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_interest_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "public"."interests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Service role can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create buddy matches" ON "public"."buddy_matches" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id_1") OR ("auth"."uid"() = "user_id_2")));



CREATE POLICY "Users can insert own preferences" ON "public"."buddy_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own preferences" ON "public"."buddy_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own buddy matches" ON "public"."buddy_matches" FOR UPDATE USING ((("auth"."uid"() = "user_id_1") OR ("auth"."uid"() = "user_id_2")));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own preferences" ON "public"."buddy_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own buddy matches" ON "public"."buddy_matches" FOR SELECT USING ((("auth"."uid"() = "user_id_1") OR ("auth"."uid"() = "user_id_2")));



ALTER TABLE "public"."buddy_matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."buddy_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_interests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "hosts delete event_interests" ON "public"."event_interests" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_interests"."event_id") AND ("events"."host_id" = "auth"."uid"())))));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public read event_interests" ON "public"."event_interests" FOR SELECT USING (true);



CREATE POLICY "users insert event_interests" ON "public"."event_interests" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_interests"."event_id") AND ("events"."host_id" = "auth"."uid"())))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

















































































































































































GRANT ALL ON FUNCTION "public"."cancel_event"("p_event_id" bigint, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_event"("p_event_id" bigint, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_event"("p_event_id" bigint, "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_review_profanity"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_review_profanity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_review_profanity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_events"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_events"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_events"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_qr_scan_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_qr_scan_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_qr_scan_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_attendees_on_event_cancel"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_attendees_on_event_cancel"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_attendees_on_event_cancel"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_host_on_event_join"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_host_on_event_join"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_host_on_event_join"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_user_on_follow"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_user_on_follow"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_user_on_follow"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_review_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_review_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_review_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_review_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_review_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_review_updated_at"() TO "service_role";
























GRANT ALL ON TABLE "public"."availability_polls" TO "anon";
GRANT ALL ON TABLE "public"."availability_polls" TO "authenticated";
GRANT ALL ON TABLE "public"."availability_polls" TO "service_role";



GRANT ALL ON SEQUENCE "public"."availability_polls_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."availability_polls_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."availability_polls_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."buddy_matches" TO "anon";
GRANT ALL ON TABLE "public"."buddy_matches" TO "authenticated";
GRANT ALL ON TABLE "public"."buddy_matches" TO "service_role";



GRANT ALL ON SEQUENCE "public"."buddy_matches_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."buddy_matches_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."buddy_matches_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."buddy_preferences" TO "anon";
GRANT ALL ON TABLE "public"."buddy_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."buddy_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."event_attendees" TO "anon";
GRANT ALL ON TABLE "public"."event_attendees" TO "authenticated";
GRANT ALL ON TABLE "public"."event_attendees" TO "service_role";



GRANT ALL ON TABLE "public"."event_checkins" TO "anon";
GRANT ALL ON TABLE "public"."event_checkins" TO "authenticated";
GRANT ALL ON TABLE "public"."event_checkins" TO "service_role";



GRANT ALL ON SEQUENCE "public"."event_checkins_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."event_checkins_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."event_checkins_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."event_interests" TO "anon";
GRANT ALL ON TABLE "public"."event_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."event_interests" TO "service_role";



GRANT ALL ON TABLE "public"."event_photos" TO "anon";
GRANT ALL ON TABLE "public"."event_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."event_photos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."event_photos_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."event_photos_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."event_photos_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."event_qr_codes" TO "anon";
GRANT ALL ON TABLE "public"."event_qr_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."event_qr_codes" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."feature_flags" TO "anon";
GRANT ALL ON TABLE "public"."feature_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_flags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."feature_flags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."feature_flags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."feature_flags_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."interests" TO "anon";
GRANT ALL ON TABLE "public"."interests" TO "authenticated";
GRANT ALL ON TABLE "public"."interests" TO "service_role";



GRANT ALL ON SEQUENCE "public"."interests_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."interests_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."interests_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."poll_slots" TO "anon";
GRANT ALL ON TABLE "public"."poll_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."poll_slots" TO "service_role";



GRANT ALL ON SEQUENCE "public"."poll_slots_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."poll_slots_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."poll_slots_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."poll_votes" TO "anon";
GRANT ALL ON TABLE "public"."poll_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."poll_votes" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."profile_review_stats" TO "anon";
GRANT ALL ON TABLE "public"."profile_review_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_review_stats" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."review_flags" TO "anon";
GRANT ALL ON TABLE "public"."review_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."review_flags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."review_flags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."review_flags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."review_flags_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."review_votes" TO "anon";
GRANT ALL ON TABLE "public"."review_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."review_votes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."review_votes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."review_votes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."review_votes_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_follows" TO "anon";
GRANT ALL ON TABLE "public"."user_follows" TO "authenticated";
GRANT ALL ON TABLE "public"."user_follows" TO "service_role";



GRANT ALL ON TABLE "public"."user_interests" TO "anon";
GRANT ALL ON TABLE "public"."user_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."user_interests" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;
