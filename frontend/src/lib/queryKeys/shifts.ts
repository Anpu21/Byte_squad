export const shifts = {
    all: () => ['shifts'] as const,
    current: () => ['shifts', 'current'] as const,
} as const;
