"use client";
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, Title, Tooltip } from "chart.js";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2"; // Import the Bar chart component

// Register necessary components for Chart.js
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement,  // Register BarElement for bar chart
  Title, 
  Tooltip, 
  Legend,
  Filler, // Register the Filler plugin
  ArcElement // For pie charts if needed later
);

const PredictChurn = () => {
  const [tenure, setTenure] = useState("");
  const [monthlyCharges, setMonthlyCharges] = useState("");
  const [totalCharges, setTotalCharges] = useState("");
  const [contract, setContract] = useState("Month-to-month");
  const [internetService, setInternetService] = useState("DSL");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);  // Track if client-side rendering is complete

  // Set the flag to indicate that component has mounted on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    if (!tenure || !monthlyCharges || !totalCharges) {
      setError("Please fill in all fields with valid numbers.");
      setLoading(false);
      return;
    }

    const inputData = {
      tenure: Number(tenure),
      monthlyCharges: Number(monthlyCharges),
      totalCharges: Number(totalCharges),
      contract,
      internetService,
    };

    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputData),
      });

      if (!response.ok) throw new Error("Server error. Please try again.");

      const data = await response.json();

      // Calculate feature contributions
      const contributions = calculateFeatureContributions(data, inputData);

      // Determine retention strategy
      const retentionStrategy = determineRetentionStrategy(contributions);

      // Set the result without time-to-churn and urgency score
      setResult({
        ...data,
        contributions,
        retentionStrategy,
      });
    } catch (error) {
      setError("Failed to fetch prediction. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

  const calculateFeatureContributions = (data, inputData) => {
    const contributions = {};

    // Example conditions for feature contributions
    contributions.tenure = inputData.tenure < 12 ? 30 : 10; // Higher contribution if tenure is less than 12 months
    contributions.monthlyCharges = inputData.monthlyCharges > 70 ? 40 : 10; // Higher contribution if monthly charges are high
    contributions.totalCharges = inputData.totalCharges < 500 ? 20 : 10; // Higher contribution if total charges are low
    contributions.contract = inputData.contract === "Month-to-month" ? 50 : 10; // Higher contribution for month-to-month contracts
    contributions.internetService = inputData.internetService === "DSL" ? 10 : (inputData.internetService === "Fiber optic" ? 30 : 5);

    // Normalize contributions to ensure their sum equals 100%
    const totalContribution = Object.values(contributions).reduce((sum, value) => sum + value, 0);
    Object.keys(contributions).forEach((key) => {
        contributions[key] = (contributions[key] / totalContribution) * 100;
    });

    return contributions;
  };

  const determineRetentionStrategy = (contributions) => {
    // Find the maximum contribution value
    const maxContribution = Math.max(...Object.values(contributions));

    // Find all features with the maximum contribution value (handle ties)
    const maxFeatures = Object.keys(contributions).filter(
        (key) => contributions[key] === maxContribution
    );

    // Define retention strategies as specific offers for each feature
    const strategies = {
        tenure: [
            "Exclusive 3-month discount on your plan.",
            "Earn double loyalty points for the next 6 months.",
            "Free onboarding session to explore all service benefits.",
            "Dedicated account manager for personalized support.",
        ],
        monthlyCharges: [
            "20% discount on your monthly charges for the next 3 months.",
            "Switch to a flexible plan with no additional cost.",
            "Bundle your services and save up to 30%.",
            "Usage-based billing option to reduce your monthly expenses.",
        ],
        totalCharges: [
            "Get $50 cashback on your total charges.",
            "Upgrade to a premium plan for free for the next 3 months.",
            "Split your total charges into easy monthly installments.",
            "Receive a personalized thank-you gift for your loyalty.",
        ],
        contract: [
            "Save 20% by switching to an annual plan and get 1 month free.",
            "Renew early and enjoy bonus services like free upgrades.",
            "Flexible cancellation policy for long-term contracts.",
            "Exclusive loyalty perks for month-to-month customers.",
        ],
        internetService: [
            "Upgrade to high-speed fiber internet at no extra cost for 3 months.",
            "Free premium add-ons like higher speed for 3 months.",
            "24/7 dedicated support for any service issues.",
            "Priority access to network performance improvements.",
        ],
    };

    // Collect strategies for all features with the maximum contribution
    const retentionStrategies = [];
    maxFeatures.forEach((feature) => {
        retentionStrategies.push(...strategies[feature]);
    });

    return retentionStrategies;
  };

  // Prepare the chart data for bar chart
  const chartData = result ? {
    labels: ['Tenure', 'Monthly Charges', 'Total Charges', 'Contract', 'Internet Service'],
    datasets: [
        {
            label: 'Feature Contributions to Churn',
            data: Object.values(result.contributions),
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)', // Red
                'rgba(54, 162, 235, 0.6)', // Blue
                'rgba(255, 206, 86, 0.6)', // Yellow
                'rgba(75, 192, 192, 0.6)', // Green
                'rgba(153, 102, 255, 0.6)', // Purple
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)', // Red
                'rgba(54, 162, 235, 1)', // Blue
                'rgba(255, 206, 86, 1)', // Yellow
                'rgba(75, 192, 192, 1)', // Green
                'rgba(153, 102, 255, 1)', // Purple
            ],
            borderWidth: 2,
            borderRadius: 10, // Rounded bar edges
            hoverBackgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)',
            ],
        },
    ],
} : {};

const chartOptions = {
    responsive: true,
    plugins: {
        title: {
            display: true,
            text: 'Feature Contributions to Churn',
            font: {
                size: 18,
                weight: 'bold',
            },
            color: '#333',
        },
        tooltip: {
            callbacks: {
                label: (context) => `${context.label}: ${context.raw.toFixed(2)}%`,
            },
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            titleFont: { size: 14 },
            bodyFont: { size: 12 },
            borderColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 1,
        },
        legend: {
            display: false, // Hide legend for simplicity
        },
    },
    scales: {
        x: {
            title: {
                display: true,
                text: 'Features',
                font: {
                    size: 14,
                    weight: 'bold',
                },
                color: '#333',
            },
            ticks: {
                font: {
                    size: 12,
                },
                color: '#666',
            },
        },
        y: {
            title: {
                display: true,
                text: 'Contribution (%)',
                font: {
                    size: 14,
                    weight: 'bold',
                },
                color: '#333',
            },
            ticks: {
                stepSize: 10,
                callback: (value) => `${value}%`,
                font: {
                    size: 12,
                },
                color: '#666',
            },
            grid: {
                color: 'rgba(200, 200, 200, 0.3)',
            },
        },
    },
};

// Render only on the client side
if (!isClient) {
    return null; // Or you can show a loading spinner here
}

return (
    <div className="p-6 max-w-lg mx-auto bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Churn Prediction</h2>

        <input type="number" placeholder="Tenure" value={tenure} onChange={(e) => setTenure(e.target.value)} className="w-full p-2 border rounded mb-2" />
        <input type="number" placeholder="Monthly Charges" value={monthlyCharges} onChange={(e) => setMonthlyCharges(e.target.value)} className="w-full p-2 border rounded mb-2" />
        <input type="number" placeholder="Total Charges" value={totalCharges} onChange={(e) => setTotalCharges(e.target.value)} className="w-full p-2 border rounded mb-2" />

        <select value={contract} onChange={(e) => setContract(e.target.value)} className="w-full p-2 border rounded mb-2">
            <option value="Month-to-month">Month-to-month</option>
            <option value="One year">One year</option>
            <option value="Two year">Two year</option>
        </select>

        <select value={internetService} onChange={(e) => setInternetService(e.target.value)} className="w-full p-2 border rounded mb-2">
            <option value="DSL">DSL</option>
            <option value="Fiber optic">Fiber optic</option>
            <option value="No">No Internet</option>
        </select>

        <button onClick={handlePredict} disabled={loading} className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400">
            {loading ? "Predicting..." : "Predict Churn"}
        </button>

        {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
        {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
                <p className="font-medium"><strong>Churn Probability:</strong> {result.churn_probability}</p>
                <p className={`font-bold ${result.churn === "Yes" ? "text-red-500" : "text-green-500"}`}>
                    <strong>Churn:</strong> {result.churn}
                </p>
                <p className="mt-2 text-blue-600 font-medium"><strong>Retention Offers:</strong></p>
                <ul className="list-disc ml-6 mt-2">
                    {result.retentionStrategy.map((strategy, index) => (
                        <li key={index} className="text-gray-700">{strategy}</li>
                    ))}
                </ul>

                {/* Displaying the enhanced bar chart */}
                <div className="mt-4">
                    <h3 className="text-xl font-semibold">Feature Contributions</h3>
                    <Bar data={chartData} options={chartOptions} />
                </div>
            </div>
        )}
    </div>
);
};

export default PredictChurn;
