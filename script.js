// Selecting HTML elements
const totalRevenue = document.querySelector("#totalRevenue");
const totalOrders = document.querySelector("#totalOrders");
const averageOrder = document.querySelector("#averageOrder");
const completedOrders = document.querySelector("#completedOrders");
const dataStatus = document.querySelector("#dataStatus");

// Currency formatter
const currencyFormatter = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0
});

// Loading sales data
async function loadSalesData() {
    try {
        dataStatus.textContent = "Loading sales data...";

        const response = await fetch("./data.json");

        if (!response.ok) {
            throw new Error("Unable to load sales data.");
        }

        const salesData = await response.json();

        if (!Array.isArray(salesData)) {
            throw new Error("Invalid dataset format.");
        }

        // Validate individual records
        const validRecords = salesData.filter((record) => {
            return (
                record &&
                Number.isFinite(record.id) &&
                typeof record.date === "string" &&
                !Number.isNaN(Date.parse(record.date)) &&
                typeof record.product === "string" &&
                typeof record.category === "string" &&
                Number.isFinite(record.revenue) &&
                record.revenue >= 0 &&
                ["Completed", "Pending", "Cancelled"].includes(record.status)
            );
        });

        if (validRecords.length === 0) {
            throw new Error("No valid sales records found.");
        }

        // Calculate total orders
        const orders = validRecords.length;

        // Get completed orders
        const completed = validRecords.filter((order) => {
            return order.status === "Completed";
        });

        // Calculate total revenue from completed orders
        const revenue = completed.reduce((total, order) => {
            return total + order.revenue;
        }, 0);

        // Calculate average order value
        const average = completed.length > 0
            ? revenue / completed.length
            : 0;

        // Update KPI cards
        totalRevenue.textContent = currencyFormatter.format(revenue);
        totalOrders.textContent = orders;
        averageOrder.textContent = currencyFormatter.format(average);
        completedOrders.textContent = completed.length;

        dataStatus.classList.remove("error");
        dataStatus.textContent =
            `Successfully loaded ${validRecords.length} valid records out of ${salesData.length}.`;

        if (validRecords.length < salesData.length) {
            dataStatus.textContent += " Some invalid records were skipped.";
        }

    } catch (error) {
        console.error("Dashboard Error:", error);

        totalRevenue.textContent = "Unavailable";
        totalOrders.textContent = "Unavailable";
        averageOrder.textContent = "Unavailable";
        completedOrders.textContent = "Unavailable";

        dataStatus.classList.add("error");
        dataStatus.textContent =
            "Unable to load sales data. Please check your dataset and try again.";
    }
}

// Start dashboard
loadSalesData();