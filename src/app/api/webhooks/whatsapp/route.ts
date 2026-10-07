import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildN8nPayload } from "@/lib/n8n-payload";

const VERIFY_TOKEN = "whatsappWebhookToken2026";
const N8N_WEBHOOK_URL =
    process.env.N8N_WEBHOOK_URL ||
    "https://n8n.speeda.ai/webhook/210b7b4e-4fb5-420b-b219-9a9e66aa8872";

type WhatsAppMessage = {
    id?: string;
    from?: string;
    type?: string;
    text?: {
        body?: string;
    };
    document?: {
        id?: string;
        filename?: string;
        mime_type?: string;
    };
    audio?: {
        id?: string;
        filename?: string;
        voice?: boolean;
    };
    image?: {
        id?: string;
        caption?: string;
    };
    interactive?: {
        list_reply?: {
            id?: string;
            title?: string;
        };
        button_reply?: {
            id?: string;
            title?: string;
        };
    };
};

type WhatsAppPayload = {
    entry?: Array<{
        changes?: Array<{
            value?: {
                messages?: WhatsAppMessage[];
            };
        }>;
    }>;
};

function getFirstMessage(payload: WhatsAppPayload): WhatsAppMessage | null {
    return payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0] ?? null;
}

function extractPhoneNumber(payload: WhatsAppPayload): string | null {
    return getFirstMessage(payload)?.from ?? null;
}

function extractMessageBody(payload: WhatsAppPayload): string | null {
    const message = getFirstMessage(payload);
    if (message?.type === "text") {
        return message.text?.body ?? null;
    }
    return null;
}

function extractPdfMediaId(payload: WhatsAppPayload): string | null {
    const message = getFirstMessage(payload);
    if (
        message?.type === "document" &&
        message.document?.mime_type === "application/pdf"
    ) {
        return message.document.id ?? null;
    }
    return null;
}

function extractPdfFilename(payload: WhatsAppPayload): string | null {
    const message = getFirstMessage(payload);
    if (message?.type === "document") {
        return message.document?.filename ?? null;
    }
    return null;
}

function extractVoiceMediaId(payload: WhatsAppPayload): string | null {
    const message = getFirstMessage(payload);
    if (message?.type === "audio" && message.audio?.voice === true) {
        return message.audio.id ?? null;
    }
    return null;
}

function extractVoiceFilename(payload: WhatsAppPayload): string | null {
    const message = getFirstMessage(payload);
    if (message?.type === "audio") {
        return message.audio?.filename ?? null;
    }
    return null;
}

function extractImageMediaId(payload: WhatsAppPayload): string | null {
    const message = getFirstMessage(payload);
    if (message?.type === "image") {
        return message.image?.id ?? null;
    }
    return null;
}

function extractImageCaption(payload: WhatsAppPayload): string | null {
    const message = getFirstMessage(payload);
    if (message?.type === "image") {
        return message.image?.caption ?? null;
    }
    return null;
}

function extractInteractiveTitle(payload: WhatsAppPayload): string | null {
    const message = getFirstMessage(payload);
    if (message?.type !== "interactive") return null;

    return (
        message.interactive?.list_reply?.title ??
        message.interactive?.button_reply?.title ??
        null
    );
}

function extractInteractiveId(payload: WhatsAppPayload): string | null {
    const message = getFirstMessage(payload);
    if (message?.type !== "interactive") return null;

    return (
        message.interactive?.list_reply?.id ??
        message.interactive?.button_reply?.id ??
        null
    );
}

function extractMessageId(payload: WhatsAppPayload): string | null {
    return getFirstMessage(payload)?.id ?? null;
}

function safeJsonStringify(data: unknown): string {
    return JSON.stringify(data, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    );
}

function sanitizeBigInt<T>(data: T): T {
    return JSON.parse(safeJsonStringify(data)) as T;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const mode = searchParams.get("hub.mode");
    const challenge = searchParams.get("hub.challenge");
    const token = searchParams.get("hub.verify_token");

    if (!mode || !challenge || !token) {
        return new NextResponse("Missing parameters", { status: 400 });
    }

    if (token === VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse("Verify token incorrect !", { status: 403 });
}

export async function POST(req: NextRequest) {
    try {
        const payload = (await req.json()) as WhatsAppPayload;
        console.log("🔥🔥 RAW WEBHOOK:", JSON.stringify(payload, null, 2));

        const phoneNumber = extractPhoneNumber(payload);
        const message = extractMessageBody(payload);
        const pdfMediaId = extractPdfMediaId(payload);
        const pdfFilename = extractPdfFilename(payload);
        const voiceMediaId = extractVoiceMediaId(payload);
        const voiceFilename = extractVoiceFilename(payload);
        const imageMediaId = extractImageMediaId(payload);
        const imageCaption = extractImageCaption(payload);
        const interactiveTitle = extractInteractiveTitle(payload);
        const interactiveId = extractInteractiveId(payload);
        const waMessageId = extractMessageId(payload);

        const isInteractive = interactiveTitle !== null;
        const isText = message !== null;
        const isPdf = pdfMediaId !== null && pdfFilename !== null;
        const isVoice = voiceMediaId !== null;
        const isImage = imageMediaId !== null;

        if (!phoneNumber) {
            console.log("❌ Numéro de téléphone manquant");
            return NextResponse.json({ ok: true });
        }

        let user = await prisma.user.findFirst({
            where: { phone: phoneNumber },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    phone: phoneNumber,
                    name: `user_${phoneNumber}`,
                    email: `temp_${phoneNumber}@speeda.local`,
                },
            });
            console.log(`👤 Nouvel utilisateur enregistré : ${phoneNumber}`);
        }

        const media =
            isImage ? { type: "image" as const, id: imageMediaId!, caption: imageCaption } :
            isVoice ? { type: "voice" as const, id: voiceMediaId!, filename: voiceFilename } :
            isPdf   ? { type: "pdf" as const, id: pdfMediaId!, filename: pdfFilename } :
            null;

        // Same builder as the web chat (/api/chat) so n8n gets one payload shape.
        const toSend = await buildN8nPayload({
            channel: "whatsapp",
            userId: user.id,
            sessionId: `wa-${phoneNumber}`,
            message: {
                text: isText ? message : null,
                interactive: isInteractive ? { id: interactiveId, title: interactiveTitle } : null,
                media,
                externalMessageId: waMessageId,
            },
        });

        console.log(
            "📤 WhatsApp → n8n",
            `user=${toSend.user_id} exist=${toSend.user_exist} token=${toSend.token_valide} ` +
            `activity=${toSend.activity_exist} pref=${toSend.preference_exist} strategy=${toSend.user_strategy} ` +
            `| Text=${isText} PDF=${isPdf} Voice=${isVoice} Image=${isImage} Interactive=${isInteractive}`
        );

        const safePayload = sanitizeBigInt(toSend);

        console.log("📦 Safe payload ready for n8n");

        const response = await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: safeJsonStringify(safePayload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ n8n webhook failed:", response.status, errorText);
        } else {
            console.log("✅ Payload envoyé vers n8n");
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[whatsapp webhook error]", error);
        return NextResponse.json({ ok: true });
    }
}
