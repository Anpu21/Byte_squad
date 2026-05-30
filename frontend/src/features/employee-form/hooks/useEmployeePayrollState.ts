import { useState } from 'react';

export interface EmployeePayrollState {
    epfEligible: boolean;
    setEpfEligible: (v: boolean) => void;
    etfEligible: boolean;
    setEtfEligible: (v: boolean) => void;
    epfNumber: string;
    setEpfNumber: (v: string) => void;
    etfNumber: string;
    setEtfNumber: (v: string) => void;
    bankName: string;
    setBankName: (v: string) => void;
    bankAccountNo: string;
    setBankAccountNo: (v: string) => void;
    bankBranch: string;
    setBankBranch: (v: string) => void;
    bankAccountName: string;
    setBankAccountName: (v: string) => void;
}

export function useEmployeePayrollState(): EmployeePayrollState {
    const [epfEligible, setEpfEligible] = useState(false);
    const [etfEligible, setEtfEligible] = useState(false);
    const [epfNumber, setEpfNumber] = useState('');
    const [etfNumber, setEtfNumber] = useState('');
    const [bankName, setBankName] = useState('');
    const [bankAccountNo, setBankAccountNo] = useState('');
    const [bankBranch, setBankBranch] = useState('');
    const [bankAccountName, setBankAccountName] = useState('');
    return {
        epfEligible,
        setEpfEligible,
        etfEligible,
        setEtfEligible,
        epfNumber,
        setEpfNumber,
        etfNumber,
        setEtfNumber,
        bankName,
        setBankName,
        bankAccountNo,
        setBankAccountNo,
        bankBranch,
        setBankBranch,
        bankAccountName,
        setBankAccountName,
    };
}
