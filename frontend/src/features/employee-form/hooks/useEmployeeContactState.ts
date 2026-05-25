import { useState } from 'react';

export interface EmployeeContactState {
    contactPhone: string;
    setContactPhone: (v: string) => void;
    contactPhone2: string;
    setContactPhone2: (v: string) => void;
    email: string;
    setEmail: (v: string) => void;
    permanentAddress: string;
    setPermanentAddress: (v: string) => void;
    currentAddress: string;
    setCurrentAddress: (v: string) => void;
    city: string;
    setCity: (v: string) => void;
    emergencyContactName: string;
    setEmergencyContactName: (v: string) => void;
    emergencyContactPhone: string;
    setEmergencyContactPhone: (v: string) => void;
    emergencyContactRelationship: string;
    setEmergencyContactRelationship: (v: string) => void;
}

export function useEmployeeContactState(): EmployeeContactState {
    const [contactPhone, setContactPhone] = useState('');
    const [contactPhone2, setContactPhone2] = useState('');
    const [email, setEmail] = useState('');
    const [permanentAddress, setPermanentAddress] = useState('');
    const [currentAddress, setCurrentAddress] = useState('');
    const [city, setCity] = useState('');
    const [emergencyContactName, setEmergencyContactName] = useState('');
    const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
    const [emergencyContactRelationship, setEmergencyContactRelationship] =
        useState('');
    return {
        contactPhone,
        setContactPhone,
        contactPhone2,
        setContactPhone2,
        email,
        setEmail,
        permanentAddress,
        setPermanentAddress,
        currentAddress,
        setCurrentAddress,
        city,
        setCity,
        emergencyContactName,
        setEmergencyContactName,
        emergencyContactPhone,
        setEmergencyContactPhone,
        emergencyContactRelationship,
        setEmergencyContactRelationship,
    };
}
