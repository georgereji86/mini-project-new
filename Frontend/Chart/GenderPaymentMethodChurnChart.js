"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const GenderPaymentMethodChurnChart = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/gender-payment-method-churn");
        const data = await response.json();
        console.log("📊 API Data:", data);

        // Transform data to split gender for better visualization
        const formattedData = data.map((d) => ({
          paymentMethod: d.payment_method,
          maleChurnYes: d.gender === "Male" ? d.churn_yes : 0,
          maleChurnNo: d.gender === "Male" ? d.churn_no : 0,
          femaleChurnYes: d.gender === "Female" ? d.churn_yes : 0,
          femaleChurnNo: d.gender === "Female" ? d.churn_no : 0,
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
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Gender vs. Payment Method vs. Churn</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="paymentMethod" />
          <YAxis />
          <Tooltip />
          <Legend />
          {/* Stacked Bars for Male Churn */}
          <Bar dataKey="maleChurnYes" stackId="a" fill="#FF4D4D" name="Male - Churned" />
          <Bar dataKey="maleChurnNo" stackId="a" fill="#4CAF50" name="Male - Not Churned" />
          {/* Stacked Bars for Female Churn */}
          <Bar dataKey="femaleChurnYes" stackId="b" fill="#FF9999" name="Female - Churned" />
          <Bar dataKey="femaleChurnNo" stackId="b" fill="#81C784" name="Female - Not Churned" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GenderPaymentMethodChurnChart;
