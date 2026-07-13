import { NextResponse } from "next/server";
import { ContactSchema } from "@/features/contact/schemas/contact.schema";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = ContactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid contact form submission" }, { status: 400 });
  }

  // No email/CRM integration yet — log the lead server-side.
  console.log("New contact form submission:", parsed.data);

  return NextResponse.json({ message: "Thanks — we'll be in touch shortly!" }, { status: 200 });
}
