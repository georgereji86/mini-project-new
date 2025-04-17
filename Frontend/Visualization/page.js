"use client";
import { useState } from "react";
import GenderMonthlyChargesChart from "@/components/chart/GenderMonthlyChargesChart";
import TenureMonthlyChargesChart from "@/components/chart/TenureMonthlyChart";
import ChurnDistributionChart from "@/components/chart/ChurnDistributionChart";
import ChurnGenderMonthlyChargesChart from "@/components/chart/ChurnGenderMonthlyChargesChart";
import ChurnTenureChart from "@/components/chart/ChurnTenureChart";
import GenderPaymentMethodChurnChart from "@/components/chart/GenderPaymentMethodChurnChart";
import GenderStreamingMoviesChart from "@/components/chart/GenderStreamingMoviesChart";

export default function VisualizationPage() {
    const [selectedChart, setSelectedChart] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // Loading state

    // Mapping of chart names to chart components
    const charts = {
        "Churn vs Gender vs Monthly Charges": <ChurnGenderMonthlyChargesChart />,
        "Churn vs Tenure": <ChurnTenureChart />,
        "Gender vs Payment Method vs Churn": <GenderPaymentMethodChurnChart />,
        "Gender vs Streaming Movies": <GenderStreamingMoviesChart />,
        "Churn Distribution": <ChurnDistributionChart />,
        "Tenure vs Monthly Charges": <TenureMonthlyChargesChart />,
        "Gender vs Monthly Charges": <GenderMonthlyChargesChart />,
    };

    // Handle chart selection and data loading
    const handleChartSelection = async (chartName) => {
        setIsLoading(true); // Set loading state to true when selecting a chart
        setSelectedChart(chartName); // Update selected chart
        // Simulate an actual data fetch with async
        try {
            // Optionally, you could fetch the actual data here if needed
            // For example:
            // const response = await fetch("api/endpoint-to-fetch-data");
            // const data = await response.json();
        } catch (error) {
            console.error("Error fetching chart data:", error);
        } finally {
            setIsLoading(false); // Set loading to false when data is ready
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Customer Data Visualization</h1>
            <div className="flex space-x-4 mb-6">
                {/* Map through chart names to generate buttons */}
                {Object.keys(charts).map((chartName) => (
                    <button
                        key={chartName}
                        onClick={() => handleChartSelection(chartName)}
                        className={`px-4 py-2 rounded-md font-semibold transition-all ${
                            selectedChart === chartName
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-black hover:bg-gray-300"
                        }`}
                    >
                        {chartName}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {/* Display loading text if loading is true */}
                {isLoading ? (
                    <p>Loading chart...</p>
                ) : (
                    selectedChart ? (
                        // Render the selected chart component
                        charts[selectedChart]
                    ) : (
                        <p>Select a chart to display</p>
                    )
                )}
            </div>
        </div>
    );
}
