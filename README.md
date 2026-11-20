# InsightDesk — Interactive Business Analytics Dashboard

InsightDesk is a responsive business analytics dashboard built with HTML, CSS, and JavaScript. It helps users explore sales data, monitor business performance, visualize trends, and manage transactions through interactive filters and charts.

## Features

- **KPI Dashboard:** Displays Total Revenue, Total Orders, Average Order Value, and Completed Orders.
- **Dynamic Filters:** Filter transactions by date range, category, and order status.
- **Interactive Charts:** Visualize completed revenue trends using a line chart and order status distribution using a doughnut chart.
- **Search Transactions:** Search records by order ID, date, product, category, status, or revenue.
- **Sorting:** Sort transaction records by available columns.
- **Pagination:** Browse transactions across multiple pages.
- **View Details:** Open a dialog to view complete transaction information.
- **CSV Export:** Download all currently filtered transactions as a CSV file.
- **Shareable Filter Links:** Copy a URL containing selected filters and restore those filters when the link is opened.
- **Data Validation:** Validate JSON records and skip invalid entries.
- **Responsive Design:** Supports desktop, tablet, and mobile screens.
- **Accessibility:** Includes semantic HTML, keyboard navigation support, accessible labels, and visible focus indicators.
- **Automated Tests:** Includes basic tests for KPI calculations and filtering functionality.

## Technologies Used

- HTML5
- CSS3
- JavaScript (Vanilla JS)
- Chart.js
- JSON
- Browser Fetch API
- Browser URL and Clipboard APIs


## KPI Calculations

The dashboard calculates its KPIs dynamically using the currently filtered records.

| KPI | Calculation |
|---|---|
| Total Orders | Count of all filtered records |
| Completed Orders | Count of filtered records with Completed status |
| Total Revenue | Sum of revenue from Completed orders |
| Average Order Value | Total Revenue / Completed Orders |

If there are no completed orders, Average Order Value is displayed as zero.

## Getting Started

### 1. Clone the Repository

```bash
git clone YOUR_REPOSITORY_URL
```

### 2. Open the Project

Open the project folder in Visual Studio Code.

### 3. Run with Live Server

Install the Live Server extension in VS Code if it is not already installed.

Right-click `index.html` and select **Open with Live Server**.

The dashboard will open in your browser.

**Note:** Run the project through a local development server because the application loads sales records using the Fetch API.

## Dataset

The project uses a local `data.json` file containing sample sales transactions.

Each record includes:

- Order ID
- Date
- Product
- Category
- Revenue
- Status

Supported order statuses:

- Completed
- Pending
- Cancelled

## Automated Testing

The application includes three basic automated tests:

1. KPI Calculation — checks total orders, completed orders, total revenue, and average order value.
2. Category Filter — checks whether category filtering returns the correct records.
3. Combined Category and Status Filter — checks whether multiple filters work together.

To view the test results:

1. Open the dashboard in Chrome.
2. Press `F12`.
3. Open the Console tab.
4. Check the test summary.

Expected result:

```text
Test Summary: 3 passed, 0 failed.
```

## CSV Export

The Export CSV feature downloads all transactions matching the currently selected filters.

The exported file includes:

- Order ID
- Date
- Product
- Category
- Revenue
- Status

The export includes all matching records, not only the records visible on the current pagination page.
