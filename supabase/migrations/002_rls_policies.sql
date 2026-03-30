ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tontines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tontine_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_select_members" ON public.users
  FOR SELECT USING (
    id IN (
      SELECT user_id FROM public.tontine_members tm
      JOIN public.tontine_members my ON tm.tontine_id = my.tontine_id
      WHERE my.user_id = auth.uid()
    )
  );

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "tontines_select_member" ON public.tontines
  FOR SELECT USING (
    id IN (
      SELECT tontine_id FROM public.tontine_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tontines_insert_auth" ON public.tontines
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "tontines_update_own" ON public.tontines
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "tontines_delete_own" ON public.tontines
  FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "members_select" ON public.tontine_members
  FOR SELECT USING (
    tontine_id IN (
      SELECT tontine_id FROM public.tontine_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members_insert_organizer" ON public.tontine_members
  FOR INSERT WITH CHECK (
    tontine_id IN (
      SELECT id FROM public.tontines WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "contributions_select_member" ON public.contributions
  FOR SELECT USING (
    tontine_id IN (
      SELECT tontine_id FROM public.tontine_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "contributions_insert_own" ON public.contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "messages_select_member" ON public.messages
  FOR SELECT USING (
    tontine_id IN (
      SELECT tontine_id FROM public.tontine_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_member" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    tontine_id IN (
      SELECT tontine_id FROM public.tontine_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
