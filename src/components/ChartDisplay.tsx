import React, { useState, useEffect } from "react";

const ChartDisplay: React.FC = () => {
    const [base64Image, setBase64Image] = useState<string | null>(null);

    useEffect(() => {
        const fetchChart = async () => {
            try {
                const response = await fetch("/api/generate_chart_plot", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        data: { label1: [10, 20, 30], label2: [15, 25, 35] },
                        title: "Sample Chart",
                    }),
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch chart data");
                }

                const result = await response.json();
                setBase64Image(result.base64Image);
            } catch (error) {
                console.error("Error fetching chart:", error);
            }
        };

        fetchChart();
    }, []);

    return (
        <div>
            {base64Image ? (
                <img
                    src={`data:image/png;base64,${base64Image}`}
                    alt="Generated Chart"
                    style={{ width: "100%", height: "auto" }}
                />
            ) : (
                <p>Loading chart...</p>
            )}
        </div>
    );
};

export default ChartDisplay;
