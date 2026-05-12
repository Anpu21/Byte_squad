import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { authService } from '@/services/auth.service';

const MIN_PASSWORD_LENGTH = 8;

export function usePasswordChange() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            setError(
                `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
            );
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setSubmitting(true);
        try {
            await authService.changePassword(currentPassword, newPassword);
            toast.success('Password updated');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                setError(data?.message ?? 'Failed to change password');
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return {
        currentPassword,
        setCurrentPassword,
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        error,
        submitting,
        submit,
    };
}
