import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top'
        },
        title: {
            display: true,
            text: 'Holdings',
        },
    },
    scales: {
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
                display: true,
                text: 'Price (₹)'
            }
        },
        y1: {
            type: 'linear',
            display: true,
            position: 'right',
            suggestedMax: 50,
            grid: {
                drawOnChartArea: false, 
            },
            title: {
                display: true,
                text: 'Quantity' 
            }
        },
    },
};


export function VerticalGraph({data}) {
    return <Bar options={options} data={data} />;
}
