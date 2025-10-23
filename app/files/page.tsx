import { createClientServer } from '@/lib/supabase-server'
import FilesClient from './ui/FilesClient'

export const dynamic = 'force-dynamic'

export default async function FilesPage() {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return <FilesClient userId={user.id} email={user.email ?? ''} />
}
