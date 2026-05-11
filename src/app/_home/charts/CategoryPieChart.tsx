import { useMemo } from "react";
import type { ChartOptions } from "chart.js";
import { Pie } from "react-chartjs-2";
import { categoryChartColors } from "../constants";
import type { CategoryExpenseSlice } from "../types";
import { formatWon } from "../utils";

export default function CategoryPieChart({ items }: { items: CategoryExpenseSlice[] }) {
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const chartData = useMemo(
    () => ({
      labels: items.map((item) => item.category),
      datasets: [
        {
          data: items.map((item) => item.amount),
          backgroundColor: items.map(
            (_, index) => categoryChartColors[index % categoryChartColors.length],
          ),
          borderColor: "transparent",
          borderWidth: 0,
        },
      ],
    }),
    [items],
  );
  const options = useMemo<ChartOptions<"pie">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = Number(context.parsed) || 0;
              const ratio = totalAmount ? (value / totalAmount) * 100 : 0;
              return `${context.label}: ${formatWon(value)} (${ratio.toFixed(1)}%)`;
            },
          },
        },
      },
    }),
    [totalAmount],
  );

  if (!items.length) {
    return <p className="title--md empty-state">이번 달 지출 내역이 없습니다.</p>;
  }

  return <Pie data={chartData} options={options} />;
}
