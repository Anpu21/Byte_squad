import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDto {
    @Expose()
    id: string;

    @Expose()
    username: string;

    @Expose()
    email: string;

    @Expose()
    firstName: string;

    @Expose()
    lastName: string;

    @Expose()
    phone: string;

    @Expose()
    roleId: string;

    @Expose()
    role: {
        id: string;
        name: string;
    };

    @Expose()
    companyId: string;

    @Expose()
    branchId: string;

    @Expose()
    isActive: boolean;

    @Expose()
    lastLoginAt: Date;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    @Expose()
    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }
}
