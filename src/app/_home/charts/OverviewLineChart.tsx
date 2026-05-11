import { useMemo } from "react";
import type { ChartOptions } from "chart.js";
import { Line } from "react-chartjs-2";
import { overviewChartColors } from "../constants";
import type { OverviewLine } from "../types";

export default function OverviewLineChart({ lines }: { lines: OverviewLine[] }) {
  const maxLength = Math.max(1, ...lines.map((line) => line.values.length));
  const chartData = useMemo(
    () => ({
      labels: Array.from({ length: maxLength }, (_, index) => String(index + 1)),
      datasets: lines.map((line) => ({
        label: line.label,
        data: line.values.length ? line.values : [0],
        borderColor: overviewChartColors[line.color],
        backgroundColor: overviewChartColors[line.color],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0.35,
      })),
    }),
    [lines, maxLength],
  );
  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: {
        intersect: true,
        mode: "index",
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
      scales: {
        x: {
          display: false,
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
        },
        y: {
          display: false,
          beginAtZero: true,
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
        },
      },
    }),
    [],
  );

  return (
    <div className="main-overview--graph" aria-hidden="true">
      <Line data={chartData} options={options} />
    </div>
  );
}
