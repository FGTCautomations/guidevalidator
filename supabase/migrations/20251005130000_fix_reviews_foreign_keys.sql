-- Fix foreign key constraints on reviews table to allow agencies as reviewees
-- The original schema incorrectly assumed all reviewers and reviewees are in profiles table
-- But agencies/DMCs/transport are in the agencies table

-- Drop the existing foreign key constraints
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey;

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_reviewee_id_fkey;

-- We can't add traditional foreign keys that reference multiple tables
-- Instead, we'll rely on:
-- 1. Application-level validation (already in place)
-- 2. The reviewer_type and reviewee_type fields to indicate which table to check
-- 3. RLS policies to enforce data integrity

-- Note: We cannot add foreign key constraints for reviewee_id because it could be in either
-- profiles (for guides) or agencies (for agencies/dmcs/transport)
-- This is validated at the application level and through RLS policies

-- Add comments for clarity
COMMENT ON COLUMN public.reviews.reviewer_id IS 'Always references profiles.id (authenticated user)';
COMMENT ON COLUMN public.reviews.reviewee_id IS 'References either profiles.id (guide) or agencies.id (agency/dmc/transport) based on reviewee_type';
COMMENT ON COLUMN public.reviews.reviewer_type IS 'Type of reviewer: guide, agency, dmc, or transport';
COMMENT ON COLUMN public.reviews.reviewee_type IS 'Type of reviewee: guide, agency, dmc, or transport - determines which table reviewee_id references';
