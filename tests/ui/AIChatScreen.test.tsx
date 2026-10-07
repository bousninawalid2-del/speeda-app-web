// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const ui = vi.hoisted(() => ({
  consumeMessage: vi.fn(() => true),
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));
vi.mock('@/components/FreeTier', () => ({
  useFreeTier: () => ({ isFree: true, consumeMessage: ui.consumeMessage }),
  AIMessageLimitBanner: () => null,
  AIMessageLimitReached: ({ onUpgrade }: { onUpgrade: () => void }) => <button onClick={onUpgrade}>limit-reached</button>,
  UpgradePrompt: ({ open }: { open: boolean }) => (open ? <div>upgrade-prompt</div> : null),
}));
vi.mock('sonner', () => ({ toast: ui.toast }));
// jsdom never finishes framer-motion exit animations; render plain elements instead.
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const MOTION_PROPS = ['initial', 'animate', 'exit', 'transition', 'whileTap', 'whileHover', 'layout', 'drag', 'dragConstraints'];
  const cache = new Map<string, unknown>();
  const motion = new Proxy({}, {
    get: (_t, tag: string) => {
      if (!cache.has(tag)) {
        const Component = React.forwardRef((props: Record<string, unknown>, ref) => {
          const rest = Object.fromEntries(Object.entries(props).filter(([k]) => !MOTION_PROPS.includes(k)));
          return React.createElement(tag, { ...rest, ref });
        });
        Component.displayName = `motion.${tag}`;
        cache.set(tag, Component);
      }
      return cache.get(tag);
    },
  });
  return { motion, AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children) };
});

import { AIChatScreen } from '@/screens/AIChatScreen';

type Route = (url: string, init?: RequestInit) => Response | Promise<Response>;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
let routes: Record<string, Route>;
const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const key = Object.keys(routes).filter(k => url.startsWith(k)).sort((a, b) => b.length - a.length)[0];
  if (!key) throw new Error(`unexpected fetch ${url}`);
  return routes[key](url, init);
});
const callsTo = (path: string) => fetchMock.mock.calls.filter(([u]) => String(u).split('?')[0] === path);
const bodyOf = (prefix: string, i = 0) => JSON.parse(String(callsTo(prefix)[i][1]!.body));

beforeEach(() => {
  routes = {
    '/api/chat': () => json({ reply: 'ok', type: 'text', sessionId: 's-1' }),
    '/api/n8n/respond': () => json({ messages: [] }),
    '/api/engagement/feed': () => json({ items: [] }),
  };
  fetchMock.mockClear();
  vi.stubGlobal('fetch', fetchMock);
  localStorage.setItem('speeda_access_token', 'tok');
  ui.consumeMessage.mockReset().mockReturnValue(true);
  ui.toast.success.mockReset(); ui.toast.error.mockReset();
  Element.prototype.scrollTo = vi.fn();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const input = () => screen.getByPlaceholderText('chat.placeholder');
const barButtons = () => within(input().parentElement as HTMLElement).getAllByRole('button');
const sendButton = () => barButtons()[2];
const paperclip = () => barButtons()[1];

async function send(text: string) {
  const user = userEvent.setup();
  await user.type(input(), `${text}{Enter}`);
}

describe('AIChatScreen — chat', () => {
  it('renders the welcome message, quick prompts, and an enabled input', () => {
    render(<AIChatScreen />);
    expect(screen.getByText('chat.welcomeMessage')).toBeInTheDocument();
    expect(screen.getByText('chat.createInstaPost')).toBeEnabled();
    expect(input()).toBeEnabled();
    expect(sendButton()).toBeDisabled();
  });

  it('uses initial props (prefilled input, engagement tab)', async () => {
    render(<AIChatScreen initialInputValue="Need tokens" />);
    expect(input()).toHaveValue('Need tokens');
    expect(sendButton()).toBeEnabled();
  });

  it('shows the user message immediately, sends it with auth, and renders the formatted reply with options', async () => {
    routes['/api/chat'] = () => json({ reply: '*Great* pick _today_', type: 'text', sessionId: 's-1', options: [{ id: 'quick_post', title: 'Quick Post' }] });
    render(<AIChatScreen />);
    await send('Plan my brunch post');

    expect(screen.getByText('Plan my brunch post')).toBeInTheDocument();
    expect(input()).toHaveValue('');
    expect(await screen.findByText('Great', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('today', { selector: 'em' })).toBeInTheDocument();
    expect(bodyOf('/api/chat')).toEqual({ message: 'Plan my brunch post' });
    expect(callsTo('/api/chat')[0][1]!.headers).toMatchObject({ Authorization: 'Bearer tok' });
    expect(screen.queryByText('chat.createInstaPost')).not.toBeInTheDocument();
  });

  it('sends an option click as title + id with the session id (same as WhatsApp)', async () => {
    routes['/api/chat'] = () => json({ reply: 'Choose', sessionId: 's-1', options: [{ id: 'eight_week_strategy', title: '8-Week Strategy' }] });
    render(<AIChatScreen />);
    await send('Hi');
    await userEvent.click(await screen.findByRole('button', { name: '8-Week Strategy' }));
    await waitFor(() => expect(callsTo('/api/chat')).toHaveLength(2));
    expect(bodyOf('/api/chat', 1)).toEqual({ message: '8-Week Strategy', sessionId: 's-1', isInteractive: true, interactiveTitle: '8-Week Strategy', interactiveId: 'eight_week_strategy' });
  });

  it('sends a quick prompt chip as a message', async () => {
    render(<AIChatScreen />);
    await userEvent.click(screen.getByText('chat.showAnalytics'));
    await waitFor(() => expect(bodyOf('/api/chat')).toEqual({ message: 'chat.showAnalytics' }));
  });

  it('blocks sending when the free-tier message limit is reached', async () => {
    ui.consumeMessage.mockReturnValue(false);
    render(<AIChatScreen />);
    await send('Hi');
    expect(callsTo('/api/chat')).toHaveLength(0);
    await userEvent.click(screen.getByText('limit-reached'));
    expect(screen.getByText('upgrade-prompt')).toBeInTheDocument();
  });

  it.each([
    [429, 'chat.rateLimited', false],
    [503, 'chat.notConfigured', false],
    [502, 'chat.serviceUnavailable', true],
  ])('maps HTTP %i to its own message (retry offered: %s)', async (status, text, retry) => {
    routes['/api/chat'] = () => json({ error: 'raw backend error' }, status);
    render(<AIChatScreen />);
    await send('Hi');
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(screen.queryByText('raw backend error')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'chat.retry' }) !== null).toBe(retry);
  });

  it('shows the backend message for other errors without a retry button', async () => {
    routes['/api/chat'] = () => json({ error: 'Missing or invalid Authorization header' }, 401);
    render(<AIChatScreen />);
    await send('Hi');
    expect(await screen.findByText('Missing or invalid Authorization header')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'chat.retry' })).not.toBeInTheDocument();
  });

  it('retries the exact last message after a network error, without duplicating the user bubble', async () => {
    let fail = true;
    routes['/api/chat'] = () => { if (fail) { fail = false; throw new TypeError('network'); } return json({ reply: 'Recovered', sessionId: 's-1' }); };
    render(<AIChatScreen />);
    await send('Hello again');
    await userEvent.click(await screen.findByRole('button', { name: 'chat.retry' }));
    expect(await screen.findByText('Recovered')).toBeInTheDocument();
    expect(bodyOf('/api/chat', 1)).toEqual(bodyOf('/api/chat', 0));
    expect(screen.getAllByText('Hello again')).toHaveLength(1);
  });
});

describe('AIChatScreen — async replies (polling)', () => {
  it('polls for async n8n replies and renders them', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    routes['/api/chat'] = () => json({ reply: '', sessionId: 's-9' });
    let polls = 0;
    routes['/api/n8n/respond'] = () => json({ messages: ++polls === 2 ? [{ reply: 'Strategy ready', type: 'image', mediaUrl: 'https://x/i.png', options: [{ id: 'approve', title: 'Approve' }] }] : [] });
    render(<AIChatScreen />);
    fireEvent.change(input(), { target: { value: 'Build my strategy' } });
    fireEvent.keyDown(input(), { key: 'Enter' });

    await act(async () => { await vi.advanceTimersByTimeAsync(4100); });
    expect(await screen.findByText('Strategy ready')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(callsTo('/api/n8n/respond')[0][0]).toBe('/api/n8n/respond?sessionId=s-9');
  });

  it('backs off and gives up after 3 minutes, then lets the user retry', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    routes['/api/chat'] = () => json({ reply: '', sessionId: 's-9' });
    render(<AIChatScreen />);
    fireEvent.change(input(), { target: { value: 'Slow job' } });
    fireEvent.keyDown(input(), { key: 'Enter' });

    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    const fastPolls = callsTo('/api/n8n/respond').length;
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(callsTo('/api/n8n/respond').length - fastPolls).toBeLessThanOrEqual(2); // 5s cadence after 15s
    await act(async () => { await vi.advanceTimersByTimeAsync(180_000); });
    expect(screen.getByText('chat.pollTimeout')).toBeInTheDocument();

    const before = callsTo('/api/n8n/respond').length;
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(callsTo('/api/n8n/respond')).toHaveLength(before); // stopped

    fireEvent.click(screen.getByRole('button', { name: 'chat.retry' }));
    expect(screen.queryByText('chat.pollTimeout')).not.toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(2100); });
    expect(callsTo('/api/n8n/respond').length).toBeGreaterThan(before);
  });

  it('starts a new chat: resets messages, shows chips again, stops polling', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    routes['/api/chat'] = () => json({ reply: 'First answer', sessionId: 's-1' });
    render(<AIChatScreen />);
    fireEvent.change(input(), { target: { value: 'Q1' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(await screen.findByText('First answer')).toBeInTheDocument();

    const header = screen.getByText('chat.online').closest('div')!.parentElement!.parentElement!.parentElement!;
    const [, plus] = within(header).getAllByRole('button');
    fireEvent.click(plus);
    expect(screen.queryByText('First answer')).not.toBeInTheDocument();
    expect(screen.getByText('chat.createInstaPost')).toBeInTheDocument();

    const polls = callsTo('/api/n8n/respond').length;
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(callsTo('/api/n8n/respond')).toHaveLength(polls);
  });
});

describe('AIChatScreen — attachments', () => {
  it('opens the attach menu (no video option) and triggers the OS picker with the right accept', async () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    render(<AIChatScreen />);
    await userEvent.click(paperclip());
    expect(screen.getByText('chat.voiceMessage')).toBeInTheDocument();
    expect(screen.queryByText('chat.video')).not.toBeInTheDocument();

    const fileInput = document.querySelector('input[type=file]') as HTMLInputElement;
    for (const [label, accept, capture] of [
      ['chat.takePhoto', 'image/*', 'environment'], ['chat.chooseFromLibrary', 'image/*', null],
      ['chat.voiceMessage', 'audio/*', null], ['chat.uploadFile', 'application/pdf', null],
    ] as const) {
      await userEvent.click(paperclip());
      await userEvent.click(screen.getAllByText(label).at(-1)!);
      expect(fileInput.accept).toBe(accept);
      expect(fileInput.getAttribute('capture')).toBe(capture);
    }
    expect(click).toHaveBeenCalledTimes(4);
  });

  it('uploads a file, previews it, and sends it with the message', async () => {
    routes['/api/chat/upload'] = () => json({ id: 'img_1', mediaUrl: '/api/chat/upload?id=img_1', mediaType: 'image', filename: 'brunch.jpg' }, 201);
    render(<AIChatScreen />);
    const fileInput = document.querySelector('input[type=file]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'brunch.jpg', { type: 'image/jpeg' })] } });

    expect(await screen.findByText('brunch.jpg')).toBeInTheDocument();
    expect(sendButton()).toBeEnabled();
    fireEvent.click(sendButton());

    await waitFor(() => expect(callsTo('/api/chat')).toHaveLength(1));
    expect(bodyOf('/api/chat')).toEqual({ message: '[file: brunch.jpg]', mediaId: 'img_1', mediaType: 'image' });
    expect(document.querySelector('img[src="/api/chat/upload?id=img_1"]')).not.toBeNull();
  });

  it.each([
    ['voice', 'note.ogg', 'audio'],
    ['pdf', 'menu.pdf', 'a[href="/api/chat/upload?id=f1"]'],
  ])('renders a sent %s attachment in the user bubble', async (mediaType, filename, selector) => {
    routes['/api/chat/upload'] = () => json({ id: 'f1', mediaUrl: '/api/chat/upload?id=f1', mediaType, filename }, 201);
    render(<AIChatScreen />);
    fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [new File(['x'], filename)] } });
    await screen.findByText(filename);
    fireEvent.click(sendButton());
    await waitFor(() => expect(document.querySelector(selector)).not.toBeNull());
  });

  it('lets the user remove a pending attachment', async () => {
    routes['/api/chat/upload'] = () => json({ id: 'img_1', mediaUrl: '/u', mediaType: 'image', filename: 'a.jpg' }, 201);
    render(<AIChatScreen />);
    fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [new File(['x'], 'a.jpg')] } });
    const name = await screen.findByText('a.jpg');
    fireEvent.click(within(name.closest('.bg-card') as HTMLElement).getByRole('button'));
    expect(screen.queryByText('a.jpg')).not.toBeInTheDocument();
  });

  it('shows a toast when the upload fails (server error or network)', async () => {
    routes['/api/chat/upload'] = () => json({ error: 'File type not allowed' }, 400);
    render(<AIChatScreen />);
    const fileInput = document.querySelector('input[type=file]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'v.mp4')] } });
    await waitFor(() => expect(ui.toast.error).toHaveBeenCalledWith('File type not allowed'));

    routes['/api/chat/upload'] = () => { throw new TypeError('network'); };
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'b.jpg')] } });
    await waitFor(() => expect(ui.toast.error).toHaveBeenCalledWith('chat.uploadFailedRetry'));
  });

  it('ignores a file input change without a file', () => {
    render(<AIChatScreen />);
    fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [] } });
    expect(callsTo('/api/chat/upload')).toHaveLength(0);
  });
});

describe('AIChatScreen — history panel', () => {
  it('opens and closes the chat history panel', async () => {
    render(<AIChatScreen />);
    const header = screen.getByText('chat.online').closest('div')!.parentElement!.parentElement!.parentElement!;
    await userEvent.click(within(header).getAllByRole('button')[0]);
    expect(screen.getByText('chat.history')).toBeInTheDocument();
    await userEvent.click(screen.getByText('chat.newChat'));
    await waitFor(() => expect(screen.queryByText('chat.history')).not.toBeInTheDocument());
  });
});

describe('AIChatScreen — engagement tab', () => {
  const feed = [
    { id: 'c1', rawId: 'raw-c1', name: 'Sara', platform: 'Instagram', sourcePlatform: 'instagram', type: 'Comment', filter: 'Comments', msg: 'Love the brunch!' },
    { id: 'r1', rawId: 'raw-r1', name: 'Omar', platform: 'Google', sourcePlatform: 'gmb', type: 'Review', filter: 'Reviews', msg: 'Slow service', isNegative: true },
    { id: 'd1', rawId: 'raw-d1', name: 'Lina', platform: 'Facebook', sourcePlatform: 'facebook', type: 'DM', filter: 'DMs', msg: 'Open today?' },
  ];

  it('loads the feed, filters it, and shows a badge count', async () => {
    routes['/api/engagement/feed'] = () => json({ items: feed });
    render(<AIChatScreen initialTab="engagement" />);
    expect(await screen.findByText('Love the brunch!')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    await userEvent.click(screen.getByText('engagement.reviews'));
    await waitFor(() => expect(callsTo('/api/engagement/feed').at(-1)![0]).toBe('/api/engagement/feed?filter=Reviews'));
  });

  it('replies to a comment and to a review through the right endpoints', async () => {
    routes['/api/engagement/feed'] = () => json({ items: feed });
    routes['/api/engagement/reply-comment'] = () => json({ ok: true });
    routes['/api/engagement/reply-review'] = () => json({ ok: true });
    render(<AIChatScreen initialTab="engagement" initialEngagementFilter="All" />);
    await screen.findByText('Love the brunch!');

    for (const [i, text] of [[0, 'Thanks Sara!'], [1, 'Sorry Omar']] as const) {
      // the replied card's button turns into "Edit Response", so the next target is always the first "Reply"
      await userEvent.click(screen.getAllByText(/engagement\.reply/)[0]);
      await userEvent.type(screen.getByPlaceholderText('engagement.composerPlaceholder'), text);
      await userEvent.click(screen.getByRole('button', { name: /common\.send/ }));
      await waitFor(() => expect(ui.toast.success).toHaveBeenCalledTimes(i + 1));
      await waitFor(() => expect(screen.queryByPlaceholderText('engagement.composerPlaceholder')).not.toBeInTheDocument());
    }
    expect(bodyOf('/api/engagement/reply-comment')).toEqual({ commentId: 'raw-c1', platforms: ['instagram'], comment: 'Thanks Sara!' });
    expect(bodyOf('/api/engagement/reply-review')).toEqual({ reviewId: 'raw-r1', reply: 'Sorry Omar', platform: 'gmb' });
  });

  it('uses a smart reply suggestion, supports cancel, and reports a failed reply', async () => {
    routes['/api/engagement/feed'] = () => json({ items: [feed[0]] });
    routes['/api/engagement/reply-comment'] = () => json({ error: 'nope' }, 500);
    render(<AIChatScreen initialTab="engagement" />);
    await screen.findByText('Love the brunch!');

    await userEvent.click(screen.getByText(/engagement\.reply/));
    await userEvent.click(screen.getByText('common.cancel'));
    await userEvent.click(screen.getByText(/engagement\.reply/));
    const suggestion = await screen.findAllByText(/^✦ /, {}, { timeout: 2000 });
    await userEvent.click(suggestion[0]);
    expect((screen.getByPlaceholderText('engagement.composerPlaceholder') as HTMLTextAreaElement).value).not.toBe('');
    await userEvent.click(screen.getByRole('button', { name: /common\.send/ }));
    await waitFor(() => expect(ui.toast.error).toHaveBeenCalledWith('engagement.replyFailed'));
  });

  it('treats DM replies as sent locally', async () => {
    routes['/api/engagement/feed'] = () => json({ items: [feed[2]] });
    render(<AIChatScreen initialTab="engagement" />);
    await screen.findByText('Open today?');
    await userEvent.click(screen.getByText(/engagement\.reply/));
    await userEvent.type(screen.getByPlaceholderText('engagement.composerPlaceholder'), 'Yes!');
    await userEvent.click(screen.getByRole('button', { name: /common\.send/ }));
    await waitFor(() => expect(screen.queryByPlaceholderText('engagement.composerPlaceholder')).not.toBeInTheDocument());
    expect(screen.getByText('Yes!')).toBeInTheDocument();
    expect(screen.getByText(/engagement\.editResponse/)).toBeInTheDocument();
  });

  it('shows empty, error (with retry) and DMs-disabled states', async () => {
    routes['/api/engagement/feed'] = () => json({ items: [] });
    const { unmount } = render(<AIChatScreen initialTab="engagement" />);
    expect(await screen.findByText('engagement.empty')).toBeInTheDocument();
    unmount();

    routes['/api/engagement/feed'] = () => json({ error: 'Ayrshare down' }, 500);
    render(<AIChatScreen initialTab="engagement" />);
    expect(await screen.findByText('Ayrshare down')).toBeInTheDocument();
    routes['/api/engagement/feed'] = () => json({ items: [], messagingDisabled: true });
    await userEvent.click(screen.getByText('common.retry'));
    await userEvent.click(await screen.findByText('engagement.dms'));
    expect(await screen.findByText('engagement.dmsDisabledTitle')).toBeInTheDocument();
  });

  it('switches back to the chat tab', async () => {
    render(<AIChatScreen initialTab="engagement" />);
    await userEvent.click(screen.getByText('chat.chatTab'));
    expect(screen.getByPlaceholderText('chat.placeholder')).toBeInTheDocument();
  });
});
