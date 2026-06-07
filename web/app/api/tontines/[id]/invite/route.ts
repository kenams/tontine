import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/request";
import { auditLog, clientIp, rateLimit } from "@/lib/security";
import { inviteSchema } from "@/lib/validators";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://tontineapp-web.vercel.app").trim();

async function sendInviteEmail(to: string, groupName: string, inviterName: string, joinCode: string) {
  const url = `${APP_URL}/g/${joinCode}`;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "Kotizy <noreply@kotizy.app>",
      to,
      subject: `${inviterName} vous invite à rejoindre ${groupName} sur Kotizy`,
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h1 style="font-size:24px;font-weight:900;margin:0 0 8px">Invitation à rejoindre ${groupName}</h1>
        <p style="color:#6b7280;margin:0 0 8px"><strong>${inviterName}</strong> vous invite à rejoindre son groupe de tontine sur Kotizy.</p>
        <p style="color:#6b7280;margin:0 0 24px">Code d'accès : <strong style="font-size:18px;color:#12c77f">${joinCode}</strong></p>
        <a href="${url}" style="display:inline-block;background:#22c55e;color:#050706;font-weight:900;padding:14px 28px;border-radius:16px;text-decoration:none;font-size:15px">Rejoindre le groupe</a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">Si vous ne connaissez pas ${inviterName}, ignorez cet email.</p>
      </div>`
    });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const limit = await rateLimit(request, "invite", 10, 300_000);
  if (!limit.ok) return NextResponse.json({ error: "Trop d'invitations envoyées. Réessayez dans 5 minutes." }, { status: 429 });

  const { id } = await params;
  const parsed = inviteSchema.safeParse(await safeJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Email invalide." }, { status: 400 });

  const [membership, group] = await Promise.all([
    prisma.membership.findFirst({ where: { userId: session.userId, tontineGroupId: id } }),
    prisma.tontineGroup.findUnique({ where: { id }, select: { name: true, joinCode: true, maxMembers: true, memberships: { select: { id: true } } } })
  ]);

  if (!membership && session.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  if (!group) return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });
  if (group.memberships.length >= group.maxMembers) return NextResponse.json({ error: "Ce groupe est complet." }, { status: 409 });

  const emailSent = await sendInviteEmail(parsed.data.email, group.name, session.fullName, group.joinCode);

  await prisma.notification.create({
    data: {
      userId: session.userId,
      tontineGroupId: id,
      title: `Invitation envoyée${emailSent ? "" : " (email en attente)"}`,
      body: `Invitation à ${parsed.data.email} pour rejoindre ${group.name}. Code : ${group.joinCode}`,
      type: "INVITE"
    }
  });

  await auditLog({
    actorId: session.userId,
    action: "MEMBER_INVITED",
    targetType: "TontineGroup",
    targetId: id,
    ipAddress: clientIp(request),
    metadata: { email: parsed.data.email, emailSent }
  });

  return NextResponse.json({ ok: true, joinLink: `${APP_URL}/g/${group.joinCode}`, emailSent });
}
