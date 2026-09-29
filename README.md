# Payroll Management System

A comprehensive automated payroll management web application built with HTML, CSS, and JavaScript.

## Features

### Dashboard
- Real-time payroll summary statistics
- Department distribution chart
- Salary range analysis
- Total employees, gross payroll, deductions, and net payroll displays

### Employee Management
- Add new employees with detailed information
- View complete employee database
- Edit employee details
- Delete employees
- Support for multiple departments

### Payroll Processing
- Automatic salary calculations
- Base salary, overtime, bonuses, and allowances tracking
- Tax calculations (customizable rates)
- Health insurance deductions
- Other deductions tracking
- Department-based filtering

### Payslips & Reports
- Generate individual payslips
- Download payslips as PDF (simulation)
- Monthly payroll reports
- Detailed breakdown of earnings and deductions

## Installation

1. Clone or download the repository
2. Open `index.html` in a web browser
3. Or serve with a local server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`

## Usage

1. **Dashboard Tab**: View payroll summary and charts
2. **Employees Tab**: Add, view, and manage employees
3. **Payroll Tab**: View detailed payroll information with filtering
4. **Reports Tab**: Generate and download payslips

## Data Storage

All employee data is stored in browser's localStorage and persists across sessions.

## Technologies Used
- HTML5
- CSS3 (with responsive design)
- Vanilla JavaScript (ES6+)
- LocalStorage API

## Files
- `index.html` – Application structure
- `style.css` – Styling and responsive design
- `script.js` – Business logic and data management
