const STORAGE_KEY = 'payrollEmployees';

const defaultEmployees = [
  {
    id: crypto.randomUUID(),
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    employeeId: 'EMP001',
    department: 'Engineering',
    baseSalary: 6500,
    overtime: 300,
    bonus: 500,
    allowances: 150,
    deductions: 300,
    healthInsurance: 200,
    taxRate: 12.5,
    payPeriod: 'Monthly',
    joinDate: '2022-01-15'
  },
  {
    id: crypto.randomUUID(),
    name: 'Michael Lee',
    email: 'michael.lee@company.com',
    employeeId: 'EMP002',
    department: 'Finance',
    baseSalary: 5200,
    overtime: 180,
    bonus: 350,
    allowances: 100,
    deductions: 250,
    healthInsurance: 180,
    taxRate: 10,
    payPeriod: 'Monthly',
    joinDate: '2021-06-20'
  },
  {
    id: crypto.randomUUID(),
    name: 'Amina Yusuf',
    email: 'amina.yusuf@company.com',
    employeeId: 'EMP003',
    department: 'HR',
    baseSalary: 4700,
    overtime: 220,
    bonus: 280,
    allowances: 120,
    deductions: 220,
    healthInsurance: 160,
    taxRate: 9.5,
    payPeriod: 'Monthly',
    joinDate: '2020-03-10'
  },
  {
    id: crypto.randomUUID(),
    name: 'James Chen',
    email: 'james.chen@company.com',
    employeeId: 'EMP004',
    department: 'Sales',
    baseSalary: 5500,
    overtime: 250,
    bonus: 600,
    allowances: 200,
    deductions: 280,
    healthInsurance: 190,
    taxRate: 11,
    payPeriod: 'Monthly',
    joinDate: '2021-09-05'
  }
];

// DOM Elements
const form = document.getElementById('employeeForm');
const employeeTableBody = document.getElementById('employeeTableBody');
const payrollTableBody = document.getElementById('payrollTableBody');
const payslipList = document.getElementById('payslipList');
const totalEmployees = document.getElementById('totalEmployees');
const grossPayroll = document.getElementById('grossPayroll');
const totalDeductions = document.getElementById('totalDeductions');
const netPayroll = document.getElementById('netPayroll');
const resetDataBtn = document.getElementById('resetDataBtn');
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const employeeModal = document.getElementById('employeeModal');
const editModal = document.getElementById('editModal');
const closeModal = document.querySelector('.close');
const editCloseModal = document.querySelector('.edit-close');
const deptFilter = document.getElementById('deptFilter');
const editForm = document.getElementById('editForm');
const monthPicker = document.getElementById('monthPicker');
const deptChart = document.getElementById('deptChart');
const salaryChart = document.getElementById('salaryChart');

let currentEmployeeId = null;

// Data Management
function getEmployees() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultEmployees));
    return [...defaultEmployees];
  }

  try {
    const employees = JSON.parse(stored);
    return Array.isArray(employees) && employees.length ? employees : [...defaultEmployees];
  } catch (error) {
    console.error('Error loading employees:', error);
    return [...defaultEmployees];
  }
}

function saveEmployees(employees) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value || 0);
}

function calculateEmployeePayroll(employee) {
  const base = Number(employee.baseSalary || 0);
  const overtime = Number(employee.overtime || 0);
  const bonus = Number(employee.bonus || 0);
  const allowances = Number(employee.allowances || 0);
  const deductions = Number(employee.deductions || 0);
  const healthInsurance = Number(employee.healthInsurance || 0);
  const taxRate = Number(employee.taxRate || 0);

  const gross = base + overtime + bonus + allowances;
  const taxAmount = (gross * taxRate) / 100;
  const totalDeductions = deductions + healthInsurance + taxAmount;
  const net = gross - totalDeductions;

  return {
    gross,
    taxAmount,
    totalDeductions,
    net
  };
}

// Render Functions
function renderEmployeeTable() {
  const employees = getEmployees();
  employeeTableBody.innerHTML = '';

  if (!employees.length) {
    employeeTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No employees found.</td></tr>';
    return;
  }

  employees.forEach((employee) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${employee.name}</td>
      <td>${employee.department}</td>
      <td>${employee.email}</td>
      <td>${formatCurrency(employee.baseSalary)}</td>
      <td><span class="badge">Active</span></td>
      <td>
        <button class="delete-btn view-btn" data-id="${employee.id}">View</button>
      </td>
    `;
    employeeTableBody.appendChild(row);
  });
}

function renderPayrollTable() {
  const employees = getEmployees();
  const deptValue = deptFilter.value;
  const filtered = deptValue ? employees.filter(e => e.department === deptValue) : employees;
  
  payrollTableBody.innerHTML = '';

  if (!filtered.length) {
    payrollTableBody.innerHTML = '<tr><td colspan="12" class="empty-state">No payroll records found.</td></tr>';
    return;
  }

  filtered.forEach((employee) => {
    const payroll = calculateEmployeePayroll(employee);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${employee.name}</td>
      <td>${employee.department}</td>
      <td>${formatCurrency(employee.baseSalary)}</td>
      <td>${formatCurrency(employee.overtime)}</td>
      <td>${formatCurrency(employee.bonus)}</td>
      <td>${formatCurrency(employee.allowances)}</td>
      <td><strong>${formatCurrency(payroll.gross)}</strong></td>
      <td>${formatCurrency(payroll.taxAmount)}</td>
      <td>${formatCurrency(employee.healthInsurance)}</td>
      <td>${formatCurrency(employee.deductions)}</td>
      <td><strong style="color: var(--success)">${formatCurrency(payroll.net)}</strong></td>
      <td>
        <button class="delete-btn payslip-btn" data-id="${employee.id}">Payslip</button>
      </td>
    `;

    payrollTableBody.appendChild(row);
  });
}

function renderPayslips() {
  const employees = getEmployees();
  payslipList.innerHTML = '';

  if (!employees.length) {
    payslipList.innerHTML = '<div class="empty-state">No payslips available yet.</div>';
    return;
  }

  employees.forEach((employee) => {
    const payroll = calculateEmployeePayroll(employee);
    const payslip = document.createElement('div');
    payslip.className = 'payslip-card';
    payslip.innerHTML = `
      <h3>${employee.name}</h3>
      <p><strong>Employee ID:</strong> ${employee.employeeId}</p>
      <p><strong>Department:</strong> ${employee.department}</p>
      <p><strong>Pay Period:</strong> ${employee.payPeriod}</p>
      <hr style="border: none; border-top: 1px solid var(--border); margin: 12px 0;">
      <p><strong>Gross Pay:</strong> ${formatCurrency(payroll.gross)}</p>
      <p><strong>Tax:</strong> ${formatCurrency(payroll.taxAmount)}</p>
      <p><strong>Insurance:</strong> ${formatCurrency(employee.healthInsurance)}</p>
      <p><strong>Deductions:</strong> ${formatCurrency(employee.deductions)}</p>
      <hr style="border: none; border-top: 2px solid var(--primary); margin: 12px 0;">
      <p style="font-size: 1.1rem; color: var(--success);"><strong>Net Pay: ${formatCurrency(payroll.net)}</strong></p>
      <button class="primary-btn" style="width: 100%; margin-top: 12px;" onclick="downloadPayslip('${employee.name}', '${formatCurrency(payroll.net)}')">Download PDF</button>
    `;
    payslipList.appendChild(payslip);
  });
}

function renderSummary() {
  const employees = getEmployees();

  const total = employees.length;
  const gross = employees.reduce((sum, employee) => {
    return sum + calculateEmployeePayroll(employee).gross;
  }, 0);

  const deductions = employees.reduce((sum, employee) => {
    return sum + calculateEmployeePayroll(employee).totalDeductions;
  }, 0);

  const net = employees.reduce((sum, employee) => {
    return sum + calculateEmployeePayroll(employee).net;
  }, 0);

  totalEmployees.textContent = String(total);
  grossPayroll.textContent = formatCurrency(gross);
  totalDeductions.textContent = formatCurrency(deductions);
  netPayroll.textContent = formatCurrency(net);
}

function populateDeptFilter() {
  const employees = getEmployees();
  const depts = [...new Set(employees.map(e => e.department))];
  deptFilter.innerHTML = '<option value="">All Departments</option>';
  depts.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept;
    option.textContent = dept;
    deptFilter.appendChild(option);
  });
}

function renderCharts() {
  const employees = getEmployees();
  const deptCounts = {};
  const salaryRanges = { '<$4k': 0, '$4k-$5k': 0, '$5k-$6k': 0, '>$6k': 0 };

  employees.forEach(emp => {
    deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
    
    const salary = emp.baseSalary;
    if (salary < 4000) salaryRanges['<$4k']++;
    else if (salary < 5000) salaryRanges['$4k-$5k']++;
    else if (salary < 6000) salaryRanges['$5k-$6k']++;
    else salaryRanges['>$6k']++;
  });

  deptChart.innerHTML = Object.entries(deptCounts)
    .map(([dept, count]) => `<div style="margin: 8px 0;"><span>${dept}:</span> <strong>${count}</strong></div>`)
    .join('');

  salaryChart.innerHTML = Object.entries(salaryRanges)
    .map(([range, count]) => `<div style="margin: 8px 0;"><span>${range}:</span> <strong>${count}</strong></div>`)
    .join('');
}

function refreshDashboard() {
  renderEmployeeTable();
  renderPayrollTable();
  renderPayslips();
  renderSummary();
  populateDeptFilter();
  renderCharts();
}

// Form Handlers
form.addEventListener('submit', (event) => {
  event.preventDefault();

  const employee = {
    id: crypto.randomUUID(),
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    employeeId: document.getElementById('employeeId').value.trim(),
    department: document.getElementById('department').value,
    baseSalary: Number(document.getElementById('baseSalary').value || 0),
    overtime: Number(document.getElementById('overtime').value || 0),
    bonus: Number(document.getElementById('bonus').value || 0),
    allowances: Number(document.getElementById('allowances').value || 0),
    deductions: Number(document.getElementById('deductions').value || 0),
    healthInsurance: Number(document.getElementById('healthInsurance').value || 0),
    taxRate: Number(document.getElementById('taxRate').value || 0),
    payPeriod: document.getElementById('payPeriod').value,
    joinDate: new Date().toISOString().split('T')[0]
  };

  if (!employee.name || !employee.department || !employee.email) {
    alert('Please complete all required fields.');
    return;
  }

  const employees = getEmployees();
  employees.push(employee);
  saveEmployees(employees);
  form.reset();
  document.getElementById('taxRate').value = 12.5;
  refreshDashboard();
});

// Tab Navigation
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    tab.classList.add('active');
    const tabId = tab.dataset.tab;
    document.getElementById(tabId).classList.add('active');
  });
});

// Modal Handlers
function showEmployeeModal(employeeId) {
  const employees = getEmployees();
  const employee = employees.find(e => e.id === employeeId);
  
  if (!employee) return;
  
  currentEmployeeId = employeeId;
  const payroll = calculateEmployeePayroll(employee);
  
  const details = document.getElementById('employeeDetails');
  details.innerHTML = `
    <p><strong>Name:</strong> ${employee.name}</p>
    <p><strong>Email:</strong> ${employee.email}</p>
    <p><strong>Employee ID:</strong> ${employee.employeeId}</p>
    <p><strong>Department:</strong> ${employee.department}</p>
    <p><strong>Base Salary:</strong> ${formatCurrency(employee.baseSalary)}</p>
    <p><strong>Gross Pay:</strong> ${formatCurrency(payroll.gross)}</p>
    <p><strong>Net Pay:</strong> ${formatCurrency(payroll.net)}</p>
  `;
  
  employeeModal.style.display = 'block';
}

function showEditModal(employeeId) {
  const employees = getEmployees();
  const employee = employees.find(e => e.id === employeeId);
  
  if (!employee) return;
  
  currentEmployeeId = employeeId;
  
  document.getElementById('editName').value = employee.name;
  document.getElementById('editDept').value = employee.department;
  document.getElementById('editBaseSalary').value = employee.baseSalary;
  document.getElementById('editTaxRate').value = employee.taxRate;
  
  editModal.style.display = 'block';
}

editForm.addEventListener('submit', (event) => {
  event.preventDefault();
  
  const employees = getEmployees();
  const index = employees.findIndex(e => e.id === currentEmployeeId);
  
  if (index !== -1) {
    employees[index].name = document.getElementById('editName').value;
    employees[index].department = document.getElementById('editDept').value;
    employees[index].baseSalary = Number(document.getElementById('editBaseSalary').value);
    employees[index].taxRate = Number(document.getElementById('editTaxRate').value);
    
    saveEmployees(employees);
    editModal.style.display = 'none';
    refreshDashboard();
  }
});

closeModal.addEventListener('click', () => {
  employeeModal.style.display = 'none';
});

editCloseModal.addEventListener('click', () => {
  editModal.style.display = 'none';
});

document.getElementById('editBtn').addEventListener('click', () => {
  employeeModal.style.display = 'none';
  showEditModal(currentEmployeeId);
});

document.getElementById('deleteBtn').addEventListener('click', () => {
  if (confirm('Are you sure you want to delete this employee?')) {
    const employees = getEmployees().filter(e => e.id !== currentEmployeeId);
    saveEmployees(employees);
    employeeModal.style.display = 'none';
    refreshDashboard();
  }
});

// Event Delegation
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('view-btn')) {
    showEmployeeModal(e.target.dataset.id);
  }
  if (e.target.classList.contains('payslip-btn')) {
    const id = e.target.dataset.id;
    const employee = getEmployees().find(e => e.id === id);
    if (employee) {
      const payroll = calculateEmployeePayroll(employee);
      alert(`Payslip for ${employee.name}\n\nGross Pay: ${formatCurrency(payroll.gross)}\nNet Pay: ${formatCurrency(payroll.net)}`);
    }
  }
});

resetDataBtn.addEventListener('click', () => {
  if (confirm('This will clear all employee data. Continue?')) {
    localStorage.removeItem(STORAGE_KEY);
    saveEmployees(defaultEmployees);
    refreshDashboard();
  }
});

deptFilter.addEventListener('change', renderPayrollTable);

function downloadPayslip(name, netPay) {
  alert(`Downloading payslip for ${name}...\nNet Pay: ${netPay}`);
}

monthPicker.valueAsDate = new Date();

// Initialize
refreshDashboard();
