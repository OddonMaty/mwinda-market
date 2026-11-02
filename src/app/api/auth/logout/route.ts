import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("mwinda_uid", "", { path: "/", maxAge: 0 });
  res.cookies.set("mwinda_admin", "", { path: "/", maxAge: 0 });
  return res;
}
