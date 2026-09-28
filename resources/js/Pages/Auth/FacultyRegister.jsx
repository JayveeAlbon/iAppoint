import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function FacultyRegister() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        employee_id: '',
        department: '',
        office_location: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('faculty.register.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Faculty Registration" />

            <div className="mb-5">
                <h2 className="text-base font-semibold text-gray-900">
                    Faculty Registration
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                    Register your faculty account to share your location with students.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="name" value="Full Name" />
                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email Address" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="employee_id" value="Employee ID" />
                    <TextInput
                        id="employee_id"
                        name="employee_id"
                        value={data.employee_id}
                        className="mt-1 block w-full"
                        placeholder="e.g. FAC-2024-001"
                        onChange={(e) => setData('employee_id', e.target.value)}
                        required
                    />
                    <InputError message={errors.employee_id} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="department" value="Department" />
                    <TextInput
                        id="department"
                        name="department"
                        value={data.department}
                        className="mt-1 block w-full"
                        placeholder="e.g. College of Computer Studies"
                        onChange={(e) => setData('department', e.target.value)}
                        required
                    />
                    <InputError message={errors.department} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="office_location" value="Office Location" />
                    <TextInput
                        id="office_location"
                        name="office_location"
                        value={data.office_location}
                        className="mt-1 block w-full"
                        placeholder="e.g. Room 301, Main Building"
                        onChange={(e) =>
                            setData('office_location', e.target.value)
                        }
                        required
                    />
                    <InputError
                        message={errors.office_location}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Password" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />
                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />
                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="flex flex-col gap-3 pt-1">
                    <div className="flex items-center justify-between">
                        <Link
                            href={route('login')}
                            className="text-sm text-gray-600 underline hover:text-gray-900"
                        >
                            Already registered?
                        </Link>
                        <PrimaryButton disabled={processing}>
                            Register
                        </PrimaryButton>
                    </div>

                    <div className="border-t border-gray-100 pt-3 text-center text-sm text-gray-500">
                        Are you a student?{' '}
                        <Link
                            href={route('register')}
                            className="font-medium text-gray-700 underline hover:text-gray-900"
                        >
                            Register as Student
                        </Link>
                    </div>
                </div>
            </form>
        </GuestLayout>
    );
}
