export type ExportFormat = 'pdf' | 'excel';

export interface ExportColumn<T> {
    header: string;
    key: keyof T | string;
    align?: 'left' | 'right' | 'center';
    format?: 'currency' | 'date' | 'text';
    footer?: 'sum' | string;
}

export interface ExportSummaryItem {
    label: string;
    value: string;
}

export interface ExportMetadata {
    title: string;
    subtitle?: string;
    filenameBase: string;
    companyName?: string;
    generatedBy?: string;
    generatedAt?: Date;
    summary?: ExportSummaryItem[];
}
