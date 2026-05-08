import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import { shopProductsService } from '@/services/shop-products.service';
import { userService } from '@/services/user.service';
import { setUserBranch, logout } from '@/store/slices/authSlice';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';
import OnboardingStepper from '@/components/auth/OnboardingStepper';

export default function BranchSelectionPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { data: branches = [], isLoading, isError } = useQuery({
        queryKey: ['shop-branches-with-staff'],
        queryFn: shopProductsService.listBranches,
    });

    const headOfficeId = useMemo(() => {
        if (branches.length === 0) return null;
        const top = branches.reduce((max, b) =>
            b.staffCount > max.staffCount ? b : max,
        );
        return top.staffCount > 0 ? top.id : null;
    }, [branches]);

    const handleContinue = async () => {
        if (!selectedId) return;
        setSubmitting(true);
        try {
            await userService.updateMyBranch(selectedId);
            dispatch(setUserBranch(selectedId));
            toast.success('Branch saved');
            navigate(FRONTEND_ROUTES.SHOP);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not save branch');
            } else {
                toast.error('Could not save branch');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        dispatch(logout());
        navigate(FRONTEND_ROUTES.LOGIN);
    };

    return (
        <>
            <OnboardingStepper currentStep={3} />
            <h1 className="text-[32px] font-bold tracking-[-0.02em] text-text-1 leading-tight">
                Choose your branch
            </h1>
            <p className="text-xs text-text-2 mt-1.5 mb-7">
                You can join more later from settings.
            </p>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
                </div>
            ) : isError || branches.length === 0 ? (
                <div className="px-3 py-2 rounded-md bg-danger-soft border border-danger/40 text-xs text-danger font-medium mb-6">
                    No active branches available. Please try again later.
                </div>
            ) : (
                <div className="flex flex-col gap-3 mb-7">
                    {branches.map((branch) => {
                        const isSelected = selectedId === branch.id;
                        const isHeadOffice = branch.id === headOfficeId;
                        const subtitle = isHeadOffice
                            ? `Head office · ${branch.staffCount} staff`
                            : `${branch.staffCount} staff`;
                        return (
                            <button
                                key={branch.id}
                                type="button"
                                onClick={() => setSelectedId(branch.id)}
                                aria-pressed={isSelected}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-md border text-left transition-all ${
                                    isSelected
                                        ? 'border-primary bg-primary-soft ring-[3px] ring-primary/20'
                                        : 'border-border-strong hover:border-primary hover:bg-surface-2'
                                }`}
                            >
                                <span
                                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        isSelected
                                            ? 'border-primary bg-primary'
                                            : 'border-border-strong'
                                    }`}
                                    aria-hidden="true"
                                >
                                    {isSelected && (
                                        <span className="w-2 h-2 rounded-full bg-text-inv" />
                                    )}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-text-1 truncate">
                                        {branch.name}
                                    </p>
                                    <p className="text-xs text-text-2 mt-0.5 truncate">
                                        {subtitle}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={handleBack}
                    disabled={submitting}
                >
                    Back
                </Button>
                <Button
                    type="button"
                    size="lg"
                    onClick={handleContinue}
                    disabled={!selectedId || submitting}
                    className="flex-1"
                >
                    {submitting ? 'Saving…' : 'Continue'}
                    {!submitting && <ArrowRight size={14} />}
                </Button>
            </div>
        </>
    );
}
