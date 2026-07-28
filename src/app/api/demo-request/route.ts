import { NextResponse } from "next/server";
import { Resend } from "resend";
import { demoRequestSchema } from "@/lib/demo-request-schema";

const DEFAULT_INBOX = "pratikrughe.qlimwelt@gmail.com";

function buildEmailHtml(data: {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  message: string;
}) {
  const rows = [
    ["Name", `${data.firstName} ${data.lastName}`],
    ["Email", data.email],
    ["Company", data.company],
    ["Message", data.message || "—"],
  ];

  const body = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;font-weight:600;color:#374151;vertical-align:top;width:120px">${label}</td><td style="padding:8px 12px;color:#111827">${value.replace(/\n/g, "<br>")}</td></tr>`
    )
    .join("");

  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px">
      <h2 style="color:#1a2e0f;margin:0 0 16px">New demo request — Qlimwelt</h2>
      <table style="border-collapse:collapse;width:100%;border:1px solid #e5e7eb">${body}</table>
      <p style="margin:20px 0 0;font-size:12px;color:#6b7280">Reply directly to this email to reach the prospect.</p>
    </div>
  `;
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.DEMO_REQUEST_EMAIL ?? DEFAULT_INBOX;

  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured");
    return NextResponse.json({ error: "Email service is not configured." }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = demoRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid form data." },
      { status: 400 }
    );
  }

  const form = parsed.data;
  const resend = new Resend(apiKey);

  const from = process.env.RESEND_FROM ?? "Qlimwelt <onboarding@resend.dev>";

  const { data: sent, error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: form.email,
    subject: `Demo request — ${form.company} (${form.firstName} ${form.lastName})`,
    html: buildEmailHtml(form),
    text: [
      "New demo request — Qlimwelt",
      "",
      `Name: ${form.firstName} ${form.lastName}`,
      `Email: ${form.email}`,
      `Company: ${form.company}`,
      `Message: ${form.message || "—"}`,
    ].join("\n"),
  });

  if (error) {
    console.error("Resend error:", error);
    const message =
      error.message ??
      "Failed to send email. Verify your Resend account email matches the inbox address.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  console.info("Demo request email sent:", sent?.id);

  return NextResponse.json({ ok: true });
}
