-- Create users profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  login_method TEXT,
  last_signed_in TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create tontine_groups table
CREATE TABLE public.tontine_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  contribution_amount DECIMAL(10, 2) NOT NULL,
  frequency TEXT NOT NULL,
  max_members INTEGER NOT NULL,
  current_cycle INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  multi_sig_address TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tontine_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tontine_groups
CREATE POLICY "Anyone can view active tontine groups"
  ON public.tontine_groups FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can create tontine groups"
  ON public.tontine_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Create tontine_members table
CREATE TABLE public.tontine_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.tontine_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.tontine_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tontine_members
CREATE POLICY "Users can view members of groups they're in"
  ON public.tontine_members FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.tontine_members WHERE group_id = tontine_members.group_id
    )
  );

CREATE POLICY "Authenticated users can join groups"
  ON public.tontine_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create contributions table
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.tontine_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  cycle INTEGER NOT NULL,
  payment_hash TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contributions
CREATE POLICY "Users can view contributions in their groups"
  ON public.contributions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.tontine_members WHERE group_id = contributions.group_id
    )
  );

CREATE POLICY "Users can create contributions"
  ON public.contributions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create payouts table
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.tontine_groups(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  cycle INTEGER NOT NULL,
  transaction_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payouts
CREATE POLICY "Users can view payouts in their groups"
  ON public.payouts FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.tontine_members WHERE group_id = payouts.group_id
    )
  );

-- Create lightning_invoices table
CREATE TABLE public.lightning_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  payment_hash TEXT UNIQUE NOT NULL,
  payment_request TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  group_id UUID REFERENCES public.tontine_groups(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Enable RLS
ALTER TABLE public.lightning_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lightning_invoices
CREATE POLICY "Users can view their own invoices"
  ON public.lightning_invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices"
  ON public.lightning_invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tontine_groups_updated_at
  BEFORE UPDATE ON public.tontine_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, login_method)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'provider', 'email')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();