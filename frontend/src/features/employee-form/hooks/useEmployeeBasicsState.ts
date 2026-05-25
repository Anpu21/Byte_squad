import { useState } from 'react';

export type GenderField = '' | 'Male' | 'Female' | 'Other';
export type MaritalField =
    | ''
    | 'Single'
    | 'Married'
    | 'Divorced'
    | 'Widowed';

export interface EmployeeBasicsState {
    employeeCode: string;
    setEmployeeCode: (v: string) => void;
    fullName: string;
    setFullName: (v: string) => void;
    nameWithInitials: string;
    setNameWithInitials: (v: string) => void;
    nic: string;
    setNic: (v: string) => void;
    dateOfBirth: string;
    setDateOfBirth: (v: string) => void;
    gender: GenderField;
    setGender: (v: GenderField) => void;
    maritalStatus: MaritalField;
    setMaritalStatus: (v: MaritalField) => void;
}

export function useEmployeeBasicsState(): EmployeeBasicsState {
    const [employeeCode, setEmployeeCode] = useState('');
    const [fullName, setFullName] = useState('');
    const [nameWithInitials, setNameWithInitials] = useState('');
    const [nic, setNic] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState<GenderField>('');
    const [maritalStatus, setMaritalStatus] = useState<MaritalField>('');
    return {
        employeeCode,
        setEmployeeCode,
        fullName,
        setFullName,
        nameWithInitials,
        setNameWithInitials,
        nic,
        setNic,
        dateOfBirth,
        setDateOfBirth,
        gender,
        setGender,
        maritalStatus,
        setMaritalStatus,
    };
}
