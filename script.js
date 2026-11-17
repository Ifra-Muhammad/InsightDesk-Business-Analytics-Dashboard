// KPI Elements
const totalRevenue = document.querySelector("#totalRevenue");
const totalOrders = document.querySelector("#totalOrders");
const averageOrder = document.querySelector("#averageOrder");
const completedOrders = document.querySelector("#completedOrders");
const dataStatus = document.querySelector("#dataStatus");

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

// Validate Records
function isValidRecord(record) {
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

        updateKPIs();
        renderTransactions();

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
    }
}

// Calculate KPIs
function updateKPIs() {
    const completed = salesData.filter(
        order => order.status === "Completed"
    );

    const revenue = completed.reduce(
        (total, order) => total + order.revenue,
        0
    );

    const average = completed.length > 0
        ? revenue / completed.length
        : 0;

    totalRevenue.textContent = currencyFormatter.format(revenue);
    totalOrders.textContent = salesData.length;
    averageOrder.textContent = currencyFormatter.format(average);
    completedOrders.textContent = completed.length;
}

// Search Records
function getFilteredRecords() {
    return salesData.filter(order => {
        const searchableText = [
            order.id,
            order.date,
            order.product,
            order.category,
            order.status
        ].join(" ").toLowerCase();

        return searchableText.includes(searchTerm);
    });
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

// Render Table
function renderTransactions() {
    const filteredRecords = getFilteredRecords();
    const sortedRecords = getSortedRecords(filteredRecords);

    const totalPages = Math.ceil(
        sortedRecords.length / itemsPerPage
    );

    recordCount.textContent =
        `${filteredRecords.length} transactions found`;

    transactionsBody.replaceChildren();

    if (sortedRecords.length === 0) {
        tableWrapper.hidden = true;
        pagination.hidden = true;

        tableStatus.classList.remove("error");
        tableStatus.textContent = searchTerm
            ? "No matching transactions found."
            : "No transactions available.";

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

// Search Event
searchInput.addEventListener("input", event => {
    searchTerm = event.target.value.trim().toLowerCase();
    currentPage = 1;
    renderTransactions();
});

// Sorting Events
document.querySelectorAll(".sort-button").forEach(button => {
    button.addEventListener("click", () => {
        const selectedField = button.dataset.sort;

        if (sortField === selectedField) {
            sortDirection = sortDirection === "asc" ? "desc" : "asc";
        } else {
            sortField = selectedField;
            sortDirection = "asc";
        }

        currentPage = 1;
        renderTransactions();
    });
});

// Pagination Events
prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderTransactions();
    }
});

nextButton.addEventListener("click", () => {
    const totalPages = Math.ceil(
        getFilteredRecords().length / itemsPerPage
    );

    if (currentPage < totalPages) {
        currentPage++;
        renderTransactions();
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

// Close Dialog
closeDialog.addEventListener("click", () => {
    detailsDialog.close();
});

// Start Dashboard
loadSalesData();
