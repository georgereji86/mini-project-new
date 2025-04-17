"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const GenderMonthlyChargesChart = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/gender-monthly-charges");
        const data = await response.json();
        console.log("📊 API Data:", data); // ✅ Debugging
        setChartData(data);
      } catch (error) {
        console.error("❌ Error fetching chart data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="w-full p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Gender vs. Monthly Charges</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="gender" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="avgMonthlyCharge" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GenderMonthlyChargesChart;
