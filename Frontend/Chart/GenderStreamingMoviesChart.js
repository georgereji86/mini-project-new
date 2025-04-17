"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const GenderStreamingMoviesChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/gender-streaming-movies");
        const data = await response.json();
        console.log("📊 API Data:", data);

        if (Array.isArray(data)) {
          // Convert to grouped format for recharts
          const formattedData = data.reduce((acc, item) => {
            const genderEntry = acc.find((d) => d.gender === item.gender);
            if (genderEntry) {
              genderEntry[item.streaming_movies] = item.count;
            } else {
              acc.push({ gender: item.gender, [item.streaming_movies]: item.count });
            }
            return acc;
          }, []);

          setChartData(formattedData);
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
    return <p>Loading chart data...</p>;
  }

  return (
    <div className="w-full p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Gender vs Streaming Movies</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} barGap={5}>
          <XAxis dataKey="gender" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Yes" stackId="a" fill="#4CAF50" name="Uses Streaming Movies" />
          <Bar dataKey="No" stackId="a" fill="#FF4D4D" name="Does Not Use" />
          <Bar dataKey="No internet service" stackId="a" fill="#8884d8" name="No Internet" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GenderStreamingMoviesChart;
