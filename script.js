
// InsightDesk - Application Setup

// KPI Elements
const totalRevenue = document.querySelector("#totalRevenue");
const totalOrders = document.querySelector("#totalOrders");
const averageOrder = document.querySelector("#averageOrder");
const completedOrders = document.querySelector("#completedOrders");
const dataStatus = document.querySelector("#dataStatus");

// Filter Elements
const startDate = document.querySelector("#startDate");
const endDate = document.querySelector("#endDate");
const categoryFilter = document.querySelector("#categoryFilter");
const statusFilter = document.querySelector("#statusFilter");
const resetFilters = document.querySelector("#resetFilters");
const filterStatus = document.querySelector("#filterStatus");

// Table Elements
const searchInput = document.querySelector("#searchInput");
const transactionsBody = document.querySelector("#transactionsBody");
const tableStatus = document.querySelector("#tableStatus");
const tableWrapper = document.querySelector("#tableWrapper");
const recordCount = document.querySelector("#recordCount");

const pagination = document.querySelector("#pagination");
const prevButton = document.querySelector("#prevButton");
const nextButton = document.querySelector("#nextButton");
const pageInfo = document.querySelector("#pageInfo");

// Details Dialog
const detailsDialog = document.querySelector("#detailsDialog");
const detailsContent = document.querySelector("#detailsContent");
const closeDialog = document.querySelector("#closeDialog");

// Chart Elements
const revenueCanvas = document.querySelector("#revenueChart");
const statusCanvas = document.querySelector("#statusChart");

// Settings
const itemsPerPage = 10;

const currencyFormatter = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0
});

// Application Data
let salesData = [];
let currentPage = 1;
let searchTerm = "";
let sortField = "id";
let sortDirection = "asc";

let revenueChart = null;
let statusChart = null;


// Validate Records

function isValidRecord(record) {
    return (
        record &&
        Number.isFinite(record.id) &&
        typeof record.date === "string" &&
        !Number.isNaN(Date.parse(record.date)) &&
        typeof record.product === "string" &&
        record.product.trim() !== "" &&
        typeof record.category === "string" &&
        record.category.trim() !== "" &&
        Number.isFinite(record.revenue) &&
        record.revenue >= 0 &&
        ["Completed", "Pending", "Cancelled"].includes(record.status)
    );
}


// Load JSON Data

async function loadSalesData() {
    try {
        dataStatus.textContent = "Loading sales data...";
        tableStatus.textContent = "Loading transactions...";

        const response = await fetch("./data.json");

        if (!response.ok) {
            throw new Error("Unable to load sales data.");
        }

        const rawData = await response.json();

        if (!Array.isArray(rawData)) {
            throw new Error("Invalid dataset format.");
        }

        salesData = rawData.filter(isValidRecord);

        if (salesData.length === 0) {
            throw new Error("No valid sales records found.");
        }

        populateCategoryFilter();
        updateDashboard();

        dataStatus.classList.remove("error");
        dataStatus.textContent =
            `Successfully loaded ${salesData.length} valid records out of ${rawData.length}.`;

        if (salesData.length < rawData.length) {
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

        tableWrapper.hidden = true;
        pagination.hidden = true;
        recordCount.textContent = "0 records";

        tableStatus.classList.add("error");
        tableStatus.textContent =
            "Unable to load transactions. Please try again.";

        filterStatus.textContent = "Sales data is unavailable.";
    }
}


// Populate Category Filter

function populateCategoryFilter() {
    const categories = [
        ...new Set(salesData.map(order => order.category))
    ].sort();

    categoryFilter.replaceChildren(
        new Option("All Categories", "")
    );

    categories.forEach(category => {
        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        categoryFilter.appendChild(option);
    });
}


// Filter Records

function filterRecords(records, filters) {
    return records.filter(order => {

        const matchesStartDate =
            !filters.startDate || order.date >= filters.startDate;

        const matchesEndDate =
            !filters.endDate || order.date <= filters.endDate;

        const matchesCategory =
            !filters.category || order.category === filters.category;

        const matchesStatus =
            !filters.status || order.status === filters.status;

        const searchableText = [
            order.id,
            order.date,
            order.product,
            order.category,
            order.status,
            order.revenue
        ].join(" ").toLowerCase();

        const matchesSearch =
            searchableText.includes(filters.search.toLowerCase());

        return (
            matchesStartDate &&
            matchesEndDate &&
            matchesCategory &&
            matchesStatus &&
            matchesSearch
        );
    });
}


// Get Filtered Records

function getFilteredRecords() {
    return filterRecords(salesData, {
        startDate: startDate.value,
        endDate: endDate.value,
        category: categoryFilter.value,
        status: statusFilter.value,
        search: searchTerm
    });
}


// Calculate KPIs

function calculateKPIs(records) {
    const completed = records.filter(
        order => order.status === "Completed"
    );

    const revenue = completed.reduce(
        (total, order) => total + order.revenue,
        0
    );

    const average = completed.length > 0
        ? revenue / completed.length
        : 0;

    return {
        totalOrders: records.length,
        completedOrders: completed.length,
        totalRevenue: revenue,
        averageOrder: average
    };
}


// Update KPIs

function updateKPIs(records) {
    const kpis = calculateKPIs(records);

    totalRevenue.textContent =
        currencyFormatter.format(kpis.totalRevenue);

    totalOrders.textContent = kpis.totalOrders;

    averageOrder.textContent =
        currencyFormatter.format(kpis.averageOrder);

    completedOrders.textContent = kpis.completedOrders;
}


// Update Filter Status

function updateFilterStatus(records) {
    const hasDateError =
        startDate.value &&
        endDate.value &&
        startDate.value > endDate.value;

    if (hasDateError) {
        filterStatus.textContent =
            "Start date cannot be later than end date.";
        return;
    }

    filterStatus.textContent =
        `Showing ${records.length} of ${salesData.length} matching transactions.`;
}


// Create Revenue Chart

function createRevenueChart(records) {
    if (!revenueCanvas || typeof Chart === "undefined") {
        return;
    }

    const completed = records.filter(
        order => order.status === "Completed"
    );

    const revenueByDate = {};

    completed.forEach(order => {
        if (!revenueByDate[order.date]) {
            revenueByDate[order.date] = 0;
        }

        revenueByDate[order.date] += order.revenue;
    });

    const dates = Object.keys(revenueByDate).sort();

    const revenues = dates.map(date => revenueByDate[date]);

    if (revenueChart) {
        revenueChart.destroy();
    }

    revenueChart = new Chart(revenueCanvas, {
        type: "line",

        data: {
            labels: dates,

            datasets: [{
                label: "Completed Revenue",
                data: revenues,
                borderColor: "#477d6b",
                backgroundColor: "rgba(182, 214, 204, 0.3)",
                borderWidth: 3,
                fill: true,
                tension: 0.35,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label: context =>
                            currencyFormatter.format(context.parsed.y)
                    }
                }
            },

            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Date"
                    },

                    grid: {
                        display: false
                    }
                },

                y: {
                    beginAtZero: true,

                    ticks: {
                        callback: value =>
                            "PKR " + Number(value).toLocaleString("en-PK")
                    }
                }
            }
        }
    });
}


// Create Order Status Chart

function createStatusChart(records) {
    if (!statusCanvas || typeof Chart === "undefined") {
        return;
    }

    const statuses = ["Completed", "Pending", "Cancelled"];

    const statusCounts = statuses.map(status => {
        return records.filter(
            order => order.status === status
        ).length;
    });

    if (statusChart) {
        statusChart.destroy();
    }

    statusChart = new Chart(statusCanvas, {
        type: "doughnut",

        data: {
            labels: statuses,

            datasets: [{
                data: statusCounts,
                backgroundColor: [
                    "#78ad91",
                    "#e9bd70",
                    "#d9827c"
                ],
                borderWidth: 2,
                borderColor: "#ffffff",
                hoverOffset: 8
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom"
                },

                tooltip: {
                    callbacks: {
                        label: context => {
                            const total = context.dataset.data.reduce(
                                (sum, value) => sum + value,
                                0
                            );

                            const percentage = total > 0
                                ? ((context.parsed / total) * 100).toFixed(1)
                                : 0;

                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}


// Update Both Charts

function updateCharts(records) {
    createRevenueChart(records);
    createStatusChart(records);
}


// Update Complete Dashboard

function updateDashboard() {
    const filteredRecords = getFilteredRecords();

    updateKPIs(filteredRecords);
    updateCharts(filteredRecords);
    updateFilterStatus(filteredRecords);
    renderTransactions(filteredRecords);
}


// Sort Records

function getSortedRecords(records) {
    return [...records].sort((a, b) => {
        let first = a[sortField];
        let second = b[sortField];

        if (sortField === "date") {
            first = new Date(first).getTime();
            second = new Date(second).getTime();
        }

        if (typeof first === "string") {
            first = first.toLowerCase();
            second = second.toLowerCase();
        }

        if (first < second) {
            return sortDirection === "asc" ? -1 : 1;
        }

        if (first > second) {
            return sortDirection === "asc" ? 1 : -1;
        }

        return 0;
    });
}


// Render Transactions Table

function renderTransactions(records) {
    const sortedRecords = getSortedRecords(records);

    const totalPages = Math.ceil(
        sortedRecords.length / itemsPerPage
    );

    recordCount.textContent =
        `${records.length} transactions found`;

    transactionsBody.replaceChildren();

    if (sortedRecords.length === 0) {
        tableWrapper.hidden = true;
        pagination.hidden = true;

        tableStatus.classList.remove("error");
        tableStatus.textContent = "No matching transactions found.";

        pageInfo.textContent = "Page 0 of 0";
        return;
    }

    tableStatus.textContent = "";
    tableStatus.classList.remove("error");

    tableWrapper.hidden = false;
    pagination.hidden = false;

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;

    const currentRecords = sortedRecords.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    currentRecords.forEach(order => {
        const row = document.createElement("tr");

        const values = [
            order.id,
            order.date,
            order.product,
            order.category,
            currencyFormatter.format(order.revenue)
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");

        statusBadge.textContent = order.status;
        statusBadge.className =
            `status-badge status-${order.status.toLowerCase()}`;

        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        const actionCell = document.createElement("td");
        const detailsButton = document.createElement("button");

        detailsButton.textContent = "View Details";
        detailsButton.className = "details-button";
        detailsButton.type = "button";

        detailsButton.addEventListener("click", () => {
            showDetails(order);
        });

        actionCell.appendChild(detailsButton);
        row.appendChild(actionCell);

        transactionsBody.appendChild(row);
    });

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
}


// Filter Events

[startDate, endDate, categoryFilter, statusFilter].forEach(element => {
    element.addEventListener("change", () => {
        currentPage = 1;
        updateDashboard();
    });
});


// Reset Filters

resetFilters.addEventListener("click", () => {
    startDate.value = "";
    endDate.value = "";
    categoryFilter.value = "";
    statusFilter.value = "";
    searchInput.value = "";

    searchTerm = "";
    currentPage = 1;

    updateDashboard();
});


// Search Event

searchInput.addEventListener("input", event => {
    searchTerm = event.target.value.trim().toLowerCase();

    currentPage = 1;
    updateDashboard();
});


// Sorting Events

document.querySelectorAll(".sort-button").forEach(button => {
    button.addEventListener("click", () => {
        const selectedField = button.dataset.sort;

        if (sortField === selectedField) {
            sortDirection =
                sortDirection === "asc" ? "desc" : "asc";
        } else {
            sortField = selectedField;
            sortDirection = "asc";
        }

        currentPage = 1;
        renderTransactions(getFilteredRecords());
    });
});


// Pagination Events

prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderTransactions(getFilteredRecords());
    }
});

nextButton.addEventListener("click", () => {
    const totalPages = Math.ceil(
        getFilteredRecords().length / itemsPerPage
    );

    if (currentPage < totalPages) {
        currentPage++;
        renderTransactions(getFilteredRecords());
    }
});


// Show Transaction Details

function showDetails(order) {
    detailsContent.replaceChildren();

    const details = [
        ["Order ID", order.id],
        ["Date", order.date],
        ["Product", order.product],
        ["Category", order.category],
        ["Revenue", currencyFormatter.format(order.revenue)],
        ["Status", order.status]
    ];

    details.forEach(([label, value]) => {
        const row = document.createElement("div");
        row.className = "detail-row";

        const labelElement = document.createElement("span");
        labelElement.textContent = label;

        const valueElement = document.createElement("span");
        valueElement.textContent = value;

        row.append(labelElement, valueElement);
        detailsContent.appendChild(row);
    });

    detailsDialog.showModal();
}


// Close Details Dialog

closeDialog.addEventListener("click", () => {
    detailsDialog.close();
});


// Automated Tests

function runDashboardTests() {
    console.group("InsightDesk - Dashboard Tests");

    let passed = 0;
    let failed = 0;

    function test(testName, condition) {
        if (condition) {
            console.log(`PASS: ${testName}`);
            passed++;
        } else {
            console.error(`FAIL: ${testName}`);
            failed++;
        }
    }

    // Sample data used only for testing
    const sampleRecords = [
        {
            id: 1,
            date: "2026-11-01",
            product: "Laptop",
            category: "Electronics",
            revenue: 1000,
            status: "Completed"
        },
        {
            id: 2,
            date: "2026-11-02",
            product: "Phone",
            category: "Electronics",
            revenue: 300,
            status: "Pending"
        },
        {
            id: 3,
            date: "2026-11-03",
            product: "Chair",
            category: "Furniture",
            revenue: 500,
            status: "Completed"
        },
        {
            id: 4,
            date: "2026-11-04",
            product: "Table",
            category: "Furniture",
            revenue: 200,
            status: "Cancelled"
        }
    ];

    // Test 1: KPI Calculation
    const kpis = calculateKPIs(sampleRecords);

    test(
        "KPI calculation",
        kpis.totalOrders === 4 &&
        kpis.completedOrders === 2 &&
        kpis.totalRevenue === 1500 &&
        kpis.averageOrder === 750
    );

    // Test 2: Category Filter
    const electronicsRecords = filterRecords(sampleRecords, {
        startDate: "",
        endDate: "",
        category: "Electronics",
        status: "",
        search: ""
    });

    test(
        "Category filter",
        electronicsRecords.length === 2 &&
        electronicsRecords.every(
            order => order.category === "Electronics"
        )
    );

    // Test 3: Combined Category and Status Filter
    const completedElectronics = filterRecords(sampleRecords, {
        startDate: "",
        endDate: "",
        category: "Electronics",
        status: "Completed",
        search: ""
    });

    test(
        "Combined category and status filter",
        completedElectronics.length === 1 &&
        completedElectronics[0].product === "Laptop" &&
        completedElectronics[0].status === "Completed"
    );

    console.log(`Test Summary: ${passed} passed, ${failed} failed.`);
    console.groupEnd();

    return {
        passed,
        failed,
        total: passed + failed
    };
}


// Run Tests and Start Dashboard

runDashboardTests();
loadSalesData();
