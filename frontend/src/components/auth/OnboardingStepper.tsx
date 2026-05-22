interface OnboardingStepperProps {
    currentStep: 1 | 2 | 3;
    totalSteps?: number;
}

export default function OnboardingStepper({
    currentStep,
    totalSteps = 3,
}: OnboardingStepperProps) {
    return (
        <div className="mb-6">
            <div className="flex gap-1.5">
                {Array.from({ length: totalSteps }, (_, i) => {
                    const stepNumber = i + 1;
                    const isActive = stepNumber <= currentStep;
                    return (
                        <div
                            key={stepNumber}
                            className={`flex-1 h-1 rounded-full transition-colors ${
                                isActive ? 'bg-primary' : 'bg-border'
                            }`}
                            aria-hidden="true"
                        />
                    );
                })}
            </div>
            <p className="mt-2 text-[11px] uppercase tracking-[0.15em] font-semibold text-text-3">
                Step {currentStep} of {totalSteps}
            </p>
        </div>
    );
}
