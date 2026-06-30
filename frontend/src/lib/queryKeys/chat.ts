export const chat = {
    conversation: (groupId: string) =>
        ['chat', 'conversation', groupId] as const,
    history: (conversationId: string) =>
        ['chat', 'history', conversationId] as const,
    participants: (conversationId: string) =>
        ['chat', 'participants', conversationId] as const,
} as const;
