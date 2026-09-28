import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import InsertEmoticonRoundedIcon from '@mui/icons-material/InsertEmoticonRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function avatarColor(name) {
    const palette = ['#6366F1','#8B5CF6','#EC4899','#EF4444','#F59E0B','#10B981','#3B82F6','#06B6D4'];
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

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|svg)$/i;

function isImage(name) {
    return name && IMAGE_EXT.test(name);
}

function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        <div
            style={{
                position: 'absolute',
                bottom: 'calc(100% + 6px)',
                left: 0,
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                padding: 8,
                zIndex: 100,
                width: 316,
            }}
        >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 1 }}>
                {EMOJIS.map(e => (
                    <button
                        key={e}
                        type="button"
                        onClick={() => onSelect(e)}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 20, lineHeight: 1, padding: '3px 1px',
                            borderRadius: 6, transition: 'background 0.1s',
                        }}
                        onMouseEnter={ev => (ev.currentTarget.style.background = '#F3F4F6')}
                        onMouseLeave={ev => (ev.currentTarget.style.background = 'none')}
                    >
                        {e}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Row builder ────────────────────────────────────────────────────────────────

function buildRows(messages, currentUserId, isGroup) {
    const rows = [];
    if (messages.length === 0) return rows;

    const groups = [];
    for (const msg of messages) {
        const isOwn = msg.sender_id === currentUserId;
        const last = groups[groups.length - 1];
        const sameDay = last && formatDate(last.msgs[last.msgs.length - 1].created_at) === formatDate(msg.created_at);
        const sameSender = last && last.msgs[last.msgs.length - 1].sender_id === msg.sender_id;
        if (last && isOwn === last.isOwn && sameSender && sameDay) {
            last.msgs.push(msg);
        } else {
            groups.push({ msgs: [msg], isOwn });
        }
    }

    let lastDate = '';
    for (const group of groups) {
        for (let i = 0; i < group.msgs.length; i++) {
            const msg = group.msgs[i];
            const dateLabel = formatDate(msg.created_at);
            if (dateLabel !== lastDate) {
                rows.push({ type: 'date', label: dateLabel });
                lastDate = dateLabel;
            }
            rows.push({
                type: 'msg', msg, isOwn: group.isOwn,
                isFirst: i === 0, isLast: i === group.msgs.length - 1,
                showAvatar: !group.isOwn && i === group.msgs.length - 1 && isGroup,
                showName:   !group.isOwn && i === 0 && isGroup,
            });
        }
    }

    return rows;
}

// ── Lightbox modal ─────────────────────────────────────────────────────────────

function LightboxModal({ src, name, onClose }) {
    useEffect(() => {
        function onKey(e) { if (e.key === 'Escape') onClose(); }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                background: 'rgba(0,0,0,0.88)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
        >
            <img
                src={src}
                alt={name}
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, objectFit: 'contain', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
            />
            <button
                onClick={onClose}
                style={{
                    position: 'absolute', top: 16, right: 16,
                    background: 'rgba(255,255,255,0.15)', border: 'none',
                    color: '#fff', borderRadius: '50%', width: 36, height: 36,
                    cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                ✕
            </button>
            <a
                href={src}
                download={name}
                onClick={e => e.stopPropagation()}
                style={{
                    position: 'absolute', top: 16, right: 60,
                    background: 'rgba(255,255,255,0.15)', border: 'none',
                    color: '#fff', borderRadius: '50%', width: 36, height: 36,
                    cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textDecoration: 'none',
                }}
                title="Download"
            >
                ↓
            </a>
        </div>
    );
}

// ── Attachment display ─────────────────────────────────────────────────────────

function AttachmentView({ url, name, isOwn, onImageClick }) {
    if (!url) return null;

    if (isImage(name)) {
        return (
            <button
                type="button"
                onClick={() => onImageClick(url, name)}
                style={{ display: 'block', marginTop: 4, background: 'none', border: 'none', padding: 0, cursor: 'zoom-in' }}
            >
                <img
                    src={url}
                    alt={name}
                    style={{ maxWidth: 220, maxHeight: 200, borderRadius: 10, display: 'block', objectFit: 'cover' }}
                />
            </button>
        );
    }

    return (
        <a
            href={url}
            download={name}
            style={{
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
                padding: '8px 10px',
                background: isOwn ? 'rgba(255,255,255,0.15)' : '#F3F4F6',
                borderRadius: 8,
                textDecoration: 'none',
                color: isOwn ? '#fff' : '#374151',
            }}
        >
            <InsertDriveFileRoundedIcon sx={{ fontSize: 18, opacity: 0.8 }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 500, wordBreak: 'break-all' }}>{name}</span>
        </a>
    );
}

// ── Bubble ─────────────────────────────────────────────────────────────────────

function Bubble({ msg, isOwn, isFirst, isLast, showAvatar, showName, isGroup, onImageClick }) {
    const color = avatarColor(msg.sender?.name ?? '?');
    const sentRadius = isLast ? '18px 18px 4px 18px' : '18px';
    const recvRadius = isLast ? '18px 18px 18px 4px' : '18px';
    const hasAttachment = !!msg.attachment_url;
    const bodyText = msg.body?.trim();

    return (
        <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'} ${isLast ? 'mb-2' : 'mb-0.5'}`}>
            {!isOwn && isGroup && (
                <div className="w-8 flex-shrink-0 self-end">
                    {showAvatar ? (
                        <Avatar sx={{ width: 32, height: 32, bgcolor: color, fontSize: '0.65rem', fontWeight: 700 }}>
                            {initials(msg.sender?.name ?? '?')}
                        </Avatar>
                    ) : null}
                </div>
            )}

            <div className={`flex min-w-0 flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[72%]`}>
                {showName && (
                    <span className="mb-0.5 ml-1 text-[11px] font-semibold" style={{ color }}>
                        {msg.sender?.name}
                    </span>
                )}

                <Tooltip
                    title={formatTime(msg.created_at)}
                    placement={isOwn ? 'left' : 'right'}
                    arrow
                    slotProps={{ tooltip: { sx: { fontSize: '0.65rem' } } }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            px: hasAttachment && !bodyText ? 1 : 1.5,
                            py: hasAttachment && !bodyText ? 0.75 : 1,
                            borderRadius: isOwn ? sentRadius : recvRadius,
                            bgcolor: isOwn ? '#3B82F6' : '#FFFFFF',
                            color: isOwn ? '#fff' : '#111827',
                            boxShadow: isOwn
                                ? '0 1px 2px rgba(59,130,246,0.25)'
                                : '0 1px 3px rgba(0,0,0,0.08)',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                            cursor: 'default',
                            userSelect: 'text',
                        }}
                    >
                        {hasAttachment && (
                            <AttachmentView
                                url={msg.attachment_url}
                                name={msg.attachment_name}
                                isOwn={isOwn}
                                onImageClick={onImageClick}
                            />
                        )}
                        {bodyText && (
                            <p style={{ fontSize: '0.875rem', lineHeight: 1.5, margin: 0, marginTop: hasAttachment ? 4 : 0 }}>
                                {bodyText}
                            </p>
                        )}
                        <p style={{
                            fontSize: '0.625rem', textAlign: 'right', marginTop: 2,
                            color: isOwn ? 'rgba(255,255,255,0.65)' : '#9CA3AF', lineHeight: 1,
                        }}>
                            {formatTime(msg.created_at)}
                        </p>
                    </Paper>
                </Tooltip>
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
    const other       = conversation.participants.find(p => p.id !== currentUser.id);
    const displayName = isGroup ? (conversation.name ?? 'Group Chat') : (other?.name ?? 'Chat');
    const subtitle    = isGroup
        ? `${conversation.participants.length} members`
        : (other?.role ? other.role.charAt(0).toUpperCase() + other.role.slice(1) : '');
    const headerColor = avatarColor(displayName);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [messages.length]);

    useEffect(() => {
        const id = setInterval(() => {
            if (!document.hidden) router.reload({ only: ['messages'] });
        }, 5_000);
        return () => clearInterval(id);
    }, []);

    const canSend = !processing && (data.body.trim() || data.attachment);

    function send(e) {
        e.preventDefault();
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
            },
        });
    }

    function handleKey(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send(e);
        }
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
        const next  = data.body.slice(0, start) + emoji + data.body.slice(end);
        setData('body', next);
        requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = start + emoji.length;
            ta.focus();
        });
    }

    function handleFileChange(e) {
        const file = e.target.files?.[0] ?? null;
        setData('attachment', file);
        e.target.value = '';
    }

    function removeFile() {
        setData('attachment', null);
    }

    const rows = buildRows(messages, currentUser.id, isGroup);

    return (
        <AuthenticatedLayout>
            <Head title={displayName} />

            {lightbox && (
            <LightboxModal
                src={lightbox.src}
                name={lightbox.name}
                onClose={() => setLightbox(null)}
            />
        )}

        <div className="flex h-[calc(100vh-3rem)] flex-col">
                {/* Header */}
                <div
                    className="flex h-14 flex-shrink-0 items-center gap-3 px-4 shadow-sm"
                    style={{ background: '#fff', borderBottom: '1px solid #E5E7EB' }}
                >
                    <Link
                        href={route('messages.index')}
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
                    >
                        <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
                    </Link>

                    {isGroup ? (
                        <Avatar sx={{ width: 36, height: 36, bgcolor: '#EFF6FF', color: '#3B82F6' }}>
                            <GroupsRoundedIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                    ) : (
                        <Avatar sx={{ width: 36, height: 36, bgcolor: headerColor, fontSize: '0.7rem', fontWeight: 700 }}>
                            {initials(displayName)}
                        </Avatar>
                    )}

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
                        <p className="truncate text-xs capitalize text-gray-400">{subtitle}</p>
                    </div>
                </div>

                {/* Message thread */}
                <div className="flex-1 overflow-y-auto px-4 py-3" style={{ backgroundColor: '#EEF1F5' }}>
                    {rows.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                            <span style={{ background: 'rgba(0,0,0,0.08)', borderRadius: 20, padding: '6px 16px', fontSize: '0.75rem', color: '#4B5563' }}>
                                No messages yet — say hello!
                            </span>
                        </div>
                    ) : (
                        <>
                            {rows.map((row, i) =>
                                row.type === 'date' ? (
                                    <div key={`d-${i}`} className="my-4 flex justify-center">
                                        <span style={{ background: 'rgba(0,0,0,0.1)', borderRadius: 20, padding: '3px 12px', fontSize: '0.6875rem', color: '#374151' }}>
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
                            )}
                        </>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Attachment preview bar */}
                {data.attachment && (
                    <div
                        style={{
                            borderTop: '1px solid #E5E7EB',
                            background: '#F9FAFB',
                            padding: '8px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        {isImage(data.attachment.name) ? (
                            <img
                                src={URL.createObjectURL(data.attachment)}
                                alt="preview"
                                style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                            />
                        ) : (
                            <div style={{ width: 40, height: 40, background: '#E5E7EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <InsertDriveFileRoundedIcon sx={{ fontSize: 20, color: '#6B7280' }} />
                            </div>
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {data.attachment.name}
                            </p>
                            <p style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>
                                {formatBytes(data.attachment.size)}
                            </p>
                        </div>
                        <IconButton size="small" onClick={removeFile} sx={{ color: '#9CA3AF', '&:hover': { color: '#EF4444' } }}>
                            <CloseRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </div>
                )}

                {/* Input bar */}
                <div
                    className="flex flex-shrink-0 items-end gap-2 px-3 py-3"
                    style={{ borderTop: '1px solid #E5E7EB', background: '#fff', position: 'relative' }}
                >
                    {/* Emoji button + picker (wrapped so outside-click excludes the button) */}
                    <div ref={emojiAnchorRef} style={{ position: 'relative', flexShrink: 0 }}>
                        {showEmoji && (
                            <EmojiPicker
                                anchorRef={emojiAnchorRef}
                                onSelect={e => { insertEmoji(e); setShowEmoji(false); }}
                                onClose={() => setShowEmoji(false)}
                            />
                        )}
                        <Tooltip title="Emoji" placement="top">
                            <IconButton
                                type="button"
                                onClick={() => setShowEmoji(s => !s)}
                                sx={{
                                    width: 36, height: 36,
                                    color: showEmoji ? '#3B82F6' : '#9CA3AF',
                                    '&:hover': { color: '#3B82F6', bgcolor: '#EFF6FF' },
                                }}
                            >
                                <InsertEmoticonRoundedIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                        </Tooltip>
                    </div>

                    {/* Attachment button */}
                    <Tooltip title="Attach file" placement="top">
                        <IconButton
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            sx={{
                                width: 36, height: 36, flexShrink: 0,
                                color: data.attachment ? '#3B82F6' : '#9CA3AF',
                                '&:hover': { color: '#3B82F6', bgcolor: '#EFF6FF' },
                            }}
                        >
                            <AttachFileRoundedIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Tooltip>
                    <input ref={fileRef} type="file" accept="*/*" style={{ display: 'none' }} onChange={handleFileChange} />

                    {/* Text area */}
                    <textarea
                        ref={inputRef}
                        value={data.body}
                        onChange={handleChange}
                        onKeyDown={handleKey}
                        placeholder="Write a message…"
                        rows={1}
                        style={{
                            flex: 1, resize: 'none',
                            borderRadius: 22, border: '1.5px solid #E5E7EB',
                            background: '#F9FAFB', padding: '10px 16px',
                            fontSize: '0.875rem', color: '#111827', outline: 'none',
                            maxHeight: 120, overflowY: 'auto', lineHeight: 1.5,
                            transition: 'border-color 0.15s', fontFamily: 'inherit',
                        }}
                        onFocus={e => (e.target.style.borderColor = '#93C5FD')}
                        onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                    />

                    {/* Send button */}
                    <IconButton
                        onClick={send}
                        disabled={!canSend}
                        sx={{
                            width: 42, height: 42, flexShrink: 0,
                            bgcolor: canSend ? '#3B82F6' : '#E5E7EB',
                            color: canSend ? '#fff' : '#9CA3AF',
                            '&:hover': { bgcolor: canSend ? '#2563EB' : '#E5E7EB' },
                            '&.Mui-disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' },
                            transition: 'background-color 0.15s',
                        }}
                    >
                        <SendRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
