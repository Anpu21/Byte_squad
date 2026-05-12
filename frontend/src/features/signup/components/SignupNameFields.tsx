import Input from '@/components/ui/Input';
import type { SignupErrors } from '../hooks/useSignupForm';

interface SignupNameFieldsProps {
    firstName: string;
    setFirstName: (v: string) => void;
    lastName: string;
    setLastName: (v: string) => void;
    errors: SignupErrors;
    clearError: (field: keyof SignupErrors) => void;
}

export function SignupNameFields({
    firstName,
    setFirstName,
    lastName,
    setLastName,
    errors,
    clearError,
}: SignupNameFieldsProps) {
    return (
        <div className="grid grid-cols-2 gap-3">
            <Input
                label="First name"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => {
                    setFirstName(e.target.value);
                    clearError('firstName');
                }}
                placeholder="Jane"
                error={errors.firstName}
                sizeVariant="lg"
            />
            <Input
                label="Last name"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => {
                    setLastName(e.target.value);
                    clearError('lastName');
                }}
                placeholder="Doe"
                error={errors.lastName}
                sizeVariant="lg"
            />
        </div>
    );
}
