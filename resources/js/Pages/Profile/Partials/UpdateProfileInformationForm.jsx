import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';

function initials(name) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }) {
    const user = usePage().props.auth.user;
    const fileRef = useRef(null);
    const [preview, setPreview] = useState(null);

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const avatarForm = useForm({ avatar: null });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        avatarForm.setData('avatar', file);
        setPreview(URL.createObjectURL(file));
    }

    function uploadAvatar(e) {
        e.preventDefault();
        avatarForm.post(route('profile.avatar'), {
            onSuccess: () => {
                setPreview(null);
                avatarForm.reset();
            },
        });
    }

    const avatarSrc = preview ?? user.avatar_url;

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Update your account's profile information and email address.
                </p>
            </header>

            {/* ── Avatar upload ─────────────────────────────────────────── */}
            <div className="mt-6">
                <p className="mb-2 text-sm font-medium text-gray-700">Profile Photo</p>
                <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 flex-shrink-0">
                        {avatarSrc ? (
                            <img
                                src={avatarSrc}
                                alt={user.name}
                                className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-200"
                            />
                        ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-lg font-semibold text-gray-600 ring-2 ring-gray-200">
                                {initials(user.name)}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Choose photo
                        </button>
                        {preview && (
                            <button
                                type="button"
                                onClick={uploadAvatar}
                                disabled={avatarForm.processing}
                                className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                            >
                                {avatarForm.processing ? 'Uploading…' : 'Save photo'}
                            </button>
                        )}
                        <p className="text-xs text-gray-400">JPG, PNG or WebP · max 2 MB</p>
                    </div>
                </div>
                {status === 'avatar-updated' && (
                    <p className="mt-2 text-sm font-medium text-green-600">Photo updated.</p>
                )}
                {avatarForm.errors.avatar && (
                    <p className="mt-1 text-xs text-red-500">{avatarForm.errors.avatar}</p>
                )}
            </div>

            {/* ── Name + email form ─────────────────────────────────────── */}
            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Name" />
                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />
                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />
                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>
                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                A new verification link has been sent to your email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
