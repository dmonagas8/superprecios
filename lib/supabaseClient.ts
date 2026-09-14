import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qichpcaconpxfgwpfyzl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpY2hwY2Fjb25weGZnd3BmeXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTUwMTUsImV4cCI6MjEwNDk3MTAxNX0.oHpvvlCYqu0wtPboWfgiq16MNtuXzhu7GKfY1Vu4FiA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
