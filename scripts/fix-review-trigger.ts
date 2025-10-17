import pg from "pg";

async function fixTrigger() {
  const client = new pg.Client({
    host: "db.vhqzmunorymtoisijiqb.supabase.co",
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: "Vertrouwen17#",
  });

  try {
    await client.connect();
    console.log("✓ Connected to database\n");

    // Drop and recreate the trigger function
    console.log("Dropping old trigger and function...");
    await client.query(`
      DROP TRIGGER IF EXISTS reviews_moderation_audit ON public.reviews;
      DROP TRIGGER IF EXISTS log_review_moderation ON public.reviews;
      DROP FUNCTION IF EXISTS public.log_review_moderation() CASCADE;
    `);

    console.log("✓ Old trigger dropped\n");

    // Recreate the function with correct column reference
    console.log("Creating new trigger function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.log_review_moderation()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Log to audit_logs when review is moderated
        IF (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected')) THEN
          INSERT INTO public.audit_logs (
            actor_id,
            action,
            entity_type,
            entity_id,
            metadata,
            occurred_at
          ) VALUES (
            NEW.moderated_by,
            CASE NEW.status
              WHEN 'approved' THEN 'review_approved'
              WHEN 'rejected' THEN 'review_rejected'
              ELSE 'review_moderated'
            END,
            'review',
            NEW.id,
            jsonb_build_object(
              'reviewer_id', NEW.reviewer_id,
              'reviewee_id', NEW.reviewee_id,
              'overall_rating', NEW.overall_rating,
              'old_status', OLD.status,
              'new_status', NEW.status,
              'moderation_notes', NEW.moderation_notes
            ),
            now()
          );
        END IF;

        -- Log when review is reported
        IF (TG_OP = 'UPDATE' AND OLD.status != 'reported' AND NEW.status = 'reported') THEN
          INSERT INTO public.audit_logs (
            actor_id,
            action,
            entity_type,
            entity_id,
            metadata,
            occurred_at
          ) VALUES (
            NEW.reported_by,
            'review_reported',
            'review',
            NEW.id,
            jsonb_build_object(
              'reviewer_id', NEW.reviewer_id,
              'reviewee_id', NEW.reviewee_id,
              'report_reason', NEW.report_reason
            ),
            now()
          );
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    console.log("✓ Trigger function created\n");

    // Create the trigger
    console.log("Creating trigger...");
    await client.query(`
      CREATE TRIGGER reviews_moderation_audit
      AFTER UPDATE ON public.reviews
      FOR EACH ROW
      EXECUTE FUNCTION public.log_review_moderation();
    `);

    console.log("✓ Trigger created\n");

    // Test the trigger by checking if it exists
    const checkTrigger = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers
      WHERE trigger_name = 'reviews_moderation_audit';
    `);

    if (checkTrigger.rows.length > 0) {
      console.log("✓ Trigger verified:", checkTrigger.rows[0]);
    } else {
      throw new Error("Trigger not found after creation!");
    }

    console.log("\n✅ Review moderation trigger is now ready!");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixTrigger();
