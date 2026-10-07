import { describe, it, expect } from 'vitest';
import { normalizeN8nReply } from '@/lib/n8n-reply';

const waList = {
  messaging_product: 'whatsapp', to: '1', type: 'interactive',
  interactive: { type: 'list', body: { text: 'اختر' }, action: { button: 'b', sections: [{ title: 't', rows: [{ id: 'option_1', title: 'A' }, { id: 'option_2', title: 'B' }] }] } },
};

describe('normalizeN8nReply — web output adapter', () => {
  it('keeps plain text as a text reply', () => {
    expect(normalizeN8nReply('Hello')).toEqual({ reply: 'Hello', type: 'text', mediaUrl: undefined, options: undefined });
  });

  it('parses an agent JSON string with string options', () => {
    expect(normalizeN8nReply('{"message":"Choose","options":["Quick Post","8-Week Strategy"]}')).toMatchObject({
      reply: 'Choose',
      options: [{ id: 'option_1', title: 'Quick Post' }, { id: 'option_2', title: '8-Week Strategy' }],
    });
  });

  it('accepts options given as an id → title object', () => {
    expect(normalizeN8nReply('Pick', { options: { a: 'Alpha', b: '' } })?.options).toEqual([{ id: 'a', title: 'Alpha' }]);
  });

  it('accepts options as a JSON string and skips invalid entries', () => {
    expect(normalizeN8nReply('Pick', { options: '[{"id":"x","label":"X"}, 3, {"id":"y"}]' })?.options).toEqual([{ id: 'x', title: 'X' }]);
  });

  it('unwraps a WhatsApp text payload', () => {
    expect(normalizeN8nReply({ messaging_product: 'whatsapp', type: 'text', text: { body: 'Salut' } })).toEqual({ reply: 'Salut', type: 'text' });
  });

  it('turns a WhatsApp interactive list (even as a JSON string) into text + options', () => {
    expect(normalizeN8nReply(JSON.stringify(waList))).toMatchObject({
      reply: 'اختر', type: 'text',
      options: [{ id: 'option_1', title: 'A' }, { id: 'option_2', title: 'B' }],
    });
  });

  it('maps WhatsApp reply buttons with a header image to an image reply', () => {
    const r = normalizeN8nReply({
      messaging_product: 'whatsapp', type: 'interactive',
      interactive: { type: 'button', header: { type: 'image', image: { link: 'https://x/img.png' } }, body: { text: 'Preview' }, action: { buttons: [{ type: 'reply', reply: { id: 'approve', title: 'Approve' } }] } },
    });
    expect(r).toEqual({ reply: 'Preview', type: 'image', mediaUrl: 'https://x/img.png', options: [{ id: 'approve', title: 'Approve' }] });
  });

  it('maps a WhatsApp image payload', () => {
    expect(normalizeN8nReply({ messaging_product: 'whatsapp', type: 'image', image: { link: 'https://x/a.jpg', caption: 'cap' } }))
      .toEqual({ reply: 'cap', type: 'image', mediaUrl: 'https://x/a.jpg' });
  });

  it('returns null for WhatsApp reactions and unknown payload types', () => {
    expect(normalizeN8nReply({ messaging_product: 'whatsapp', type: 'reaction', reaction: { emoji: '👍' } })).toBeNull();
    expect(normalizeN8nReply({ messaging_product: 'whatsapp', type: 'sticker' })).toBeNull();
  });

  it('reads common n8n body shapes ({reply}, {output}) and carries their metadata', () => {
    expect(normalizeN8nReply({ reply: 'Pick', type: 'text', sessionId: 's', options: [{ id: 'a', title: 'A' }] }))
      .toMatchObject({ reply: 'Pick', options: [{ id: 'a', title: 'A' }] });
    expect(normalizeN8nReply({ output: 'from agent' })).toMatchObject({ reply: 'from agent' });
    expect(normalizeN8nReply({ reply: 'img', type: 'image', imageUrl: 'https://x/i.png' })).toMatchObject({ type: 'image', mediaUrl: 'https://x/i.png' });
  });

  it('returns null when there is nothing to show', () => {
    expect(normalizeN8nReply('')).toBeNull();
    expect(normalizeN8nReply({ foo: 'bar' })).toBeNull();
    expect(normalizeN8nReply(null)).toBeNull();
  });

  it('falls back to text for unknown types and keeps invalid JSON as text', () => {
    expect(normalizeN8nReply('{not json', { type: 'carousel' })).toMatchObject({ reply: '{not json', type: 'text' });
  });
});
