import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

function IconArrow({ className = '' }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
        </svg>
    );
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';

function loadGoogleScript() {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return reject(new Error('SSR'));
        if (window.google?.accounts?.id) return resolve(window.google);

        const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
        if (existing) {
            existing.addEventListener('load', () => resolve(window.google));
            existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')));
            return;
        }

        const script = document.createElement('script');
        script.src = GIS_SRC;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.google);
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(script);
    });
}

export default function Welcome({ laravelVersion, phpVersion }) {
    const { props } = usePage();
    const auth = props.auth;
    const googleClientId = props.google_client_id;
    const flash = props.flash || {};
    const loggedIn = !!auth?.user;

    const googleButtonRef = useRef(null);
    const [googleError, setGoogleError] = useState('');
    const [signingIn, setSigningIn] = useState(false);
    const [registeredModal, setRegisteredModal] = useState(flash.registered || null);

    useEffect(() => {
        if (flash.registered) setRegisteredModal(flash.registered);
    }, [flash.registered]);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    useEffect(() => {
        if (loggedIn) return;
        if (!googleClientId) {
            setGoogleError('Google Sign-In is not configured. Set GOOGLE_CLIENT_ID in your .env file.');
            return;
        }

        let cancelled = false;

        loadGoogleScript()
            .then((google) => {
                if (cancelled || !google?.accounts?.id) return;

                google.accounts.id.initialize({
                    client_id: googleClientId,
                    ux_mode: 'popup',
                    auto_select: false,
                    callback: (response) => {
                        if (!response?.credential) {
                            setGoogleError('Google did not return a credential. Please try again.');
                            return;
                        }
                        setGoogleError('');
                        setSigningIn(true);
                        router.post(
                            route('auth.google.callback'),
                            { credential: response.credential },
                            {
                                preserveScroll: true,
                                onError: (errs) => {
                                    setSigningIn(false);
                                    setGoogleError(errs?.credential || 'Sign-in failed. Please try again.');
                                },
                                onFinish: () => setSigningIn(false),
                            },
                        );
                    },
                });

                if (googleButtonRef.current) {
                    googleButtonRef.current.innerHTML = '';
                    google.accounts.id.renderButton(googleButtonRef.current, {
                        theme: 'outline',
                        size: 'large',
                        type: 'standard',
                        shape: 'rectangular',
                        text: 'signin_with',
                        logo_alignment: 'center',
                        width: 320,
                    });
                }
            })
            .catch(() => {
                if (!cancelled) setGoogleError('Could not load Google Sign-In. Check your connection and try again.');
            });

        return () => {
            cancelled = true;
        };
    }, [googleClientId, loggedIn]);

    return (
        <>
            <Head title="iAppoint — Southern Christian College" />

            <div
                className="relative min-h-screen bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/backgrounds/sccbg.jpg')" }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/70 to-slate-900/85" />

                <div className="relative flex min-h-screen flex-col">
                    <header className="px-6 py-5 sm:px-10">
                        <div className="mx-auto flex max-w-6xl items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-white/40">
                                    <img
                                        src="/img/iappoint.png"
                                        alt="iAppoint logo"
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                                <div className="leading-tight">
                                    <div className="text-base font-semibold text-white">iAppoint</div>
                                    <div className="text-xs text-slate-300">Southern Christian College</div>
                                </div>
                            </div>

                            {loggedIn && (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
                                >
                                    Open Dashboard <IconArrow className="h-3.5 w-3.5" />
                                </Link>
                            )}
                        </div>
                    </header>

                    <main className="flex flex-1 items-center px-6 py-10 sm:px-10">
                        <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
                            <div className="text-white">
                                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-slate-100 backdrop-blur">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    Campus appointment system
                                </span>

                                <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                                    Find your faculty.
                                    <br />
                                    <span className="text-slate-300">Book with a tap.</span>
                                </h1>

                                <p className="mt-5 max-w-md text-base text-slate-200/90">
                                    iAppoint helps SCC students see who's on campus in real
                                    time, request consultations, and keep in touch — all from one
                                    place.
                                </p>
                            </div>

                            <div className="w-full max-w-[420px] justify-self-center lg:justify-self-end">
                                <div className="rounded-2xl bg-white p-8 shadow-[0_20px_60px_-15px_rgba(2,6,23,0.45)] ring-1 ring-slate-900/5 sm:p-10">
                                    {loggedIn ? (
                                        <div className="text-center">
                                            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                                                Welcome back, {auth.user.name.split(' ')[0]}.
                                            </h2>
                                            <p className="mt-2 text-sm text-slate-500">You're already signed in.</p>
                                            <Link
                                                href={route('dashboard')}
                                                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                                            >
                                                Go to Dashboard <IconArrow className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                                                    Sign in
                                                </h2>
                                                <p className="mt-1.5 text-sm text-slate-500">
                                                    Access your iAppoint account to continue.
                                                </p>
                                            </div>

                                            {flash.status && (
                                                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
                                                    {flash.status}
                                                </div>
                                            )}
                                            {flash.success && (
                                                <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-900">
                                                    {flash.success}
                                                </div>
                                            )}
                                            {flash.error && (
                                                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-900">
                                                    {flash.error}
                                                </div>
                                            )}

                                            <form onSubmit={submit} className="mt-8 space-y-5">
                                                <div className="space-y-1.5">
                                                    <label htmlFor="email" className="block text-xs font-medium text-slate-700">
                                                        Email address
                                                    </label>
                                                    <input
                                                        id="email"
                                                        type="email"
                                                        autoComplete="username"
                                                        required
                                                        value={data.email}
                                                        onChange={(e) => setData('email', e.target.value)}
                                                        placeholder="you@scc.edu.ph"
                                                        className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                                    />
                                                    {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <div className="flex items-baseline justify-between">
                                                        <label htmlFor="password" className="block text-xs font-medium text-slate-700">
                                                            Password
                                                        </label>
                                                        <Link
                                                            href={route('password.request')}
                                                            className="text-xs font-medium text-slate-500 hover:text-slate-900"
                                                        >
                                                            Forgot?
                                                        </Link>
                                                    </div>
                                                    <input
                                                        id="password"
                                                        type="password"
                                                        autoComplete="current-password"
                                                        required
                                                        value={data.password}
                                                        onChange={(e) => setData('password', e.target.value)}
                                                        placeholder="••••••••"
                                                        className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                                    />
                                                    {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                                                </div>

                                                <label className="flex select-none items-center gap-2 text-xs text-slate-600">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.remember}
                                                        onChange={(e) => setData('remember', e.target.checked)}
                                                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                                    />
                                                    Remember me on this device
                                                </label>

                                                <button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                                                >
                                                    {processing ? 'Signing in…' : 'Sign in'}
                                                </button>
                                            </form>

                                            <div className="my-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                                                <span className="h-px flex-1 bg-slate-200" />
                                                or continue with
                                                <span className="h-px flex-1 bg-slate-200" />
                                            </div>

                                            <div className="flex flex-col items-center">
                                                <div ref={googleButtonRef} className="min-h-[44px] w-full [&>div]:!w-full" aria-live="polite" />
                                                {signingIn && (
                                                    <p className="mt-2 text-xs text-slate-500">Signing you in…</p>
                                                )}
                                                {googleError && (
                                                    <p className="mt-2 text-center text-xs text-red-600">{googleError}</p>
                                                )}
                                            </div>

                                            <div className="mt-8 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
                                                New to iAppoint?{' '}
                                                <Link href={route('register')} className="font-medium text-slate-900 hover:underline">
                                                    Register as student
                                                </Link>
                                                <span className="mx-2 text-slate-300">·</span>
                                                <Link href={route('faculty.register')} className="font-medium text-slate-900 hover:underline">
                                                    Register as faculty
                                                </Link>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <p className="mt-5 text-center text-[11px] text-slate-300/80">
                                    By continuing you agree to iAppoint's campus usage policy.
                                </p>
                            </div>
                        </div>
                    </main>

                    <footer className="px-6 pb-6 pt-4 sm:px-10">
                        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 text-[11px] text-slate-300/80 sm:flex-row">
                            <p>© {new Date().getFullYear()} iAppoint · Southern Christian College</p>
                            <p>Laravel v{laravelVersion} · PHP v{phpVersion}</p>
                        </div>
                    </footer>
                </div>
            </div>

            {registeredModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="registered-title"
                >
                    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-900/5">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                            <svg viewBox="0 0 24 24" className="h-9 w-9 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>

                        <h3 id="registered-title" className="mt-5 text-center text-xl font-semibold text-slate-900">
                            Account created successfully
                        </h3>
                        <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">
                            Welcome, <span className="font-semibold text-slate-900">{registeredModal.name}</span>! Your iAppoint account
                            {' '}(<span className="font-mono text-xs text-slate-500">{registeredModal.email}</span>) is now{' '}
                            <span className="font-semibold text-amber-700">pending admin approval</span>.
                        </p>

                        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
                            <p className="font-semibold">What happens next?</p>
                            <ul className="mt-1 list-disc pl-4 space-y-0.5">
                                <li>An administrator will review your account.</li>
                                <li>You'll receive an email once your account is approved.</li>
                                <li>Then you can sign in again with Google to access iAppoint.</li>
                            </ul>
                        </div>

                        <button
                            type="button"
                            onClick={() => setRegisteredModal(null)}
                            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
