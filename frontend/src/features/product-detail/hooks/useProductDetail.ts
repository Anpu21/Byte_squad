import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';
import { shopProductsService } from '@/services/shop-products.service';
import { addToCart } from '@/store/slices/shopCartSlice';
import { setActiveBranch } from '@/store/slices/shopBranchSlice';
import { selectActiveBranchId } from '@/store/selectors/shopBranch';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { FRONTEND_ROUTES } from '@/constants/routes';
import {
    qtyRules,
    formatQty,
    isFractionalUnit,
    quantityForAmount,
    amountForQuantity,
    clampQty,
} from '@/lib/unit-quantity';
import type { IShopProduct, IShopSellableUnit } from '@/types';

/** Weight ('By weight') vs cash ('By amount') entry for a loose product. */
type EntryMode = 'weight' | 'amount';

export function useProductDetail() {
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user } = useAuth();
    const activeBranchId = useAppSelector(selectActiveBranchId);
    const branchId = activeBranchId ?? user?.branchId ?? null;

    const [qty, setQty] = useState(1);
    const [amount, setAmount] = useState(0);
    const [entryMode, setEntryMode] = useState<EntryMode>('weight');
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

    const branchesQuery = useQuery({
        queryKey: queryKeys.shop.branches(),
        queryFn: shopProductsService.listBranches,
    });
    const branchName = useMemo(
        () =>
            branchesQuery.data?.find((b) => b.id === branchId)?.name ?? '',
        [branchesQuery.data, branchId],
    );

    const { data: product, isLoading } = useQuery({
        queryKey: queryKeys.shop.publicProduct(id ?? '', branchId),
        queryFn: () =>
            shopProductsService.getProduct(id!, branchId ?? undefined),
        enabled: !!id,
    });

    const { data: recommendedProducts = [] } = useQuery({
        queryKey: queryKeys.shop.recommended({
            branchId,
            productId: id,
            category: product?.category,
            limit: 4,
        }),
        queryFn: () =>
            shopProductsService.listRecommended({
                branchId: branchId!,
                productId: id,
                category: product?.category,
                limit: 4,
            }),
        enabled: Boolean(branchId && id && product),
    });

    const selectedUnit: IShopSellableUnit | null = useMemo(() => {
        if (!product) return null;
        return (
            product.sellableUnits.find((u) => u.id === selectedUnitId) ??
            product.sellableUnits.find((u) => u.isBase) ??
            null
        );
    }, [product, selectedUnitId]);

    const unitPrice = selectedUnit
        ? selectedUnit.sellingPrice
        : (product?.sellingPrice ?? 0);

    // Step / min / decimals come from the product's base unit (whole vs
    // fractional); the label shown is the chosen sellable unit's name.
    const baseUnit = product?.baseUnit ?? '';
    const rules = qtyRules(baseUnit);
    const qtyUnitLabel = selectedUnit?.name ?? product?.baseUnit ?? '';

    // "Buy by amount" is loose-only (the backend rejects it for piece goods).
    const isFractional = isFractionalUnit(baseUnit);
    // Amount mode: shopper names the cash, we derive the weight to order. Weight
    // mode: the inverse preview — what the chosen weight will cost.
    const derivedQty = quantityForAmount(amount, unitPrice, baseUnit);
    const previewAmount = amountForQuantity(qty, unitPrice);

    // Switching modes seeds the counterpart from the current value so the
    // handoff is continuous (5 kg ⇄ its cash, not a reset to 0).
    const handleEntryModeChange = (mode: EntryMode): void => {
        if (mode === entryMode) return;
        if (mode === 'amount') setAmount(amountForQuantity(qty, unitPrice));
        else setQty(clampQty(derivedQty, baseUnit));
        setEntryMode(mode);
    };

    // In weight mode the order minimum gates on the typed quantity; in amount
    // mode it gates on the *derived* weight (and a positive cash amount), since
    // a tiny amount can imply a sub-minimum weight the API would reject.
    const canAdd =
        isFractional && entryMode === 'amount'
            ? amount > 0 && derivedQty >= rules.min
            : qty >= rules.min;

    const availableIds = product?.availableBranches.map((b) => b.id) ?? [];
    const isOutEverywhere =
        !!product && product.stockStatus === 'out' && availableIds.length === 0;
    const currentBranchHasIt = !!product && product.stockStatus !== 'out';
    const branchSwitchNeeded =
        !!product && !currentBranchHasIt && availableIds.length > 0;
    const targetBranch = product?.availableBranches[0] ?? null;

    // Switch the browsing branch — keeps the cart (items can span branches).
    const handleSwitchBranch = () => {
        if (targetBranch) dispatch(setActiveBranch(targetBranch.id));
    };

    const handleAdd = async (): Promise<boolean> => {
        if (!product || !branchId) return false;
        if (product.stockStatus === 'out') {
            toast.error('Out of stock at this branch');
            return false;
        }
        // Amount lines carry the firm cash the customer named; the weight is the
        // derived estimate. Weight lines carry no amount (priced by quantity).
        const isAmountLine = isFractional && entryMode === 'amount';
        const lineQty = isAmountLine ? derivedQty : qty;
        dispatch(
            addToCart({
                productId: product.id,
                branchId,
                branchName,
                name: product.name,
                sellingPrice: unitPrice,
                imageUrl: product.imageUrl,
                unitId: selectedUnit ? selectedUnit.id : null,
                unitLabel: selectedUnit ? selectedUnit.name : product.baseUnit,
                baseUnit: product.baseUnit,
                quantity: lineQty,
                amount: isAmountLine ? amount : null,
            }),
        );
        toast.success(
            `${product.name} × ${formatQty(lineQty, qtyUnitLabel)} added`,
        );
        return true;
    };

    const handleBuyNow = async () => {
        const added = await handleAdd();
        if (added) navigate(FRONTEND_ROUTES.SHOP_CART);
    };

    const handleAddRecommended = (recommended: IShopProduct) => {
        if (recommended.stockStatus === 'out' || !branchId) return;
        const base =
            recommended.sellableUnits.find((u) => u.isBase) ?? null;
        dispatch(
            addToCart({
                productId: recommended.id,
                branchId,
                branchName,
                name: recommended.name,
                sellingPrice: base ? base.sellingPrice : recommended.sellingPrice,
                imageUrl: recommended.imageUrl,
                unitId: base ? base.id : null,
                unitLabel: base ? base.name : recommended.baseUnit,
                baseUnit: recommended.baseUnit,
            }),
        );
        toast.success(`${recommended.name} added`);
    };

    return {
        product,
        isLoading,
        qty,
        setQty,
        qtyStep: rules.step,
        qtyDecimals: rules.decimals,
        qtyUnitLabel,
        // "Buy by amount" toggle + state (loose products only).
        isFractional,
        entryMode,
        setEntryMode: handleEntryModeChange,
        amount,
        setAmount,
        derivedQty,
        previewAmount,
        // Stepper floors at 0 (a "cleared" state); the order minimum (rules.min)
        // gates Add/Buy so a 0 / sub-minimum quantity can't be ordered. In
        // amount mode it gates on the derived weight + a positive amount.
        canAdd,
        units: product?.sellableUnits ?? [],
        // Effective unit id (falls back to base) so the unit <Select> stays controlled.
        selectedUnitId: selectedUnit?.id ?? null,
        setSelectedUnitId,
        unitPrice,
        isOutEverywhere,
        branchSwitchNeeded,
        targetBranch,
        handleSwitchBranch,
        recommendedProducts,
        handleAddRecommended,
        handleAdd,
        handleBuyNow,
    };
}
