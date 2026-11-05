import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const uid = req.cookies.get("mwinda_uid")?.value;
  if (!uid) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: uid },
    include: { vendor: true },
  });

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.name,
      phone: user.phone,
      role: user.role,
      shopId: user.vendor?.id || null,
      isVerified: Boolean(user.emailVerified),
      emailConfirmed: Boolean(user.emailVerified),
    },
  });
}
