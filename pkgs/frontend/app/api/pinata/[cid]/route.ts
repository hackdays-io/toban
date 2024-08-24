import {NextApiRequest} from "next";
import {NextRequest, NextResponse} from "next/server";

export async function GET(req: NextRequest, {cid}: {cid: string}) {
  console.log(cid);
  return NextResponse.json({cid});
}
