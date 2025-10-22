-- Add multi-signature wallet tables
CREATE TABLE public.multi_sig_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.tontine_groups(id) ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  redeem_script TEXT NOT NULL,
  public_keys TEXT[] NOT NULL,
  required_signatures INTEGER NOT NULL DEFAULT 2,
  balance DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.multi_sig_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for multi_sig_wallets
CREATE POLICY "Group members can view wallet"
  ON public.multi_sig_wallets FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.tontine_members WHERE group_id = multi_sig_wallets.group_id
    )
  );

-- Wallet keys table (stores encrypted private keys)
CREATE TABLE public.wallet_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.multi_sig_wallets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL, -- In production, this should be encrypted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_id, user_id)
);

-- Enable RLS
ALTER TABLE public.wallet_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallet_keys
CREATE POLICY "Users can view their own keys"
  ON public.wallet_keys FOR SELECT
  USING (auth.uid() = user_id);

-- Pending transactions table
CREATE TABLE public.pending_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.multi_sig_wallets(id) ON DELETE CASCADE NOT NULL,
  to_address TEXT NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  initiator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  signatures_needed INTEGER NOT NULL,
  signatures_received INTEGER DEFAULT 0,
  txid TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pending_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pending_transactions
CREATE POLICY "Wallet members can view transactions"
  ON public.pending_transactions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.tontine_members 
      WHERE group_id = (
        SELECT group_id FROM public.multi_sig_wallets WHERE id = pending_transactions.wallet_id
      )
    )
  );

CREATE POLICY "Wallet members can create transactions"
  ON public.pending_transactions FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.tontine_members 
      WHERE group_id = (
        SELECT group_id FROM public.multi_sig_wallets WHERE id = pending_transactions.wallet_id
      )
    )
  );

-- Transaction signatures table
CREATE TABLE public.transaction_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.pending_transactions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(transaction_id, user_id)
);

-- Enable RLS
ALTER TABLE public.transaction_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transaction_signatures
CREATE POLICY "Users can view signatures for their transactions"
  ON public.transaction_signatures FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.tontine_members 
      WHERE group_id = (
        SELECT group_id FROM public.multi_sig_wallets 
        WHERE id = (
          SELECT wallet_id FROM public.pending_transactions 
          WHERE id = transaction_signatures.transaction_id
        )
      )
    )
  );

CREATE POLICY "Users can create signatures for their transactions"
  ON public.transaction_signatures FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IN (
      SELECT user_id FROM public.tontine_members 
      WHERE group_id = (
        SELECT group_id FROM public.multi_sig_wallets 
        WHERE id = (
          SELECT wallet_id FROM public.pending_transactions 
          WHERE id = transaction_signatures.transaction_id
        )
      )
    )
  );

-- Payout schedules table
CREATE TABLE public.payout_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.tontine_groups(id) ON DELETE CASCADE NOT NULL,
  cycle INTEGER NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled',
  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount DECIMAL(20, 8) NOT NULL,
  txid TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payout_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payout_schedules
CREATE POLICY "Group members can view payout schedules"
  ON public.payout_schedules FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.tontine_members WHERE group_id = payout_schedules.group_id
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_multi_sig_wallets_updated_at
  BEFORE UPDATE ON public.multi_sig_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payout_schedules_updated_at
  BEFORE UPDATE ON public.payout_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
