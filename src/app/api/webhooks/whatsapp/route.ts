import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

function notBlank(value?: string | null): boolean {
    return !!value && value.trim() !== "";
}

function buildPreferenceText(preference: {
    resumer: string | null;
    preferred_platforms: string | null;
} | null): string {
    if (!preference) return "";

    let result = "";

    if (notBlank(preference.resumer)) {
        result += preference.resumer!.trim();
    }

    if (notBlank(preference.preferred_platforms)) {
        if (result.length > 0) result += "\n\n";
        result += `Preferred Platforms: ${preference.preferred_platforms!.trim()}`;
    }

    return result;
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

        const userId = user.id.toString();
        const userExist = !!(user.password && user.password.trim() !== "");

        const activity = await prisma.activity.findUnique({
            where: { userId: user.id },
        });

        const activityExist = activity !== null;
        const activityText = activity?.resumer ?? "";

        const preference = await prisma.preference.findUnique({
            where: { userId: user.id },
        });

        const preferenceExist = preference !== null;
        const preferenceText = buildPreferenceText(preference);

        console.log("📞 Phone            :", phoneNumber);
        console.log("✅ User exist       :", userExist);
        console.log("📊 Activity exist   :", activityExist);
        console.log("🎯 Pref exist       :", preferenceExist);
        console.log("🆔 User ID          :", userId);
        console.log(
            "📤 Types            :",
            `Text=${isText} | PDF=${isPdf} | Voice=${isVoice} | Image=${isImage} | Interactive=${isInteractive}`
        );

        const toSend: Record<string, unknown> = {
            wa_message_id: waMessageId,
            user_id: userId,
            phone: phoneNumber,
            user_exist: userExist,
            token_valide: false,
            token_refresh: null,
            activity_exist: activityExist,
            activity_text: activityText,
            preference_exist: preferenceExist,
            status: null,
            is_text: isText,
            is_pdf: isPdf,
            is_voice: isVoice,
            is_image: isImage,
            is_interactive: isInteractive,
            username: user.name,
            session_id: null,
            session_status: null,
            session_start_date: null,
            session_end_date: null,
            preference_text: preferenceText,
            email: user.email,
            discu_code: null,
            discu_key: null,
            prestention_exist: false,
            user_strategy: false,
            current_post: null,
        };

        if (activity) {
            toSend.activity_id = activity.id.toString();
            toSend.business_name = activity.business_name;
            toSend.industry = activity.industry;
            toSend.business_description = activity.business_description;
            toSend.location = activity.location;
            toSend.opening_hours = activity.opening_hours;
            toSend.audience_target = activity.audience_target;
            toSend.business_size = activity.business_size;
            toSend.unique_selling_point = activity.unique_selling_point;
            toSend.year_founded = activity.year_founded;
            toSend.certifications = activity.certifications;
            toSend.resumer = activity.resumer;
        }

        if (preference) {
            toSend.preference_id = preference.id.toString();
            toSend.preferred_platforms = preference.preferred_platforms;
            toSend.tone_of_voice = preference.tone_of_voice;
            toSend.language_preference = preference.language_preference;
        }

        if (isText) {
            toSend.message = message;
        }

        if (isPdf) {
            toSend.pdf_media_id = pdfMediaId;
            toSend.pdf_filename = pdfFilename;
        }

        if (isVoice) {
            toSend.voice_media_id = voiceMediaId;
            if (voiceFilename) {
                toSend.voice_filename = voiceFilename;
            }
        }

        if (isImage) {
            toSend.image_media_id = imageMediaId;
            if (imageCaption) {
                toSend.image_caption = imageCaption;
            }
        }

        if (isInteractive) {
            toSend.interactive_title = interactiveTitle;
            toSend.interactive_id = interactiveId;
        }

        await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(toSend, (_, value) =>
                typeof value === "bigint" ? value.toString() : value
            ),
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[whatsapp webhook error]", error);
        return NextResponse.json({ ok: true });
    }
}
