import { redirect } from "next/navigation";
import { createServerSupabase } from '@/lib/supabaseServer'

export default async function Home() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  // If user is logged in, go to events, otherwise go to welcome page
  if (user) {
    redirect("/events");
  } else {
    redirect("/welcome");
  }
}
