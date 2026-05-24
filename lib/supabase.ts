import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://juscalxdplgviyzxzbkz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1c2NhbHhkcGxndml5enh6Ymt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzQxMjIsImV4cCI6MjA4OTUxMDEyMn0.XM7jVGnFxnIQeTRA3Ew37DsBFmB7JXc60v0ealCGdnI'
)
