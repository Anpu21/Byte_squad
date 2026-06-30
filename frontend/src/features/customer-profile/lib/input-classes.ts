import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';

/**
 * Sharp field styling for the customer-profile forms. The visible label is
 * supplied by the surrounding <ProfileField>, so there's no floating label —
 * this is the shared field shell (crisp border, sharp radius, animated focus
 * ring) at the compact h-10 height these forms use.
 */
export const PROFILE_INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-10 px-3`;
