"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const ChurnTenureHistogram = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/churn-tenure");
        const data = await response.json();
        console.log("📊 API Data:", data);

        // Convert tenure_values into frequency counts
        const tenureCounts = {};
        data[0].tenure_values.forEach((tenure) => {
          tenureCounts[tenure] = (tenureCounts[tenure] || 0) + 1;
        });

        // Format data for Recharts
        const formattedData = Object.entries(tenureCounts).map(([tenure, count]) => ({
          tenure: parseInt(tenure),
          count,
        }));

        setChartData(formattedData);
      } catch (error) {
        console.error("❌ Error fetching chart data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="w-full p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Churned Customers - Tenure Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="tenure" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#FF4D4D" name="Churned Users" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChurnTenureHistogram;
