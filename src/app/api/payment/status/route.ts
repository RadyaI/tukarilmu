import { NextRequest, NextResponse } from "next/server";
import { Pakasir } from "pakasir-sdk";

const pakasir = new Pakasir({
  slug: "tukarilmu",
  apikey: "6ngUlXK8nPNKPMD0whXGP3xB8Xrno9zH",
});

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount } = await req.json();

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: "orderId dan amount wajib diisi" },
        { status: 400 }
      );
    }

    const payment = await pakasir.detailPayment(orderId, amount);

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    console.error("[Pakasir] Detail payment error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal mengecek status" },
      { status: 500 }
    );
  }
}