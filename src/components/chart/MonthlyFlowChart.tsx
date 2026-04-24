"use client";

import { useMemo } from "react";
import type { ChartOptions } from "chart.js";
import { Bar } from "react-chartjs-2";
import "@/lib/chart";

type MonthlyDatum = {
  label: string;
  expenseTotal: number;
  incomeTotal: number;
};

type Props = {
  data: MonthlyDatum[];
  currentMonth?: number;
  height?: number;
};

export default function MonthlyFlowChart({
  data,
  currentMonth,
  height = 280,
}: Props) {
  const chartData = useMemo(
    () => ({
      labels: data.map((item) => item.label),
      datasets: [
        {
          label: "수입",
          data: data.map((item) => item.incomeTotal),
          backgroundColor: data.map((_, index) =>
            index === currentMonth ? "#45555d" : "#506169",
          ),
          // borderRadius: 999,
          borderSkipped: false as const,
          barThickness: 16,
          maxBarThickness: 18,
        },
        {
          label: "지출",
          data: data.map((item) => item.expenseTotal),
          backgroundColor: data.map((_, index) =>
            index === currentMonth ? "#8b3432" : "#9f403d",
          ),
          // borderRadius: 999,
          borderSkipped: false as const,
          barThickness: 16,
          maxBarThickness: 18,
        },
      ],
    }),
    [currentMonth, data],
  );

  const options = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "#243136",
          padding: 12,
          titleColor: "#f8fafb",
          bodyColor: "#f8fafb",
          displayColors: true,
          callbacks: {
            label: (context) => `${context.dataset.label ?? ""}: ₩ ${Number(context.parsed.y).toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#7b878c",
            font: {
              size: 11,
              weight: 700,
            },
          },
          border: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "#95a1a6",
            callback: (value) => `₩ ${Number(value).toLocaleString()}`,
            font: {
              size: 11,
            },
          },
          grid: {
            color: "rgba(80, 97, 105, 0.12)",
            drawTicks: false,
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
    <div className="chartjs-shell" style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}