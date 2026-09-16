import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface TrendChartProps {
  labels: string[]
  data: number[]
  metricName: string
  unit: string
  color?: string
}

export function TrendChart({ labels, data, metricName, unit, color = '#10b981' }: TrendChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        label: `${metricName} (${unit})`,
        data,
        borderColor: color,
        backgroundColor: `${color}20`, // 20% opacity for fill
        borderWidth: 2,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: color,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.3, // Smooth curves
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false, // We show the title externally
      },
      tooltip: {
        backgroundColor: '#183c25',
        titleColor: '#ffffff',
        bodyColor: '#e4efe4',
        borderColor: '#2e6e47',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y
            }
            return label
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#6b7b6e',
          maxTicksLimit: 8,
        },
      },
      y: {
        grid: {
          color: '#e3eae0',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7b6e',
          padding: 10,
        },
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="w-full h-full min-h-[300px]">
      <Line data={chartData} options={options} />
    </div>
  )
}
