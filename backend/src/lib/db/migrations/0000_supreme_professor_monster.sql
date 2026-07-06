CREATE TABLE "group_meta" (
	"address" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"invite_code" text,
	"created_at" text NOT NULL,
	"creator" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "join_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_intents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_address" text NOT NULL,
	"group_address" text NOT NULL,
	"purpose" text NOT NULL,
	"amount" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"failure_reason" text,
	"retryable" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"resulting_tx_id" text
);
--> statement-breakpoint
CREATE TABLE "proposal_texts" (
	"proposal_id" text PRIMARY KEY NOT NULL,
	"purpose" text,
	"category" text,
	"reason" text,
	"reason_category" text
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"group_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings_changes" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"field" text NOT NULL,
	"field_label" text NOT NULL,
	"current_value" text,
	"proposed_value" text NOT NULL,
	"requester_name" text NOT NULL,
	"requester_initials" text NOT NULL,
	"requester_user_id" text NOT NULL,
	"signature_count" integer DEFAULT 1 NOT NULL,
	"signature_threshold" integer DEFAULT 2 NOT NULL,
	"signatures" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"current_user_already_signed" boolean DEFAULT true NOT NULL,
	"current_user_signed_at" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signing_states" (
	"id" text PRIMARY KEY NOT NULL,
	"signed_by" text[] DEFAULT '{}' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"name" text,
	"phone" text,
	"custodial" boolean DEFAULT false NOT NULL,
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "users_address_unique" UNIQUE("address")
);
