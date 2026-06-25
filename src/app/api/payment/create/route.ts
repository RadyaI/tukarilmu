import { NextRequest, NextResponse } from "next/server";
import { Pakasir } from "pakasir-sdk";

const pakasir = new Pakasir({
  slug: process.env.TUKARILMU_SLUG!,
  apikey: process.env.TUKARILMU_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount, redirectUrl } = await req.json();

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: "orderId dan amount wajib diisi" },
        { status: 400 }
      );
    }

    if (amount < 500) {
      return NextResponse.json(
        { error: "Minimum pembayaran Rp500" },
        { status: 400 }
      );
    }

    const payment = await pakasir.createPayment(
      "qris",
      orderId,
      amount,
      redirectUrl
    );

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    console.error("[Pakasir] Create payment error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal membuat transaksi" },
      { status: 500 }
    );
  }
}