import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qxwbzjqhespeushoktro.supabase.co'
const supabaseKey = 'sb_publishable_3cCknROrBO-fJayGEOqcoA_KUZmZ2fJ'

export const supabase = createClient(supabaseUrl, supabaseKey)
