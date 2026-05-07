import AreaChart from './AreaChart';

const data = [
    { name: 'Mon', value: 2400 },
    { name: 'Tue', value: 1398 },
    { name: 'Wed', value: 5800 },
    { name: 'Thu', value: 3908 },
    { name: 'Fri', value: 4800 },
    { name: 'Sat', value: 8390 },
    { name: 'Sun', value: 7200 },
];

const formatLkr = (value: number) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 0,
    }).format(value);

export default function SalesChart() {
    return (
        <div className="h-[280px] w-full mt-4 animate-in fade-in duration-700">
            <AreaChart
                data={data}
                height={280}
                color="var(--primary)"
                formatValue={formatLkr}
            />
        </div>
    );
}
