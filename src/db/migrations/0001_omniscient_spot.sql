ALTER TABLE "purchases" ADD COLUMN "new_salary" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "available" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "total_money_sent" numeric(10, 2) NOT NULL;