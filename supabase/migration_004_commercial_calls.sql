-- Migration 004: Système de Rendez-vous Commercial & Appels
-- Date: 2025-01-29

-- ============================================================================
-- 1. TABLE: commercial_appointments (Rendez-vous commerciaux)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.commercial_appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_email TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  duration INTEGER NOT NULL DEFAULT 30, -- en minutes
  zoom_link TEXT,
  
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('analysis', 'capsule1', 'capsule2', 'capsule3', 'capsule4', 'capsule5', 'pack')),
  source TEXT NOT NULL CHECK (source IN ('calendly', 'manual', 'whatsapp', 'tiktok', 'other')),
  
  status TEXT NOT NULL DEFAULT 'nouveau' CHECK (status IN (
    'nouveau', 'a_qualifier', 'a_relancer', 'rdv_confirme', 'no_show', 'paye', 'cloture'
  )),
  
  priority BOOLEAN DEFAULT false,
  notes TEXT,
  internal_notes TEXT, -- notes internes uniquement
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_appointments_user ON public.commercial_appointments(user_id);
CREATE INDEX idx_appointments_email ON public.commercial_appointments(contact_email);
CREATE INDEX idx_appointments_date ON public.commercial_appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.commercial_appointments(status);
CREATE INDEX idx_appointments_type ON public.commercial_appointments(appointment_type);

-- ============================================================================
-- 2. TABLE: appointment_followups (Suivi des rendez-vous)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.appointment_followups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.commercial_appointments(id) ON DELETE CASCADE,
  
  followup_type TEXT NOT NULL CHECK (followup_type IN ('call', 'email', 'whatsapp', 'sms')),
  followup_content TEXT,
  followup_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  next_action_at TIMESTAMP WITH TIME ZONE,
  reminder_sent BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_followups_appointment ON public.appointment_followups(appointment_id);
CREATE INDEX idx_followups_date ON public.appointment_followups(followup_date);

-- ============================================================================
-- 3. TABLE: appointment_payments (Paiements liés aux rendez-vous)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.appointment_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.commercial_appointments(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  
  expected_amount DECIMAL(10, 2) NOT NULL CHECK (expected_amount >= 0),
  paid_amount DECIMAL(10, 2) DEFAULT 0 CHECK (paid_amount >= 0),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  
  payment_method TEXT,
  transaction_id TEXT,
  invoice_url TEXT,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_appt_payments_appointment ON public.appointment_payments(appointment_id);
CREATE INDEX idx_appt_payments_status ON public.appointment_payments(payment_status);

-- ============================================================================
-- 4. TABLE: appointment_status_history (Historique des statuts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.appointment_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.commercial_appointments(id) ON DELETE CASCADE,
  
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT
);

CREATE INDEX idx_status_history_appointment ON public.appointment_status_history(appointment_id);

-- ============================================================================
-- 5. Trigger pour mettre à jour updated_at
-- ============================================================================
CREATE TRIGGER update_commercial_appointments_updated_at 
BEFORE UPDATE ON public.commercial_appointments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointment_payments_updated_at 
BEFORE UPDATE ON public.appointment_payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. Trigger pour enregistrer l'historique des statuts
-- ============================================================================
CREATE OR REPLACE FUNCTION log_appointment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.appointment_status_history (appointment_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_commercial_appointment_status
AFTER UPDATE ON public.commercial_appointments
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_appointment_status_change();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Commercial Appointments
ALTER TABLE public.commercial_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and commercial can view all appointments"
  ON public.commercial_appointments FOR SELECT
  USING (
    public.is_admin(auth.uid()) OR public.is_commercial(auth.uid())
  );

CREATE POLICY "Admins and commercial can manage appointments"
  ON public.commercial_appointments FOR ALL
  USING (
    public.is_admin(auth.uid()) OR public.is_commercial(auth.uid())
  )
  WITH CHECK (
    public.is_admin(auth.uid()) OR public.is_commercial(auth.uid())
  );

-- Appointment Followups
ALTER TABLE public.appointment_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and commercial can manage followups"
  ON public.appointment_followups FOR ALL
  USING (
    public.is_admin(auth.uid()) OR public.is_commercial(auth.uid())
  )
  WITH CHECK (
    public.is_admin(auth.uid()) OR public.is_commercial(auth.uid())
  );

-- Appointment Payments
ALTER TABLE public.appointment_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and commercial can manage appointment payments"
  ON public.appointment_payments FOR ALL
  USING (
    public.is_admin(auth.uid()) OR public.is_commercial(auth.uid())
  )
  WITH CHECK (
    public.is_admin(auth.uid()) OR public.is_commercial(auth.uid())
  );

-- Status History
ALTER TABLE public.appointment_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and commercial can view status history"
  ON public.appointment_status_history FOR SELECT
  USING (
    public.is_admin(auth.uid()) OR public.is_commercial(auth.uid())
  );

-- ============================================================================
-- 8. Fonctions utilitaires
-- ============================================================================

-- Fonction pour calculer le taux de conversion
CREATE OR REPLACE FUNCTION get_conversion_rate(start_date DATE, end_date DATE)
RETURNS TABLE (
  total_appointments BIGINT,
  paid_appointments BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_appointments,
    COUNT(*) FILTER (WHERE status = 'paye') as paid_appointments,
    CASE 
      WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE status = 'paye')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0
    END as conversion_rate
  FROM public.commercial_appointments
  WHERE appointment_date::DATE BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_conversion_rate(DATE, DATE) IS 'Calcule le taux de conversion des rendez-vous sur une période';

-- ============================================================================
-- 9. Vue pour faciliter l'affichage des rendez-vous
-- ============================================================================
CREATE OR REPLACE VIEW public.appointments_dashboard AS
SELECT 
  a.id,
  a.user_id,
  a.contact_name,
  a.contact_email,
  a.contact_phone,
  a.appointment_date,
  a.timezone,
  a.duration,
  a.zoom_link,
  a.appointment_type,
  a.source,
  a.status,
  a.priority,
  a.created_at,
  a.updated_at,
  u.email as user_email,
  COUNT(DISTINCT f.id) as followups_count,
  COUNT(DISTINCT p.id) as payments_count,
  COALESCE(SUM(p.paid_amount), 0) as total_paid_amount,
  MAX(f.followup_date) as last_followup_date
FROM public.commercial_appointments a
LEFT JOIN auth.users u ON a.user_id = u.id
LEFT JOIN public.appointment_followups f ON a.id = f.appointment_id
LEFT JOIN public.appointment_payments p ON a.id = p.appointment_id
GROUP BY a.id, a.user_id, a.contact_name, a.contact_email, a.contact_phone, 
         a.appointment_date, a.timezone, a.duration, a.zoom_link, a.appointment_type, 
         a.source, a.status, a.priority, a.created_at, a.updated_at, u.email;

COMMENT ON VIEW public.appointments_dashboard IS 'Vue consolidée pour le dashboard des rendez-vous commerciaux';

-- Rendre la vue accessible
GRANT SELECT ON public.appointments_dashboard TO authenticated;

