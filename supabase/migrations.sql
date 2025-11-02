-- Migration Supabase pour Cash360
-- Création des tables pour formations, paiements, produits

-- ============================================================================
-- 1. TABLE: formations (Sessions de formation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.formations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_name TEXT NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'Capsule' CHECK (session_type IN ('Capsule', 'Workshop', 'Webinaire')),
  capsule_id TEXT,
  duration INTEGER NOT NULL DEFAULT 60 CHECK (duration > 0),
  date_scheduled DATE NOT NULL,
  time_scheduled TIME NOT NULL,
  description TEXT,
  zoom_link TEXT,
  max_participants INTEGER NOT NULL DEFAULT 50 CHECK (max_participants > 0),
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  access_type TEXT NOT NULL DEFAULT 'tous' CHECK (access_type IN ('tous', 'capsule', 'custom')),
  price DECIMAL(10, 2) DEFAULT 0 CHECK (price >= 0),
  require_payment BOOLEAN DEFAULT false,
  send_notification BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'a_venir' CHECK (status IN ('a_venir', 'en_ligne', 'termine')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_formations_date ON public.formations(date_scheduled);
CREATE INDEX idx_formations_status ON public.formations(status);
CREATE INDEX idx_formations_capsule ON public.formations(capsule_id);

-- ============================================================================
-- 2. TABLE: formation_registrations (Inscriptions aux formations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.formation_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attended BOOLEAN DEFAULT false,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  CONSTRAINT unique_registration UNIQUE(formation_id, user_id)
);

CREATE INDEX idx_registrations_formation ON public.formation_registrations(formation_id);
CREATE INDEX idx_registrations_user ON public.formation_registrations(user_id);
CREATE INDEX idx_registrations_payment ON public.formation_registrations(payment_status);

-- ============================================================================
-- 3. TABLE: products (Produits de la boutique)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  is_pack BOOLEAN DEFAULT false,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer les produits de la boutique
INSERT INTO public.products (id, name, description, price, original_price, is_pack, image_url) VALUES
  ('capsule1', 'L''éducation financière', 'Apprenez à maîtriser votre budget, comprendre vos dépenses et poser les fondations d''une stabilité durable.', 350.00, NULL, false, '/images/logo/capsule1.jpg'),
  ('capsule2', 'La Mentalité de la pauvreté', 'Identifiez et brisez les blocages mentaux qui sabotent votre relation avec l''argent.', 350.00, NULL, false, '/images/logo/capsule2.jpg'),
  ('capsule3', 'Les Lois spirituelles liées à l''argent', 'Découvrez les principes divins qui gouvernent la prospérité et la bénédiction financière.', 350.00, NULL, false, '/images/logo/capsule3.jpg'),
  ('capsule4', 'Les Combats liés à la prospérité', 'Apprenez à reconnaître et vaincre les résistances spirituelles à votre épanouissement.', 350.00, NULL, false, '/images/logo/capsule4.jpg'),
  ('capsule5', 'Épargne & Investissement', 'Apprenez à épargner intelligemment et à faire fructifier vos ressources avec sagesse.', 350.00, NULL, false, '/images/logo/capsule5.jpg'),
  ('pack', 'Pack complet Cash360', 'Accédez à l''ensemble des 5 capsules pour une transformation complète.', 1500.00, 1750.00, true, '/images/pack.png'),
  ('analyse-financiere', 'Analyse financière personnalisée', 'Analyse approfondie de votre situation financière avec recommandations personnalisées.', 39.99, NULL, false, '/images/Firefly-2.jpg')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. TABLE: payments (Paiements et transactions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  formation_id UUID REFERENCES public.formations(id) ON DELETE SET NULL,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('analysis', 'capsule', 'pack', 'formation', 'other')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled', 'refunded')),
  method TEXT CHECK (method IN ('Stripe', 'PayPal', 'Carte bancaire', 'Virement', 'Chèque')),
  transaction_id TEXT UNIQUE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_type ON public.payments(payment_type);
CREATE INDEX idx_payments_created ON public.payments(created_at);
CREATE INDEX idx_payments_transaction ON public.payments(transaction_id);

-- ============================================================================
-- 5. TABLE: cart_items (Panier d'achat) - Optionnel pour synchronisation
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_cart_item UNIQUE(user_id, product_id)
);

CREATE INDEX idx_cart_items_user ON public.cart_items(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Formations
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available formations"
  ON public.formations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage formations"
  ON public.formations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@cash360.com', 'yvann.guy@gmail.com')
    )
  );

-- Formation Registrations
ALTER TABLE public.formation_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own registrations"
  ON public.formation_registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can register for formations"
  ON public.formation_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@cash360.com', 'yvann.guy@gmail.com')
    )
  );

-- Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Cart Items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cart"
  ON public.cart_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_formations_updated_at
  BEFORE UPDATE ON public.formations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour obtenir les statistiques de paiements
CREATE OR REPLACE FUNCTION public.get_payment_stats(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_revenue NUMERIC,
  total_transactions BIGINT,
  successful_transactions BIGINT,
  failed_transactions BIGINT,
  average_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN p.status = 'success' THEN p.amount ELSE 0 END), 0) as total_revenue,
    COUNT(*) as total_transactions,
    COUNT(*) FILTER (WHERE p.status = 'success') as successful_transactions,
    COUNT(*) FILTER (WHERE p.status = 'failed') as failed_transactions,
    COALESCE(AVG(CASE WHEN p.status = 'success' THEN p.amount END), 0) as average_amount
  FROM public.payments p
  WHERE 
    (start_date IS NULL OR p.created_at::DATE >= start_date)
    AND (end_date IS NULL OR p.created_at::DATE <= end_date);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques de formations
CREATE OR REPLACE FUNCTION public.get_formation_stats(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_sessions BIGINT,
  total_registrations BIGINT,
  total_attendances BIGINT,
  participation_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT f.id) as total_sessions,
    COUNT(DISTINCT r.id) as total_registrations,
    COUNT(*) FILTER (WHERE r.attended = true) as total_attendances,
    CASE 
      WHEN COUNT(DISTINCT r.id) > 0 
      THEN (COUNT(*) FILTER (WHERE r.attended = true)::NUMERIC / COUNT(DISTINCT r.id)::NUMERIC) * 100
      ELSE 0
    END as participation_rate
  FROM public.formations f
  LEFT JOIN public.formation_registrations r ON f.id = r.formation_id
  WHERE 
    (start_date IS NULL OR f.date_scheduled >= start_date)
    AND (end_date IS NULL OR f.date_scheduled <= end_date);
END;
$$ LANGUAGE plpgsql;

