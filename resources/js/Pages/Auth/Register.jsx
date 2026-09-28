import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';

function Field({ id, label, error, hint, children }) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-700">
                {label}
            </label>
            {children}
            {hint && !error && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
            <InputError message={error} className="mt-1.5" />
        </div>
    );
}

const inputCls =
    'block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        student_id: '',
        course: '',
        year_level: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Student Registration · iAppoint" />

            <div className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
                {/* Left brand panel */}
                <div className="relative hidden overflow-hidden bg-slate-900 lg:block">
                    <div
                        aria-hidden
                        className="absolute inset-0 bg-[radial-gradient(600px_400px_at_20%_20%,rgba(99,102,241,0.25),transparent),radial-gradient(500px_400px_at_80%_80%,rgba(236,72,153,0.2),transparent)]"
                    />
                    <div className="relative flex h-full flex-col justify-between p-10 text-white">
                        <Link href="/" className="flex w-fit items-center gap-2 text-sm font-semibold">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            iAppoint
                        </Link>

                        <div className="max-w-md">
                            <p className="mb-3 text-xs uppercase tracking-wider text-white/50">
                                For Southern Christian College Students
                            </p>
                            <h2 className="text-3xl font-semibold leading-tight">
                                Book appointments with your faculty in seconds.
                            </h2>
                            <p className="mt-3 text-sm leading-relaxed text-white/70">
                                See who is on campus right now, request a consultation, and get real-time
                                updates once your appointment is approved.
                            </p>

                            <ul className="mt-8 space-y-3">
                                {[
                                    'Live faculty availability & map',
                                    'Admin-vetted appointment requests',
                                    'Direct messaging once approved',
                                    'Email notifications for every step',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2 text-sm text-white/80">
                                        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <p className="text-xs text-white/40">
                            © {new Date().getFullYear()} Southern Christian College — iAppoint
                        </p>
                    </div>
                </div>

                {/* Right form panel */}
                <div className="flex items-center justify-center px-6 py-10 sm:px-10">
                    <div className="w-full max-w-md">
                        {/* Mobile brand */}
                        <div className="mb-6 flex items-center gap-2 lg:hidden">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <span className="text-sm font-semibold text-slate-900">iAppoint</span>
                        </div>

                        <div className="mb-6">
                            <h1 className="text-2xl font-semibold text-slate-900">Create your student account</h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Register with your school details to start booking appointments.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <Field id="name" label="Full Name" error={errors.name}>
                                <input
                                    id="name"
                                    name="name"
                                    autoComplete="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Juan D. Cruz"
                                    className={inputCls}
                                    required
                                />
                            </Field>

                            <Field id="email" label="Email Address" error={errors.email} hint="Use your school email if you have one.">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="username"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="you@example.com"
                                    className={inputCls}
                                    required
                                />
                            </Field>

                            <div className="grid grid-cols-2 gap-3">
                                <Field id="student_id" label="Student ID" error={errors.student_id}>
                                    <input
                                        id="student_id"
                                        name="student_id"
                                        value={data.student_id}
                                        onChange={(e) => setData('student_id', e.target.value)}
                                        placeholder="2021-00123"
                                        className={inputCls}
                                        required
                                    />
                                </Field>

                                <Field id="year_level" label="Year Level" error={errors.year_level}>
                                    <select
                                        id="year_level"
                                        name="year_level"
                                        value={data.year_level}
                                        onChange={(e) => setData('year_level', e.target.value)}
                                        className={inputCls}
                                        required
                                    >
                                        <option value="">Select…</option>
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                        <option value="3rd Year">3rd Year</option>
                                        <option value="4th Year">4th Year</option>
                                        <option value="5th Year">5th Year</option>
                                    </select>
                                </Field>
                            </div>

                            <Field id="course" label="Course / Program" error={errors.course}>
                                <input
                                    id="course"
                                    name="course"
                                    value={data.course}
                                    onChange={(e) => setData('course', e.target.value)}
                                    placeholder="e.g. BS Computer Science"
                                    className={inputCls}
                                    required
                                />
                            </Field>

                            <div className="grid grid-cols-2 gap-3">
                                <Field id="password" label="Password" error={errors.password}>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="At least 8 characters"
                                        className={inputCls}
                                        required
                                    />
                                </Field>

                                <Field
                                    id="password_confirmation"
                                    label="Confirm Password"
                                    error={errors.password_confirmation}
                                >
                                    <input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        autoComplete="new-password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Repeat password"
                                        className={inputCls}
                                        required
                                    />
                                </Field>
                            </div>

                            <p className="text-[11px] leading-relaxed text-slate-500">
                                By creating an account you agree that your submitted details will be reviewed
                                by iAppoint administrators before activation.
                            </p>

                            <button
                                type="submit"
                                disabled={processing}
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
                            >
                                {processing ? 'Creating account…' : 'Create account'}
                            </button>
                        </form>

                        <div className="mt-6 flex flex-col gap-1 text-center text-sm text-slate-500">
                            <p>
                                Already registered?{' '}
                                <Link
                                    href={route('login')}
                                    className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700"
                                >
                                    Log in
                                </Link>
                            </p>
                            <p>
                                Are you faculty?{' '}
                                <Link
                                    href={route('faculty.register')}
                                    className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700"
                                >
                                    Register as Faculty
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
