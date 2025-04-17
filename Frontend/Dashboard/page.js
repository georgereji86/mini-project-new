"use client";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const router = useRouter();

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="space-y-4">
                <button 
                    className="bg-blue-500 text-white px-4 py-2 rounded" 
                    onClick={() => router.push("/predict")}
                >
                    Predict Customer Churn
                </button>
                <button 
                    className="bg-green-500 text-white px-4 py-2 rounded" 
                    onClick={() => router.push("/visualization")}
                >
                    View Customer Visualization
                </button>
            </div>
        </div>
    );
}
