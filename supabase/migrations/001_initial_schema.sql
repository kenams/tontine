CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE tontine_status AS ENUM ('pending', 'active', 'completed', 'cancelled');
CREATE TYPE contribution_status AS ENUM ('pending', 'paid', 'late', 'cancelled');
CREATE TYPE frequency_type AS ENUM ('weekly', 'biweekly', 'monthly');
CREATE TYPE notification_type AS ENUM (
  'payment_reminder',
  'payment_confirmed',
  'member_joined',
  'your_turn',
  'tontine_completed',
  'general'
);
CREATE TYPE member_status AS ENUM ('invited', 'active', 'removed');

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  trust_score INTEGER DEFAULT 100 CHECK (trust_score >= 0 AND trust_score <= 100),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.tontines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 10),
  frequency frequency_type NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE,
  max_members INTEGER NOT NULL CHECK (max_members >= 2 AND max_members <= 50),
  status tontine_status NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.tontine_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tontine_id UUID NOT NULL REFERENCES public.tontines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  order_position INTEGER NOT NULL,
  join_date TIMESTAMPTZ DEFAULT NOW(),
  status member_status NOT NULL DEFAULT 'active',
  UNIQUE(tontine_id, user_id),
  UNIQUE(tontine_id, order_position)
);

CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tontine_id UUID NOT NULL REFERENCES public.tontines(id),
  user_id UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date TIMESTAMPTZ,
  stripe_payment_id TEXT,
  status contribution_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tontine_id UUID NOT NULL REFERENCES public.tontines(id),
  beneficiary_id UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(10,2) NOT NULL,
  scheduled_date DATE NOT NULL,
  paid_date TIMESTAMPTZ,
  stripe_transfer_id TEXT,
  status contribution_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tontine_id UUID NOT NULL REFERENCES public.tontines(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id),
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'general',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tontines_created_by ON public.tontines(created_by);
CREATE INDEX idx_tontines_status ON public.tontines(status);
CREATE INDEX idx_members_tontine ON public.tontine_members(tontine_id);
CREATE INDEX idx_members_user ON public.tontine_members(user_id);
CREATE INDEX idx_contributions_tontine ON public.contributions(tontine_id);
CREATE INDEX idx_contributions_user ON public.contributions(user_id);
CREATE INDEX idx_messages_tontine ON public.messages(tontine_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tontines_updated_at
BEFORE UPDATE ON public.tontines
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
