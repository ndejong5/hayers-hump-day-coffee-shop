import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { notifyAllCustomers } from "@/lib/push";

// Triggered weekly by Vercel Cron (see vercel.json). Our order window is
// created lazily whenever anyone hits get_window_status(), so this route
// both ensures this week's window exists and tells customers it's open.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const { data: windowStatus, error } = await supabase.rpc("get_window_status").single();
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  await notifyAllCustomers({
    title: "Ordering is open! ☕",
    body: "This week's coffee order window is open. Order before slots run out!",
    url: "/",
  });

  return NextResponse.json({ ok: true, windowStatus });
}
