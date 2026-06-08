import { useCallback, useState } from 'react';
import type {
    BarcodeLookupStatus,
    ProductFormErrors,
} from '../types/form-errors.type';
import type { TBaseUnitFe } from '../lib/sellable-units';
import {
    type SellableUnitsState,
    useSellableUnitsState,
} from './useSellableUnitsState';
import {
    type ProductPriceUnitsState,
    useProductPriceUnits,
} from './useProductPriceUnits';

export interface ProductFormState
    extends SellableUnitsState,
        ProductPriceUnitsState {
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
    mrp: string;
    setMrp: (value: string) => void;
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
    const [mrp, setMrp] = useState('');
    const [initialStock, setInitialStock] = useState('');
    const [lowStockThreshold, setLowStockThreshold] = useState('10');
    const [errors, setErrors] = useState<ProductFormErrors>({});
    const [barcodeStatus, setBarcodeStatus] =
        useState<BarcodeLookupStatus>('idle');
    const [scanDetected, setScanDetected] = useState(false);
    const sellableUnits = useSellableUnitsState();
    const priceUnits = useProductPriceUnits(sellableUnits.baseUnit);

    // Override resetUnitsForBase so the base-unit change also resets both
    // price-unit selectors. Without this, switching kg → l would silently
    // leave the cost/selling price denominated in `g`, producing wrong
    // stored prices once Phase P3 normalizes on submit.
    const resetUnitsForBase = useCallback(
        (next: TBaseUnitFe) => {
            sellableUnits.resetUnitsForBase(next);
            priceUnits.resetPriceUnitsTo(next);
        },
        [sellableUnits, priceUnits],
    );

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
        mrp,
        setMrp,
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
        ...sellableUnits,
        ...priceUnits,
        resetUnitsForBase,
    };
}
