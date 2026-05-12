import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { FRONTEND_ROUTES } from '@/constants/routes';

const PASSWORD_MIN = 8;

export function useChangePasswordPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < PASSWORD_MIN) {
            setError(`New password must be at least ${PASSWORD_MIN} characters`);
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (currentPassword === newPassword) {
            setError(
                'New password must be different from the temporary password',
            );
            return;
        }

        setIsLoading(true);
        try {
            await authService.changePassword(currentPassword, newPassword);
            toast.success(
                'Password changed successfully! Please log in with your new password.',
            );
            logout();
            navigate(FRONTEND_ROUTES.LOGIN);
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as {
                    response?: { data?: { message?: string } };
                };
                setError(
                    axiosErr.response?.data?.message ||
                        'Failed to change password',
                );
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return {
        currentPassword,
        setCurrentPassword,
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        isLoading,
        error,
        handleSubmit,
    };
}
