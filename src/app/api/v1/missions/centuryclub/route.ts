import { getCenturyClub } from "@/app/lib/data";
import { auth } from "auth";
import { NextRequest, NextResponse } from "next/server";
import { OPERATIONAL_UNITS } from "../../../../../../loader/util";

export async function GET(request: NextRequest) {
  if (!await auth()) return NextResponse.json({ error: 'Please login' }, { status: 401 });

  const unit = request.nextUrl.searchParams.get('unit');
  if (!unit || !OPERATIONAL_UNITS[unit ?? '']) return NextResponse.json({ error: 'Invalid unit' }, { status: 400 });

  const n = Number(request.nextUrl.searchParams.get('n')) ?? 100;

  return NextResponse.json(await getCenturyClub(n, { unit }));
}