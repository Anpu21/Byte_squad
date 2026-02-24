export default function OtpVerificationPage() {
    return (
        <div>
            <h2 className="text-xl font-semibold text-white mb-2">Verify Your Email</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                Enter the 6-digit code sent to your email address.
            </p>

            <form className="space-y-4">
                <input
                    type="text"
                    maxLength={6}
                    className="glass-input w-full text-center text-2xl tracking-[0.5em] font-mono"
                    placeholder="000000"
                />

                <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
                >
                    Verify
                </button>
            </form>
        </div>
    );
}
