import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

// ── Icons (pure SVG, no MUI) ───────────────────────────────────────────────────

function IconArrowLeft() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
    );
}

function IconGroup() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function IconSend() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    );
}

function IconPaperclip() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
    );
}

function IconSmile() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
    );
}

function IconX() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function IconFile() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    );
}

function IconDownload() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name = '') {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function avatarColor(name = '') {
    const palette = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#06B6D4'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffffff;
    return palette[h % palette.length];
}

function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|svg)$/i;
function isImage(name) { return name && IMAGE_EXT.test(name); }

// ── UserAvatar ─────────────────────────────────────────────────────────────────

function UserAvatar({ name, avatarUrl, size = 8 }) {
    const color = avatarColor(name);
    const dim   = `${size * 4}px`;
    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={name}
                style={{ width: dim, height: dim }}
                className="rounded-full object-cover flex-shrink-0"
            />
        );
    }
    return (
        <div
            style={{ width: dim, height: dim, backgroundColor: color, fontSize: '0.65rem' }}
            className="flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white"
        >
            {initials(name)}
        </div>
    );
}

// ── Emoji picker ───────────────────────────────────────────────────────────────

const EMOJIS = [
    '😀','😂','🤣','😊','😍','🥰','😎','🤔','😭','😅',
    '😆','😇','🤩','😋','😛','😜','🤪','😏','😒','😳',
    '😱','🤯','😡','😤','🤗','🥳','🤫','🤭','😴','😷',
    '❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','❣️',
    '👍','👎','👏','🙌','🤝','🙏','✌️','🤞','👊','✊',
    '🎉','🎊','🎈','🔥','✨','💯','⭐','🌟','💫','🌈',
    '😢','😔','😞','😟','😠','👀','💀','🤦','🤷','💪',
    '📚','📝','📱','💻','⏰','📅','🎓','🏫','📧','🔔',
];

function EmojiPicker({ onSelect, onClose, anchorRef }) {
    useEffect(() => {
        function outside(e) {
            if (anchorRef.current && !anchorRef.current.contains(e.target)) onClose();
        }
        document.addEventListener('mousedown', outside);
        return () => document.removeEventListener('mousedown', outside);
    }, [onClose, anchorRef]);

    return (
        <div className="absolute bottom-full left-0 z-50 mb-1.5 w-[316px] rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
            <div className="grid grid-cols-10 gap-0.5">
                {EMOJIS.map(e => (
                    <button
                        key={e}
                        type="button"
                        onClick={() => onSelect(e)}
                        className="rounded-md p-0.5 text-xl leading-none transition-colors hover:bg-gray-100"
                    >
                        {e}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Message row builder ────────────────────────────────────────────────────────

function buildRows(messages, currentUserId, isGroup) {
    if (!messages.length) return [];
    const groups = [];

    for (const msg of messages) {
        const isOwn = msg.sender_id === currentUserId;
        const last  = groups[groups.length - 1];
        const sameDay    = last && formatDate(last.msgs.at(-1).created_at) === formatDate(msg.created_at);
        const sameSender = last && last.msgs.at(-1).sender_id === msg.sender_id;
        if (last && isOwn === last.isOwn && sameSender && sameDay) {
            last.msgs.push(msg);
        } else {
            groups.push({ msgs: [msg], isOwn });
        }
    }

    const rows = [];
    let lastDate = '';
    for (const group of groups) {
        for (let i = 0; i < group.msgs.length; i++) {
            const msg       = group.msgs[i];
            const dateLabel = formatDate(msg.created_at);
            if (dateLabel !== lastDate) {
                rows.push({ type: 'date', label: dateLabel });
                lastDate = dateLabel;
            }
            rows.push({
                type: 'msg', msg,
                isOwn:      group.isOwn,
                isFirst:    i === 0,
                isLast:     i === group.msgs.length - 1,
                showAvatar: !group.isOwn && i === group.msgs.length - 1 && isGroup,
                showName:   !group.isOwn && i === 0 && isGroup,
            });
        }
    }
    return rows;
}

// ── Lightbox ───────────────────────────────────────────────────────────────────

function Lightbox({ src, name, onClose }) {
    useEffect(() => {
        const onKey = e => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90"
            onClick={onClose}
        >
            <img
                src={src}
                alt={name}
                onClick={e => e.stopPropagation()}
                className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            />
            <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
            >
                <IconX />
            </button>
            <a
                href={src}
                download={name}
                onClick={e => e.stopPropagation()}
                className="absolute right-16 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
                title="Download"
            >
                <IconDownload />
            </a>
        </div>
    );
}

// ── Attachment in message ──────────────────────────────────────────────────────

function AttachmentView({ url, name, isOwn, onImageClick }) {
    if (!url) return null;

    if (isImage(name)) {
        return (
            <button
                type="button"
                onClick={() => onImageClick(url, name)}
                className="mt-1 block cursor-zoom-in overflow-hidden rounded-xl border-0 bg-transparent p-0"
            >
                <img
                    src={url}
                    alt={name}
                    className="block max-h-48 max-w-[220px] rounded-xl object-cover"
                />
            </button>
        );
    }

    return (
        <a
            href={url}
            download={name}
            className={`mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 no-underline transition-opacity hover:opacity-80 ${
                isOwn ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
            }`}
        >
            <span className="flex-shrink-0 opacity-80"><IconFile /></span>
            <span className="break-all text-xs font-medium leading-tight">{name}</span>
        </a>
    );
}

// ── Chat bubble ────────────────────────────────────────────────────────────────

function Bubble({ msg, isOwn, isFirst, isLast, showAvatar, showName, isGroup, onImageClick }) {
    const senderName  = msg.sender?.name ?? '?';
    const senderColor = avatarColor(senderName);
    const hasAttach   = !!msg.attachment_url;
    const bodyText    = msg.body?.trim();

    // Rounded corners: last bubble in a group gets a sharper near corner
    const ownRadius  = isLast ? 'rounded-[18px] rounded-br-[4px]' : 'rounded-[18px]';
    const recvRadius = isLast ? 'rounded-[18px] rounded-bl-[4px]' : 'rounded-[18px]';

    return (
        <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'} ${isLast ? 'mb-2' : 'mb-0.5'}`}>
            {/* Received avatar spacer */}
            {!isOwn && isGroup && (
                <div className="w-8 flex-shrink-0 self-end">
                    {showAvatar && (
                        <UserAvatar name={senderName} avatarUrl={msg.sender?.avatar_url ?? null} size={8} />
                    )}
                </div>
            )}

            <div className={`flex min-w-0 max-w-[72%] flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                {showName && (
                    <span
                        className="mb-0.5 ml-1 text-[11px] font-semibold"
                        style={{ color: senderColor }}
                    >
                        {senderName}
                    </span>
                )}

                <div
                    title={formatTime(msg.created_at)}
                    className={`cursor-default select-text break-words px-3 py-2 ${ownRadius} ${recvRadius} ${
                        isOwn
                            ? 'bg-blue-500 text-white shadow-[0_1px_2px_rgba(59,130,246,0.25)]'
                            : 'bg-white text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                    }`}
                    style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                >
                    {hasAttach && (
                        <AttachmentView
                            url={msg.attachment_url}
                            name={msg.attachment_name}
                            isOwn={isOwn}
                            onImageClick={onImageClick}
                        />
                    )}
                    {bodyText && (
                        <p className={`text-sm leading-relaxed ${hasAttach ? 'mt-1' : ''}`}>
                            {bodyText}
                        </p>
                    )}
                    <p className={`mt-0.5 text-right text-[10px] leading-none ${
                        isOwn ? 'text-white/60' : 'text-gray-400'
                    }`}>
                        {formatTime(msg.created_at)}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MessagesShow({ conversation, messages, currentUser }) {
    const bottomRef      = useRef(null);
    const inputRef       = useRef(null);
    const fileRef        = useRef(null);
    const emojiAnchorRef = useRef(null);

    const [showEmoji, setShowEmoji] = useState(false);
    const [lightbox, setLightbox]   = useState(null); // { src, name }

    const { data, setData, post, reset, processing } = useForm({ body: '', attachment: null });

    const isGroup     = conversation.type === 'group';
    const other       = conversation.participants?.find(p => p.id !== currentUser.id);
    const displayName = isGroup ? (conversation.name ?? 'Group Chat') : (other?.name ?? 'Chat');
    const subtitle    = isGroup
        ? `${conversation.participants?.length ?? 0} members`
        : (other?.role ? other.role.charAt(0).toUpperCase() + other.role.slice(1) : '');

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [messages.length]);

    // Poll for new messages every 5 s when tab is visible
    useEffect(() => {
        const id = setInterval(() => {
            if (!document.hidden) router.reload({ only: ['messages'] });
        }, 5_000);
        return () => clearInterval(id);
    }, []);

    const canSend = !processing && (data.body.trim() || data.attachment);

    function send(e) {
        e?.preventDefault();
        if (!canSend) return;
        post(route('messages.send', { conversation: conversation.id }), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset('body', 'attachment');
                if (inputRef.current) {
                    inputRef.current.style.height = 'auto';
                    inputRef.current.focus();
                }
                setShowEmoji(false);
            },
        });
    }

    function handleKey(e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    }

    function handleChange(e) {
        setData('body', e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    }

    function insertEmoji(emoji) {
        const ta = inputRef.current;
        if (!ta) { setData('body', data.body + emoji); return; }
        const start = ta.selectionStart;
        const end   = ta.selectionEnd;
        setData('body', data.body.slice(0, start) + emoji + data.body.slice(end));
        requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = start + emoji.length;
            ta.focus();
        });
    }

    function handleFileChange(e) {
        setData('attachment', e.target.files?.[0] ?? null);
        e.target.value = '';
    }

    const rows = buildRows(messages, currentUser.id, isGroup);

    return (
        <AuthenticatedLayout>
            <Head title={displayName} />

            {lightbox && (
                <Lightbox
                    src={lightbox.src}
                    name={lightbox.name}
                    onClose={() => setLightbox(null)}
                />
            )}

            <div className="flex h-[calc(100vh-3rem)] flex-col">

                {/* ── Header ── */}
                <div className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 shadow-sm">
                    <Link
                        href={route('messages.index')}
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    >
                        <IconArrowLeft />
                    </Link>

                    {isGroup ? (
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                            <IconGroup />
                        </div>
                    ) : (
                        <UserAvatar
                            name={displayName}
                            avatarUrl={other?.avatar_url ?? null}
                            size={9}
                        />
                    )}

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
                        <p className="truncate text-xs capitalize text-gray-400">{subtitle}</p>
                    </div>

                    {/* Participant avatars for group */}
                    {isGroup && conversation.participants?.length > 0 && (
                        <div className="hidden items-center sm:flex">
                            {conversation.participants.slice(0, 5).map((p, i) => (
                                <div
                                    key={p.id}
                                    title={p.name}
                                    style={{ marginLeft: i === 0 ? 0 : '-8px', zIndex: 5 - i }}
                                    className="relative flex-shrink-0"
                                >
                                    <UserAvatar name={p.name} avatarUrl={p.avatar_url ?? null} size={7} />
                                </div>
                            ))}
                            {conversation.participants.length > 5 && (
                                <div
                                    className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600"
                                    style={{ marginLeft: '-8px', zIndex: 0 }}
                                >
                                    +{conversation.participants.length - 5}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Message thread ── */}
                <div className="flex-1 overflow-y-auto px-4 py-3" style={{ backgroundColor: '#EEF1F5' }}>
                    {rows.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                            <span className="rounded-full bg-black/10 px-4 py-1.5 text-xs text-gray-600">
                                No messages yet — say hello! 👋
                            </span>
                        </div>
                    ) : (
                        rows.map((row, i) =>
                            row.type === 'date' ? (
                                <div key={`d-${i}`} className="my-4 flex justify-center">
                                    <span className="rounded-full bg-black/10 px-3 py-1 text-[11px] text-gray-600">
                                        {row.label}
                                    </span>
                                </div>
                            ) : (
                                <Bubble
                                    key={row.msg.id}
                                    msg={row.msg}
                                    isOwn={row.isOwn}
                                    isFirst={row.isFirst}
                                    isLast={row.isLast}
                                    showAvatar={row.showAvatar}
                                    showName={row.showName}
                                    isGroup={isGroup}
                                    onImageClick={(src, name) => setLightbox({ src, name })}
                                />
                            )
                        )
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* ── Attachment preview bar ── */}
                {data.attachment && (
                    <div className="flex items-center gap-3 border-t border-gray-200 bg-gray-50 px-4 py-2">
                        {isImage(data.attachment.name) ? (
                            <img
                                src={URL.createObjectURL(data.attachment)}
                                alt="preview"
                                className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-500">
                                <IconFile />
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-gray-900">{data.attachment.name}</p>
                            <p className="text-[11px] text-gray-400">{formatBytes(data.attachment.size)}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setData('attachment', null)}
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                            <IconX />
                        </button>
                    </div>
                )}

                {/* ── Input bar ── */}
                <div className="flex flex-shrink-0 items-end gap-2 border-t border-gray-200 bg-white px-3 py-3">

                    {/* Emoji button + picker */}
                    <div ref={emojiAnchorRef} className="relative flex-shrink-0">
                        {showEmoji && (
                            <EmojiPicker
                                anchorRef={emojiAnchorRef}
                                onSelect={e => { insertEmoji(e); setShowEmoji(false); }}
                                onClose={() => setShowEmoji(false)}
                            />
                        )}
                        <button
                            type="button"
                            onClick={() => setShowEmoji(s => !s)}
                            title="Emoji"
                            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                                showEmoji
                                    ? 'bg-blue-50 text-blue-500'
                                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                            }`}
                        >
                            <IconSmile />
                        </button>
                    </div>

                    {/* Attach file button */}
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        title="Attach file"
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                            data.attachment
                                ? 'bg-blue-50 text-blue-500'
                                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                        }`}
                    >
                        <IconPaperclip />
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="*/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    {/* Textarea */}
                    <textarea
                        ref={inputRef}
                        value={data.body}
                        onChange={handleChange}
                        onKeyDown={handleKey}
                        placeholder="Write a message…"
                        rows={1}
                        className="flex-1 resize-none rounded-[22px] border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                        style={{ maxHeight: 120, overflowY: 'auto', lineHeight: '1.5', fontFamily: 'inherit' }}
                    />

                    {/* Send button */}
                    <button
                        type="button"
                        onClick={send}
                        disabled={!canSend}
                        title="Send (Enter)"
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                            canSend
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-200 text-gray-400'
                        }`}
                    >
                        <IconSend />
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
