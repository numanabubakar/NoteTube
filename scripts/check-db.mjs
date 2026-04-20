import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTables() {
  console.log('Checking tables in Supabase...')
  
  const { data, error } = await supabase
    .from('videos')
    .select('count', { count: 'exact', head: true })

  if (error) {
    console.error('Error selecting from videos:', error.message)
    if (error.code === 'PGRST116' || error.message.includes('not found')) {
      console.log('Table "videos" likely does not exist.')
    }
  } else {
    console.log('Table "videos" exists.')
  }

  // Check other tables
  const tables = ['profiles', 'notes', 'quizzes', 'learning_sessions', 'learning_stats']
  for (const table of tables) {
    const { error: tableError } = await supabase.from(table).select('count', { count: 'exact', head: true })
    if (tableError) {
      console.error(`Table "${table}" error:`, tableError.message)
    } else {
      console.log(`Table "${table}" exists.`)
    }
  }
}

checkTables()
