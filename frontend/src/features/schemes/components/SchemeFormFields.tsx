import type {
    SchemeFormValues,
    SchemeOption,
    SetSchemeField,
} from './scheme-form.types';
import { SchemeScopeFields } from './SchemeScopeFields';
import { SchemeTermsFields } from './SchemeTermsFields';

export type { SchemeFormValues, SetSchemeField } from './scheme-form.types';

interface SchemeFormFieldsProps {
    form: SchemeFormValues;
    set: SetSchemeField;
    isAdmin: boolean;
    isEdit: boolean;
    productInput: string;
    onProductInput: (value: string) => void;
    products: SchemeOption[];
    productsLoading: boolean;
    categories: SchemeOption[];
    categoriesLoading: boolean;
    branches: SchemeOption[];
}

/** The discount-scheme field grid: scope basics + terms. */
export function SchemeFormFields({
    form,
    set,
    isAdmin,
    isEdit,
    productInput,
    onProductInput,
    products,
    productsLoading,
    categories,
    categoriesLoading,
    branches,
}: SchemeFormFieldsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SchemeScopeFields
                form={form}
                set={set}
                isAdmin={isAdmin}
                productInput={productInput}
                onProductInput={onProductInput}
                products={products}
                productsLoading={productsLoading}
                categories={categories}
                categoriesLoading={categoriesLoading}
                branches={branches}
            />
            <SchemeTermsFields form={form} set={set} isEdit={isEdit} />
        </div>
    );
}
