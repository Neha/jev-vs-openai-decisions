import { connection } from "next/server";
import { envConfigured } from "@/lib/keys";

export async function GET() {
  await connection();
  return Response.json({ env: envConfigured() });
}
