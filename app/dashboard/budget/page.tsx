// Page "Budget & suivi" Cash360
// V1 avec persistance Supabase (budgets + budget_expenses) par utilisateur et mois.
// Notes d'analyse : la config Supabase (client public + service) vit dans `lib/supabase.ts`
// et le client SSR authentifié est exposé via `lib/supabase-server.ts` (utilisé par /api/budget).
// La navigation principale du dashboard (onglets Tableau de bord / Boutique / Mes achats / Profil)
// reste centralisée dans `app/dashboard/page.tsx`; on y ajoute simplement un lien vers /dashboard/budget.

import BudgetTracker from '@/components/dashboard/BudgetTracker'

export const metadata = {
  title: 'Budget & suivi - Cash360'
}

export default function DashboardBudgetPage() {
  return <BudgetTracker />
}
