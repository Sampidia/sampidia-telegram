import { createClient } from '@/utils/supabase/server'
import HomeClient from './HomeClient'

export interface DatabaseItem {
  price: number;
  // Add other expected properties from your database
}

export default async function Page() {
  const supabase = await createClient()
  let initialData: DatabaseItem[] = [] // Replaced any[] with DatabaseItem[]
  let serverError: string | null = null

  try {
    const { data, error } = await supabase
      .from('your_table_name') // replace with actual table name
      .select('price')

    if (error) {
      serverError = error.message
    } else if (data) {
      initialData = data
    }
  } catch (err) {
    serverError = err instanceof Error ? err.message : 'Unknown error'
  }

  return (
    <HomeClient
      initialData={initialData}
      serverError={serverError}
    />
  )
}