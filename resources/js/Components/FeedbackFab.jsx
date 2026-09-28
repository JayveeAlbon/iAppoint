import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

// ── Small icons ──────────────────────────────────────────────────────────────
const IconMessage = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);
const IconClose = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
const IconCamera = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
    </svg>
);
const IconUpload = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);
const IconCrop = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2v14a2 2 0 0 0 2 2h14" /><path d="M18 22V8a2 2 0 0 0-2-2H2" />
    </svg>
);

// ── Capture the browser tab as an image (native API, no deps) ────────────────
async function captureTab() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Your browser does not support screen capture. Please upload an image instead.');
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: false,
        preferCurrentTab: true,
    });

    const track = stream.getVideoTracks()[0];
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    await video.play();

    // Wait a tick to ensure a frame is available
    await new Promise((r) => setTimeout(r, 120));

    const w = video.videoWidth;
    const h = video.videoHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(video, 0, 0, w, h);

    track.stop();
    video.srcObject = null;

    return await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png'),
    );
}

// ── Crop tool: shows image, user drags to select a rect, confirms ────────────
function CropStage({ blob, onCropped, onCancel }) {
    const imgRef = useRef(null);
    const boxRef = useRef(null);
    const [imgUrl, setImgUrl] = useState(null);
    const [imgDims, setImgDims] = useState(null); // natural
    const [rect, setRect] = useState(null); // { x, y, w, h } in display coords
    const [dragging, setDragging] = useState(false);
    const dragStart = useRef(null);

    useEffect(() => {
        const url = URL.createObjectURL(blob);
        setImgUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [blob]);

    function onImgLoad(e) {
        setImgDims({ nw: e.target.naturalWidth, nh: e.target.naturalHeight });
    }

    function pos(e) {
        const b = boxRef.current.getBoundingClientRect();
        const cx = (e.touches ? e.touches[0].clientX : e.clientX) - b.left;
        const cy = (e.touches ? e.touches[0].clientY : e.clientY) - b.top;
        return {
            x: Math.max(0, Math.min(b.width, cx)),
            y: Math.max(0, Math.min(b.height, cy)),
        };
    }

    function onDown(e) {
        e.preventDefault();
        const p = pos(e);
        dragStart.current = p;
        setRect({ x: p.x, y: p.y, w: 0, h: 0 });
        setDragging(true);
    }
    function onMove(e) {
        if (!dragging) return;
        const p = pos(e);
        const s = dragStart.current;
        setRect({
            x: Math.min(s.x, p.x),
            y: Math.min(s.y, p.y),
            w: Math.abs(p.x - s.x),
            h: Math.abs(p.y - s.y),
        });
    }
    function onUp() {
        setDragging(false);
    }

    function confirm() {
        if (!rect || rect.w < 4 || rect.h < 4) {
            onCropped(blob); // just use the full image
            return;
        }
        const img = imgRef.current;
        const displayW = img.clientWidth;
        const displayH = img.clientHeight;
        const scaleX = imgDims.nw / displayW;
        const scaleY = imgDims.nh / displayH;

        const sx = Math.round(rect.x * scaleX);
        const sy = Math.round(rect.y * scaleY);
        const sw = Math.round(rect.w * scaleX);
        const sh = Math.round(rect.h * scaleY);

        const canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        canvas.toBlob((b) => onCropped(b), 'image/png');
    }

    return (
        <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-500">
                Drag on the image to select the area to send. Or press <span className="font-medium">Use full image</span>.
            </p>

            <div
                ref={boxRef}
                onMouseDown={onDown}
                onMouseMove={onMove}
                onMouseUp={onUp}
                onMouseLeave={onUp}
                onTouchStart={onDown}
                onTouchMove={onMove}
                onTouchEnd={onUp}
                className="relative max-h-[55vh] cursor-crosshair overflow-hidden rounded-md border border-gray-200 bg-gray-100 select-none"
            >
                {imgUrl && (
                    <img
                        ref={imgRef}
                        src={imgUrl}
                        alt="snapshot"
                        onLoad={onImgLoad}
                        draggable={false}
                        className="block max-h-[55vh] w-auto max-w-full"
                    />
                )}

                {rect && (
                    <>
                        {/* Dim overlay outside selection using 4 divs */}
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-x-0" style={{ top: 0, height: rect.y, background: 'rgba(0,0,0,0.5)' }} />
                            <div className="absolute" style={{ top: rect.y, left: 0, width: rect.x, height: rect.h, background: 'rgba(0,0,0,0.5)' }} />
                            <div className="absolute" style={{ top: rect.y, left: rect.x + rect.w, right: 0, height: rect.h, background: 'rgba(0,0,0,0.5)' }} />
                            <div className="absolute inset-x-0" style={{ top: rect.y + rect.h, bottom: 0, background: 'rgba(0,0,0,0.5)' }} />
                            <div
                                className="absolute border-2 border-indigo-400"
                                style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
                            />
                        </div>
                    </>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={() => onCropped(blob)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                    Use full image
                </button>
                <button
                    type="button"
                    onClick={confirm}
                    disabled={!rect || rect.w < 4 || rect.h < 4}
                    className="flex-1 rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                >
                    Crop & Continue
                </button>
            </div>
        </div>
    );
}

// ── Feedback form (after optional screenshot is chosen) ──────────────────────
function FeedbackForm({ screenshotBlob, onBack, onSuccess }) {
    const [category, setCategory] = useState('bug');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const previewUrl = screenshotBlob ? URL.createObjectURL(screenshotBlob) : null;
    useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

    async function submit(e) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const fd = new FormData();
        fd.append('category', category);
        fd.append('subject', subject);
        fd.append('message', message);
        fd.append('page_url', window.location.href);
        if (screenshotBlob) {
            fd.append('screenshot', screenshotBlob, 'snapshot.png');
        }

        router.post(route('user-feedback.store'), fd, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => onSuccess(),
            onError: (errs) => setError(Object.values(errs)[0] ?? 'Submission failed.'),
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-3">
            {previewUrl && (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
                    <img src={previewUrl} alt="snapshot preview" className="mx-auto max-h-40 rounded" />
                </div>
            )}

            <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Category</label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                >
                    <option value="bug">Bug / Something's broken</option>
                    <option value="suggestion">Suggestion / Improvement</option>
                    <option value="question">Question</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Subject</label>
                <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={200}
                    required
                    placeholder="Brief description…"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                />
            </div>

            <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Details</label>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    maxLength={5000}
                    required
                    placeholder="Tell the admin what happened, what you expected, or how we can improve…"
                    className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-2">
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Back
                    </button>
                )}
                <button
                    type="submit"
                    disabled={submitting || !subject || !message}
                    className="flex-1 rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                >
                    {submitting ? 'Sending…' : 'Send to Admin'}
                </button>
            </div>
        </form>
    );
}

// ── Root: FAB + modal orchestrator ───────────────────────────────────────────
export default function FeedbackFab() {
    // steps: 'closed' | 'menu' | 'capturing' | 'crop' | 'form' | 'sent'
    const [step, setStep] = useState('closed');
    const [blob, setBlob] = useState(null);
    const [captureError, setCaptureError] = useState(null);
    const fileInputRef = useRef(null);

    function open() {
        setStep('menu');
        setBlob(null);
        setCaptureError(null);
    }
    function close() {
        setStep('closed');
        setBlob(null);
        setCaptureError(null);
    }

    async function takeScreenshot() {
        setCaptureError(null);
        setStep('capturing');
        try {
            const b = await captureTab();
            setBlob(b);
            setStep('crop');
        } catch (err) {
            setCaptureError(err.message || 'Screen capture cancelled.');
            setStep('menu');
        }
    }

    function onFilePicked(e) {
        const f = e.target.files?.[0];
        if (!f) return;
        setBlob(f);
        setStep('crop');
        e.target.value = '';
    }

    function skipScreenshot() {
        setBlob(null);
        setStep('form');
    }

    return (
        <>
            {/* Floating action button */}
            {step === 'closed' && (
                <button
                    onClick={open}
                    className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-500"
                    title="Send feedback to admin"
                    aria-label="Send feedback"
                >
                    <IconMessage />
                </button>
            )}

            {step !== 'closed' && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
                    <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                            <h3 className="text-sm font-semibold text-gray-900">
                                {step === 'menu'      && 'Send feedback to Admin'}
                                {step === 'capturing' && 'Preparing screenshot…'}
                                {step === 'crop'      && 'Crop your snapshot'}
                                {step === 'form'      && 'Feedback details'}
                                {step === 'sent'      && 'Thank you!'}
                            </h3>
                            <button
                                onClick={close}
                                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <IconClose />
                            </button>
                        </div>

                        <div className="p-5">
                            {step === 'menu' && (
                                <>
                                    <p className="mb-4 text-xs text-gray-500">
                                        Report a bug, suggest an improvement, or ask a question — with an optional snapshot.
                                    </p>

                                    <div className="grid gap-2 sm:grid-cols-3">
                                        <button
                                            onClick={takeScreenshot}
                                            className="flex flex-col items-center gap-1.5 rounded-lg border border-gray-200 p-3 text-center hover:bg-gray-50"
                                        >
                                            <span className="text-indigo-500"><IconCamera /></span>
                                            <span className="text-xs font-medium text-gray-900">Snapshot Tab</span>
                                            <span className="text-[10px] text-gray-400">Browser capture</span>
                                        </button>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex flex-col items-center gap-1.5 rounded-lg border border-gray-200 p-3 text-center hover:bg-gray-50"
                                        >
                                            <span className="text-indigo-500"><IconUpload /></span>
                                            <span className="text-xs font-medium text-gray-900">Upload Image</span>
                                            <span className="text-[10px] text-gray-400">Then crop</span>
                                        </button>
                                        <button
                                            onClick={skipScreenshot}
                                            className="flex flex-col items-center gap-1.5 rounded-lg border border-gray-200 p-3 text-center hover:bg-gray-50"
                                        >
                                            <span className="text-indigo-500"><IconCrop /></span>
                                            <span className="text-xs font-medium text-gray-900">No image</span>
                                            <span className="text-[10px] text-gray-400">Text only</span>
                                        </button>
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={onFilePicked}
                                        className="hidden"
                                    />

                                    {captureError && (
                                        <p className="mt-3 rounded bg-red-50 px-3 py-2 text-xs text-red-600">
                                            {captureError}
                                        </p>
                                    )}
                                </>
                            )}

                            {step === 'capturing' && (
                                <p className="py-6 text-center text-sm text-gray-500">
                                    Choose this tab in the picker to capture the current page…
                                </p>
                            )}

                            {step === 'crop' && blob && (
                                <CropStage
                                    blob={blob}
                                    onCancel={() => setStep('menu')}
                                    onCropped={(b) => {
                                        setBlob(b);
                                        setStep('form');
                                    }}
                                />
                            )}

                            {step === 'form' && (
                                <FeedbackForm
                                    screenshotBlob={blob}
                                    onBack={() => (blob ? setStep('crop') : setStep('menu'))}
                                    onSuccess={() => setStep('sent')}
                                />
                            )}

                            {step === 'sent' && (
                                <div className="py-6 text-center">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">Feedback sent to admin.</p>
                                    <p className="mt-1 text-xs text-gray-500">Thanks — someone will look at it soon.</p>
                                    <button
                                        onClick={close}
                                        className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
