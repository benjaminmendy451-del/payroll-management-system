# Payroll Management System

A full-stack payroll management application with:
- secure admin login
- employee management
- payroll computation and summaries
- payslips and PDF export
- SQLite database persistence
- Express backend API

## Default login
- Username: `admin`
- Password: `admin123`

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

3. Open your browser at:

```text
http://localhost:3000
```

## Features
- Admin login with authentication
- Add, edit, and delete employees
- Department filtering and payroll summaries
- Automatic payroll calculations
- Real PDF payslip export using jsPDF
- SQLite data persistence
- Responsive dashboard UI

## Project structure
- `server.js` – Express backend and API routes
- `public/index.html` – app UI
- `public/style.css` – styles
- `public/script.js` – frontend logic
- `payroll.db` – SQLite database generated automatically

## Notes
The app stores payroll data in a local SQLite database file named `payroll.db` in the project root.
