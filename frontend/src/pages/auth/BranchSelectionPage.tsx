import { ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import OnboardingStepper from '@/components/auth/OnboardingStepper';
import { useBranchSelection } from '@/features/branch-selection/hooks/useBranchSelection';
import { BranchList } from '@/features/branch-selection/components/BranchList';

export function BranchSelectionPage() {
    const p = useBranchSelection();

    return (
        <>
            <OnboardingStepper currentStep={3} />
            <h1 className="text-[32px] font-bold tracking-[-0.02em] text-text-1 leading-tight">
                Choose your branch
            </h1>
            <p className="text-xs text-text-2 mt-1.5 mb-7">
                You can join more later from settings.
            </p>

            <BranchList
                branches={p.branches}
                isLoading={p.isLoading}
                isError={p.isError}
                selectedId={p.selectedId}
                headOfficeId={p.headOfficeId}
                onSelect={p.setSelectedId}
            />

            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={p.handleBack}
                    disabled={p.submitting}
                >
                    Back
                </Button>
                <Button
                    type="button"
                    size="lg"
                    onClick={p.handleContinue}
                    disabled={!p.selectedId || p.submitting}
                    className="flex-1"
                >
                    {p.submitting ? 'Saving…' : 'Continue'}
                    {!p.submitting && <ArrowRight size={14} />}
                </Button>
            </div>
        </>
    );
}
