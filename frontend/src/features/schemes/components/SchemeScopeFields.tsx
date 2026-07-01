import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import type { DiscountSchemeScope } from '@/types';
import type {
    SchemeFormValues,
    SchemeOption,
    SetSchemeField,
} from './scheme-form.types';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

interface SchemeScopeFieldsProps {
    form: SchemeFormValues;
    set: SetSchemeField;
    isAdmin: boolean;
    productInput: string;
    onProductInput: (value: string) => void;
    products: SchemeOption[];
    productsLoading: boolean;
    categories: SchemeOption[];
    categoriesLoading: boolean;
    branches: SchemeOption[];
}

/** Name, branch, scope, and the product/category target for a scheme. */
export function SchemeScopeFields({
    form,
    set,
    isAdmin,
    productInput,
    onProductInput,
    products,
    productsLoading,
    categories,
    categoriesLoading,
    branches,
}: SchemeScopeFieldsProps) {
    return (
        <>
            <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Scheme name
                </span>
                <input
                    className={`${INPUT_CLASS} w-full`}
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="e.g. June rice promo"
                    required
                    minLength={3}
                    maxLength={120}
                />
            </label>
            {isAdmin && (
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Branch
                    </span>
                    <select
                        className={`${INPUT_CLASS} field-select w-full`}
                        value={form.branchId}
                        onChange={(e) => set('branchId', e.target.value)}
                    >
                        <option value="">All branches</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                </label>
            )}
            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Applies to
                </span>
                <select
                    className={`${INPUT_CLASS} field-select w-full`}
                    value={form.scope}
                    onChange={(e) =>
                        set('scope', e.target.value as DiscountSchemeScope)
                    }
                >
                    <option value="Product">A single product</option>
                    <option value="Category">A whole category</option>
                </select>
            </label>
            {form.scope === 'Product' ? (
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Product
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full`}
                        list="scheme-product-options"
                        value={productInput}
                        onChange={(e) => onProductInput(e.target.value)}
                        placeholder={
                            productsLoading
                                ? 'Loading products…'
                                : 'Type a product name'
                        }
                        autoComplete="off"
                        required
                    />
                    <datalist id="scheme-product-options">
                        {products.map((p) => (
                            <option key={p.id} value={p.name} />
                        ))}
                    </datalist>
                </label>
            ) : (
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Category
                    </span>
                    <select
                        className={`${INPUT_CLASS} field-select w-full`}
                        value={form.category}
                        onChange={(e) => set('category', e.target.value)}
                        required
                    >
                        <option value="" disabled>
                            {categoriesLoading
                                ? 'Loading categories…'
                                : 'Pick a category'}
                        </option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.name}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </label>
            )}
        </>
    );
}
