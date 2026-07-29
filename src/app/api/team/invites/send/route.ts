import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { email?: string; role?: string; companyName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const role = body.role?.trim() || "member";
  const companyName = body.companyName?.trim() || "your workspace";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }

  const { data: membership, error: memberError } = await supabase
    .from("company_members")
    .select("company_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError || !membership?.company_id) {
    return NextResponse.json({ error: "No company membership." }, { status: 403 });
  }

  if (membership.role !== "admin") {
    return NextResponse.json({ error: "Only admins can send invites." }, { status: 403 });
  }

  const companyId = membership.company_id as string;

  const { data: existing } = await supabase
    .from("team_invites")
    .select("id")
    .eq("company_id", companyId)
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (!existing) {
    const { error: insertError } = await supabase.from("team_invites").insert({
      company_id: companyId,
      email,
      role,
      invited_by: user.id,
      status: "pending",
    });
    if (insertError && !insertError.message.toLowerCase().includes("duplicate")) {
      // Client may already have inserted; ignore duplicate-style failures
      console.warn("Invite insert:", insertError.message);
    }
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "").replace(/\/$/, "");
  const loginUrl = `${appUrl || "https://qlimwelt.com"}/login`;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ ok: true, emailed: false });
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM ?? "Qlimwelt <onboarding@resend.dev>";

  const { error: sendError } = await resend.emails.send({
    from,
    to: [email],
    subject: `You're invited to ${companyName} on Qlimwelt`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px">
        <h2 style="color:#1a2e0f;margin:0 0 16px">Join ${companyName} on Qlimwelt</h2>
        <p style="color:#111827;line-height:1.5">
          You've been invited as <strong>${role}</strong>. Sign in with this email to accept:
        </p>
        <p style="margin:24px 0">
          <a href="${loginUrl}" style="display:inline-block;background:#5cb832;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">
            Sign in to Qlimwelt
          </a>
        </p>
        <p style="font-size:12px;color:#6b7280">${loginUrl}</p>
      </div>
    `,
    text: [
      `You've been invited to join ${companyName} on Qlimwelt as ${role}.`,
      "",
      `Sign in with this email: ${loginUrl}`,
    ].join("\n"),
  });

  if (sendError) {
    console.error("Resend invite error:", sendError);
    return NextResponse.json({ ok: true, emailed: false });
  }

  return NextResponse.json({ ok: true, emailed: true });
}
