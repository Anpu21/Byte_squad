import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    PosChequeForm,
    type IPosChequeFormValues,
} from '../PosChequeForm';

const baseValues: IPosChequeFormValues = {
    chequeAmount: 0,
    chequeNo: '',
    chequeDate: '',
    chequeBank: '',
    chequeBranch: '',
    chequeRef: '',
    chequeDeliveredBy: '',
};

describe('PosChequeForm', () => {
    it('renders the full Shanel cheque field set', () => {
        render(<PosChequeForm {...baseValues} onChange={() => {}} />);
        expect(screen.getByLabelText('Cheque amount')).toBeInTheDocument();
        expect(screen.getByLabelText('Cheque number')).toBeInTheDocument();
        expect(screen.getByLabelText('Cheque date')).toBeInTheDocument();
        expect(screen.getByLabelText('Bank')).toBeInTheDocument();
        expect(screen.getByLabelText('Branch')).toBeInTheDocument();
        expect(screen.getByLabelText('Reference')).toBeInTheDocument();
        expect(screen.getByLabelText('Delivered by')).toBeInTheDocument();
    });

    it('emits a narrow patch on cheque-number input', async () => {
        const onChange = vi.fn();
        render(<PosChequeForm {...baseValues} onChange={onChange} />);
        const chequeNo = screen.getByLabelText('Cheque number');
        await userEvent.type(chequeNo, '7');
        // The form is purely presentational, so a single keystroke patch
        // is enough to verify the onChange wiring. The orchestrator handles
        // state composition; further keystrokes would re-render with the
        // patched value applied.
        expect(onChange).toHaveBeenCalledExactlyOnceWith({ chequeNo: '7' });
    });

    it('emits a narrow patch on amount commit', async () => {
        const onChange = vi.fn();
        render(<PosChequeForm {...baseValues} onChange={onChange} />);
        const amount = screen.getByLabelText('Cheque amount');
        await userEvent.clear(amount);
        await userEvent.type(amount, '500');
        // Last call should be the amount patch (other intermediate updates
        // are fine; the orchestrator only cares about the final value).
        expect(onChange).toHaveBeenLastCalledWith({ chequeAmount: 500 });
    });
});
