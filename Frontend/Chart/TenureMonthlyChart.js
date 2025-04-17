"use client";
import { useEffect, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TenureMonthlyChart = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/tenure-monthly-charges");
        const data = await response.json();
        console.log("📊 Tenure vs Monthly API Data:", data); // ✅ Debugging
        setChartData(data);
      } catch (error) {
        console.error("❌ Error fetching tenure data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="w-full p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Tenure vs. Monthly Charges</h2>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="tenure" name="Tenure (Months)" />
          <YAxis type="number" dataKey="monthly_charges" name="Monthly Charges ($)" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter name="Customer Data" data={chartData} fill="#8884d8" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TenureMonthlyChart;
