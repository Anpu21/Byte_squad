import { useState } from 'react';
import type { IUserProfile } from '@/types';

/**
 * Hydrates form fields from the profile query exactly once on first load.
 * Uses the React-recommended "adjust state during render" pattern so the
 * fields stay editable after hydration without round-tripping through an
 * effect.
 */
export function usePersonalInfo(profile: IUserProfile | undefined) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [hydratedId, setHydratedId] = useState<string | null>(null);

    if (profile && hydratedId !== profile.id) {
        setHydratedId(profile.id);
        setFirstName(profile.firstName);
        setLastName(profile.lastName);
        setPhone(profile.phone ?? '');
    }

    return {
        firstName,
        setFirstName,
        lastName,
        setLastName,
        phone,
        setPhone,
    };
}
