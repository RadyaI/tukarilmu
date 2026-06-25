import { NextRequest, NextResponse } from "next/server";
import { buyMaterial } from "@/utils/purchases";

// Webhook dari Pakasir saat pembayaran berhasil
// Body: { amount, order_id, project, status, payment_method, completed_at }
// order_id format: {uid}_{contentType}_{contentId}_{timestamp}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[Webhook] Pakasir payload:", body);

    const { order_id, status, amount } = body;

    if (status !== "completed") {
      return NextResponse.json({ received: true, skipped: true });
    }

    // Parse order_id: "uid_video_videoId_timestamp"
    const parts = order_id.split("_");
    if (parts.length < 4) {
      return NextResponse.json(
        { error: "Format order_id tidak valid" },
        { status: 400 }
      );
    }

    const [uid, contentType, contentId] = parts;

    // Tandai sebagai sudah dibeli di Firestore
    // userId seller tidak diketahui dari webhook, pakai placeholder
    // Kamu bisa simpan sellerId di Firestore saat create order jika perlu
    await buyMaterial(uid, "system", contentType, contentId, amount);

    console.log(`[Webhook] Pembelian berhasil: ${uid} beli ${contentType}/${contentId}`);
    return NextResponse.json({ received: true, success: true });
  } catch (error: any) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal error" },
      { status: 500 }
    );
  }
}