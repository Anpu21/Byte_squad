import { useState } from 'react';
import type {
    BarcodeLookupStatus,
    ProductFormErrors,
} from '../types/form-errors.type';

export interface ProductFormState {
    name: string;
    setName: (value: string) => void;
    barcode: string;
    setBarcode: (value: string) => void;
    description: string;
    setDescription: (value: string) => void;
    category: string;
    setCategory: (value: string) => void;
    costPrice: string;
    setCostPrice: (value: string) => void;
    sellingPrice: string;
    setSellingPrice: (value: string) => void;
    initialStock: string;
    setInitialStock: (value: string) => void;
    lowStockThreshold: string;
    setLowStockThreshold: (value: string) => void;
    errors: ProductFormErrors;
    setErrors: (errors: ProductFormErrors) => void;
    barcodeStatus: BarcodeLookupStatus;
    setBarcodeStatus: (status: BarcodeLookupStatus) => void;
    scanDetected: boolean;
    setScanDetected: (value: boolean) => void;
}

export function useProductFormState(): ProductFormState {
    const [name, setName] = useState('');
    const [barcode, setBarcode] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [sellingPrice, setSellingPrice] = useState('');
    const [initialStock, setInitialStock] = useState('');
    const [lowStockThreshold, setLowStockThreshold] = useState('10');
    const [errors, setErrors] = useState<ProductFormErrors>({});
    const [barcodeStatus, setBarcodeStatus] =
        useState<BarcodeLookupStatus>('idle');
    const [scanDetected, setScanDetected] = useState(false);

    return {
        name,
        setName,
        barcode,
        setBarcode,
        description,
        setDescription,
        category,
        setCategory,
        costPrice,
        setCostPrice,
        sellingPrice,
        setSellingPrice,
        initialStock,
        setInitialStock,
        lowStockThreshold,
        setLowStockThreshold,
        errors,
        setErrors,
        barcodeStatus,
        setBarcodeStatus,
        scanDetected,
        setScanDetected,
    };
}
