"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const ChurnGenderMonthlyChargesChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/churn-gender-monthly-charges");
        const data = await response.json();
        console.log("📊 API Response:", data);

        if (Array.isArray(data)) {
          setChartData(
            data.map(d => ({
              ...d,
              avgMonthlyCharge: Number(d.avgMonthlyCharge) // Ensure it's a number
            }))
          );
        } else {
          console.error("❌ Invalid data format:", data);
        }
      } catch (error) {
        console.error("❌ Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full p-4 bg-white shadow-md rounded-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Churn vs. Gender vs. Monthly Charges</h2>
        <p>Loading chart data...</p>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full p-4 bg-white shadow-md rounded-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Churn vs. Gender vs. Monthly Charges</h2>
        <p>No data available to display the chart.</p>
      </div>
    );
  }

  // Prepare the data for bar chart
  const groupedData = chartData.reduce((acc, curr) => {
    const key = `${curr.gender} - ${curr.churn}`;
    if (!acc[key]) {
      acc[key] = { gender: curr.gender, churn: curr.churn, totalCharges: 0, count: 0 };
    }
    acc[key].totalCharges += curr.avgMonthlyCharge;
    acc[key].count += 1;
    return acc;
  }, {});

  const chartDataForBar = Object.values(groupedData).map(item => ({
    gender: item.gender,
    churn: item.churn,
    avgMonthlyCharge: item.totalCharges / item.count,
  }));

  return (
    <div className="w-full p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Churn vs. Avg Monthly Charges</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartDataForBar}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="gender" name="Gender" />
          <YAxis name="Avg Monthly Charge" tickFormatter={(value) => value.toFixed(2)} />
          <Tooltip />
          <Legend />
          
          {/* Bars for Churned Users */}
          <Bar dataKey="avgMonthlyCharge" name="Churned" fill="#FF0000" />
          
          {/* You can add another Bar for Non-Churned Users if you want */}
          <Bar dataKey="avgMonthlyCharge" name="Not Churned" fill="#0088FE" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChurnGenderMonthlyChargesChart;
