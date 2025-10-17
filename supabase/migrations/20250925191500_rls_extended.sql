-- Extended RLS policies for messaging, jobs, payments, and compliance tables

-- Helper functions
create or replace function public.is_conversation_participant(target uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = target
      and cp.profile_id = auth.uid()
  );
$$;

create or replace function public.is_job_owner(job uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.jobs j
    join public.agency_members am on am.agency_id = j.agency_id
    where j.id = job
      and am.profile_id = auth.uid()
      and am.removed_at is null
  ) or public.is_admin();
$$;

create or replace function public.is_shortlist_owner(shortlist uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.shortlists s
    join public.agency_members am on am.agency_id = s.agency_id
    where s.id = shortlist
      and am.profile_id = auth.uid()
      and am.removed_at is null
  ) or public.is_admin();
$$;

create or replace function public.is_subscription_owner(subscription uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.subscriptions s
    join public.agency_members am on am.agency_id = s.organization_id
    where s.id = subscription
      and am.profile_id = auth.uid()
      and am.removed_at is null
  ) or public.is_admin();
$$;

create or replace function public.is_saved_search_owner(search_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.saved_searches ss
    where ss.id = search_id
      and ss.profile_id = auth.uid()
  ) or public.is_admin();
$$;

-- Conversations
drop policy if exists "conversations_select_participants" on public.conversations;
create policy "conversations_select_participants" on public.conversations
  for select using (public.is_conversation_participant(id) or public.is_admin());

drop policy if exists "conversations_insert" on public.conversations;
create policy "conversations_insert" on public.conversations
  for insert with check (created_by = auth.uid());

drop policy if exists "conversations_update_admin" on public.conversations;
create policy "conversations_update_admin" on public.conversations
  for update using (public.is_admin()) with check (true);

-- Conversation participants
drop policy if exists "conversation_participants_select" on public.conversation_participants;
create policy "conversation_participants_select" on public.conversation_participants
  for select using (public.is_conversation_participant(conversation_id) or public.is_admin());

drop policy if exists "conversation_participants_manage" on public.conversation_participants;
create policy "conversation_participants_manage" on public.conversation_participants
  for all using (public.is_conversation_participant(conversation_id) or public.is_admin())
  with check (public.is_conversation_participant(conversation_id) or public.is_admin());

-- Messages
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
  for select using (public.is_conversation_participant(conversation_id) or public.is_admin());

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
  );

drop policy if exists "messages_update_sender" on public.messages;
create policy "messages_update_sender" on public.messages
  for update using (sender_id = auth.uid()) with check (sender_id = auth.uid());

drop policy if exists "messages_admin_all" on public.messages;
create policy "messages_admin_all" on public.messages
  for all using (public.is_admin()) with check (true);

-- Message reactions
drop policy if exists "message_reactions_select" on public.message_reactions;
create policy "message_reactions_select" on public.message_reactions
  for select using (public.is_conversation_participant(conversation_id) or public.is_admin());

drop policy if exists "message_reactions_manage" on public.message_reactions;
create policy "message_reactions_manage" on public.message_reactions
  for all using (
    profile_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
  ) with check (
    profile_id = auth.uid()
  );

-- Jobs & applications
drop policy if exists "jobs_select_public" on public.jobs;
create policy "jobs_select_public" on public.jobs
  for select using (true);

drop policy if exists "jobs_manage_owner" on public.jobs;
create policy "jobs_manage_owner" on public.jobs
  for all using (public.is_job_owner(id)) with check (public.is_job_owner(id));

drop policy if exists "job_applications_select" on public.job_applications;
create policy "job_applications_select" on public.job_applications
  for select using (
    guide_id = auth.uid()
    or public.is_job_owner(job_id)
    or public.is_admin()
  );

drop policy if exists "job_applications_insert" on public.job_applications;
create policy "job_applications_insert" on public.job_applications
  for insert with check (guide_id = auth.uid());

drop policy if exists "job_applications_update" on public.job_applications;
create policy "job_applications_update" on public.job_applications
  for update using (
    guide_id = auth.uid()
    or public.is_job_owner(job_id)
  ) with check (true);

-- Shortlists
drop policy if exists "shortlists_select" on public.shortlists;
create policy "shortlists_select" on public.shortlists
  for select using (public.is_shortlist_owner(id));

drop policy if exists "shortlists_manage" on public.shortlists;
create policy "shortlists_manage" on public.shortlists
  for all using (public.is_shortlist_owner(id)) with check (public.is_shortlist_owner(id));

drop policy if exists "shortlist_items_select" on public.shortlist_items;
create policy "shortlist_items_select" on public.shortlist_items
  for select using (public.is_shortlist_owner(shortlist_id));

drop policy if exists "shortlist_items_manage" on public.shortlist_items;
create policy "shortlist_items_manage" on public.shortlist_items
  for all using (public.is_shortlist_owner(shortlist_id)) with check (public.is_shortlist_owner(shortlist_id));

-- Subscriptions & payments
drop policy if exists "subscriptions_select" on public.subscriptions;
create policy "subscriptions_select" on public.subscriptions
  for select using (public.is_subscription_owner(id));

drop policy if exists "subscriptions_manage" on public.subscriptions;
create policy "subscriptions_manage" on public.subscriptions
  for all using (public.is_subscription_owner(id)) with check (public.is_subscription_owner(id));

drop policy if exists "payments_select" on public.payments;
create policy "payments_select" on public.payments
  for select using (
    public.is_subscription_owner(subscription_id)
    or exists (
      select 1
      from public.agency_members am
      where am.agency_id = organization_id
        and am.profile_id = auth.uid()
        and am.removed_at is null
    )
    or public.is_admin()
  );

drop policy if exists "payments_insert_admin" on public.payments;
create policy "payments_insert_admin" on public.payments
  for insert with check (public.is_admin());

-- Contact reveals
drop policy if exists "contact_reveals_select" on public.contact_reveals;
create policy "contact_reveals_select" on public.contact_reveals
  for select using (
    requester_id = auth.uid()
    or target_profile_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "contact_reveals_insert" on public.contact_reveals;
create policy "contact_reveals_insert" on public.contact_reveals
  for insert with check (requester_id = auth.uid());

-- Jobs queue & renewal events (admin only)
drop policy if exists "jobs_queue_admin" on public.jobs_queue;
create policy "jobs_queue_admin" on public.jobs_queue
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "renewal_events_admin" on public.renewal_events;
create policy "renewal_events_admin" on public.renewal_events
  for all using (public.is_admin()) with check (public.is_admin());

-- Saved searches
drop policy if exists "saved_searches_select" on public.saved_searches;
create policy "saved_searches_select" on public.saved_searches
  for select using (public.is_saved_search_owner(id));

drop policy if exists "saved_searches_manage" on public.saved_searches;
create policy "saved_searches_manage" on public.saved_searches
  for all using (public.is_saved_search_owner(id)) with check (public.is_saved_search_owner(id));

drop policy if exists "saved_search_runs_select" on public.saved_search_runs;
create policy "saved_search_runs_select" on public.saved_search_runs
  for select using (
    public.is_saved_search_owner(saved_search_id)
  );

-- Reviews
drop policy if exists "guide_reviews_select" on public.guide_reviews;
create policy "guide_reviews_select" on public.guide_reviews
  for select using (
    guide_id = auth.uid()
    or reviewer_profile_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "guide_reviews_insert" on public.guide_reviews;
create policy "guide_reviews_insert" on public.guide_reviews
  for insert with check (reviewer_profile_id = auth.uid());

drop policy if exists "guide_reviews_update_admin" on public.guide_reviews;
create policy "guide_reviews_update_admin" on public.guide_reviews
  for update using (public.is_admin()) with check (true);

drop policy if exists "agency_reviews_select" on public.agency_reviews;
create policy "agency_reviews_select" on public.agency_reviews
  for select using (
    agency_id = any (
      select agency_id from public.agency_members
      where profile_id = auth.uid()
        and removed_at is null
    )
    or reviewer_profile_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "agency_reviews_insert" on public.agency_reviews;
create policy "agency_reviews_insert" on public.agency_reviews
  for insert with check (reviewer_profile_id = auth.uid());

drop policy if exists "agency_reviews_update_admin" on public.agency_reviews;
create policy "agency_reviews_update_admin" on public.agency_reviews
  for update using (public.is_admin()) with check (true);

drop policy if exists "transport_reviews_select" on public.transport_reviews;
create policy "transport_reviews_select" on public.transport_reviews
  for select using (
    transport_agency_id = any (
      select agency_id from public.agency_members
      where profile_id = auth.uid()
        and removed_at is null
    )
    or reviewer_profile_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "transport_reviews_insert" on public.transport_reviews;
create policy "transport_reviews_insert" on public.transport_reviews
  for insert with check (reviewer_profile_id = auth.uid());

drop policy if exists "transport_reviews_update_admin" on public.transport_reviews;
create policy "transport_reviews_update_admin" on public.transport_reviews
  for update using (public.is_admin()) with check (true);

-- Availability
drop policy if exists "calendar_accounts_manage_owner" on public.calendar_accounts;
create policy "calendar_accounts_manage_owner" on public.calendar_accounts
  for all using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists "availability_slots_select" on public.availability_slots;
create policy "availability_slots_select" on public.availability_slots
  for select using (guide_id = auth.uid() or public.is_admin() or public.is_org_member((select organization_id from public.profiles where id = guide_id)));

drop policy if exists "availability_slots_manage_owner" on public.availability_slots;
create policy "availability_slots_manage_owner" on public.availability_slots
  for all using (guide_id = auth.uid() or public.is_admin())
  with check (guide_id = auth.uid() or public.is_admin());

drop policy if exists "holds_select" on public.holds;
create policy "holds_select" on public.holds
  for select using (
    guide_id = auth.uid()
    or requested_by = auth.uid()
    or public.is_admin()
    or public.is_org_member(coalesce(agency_id, uuid_nil()))
  );

drop policy if exists "holds_insert" on public.holds;
create policy "holds_insert" on public.holds
  for insert with check (
    requested_by = auth.uid()
    or public.is_admin()
  );

drop policy if exists "holds_update" on public.holds;
create policy "holds_update" on public.holds
  for update using (
    guide_id = auth.uid()
    or requested_by = auth.uid()
    or public.is_admin()
  ) with check (true);

-- Ratings summaries (public read)
drop policy if exists "guide_ratings_summary_select" on public.guide_ratings_summary;
create policy "guide_ratings_summary_select" on public.guide_ratings_summary
  for select using (true);

drop policy if exists "agency_ratings_summary_select" on public.agency_ratings_summary;
create policy "agency_ratings_summary_select" on public.agency_ratings_summary
  for select using (true);

drop policy if exists "transport_ratings_summary_select" on public.transport_ratings_summary;
create policy "transport_ratings_summary_select" on public.transport_ratings_summary
  for select using (true);

-- Compliance & trust tables
drop policy if exists "audit_logs_admin" on public.audit_logs;
create policy "audit_logs_admin" on public.audit_logs
  for select using (public.is_admin());

drop policy if exists "strikes_select" on public.strikes;
create policy "strikes_select" on public.strikes
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "strikes_manage_admin" on public.strikes;
create policy "strikes_manage_admin" on public.strikes
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "moderation_queue_admin" on public.moderation_queue;
create policy "moderation_queue_admin" on public.moderation_queue
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "banners_select" on public.banners;
create policy "banners_select" on public.banners
  for select using (true);

drop policy if exists "banners_manage" on public.banners;
create policy "banners_manage" on public.banners
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "feature_flags_admin" on public.feature_flags;
create policy "feature_flags_admin" on public.feature_flags
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "terms_versions_select" on public.terms_versions;
create policy "terms_versions_select" on public.terms_versions
  for select using (true);

drop policy if exists "terms_versions_manage" on public.terms_versions;
create policy "terms_versions_manage" on public.terms_versions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "consents_select" on public.consents;
create policy "consents_select" on public.consents
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "consents_manage_owner" on public.consents;
create policy "consents_manage_owner" on public.consents
  for all using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists "dsar_requests_select" on public.dsar_requests;
create policy "dsar_requests_select" on public.dsar_requests
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "dsar_requests_manage_owner" on public.dsar_requests;
create policy "dsar_requests_manage_owner" on public.dsar_requests
  for all using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists "honey_tokens_admin" on public.honey_tokens;
create policy "honey_tokens_admin" on public.honey_tokens
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "referrals_select" on public.referrals;
create policy "referrals_select" on public.referrals
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "referrals_manage_owner" on public.referrals;
create policy "referrals_manage_owner" on public.referrals
  for all using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists "referral_events_select" on public.referral_events;
create policy "referral_events_select" on public.referral_events
  for select using (
    exists (
      select 1 from public.referrals r
      where r.id = referral_id
        and (r.profile_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "referral_events_manage_admin" on public.referral_events;
create policy "referral_events_manage_admin" on public.referral_events
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "badges_select" on public.badges;
create policy "badges_select" on public.badges
  for select using (true);

drop policy if exists "badges_manage" on public.badges;
create policy "badges_manage" on public.badges
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profile_badges_select" on public.profile_badges;
create policy "profile_badges_select" on public.profile_badges
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "profile_badges_manage_admin" on public.profile_badges;
create policy "profile_badges_manage_admin" on public.profile_badges
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "impersonation_logs_super_admin" on public.impersonation_logs;
create policy "impersonation_logs_super_admin" on public.impersonation_logs
  for select using (public.is_super_admin());

drop policy if exists "mfa_reset_tokens_admin" on public.mfa_reset_tokens;
create policy "mfa_reset_tokens_admin" on public.mfa_reset_tokens
  for all using (public.is_admin()) with check (public.is_admin());


