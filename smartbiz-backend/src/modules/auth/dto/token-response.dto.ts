export class TokenResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
    user: {
        id: string;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        companyId: string;
    };
}
