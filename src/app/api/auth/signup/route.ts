import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, phone } = await req.json();

    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "Email et mot de passe (min 6 car.) requis." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: fullName || email.split("@")[0],
        phone: phone || null,
        passwordHash,
        role: "customer",
      },
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.name,
        phone: user.phone,
        role: user.role,
      },
    });

    // Session simple via cookie (token = userId pour le moment — à renforcer plus tard)
    res.cookies.set("mwinda_uid", user.id, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return res;
  } catch (err: any) {
    console.error("[auth/signup]", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
