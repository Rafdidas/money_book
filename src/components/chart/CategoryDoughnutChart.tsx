"use client";

import { useMemo } from "react";
import type { ChartOptions } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import "@/lib/chart";

type CategoryDatum = {
  label: string;
  value: number;
};

type Props = {
  data: CategoryDatum[];
  height?: number;
};

const palette = ["#506169", "#9f403d", "#84d5c8", "#88a2ff", "#d2f2ed", "#d8c087"];

export default function CategoryDoughnutChart({ data, height = 260 }: Props) {
  const chartData = useMemo(
    () => ({
      labels: data.map((item) => item.label),
      datasets: [
        {
          data: data.map((item) => item.value),
          backgroundColor: data.map((_, index) => palette[index % palette.length]),
          borderColor: "#ffffff",
          borderWidth: 4,
          hoverOffset: 8,
        },
      ],
    }),
    [data],
  );

  const options = useMemo<ChartOptions<"doughnut">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#566164",
            usePointStyle: true,
            pointStyle: "circle",
            padding: 16,
            font: {
              size: 11,
              weight: 700,
            },
          },
        },
        tooltip: {
          backgroundColor: "#243136",
          padding: 12,
          titleColor: "#f8fafb",
          bodyColor: "#f8fafb",
          callbacks: {
            label: (context) => `${context.label ?? ""}: ₩ ${Number(context.parsed).toLocaleString()}`,
          },
        },
      },
    }),
    [],
  );

  return (
    <div className="chartjs-shell chartjs-shell-doughnut" style={{ height }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}