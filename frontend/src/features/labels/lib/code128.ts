/**
 * Dependency-free Code 128 barcode encoder → standalone SVG string.
 *
 * Standard Code 128 width table: entries 0–102 are data symbols,
 * 103–105 the A/B/C start codes, 106 the stop pattern. Each entry lists
 * alternating bar/space widths (starting with a bar) and sums to 11
 * modules (13 for stop) — the unit test asserts that invariant over the
 * whole table.
 */
export const CODE128_WIDTHS: readonly string[] = [
    '212222', '222122', '222221', '121223', '121322', '131222', '122213',
    '122312', '132212', '221213', '221312', '231212', '112232', '122132',
    '122231', '113222', '123122', '123221', '223211', '221132', '221231',
    '213212', '223112', '312131', '311222', '321122', '321221', '312212',
    '322112', '322211', '212123', '212321', '232121', '111323', '131123',
    '131321', '112313', '132113', '132311', '211313', '231113', '231311',
    '112133', '112331', '132131', '113123', '113321', '133121', '313121',
    '211331', '231131', '213113', '213311', '213131', '311123', '311321',
    '331121', '312113', '312311', '332111', '314111', '221411', '431111',
    '111224', '111422', '121124', '121421', '141122', '141221', '112214',
    '112412', '122114', '122411', '142112', '142211', '241211', '221114',
    '413111', '241112', '134111', '111242', '121142', '121241', '114212',
    '124112', '124211', '411212', '421112', '421211', '212141', '214121',
    '412121', '111143', '111341', '131141', '114113', '114311', '411113',
    '411311', '113141', '114131', '311141', '411131', '211412', '211214',
    '211232', '2331112',
];

const START_B = 104;
const START_C = 105;
const STOP = 106;
const QUIET_ZONE_MODULES = 10;

/**
 * Encode a value into Code 128 symbol values (start…data…checksum…stop).
 * Digit-only values of even length use the compact Code C set; everything
 * else uses Code B (printable ASCII 32–126). Returns null when the value
 * is empty or contains characters Code B cannot represent.
 */
export function encodeCode128(value: string): number[] | null {
    if (value.length === 0) return null;
    const symbols: number[] = [];
    if (/^\d+$/.test(value) && value.length % 2 === 0) {
        symbols.push(START_C);
        for (let i = 0; i < value.length; i += 2) {
            symbols.push(Number(value.slice(i, i + 2)));
        }
    } else {
        symbols.push(START_B);
        for (const ch of value) {
            const code = ch.charCodeAt(0);
            if (code < 32 || code > 126) return null;
            symbols.push(code - 32);
        }
    }
    let checksum = symbols[0];
    for (let i = 1; i < symbols.length; i++) {
        checksum += symbols[i] * i;
    }
    symbols.push(checksum % 103);
    symbols.push(STOP);
    return symbols;
}

export interface Code128SvgOptions {
    /** Bar height in SVG units (default 48). */
    height?: number;
    /** Width of one module in SVG units (default 2). */
    moduleWidth?: number;
}

/**
 * Render a value as a Code 128 SVG (black bars, transparent background,
 * quiet zones included). Returns null for unencodable input — the caller
 * decides the fallback (e.g. printing the text alone).
 */
export function code128Svg(
    value: string,
    options: Code128SvgOptions = {},
): string | null {
    const symbols = encodeCode128(value);
    if (!symbols) return null;
    const { height = 48, moduleWidth = 2 } = options;

    const rects: string[] = [];
    let x = QUIET_ZONE_MODULES;
    for (const symbol of symbols) {
        const widths = CODE128_WIDTHS[symbol];
        for (let i = 0; i < widths.length; i++) {
            const w = Number(widths[i]);
            // Even positions are bars, odd positions are spaces.
            if (i % 2 === 0) {
                rects.push(
                    `<rect x="${x * moduleWidth}" y="0" width="${w * moduleWidth}" height="${height}" fill="#000"/>`,
                );
            }
            x += w;
        }
    }
    const totalWidth = (x + QUIET_ZONE_MODULES) * moduleWidth;
    return (
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height}" ` +
        `width="${totalWidth}" height="${height}" role="img" shape-rendering="crispEdges">` +
        rects.join('') +
        '</svg>'
    );
}
