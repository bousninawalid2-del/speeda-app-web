/**
 * Web-side output adapter for n8n replies.
 *
 * n8n workflows were written for WhatsApp, so a "reply" can arrive as plain
 * text, as an agent JSON string ({ message, options }), or as a raw WhatsApp
 * Cloud API payload ({ messaging_product, type: 'interactive', ... }).
 * Everything is reduced here to the shape the web chat renders, so a raw
 * payload never reaches the UI as a JSON string.
 */

export interface ChatOption { id: string; title: string }

export interface WebReply {
  reply: string;
  type: 'text' | 'image' | 'video' | 'file';
  mediaUrl?: string;
  options?: ChatOption[];
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

function tryParseJson(value: string): unknown {
  const trimmed = value.trim();
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return value;
  try { return JSON.parse(trimmed); } catch { return value; }
}

function normalizeOptions(raw: unknown): ChatOption[] | undefined {
  if (typeof raw === 'string') raw = tryParseJson(raw);
  if (Array.isArray(raw)) {
    const out = raw
      .map((o, i) => {
        if (typeof o === 'string') return { id: `option_${i + 1}`, title: o };
        if (isObj(o)) {
          const reply = isObj(o.reply) ? o.reply : o; // WhatsApp button shape
          const title = str(reply.title ?? reply.label ?? reply.text);
          return title ? { id: str(reply.id) || `option_${i + 1}`, title } : null;
        }
        return null;
      })
      .filter((o): o is ChatOption => !!o);
    return out.length ? out : undefined;
  }
  if (isObj(raw)) {
    const out = Object.entries(raw)
      .filter(([, v]) => typeof v === 'string' && v)
      .map(([id, v]) => ({ id, title: v as string }));
    return out.length ? out : undefined;
  }
  return undefined;
}

/** WhatsApp Cloud API message payload → web reply (null for reactions). */
function fromWhatsAppPayload(p: Obj): WebReply | null {
  const type = str(p.type);
  if (type === 'reaction') return null;
  if (type === 'text' && isObj(p.text)) return { reply: str(p.text.body), type: 'text' };
  if (type === 'image' && isObj(p.image)) {
    return { reply: str(p.image.caption), type: 'image', mediaUrl: str(p.image.link) || undefined };
  }
  if (type === 'interactive' && isObj(p.interactive)) {
    const it = p.interactive;
    const body = isObj(it.body) ? str(it.body.text) : '';
    const action = isObj(it.action) ? it.action : {};
    const rows = Array.isArray(action.sections)
      ? action.sections.flatMap(s => (isObj(s) && Array.isArray(s.rows) ? s.rows : []))
      : [];
    const options = normalizeOptions(rows.length ? rows : action.buttons);
    const header = isObj(it.header) ? it.header : {};
    const headerImage = isObj(header.image) ? str(header.image.link) : '';
    return {
      reply: body,
      type: headerImage ? 'image' : 'text',
      mediaUrl: headerImage || undefined,
      options,
    };
  }
  return null;
}

/**
 * @param raw   the reply field (string or object) or a whole n8n response body
 * @param extra fields sent alongside the reply (type/mediaUrl/options)
 * @returns null when there is nothing to show on the web (e.g. a WhatsApp reaction)
 */
export function normalizeN8nReply(raw: unknown, extra: Obj = {}): WebReply | null {
  let value: unknown = typeof raw === 'string' ? tryParseJson(raw) : raw;

  if (isObj(value) && 'messaging_product' in value) return fromWhatsAppPayload(value);

  if (isObj(value)) {
    // Common n8n/agent response shapes.
    const inner = value.reply ?? value.output ?? value.message ?? value.text ?? value.body;
    if (inner !== undefined && inner !== value) {
      const merged = { ...value, ...extra };
      delete merged.reply; delete merged.output; delete merged.message; delete merged.text; delete merged.body;
      return normalizeN8nReply(inner, merged);
    }
    value = '';
  }

  const reply = str(value);
  const options = normalizeOptions(extra.options ?? extra.interactive_options);
  const mediaUrl = str(extra.mediaUrl ?? extra.imageUrl ?? extra.videoUrl ?? extra.fileUrl) || undefined;
  const allowed = ['text', 'image', 'video', 'file'] as const;
  const type = (allowed as readonly string[]).includes(str(extra.type)) ? (str(extra.type) as WebReply['type']) : 'text';

  if (!reply && !mediaUrl && !options) return null;
  return { reply, type, mediaUrl, options };
}
