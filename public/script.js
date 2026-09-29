const apiBase = '/api';
const state = {
  token: localStorage.getItem('payroll_token') || '',
  employees: [],
  payroll: [],
  selectedEmployeeId: null,
  currentUser: null
};

const loginView = document.getElementById('loginView');
const appView = document.getElementById('appView');
const userLabel = document.getElementById('userLabel');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const employeeForm = document.getElementById('employeeForm');
const employeeTableBody = document.getElementById('employeeTableBody');
const payrollTableBody = document.getElementById('payrollTableBody');
const payslipList = document.getElementById('payslipList');
const deptFilter = document.getElementById('deptFilter');
const deptChart = document.getElementById('deptChart');
const salaryChart = document.getElementById('salaryChart');
const totalEmployees = document.getElementById('totalEmployees');
const grossPayroll = document.getElementById('grossPayroll');
const totalDeductions = document.getElementById('totalDeductions');
const netPayroll = document.getElementById('netPayroll');
const employeeModal = document.getElementById('employeeModal');
const editModal = document.getElementById('editModal');

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Number(value || 0));

const apiFetch = async (url, options = {}) => {
  const headers = { ...options.headers, 'Content-Type': 'application/json' };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const response = await fetch(`${apiBase}${url}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }
  return data;
};

function setAuthUI() {
  if (state.token) {
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
  } else {
    loginView.classList.remove('hidden');
    appView.classList.add('hidden');
  }
}

async function getCurrentUser() {
  try {
    const data = await apiFetch('/me');
    state.currentUser = data.user;
    userLabel.textContent = data.user?.username || 'Admin';
  } catch (err) {
    logout();
  }
}

async function loadEmployees() {
  try {
    state.employees = await apiFetch('/employees');
    populateDepartments();
    renderEmployeeTable();
    renderPayrollTable();
    renderPayslips();
    renderSummary();
    renderCharts();
  } catch (error) {
    console.error(error);
  }
}

async function loadPayroll() {
  try {
    state.payroll = await apiFetch('/payroll');
    renderPayrollTable();
  } catch (err) {
    console.error(err);
  }
}

async function loadSummary() {
  try {
    const summary = await apiFetch('/summary');
    totalEmployees.textContent = summary.totalEmployees;
    grossPayroll.textContent = formatCurrency(summary.grossPayroll);
    totalDeductions.textContent = formatCurrency(summary.totalDeductions);
    netPayroll.textContent = formatCurrency(summary.netPayroll);
  } catch (err) {
    console.error(err);
  }
}

function populateDepartments() {
  const depts = [...new Set(state.employees.map((employee) => employee.department))];
  deptFilter.innerHTML = '<option value="">All Departments</option>';
  depts.forEach((dept) => {
    const option = document.createElement('option');
    option.value = dept;
    option.textContent = dept;
    deptFilter.appendChild(option);
  });
}

function renderEmployeeTable() {
  employeeTableBody.innerHTML = '';
  if (!state.employees.length) {
    employeeTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No employees found.</td></tr>';
    return;
  }

  state.employees.forEach((employee) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${employee.name}</td>
      <td>${employee.department}</td>
      <td>${employee.email}</td>
      <td>${formatCurrency(employee.base_salary)}</td>
      <td><span class="badge">Active</span></td>
      <td>
        <button class="delete-btn view-btn" data-id="${employee.id}">View</button>
      </td>
    `;
    employeeTableBody.appendChild(row);
  });
}

function renderPayrollTable() {
  const dept = deptFilter.value;
  const filtered = dept ? state.payroll.filter((item) => item.department === dept) : state.payroll;

  payrollTableBody.innerHTML = '';
  if (!filtered.length) {
    payrollTableBody.innerHTML = '<tr><td colspan="12" class="empty-state">No payroll records found.</td></tr>';
    return;
  }

  filtered.forEach((employee) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${employee.name}</td>
      <td>${employee.department}</td>
      <td>${formatCurrency(employee.base_salary)}</td>
      <td>${formatCurrency(employee.overtime)}</td>
      <td>${formatCurrency(employee.bonus)}</td>
      <td>${formatCurrency(employee.allowances)}</td>
      <td><strong>${formatCurrency(employee.gross)}</strong></td>
      <td>${formatCurrency(employee.taxAmount)}</td>
      <td>${formatCurrency(employee.health_insurance)}</td>
      <td>${formatCurrency(employee.deductions)}</td>
      <td><strong style="color: var(--success);">${formatCurrency(employee.net)}</strong></td>
      <td>
        <button class="delete-btn payslip-btn" data-id="${employee.id}">Payslip</button>
      </td>
    `;
    payrollTableBody.appendChild(row);
  });
}

function renderPayslips() {
  payslipList.innerHTML = '';
  if (!state.payroll.length) {
    payslipList.innerHTML = '<div class="empty-state">No payslips generated yet.</div>';
    return;
  }

  state.payroll.forEach((employee) => {
    const card = document.createElement('div');
    card.className = 'payslip-card';
    card.innerHTML = `
      <h3>${employee.name}</h3>
      <p><strong>Employee ID:</strong> ${employee.employee_id}</p>
      <p><strong>Department:</strong> ${employee.department}</p>
      <p><strong>Pay Period:</strong> ${employee.pay_period}</p>
      <p><strong>Gross Pay:</strong> ${formatCurrency(employee.gross)}</p>
      <p><strong>Tax:</strong> ${formatCurrency(employee.taxAmount)}</p>
      <p><strong>Insurance:</strong> ${formatCurrency(employee.health_insurance)}</p>
      <p><strong>Deductions:</strong> ${formatCurrency(employee.deductions)}</p>
      <p style="font-size:1.1rem; color: var(--success);"><strong>Net Pay: ${formatCurrency(employee.net)}</strong></p>
      <button class="primary-btn full export-btn" data-id="${employee.id}" style="margin-top: 12px;">Download PDF</button>
    `;
    payslipList.appendChild(card);
  });
}

function renderSummary() {
  const summary = state.payroll.reduce(
    (acc, item) => {
      acc.totalEmployees += 1;
      acc.grossPayroll += Number(item.gross || 0);
      acc.totalDeductions += Number(item.totalDeductions || 0);
      acc.netPayroll += Number(item.net || 0);
      return acc;
    },
    { totalEmployees: 0, grossPayroll: 0, totalDeductions: 0, netPayroll: 0 }
  );

  totalEmployees.textContent = summary.totalEmployees;
  grossPayroll.textContent = formatCurrency(summary.grossPayroll);
  totalDeductions.textContent = formatCurrency(summary.totalDeductions);
  netPayroll.textContent = formatCurrency(summary.netPayroll);
}

function renderCharts() {
  const deptCounts = {};
  const salaryRanges = { '<$4k': 0, '$4k-$5k': 0, '$5k-$6k': 0, '>$6k': 0 };

  state.employees.forEach((employee) => {
    deptCounts[employee.department] = (deptCounts[employee.department] || 0) + 1;
    const salary = Number(employee.base_salary || 0);
    if (salary < 4000) salaryRanges['<$4k'] += 1;
    else if (salary < 5000) salaryRanges['$4k-$5k'] += 1;
    else if (salary < 6000) salaryRanges['$5k-$6k'] += 1;
    else salaryRanges['>$6k'] += 1;
  });

  deptChart.innerHTML = Object.entries(deptCounts)
    .map(([department, count]) => `<div><strong>${department}:</strong> ${count}</div>`)
    .join('');

  salaryChart.innerHTML = Object.entries(salaryRanges)
    .map(([range, count]) => `<div><strong>${range}:</strong> ${count}</div>`)
    .join('');
}

async function refreshAll() {
  if (!state.token) return;
  await Promise.all([loadEmployees(), loadPayroll(), loadSummary()]);
}

async function login(username, password) {
  try {
    const data = await fetch(`${apiBase}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const json = await data.json();
    if (!data.ok) throw new Error(json.error || 'Login failed');

    state.token = json.token;
    localStorage.setItem('payroll_token', json.token);
    setAuthUI();
    await getCurrentUser();
    await refreshAll();
  } catch (error) {
    alert(error.message);
  }
}

function logout() {
  state.token = '';
  state.currentUser = null;
  localStorage.removeItem('payroll_token');
  setAuthUI();
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!username || !password) return alert('Enter username and password.');
  await login(username, password);
});

logoutBtn.addEventListener('click', logout);

departmentSelect = document.getElementById('department');

employeeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    employee_id: document.getElementById('employeeId').value.trim(),
    department: document.getElementById('department').value,
    base_salary: Number(document.getElementById('baseSalary').value),
    overtime: Number(document.getElementById('overtime').value || 0),
    bonus: Number(document.getElementById('bonus').value || 0),
    allowances: Number(document.getElementById('allowances').value || 0),
    deductions: Number(document.getElementById('deductions').value || 0),
    health_insurance: Number(document.getElementById('healthInsurance').value || 0),
    tax_rate: Number(document.getElementById('taxRate').value || 0),
    pay_period: document.getElementById('payPeriod').value,
    join_date: new Date().toISOString().slice(0, 10)
  };

  try {
    await apiFetch('/employees', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    employeeForm.reset();
    document.getElementById('taxRate').value = 12.5;
    await refreshAll();
  } catch (err) {
    alert(err.message);
  }
});

departmentSelect = document.getElementById('department');

document.addEventListener('click', async (event) => {
  const target = event.target;

  if (target.classList.contains('view-btn')) {
    const id = Number(target.dataset.id);
    const employee = state.employees.find((item) => item.id === id);
    if (!employee) return;

    const payroll = state.payroll.find((item) => item.id === id);
    state.selectedEmployeeId = id;
    document.getElementById('employeeDetails').innerHTML = `
      <p><strong>Name:</strong> ${employee.name}</p>
      <p><strong>Email:</strong> ${employee.email}</p>
      <p><strong>Employee ID:</strong> ${employee.employee_id}</p>
      <p><strong>Department:</strong> ${employee.department}</p>
      <p><strong>Base Salary:</strong> ${formatCurrency(employee.base_salary)}</p>
      <p><strong>Gross Pay:</strong> ${formatCurrency(payroll?.gross || 0)}</p>
      <p><strong>Net Pay:</strong> ${formatCurrency(payroll?.net || 0)}</p>
    `;
    employeeModal.classList.add('open');
  }

  if (target.classList.contains('payslip-btn')) {
    const id = Number(target.dataset.id);
    const employee = state.payroll.find((item) => item.id === id);
    if (!employee) return;
    generatePdf(employee);
  }

  if (target.classList.contains('export-btn')) {
    const id = Number(target.dataset.id);
    const employee = state.payroll.find((item) => item.id === id);
    if (employee) generatePdf(employee);
  }
});

function generatePdf(employee) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Payroll Payslip', 20, 20);
  doc.setFontSize(11);
  doc.text(`Employee: ${employee.name}`, 20, 40);
  doc.text(`Employee ID: ${employee.employee_id}`, 20, 48);
  doc.text(`Department: ${employee.department}`, 20, 56);
  doc.text(`Pay Period: ${employee.pay_period}`, 20, 64);
  doc.text(`Gross Pay: ${formatCurrency(employee.gross)}`, 20, 82);
  doc.text(`Tax: ${formatCurrency(employee.taxAmount)}`, 20, 90);
  doc.text(`Insurance: ${formatCurrency(employee.health_insurance)}`, 20, 98);
  doc.text(`Deductions: ${formatCurrency(employee.deductions)}`, 20, 106);
  doc.setFontSize(14);
  doc.text(`Net Pay: ${formatCurrency(employee.net)}`, 20, 126);
  doc.save(`${employee.name.replace(/\s+/g, '_')}_payslip.pdf`);
}

document.getElementById('editBtn').addEventListener('click', () => {
  const employee = state.employees.find((item) => item.id === state.selectedEmployeeId);
  if (!employee) return;
  document.getElementById('editName').value = employee.name;
  document.getElementById('editDept').value = employee.department;
  document.getElementById('editBaseSalary').value = employee.base_salary;
  document.getElementById('editTaxRate').value = employee.tax_rate;
  employeeModal.classList.remove('open');
  editModal.classList.add('open');
});

document.getElementById('deleteBtn').addEventListener('click', async () => {
  if (!state.selectedEmployeeId) return;
  if (!confirm('Delete this employee?')) return;
  try {
    await apiFetch(`/employees/${state.selectedEmployeeId}`, { method: 'DELETE' });
    employeeModal.classList.remove('open');
    await refreshAll();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById('editForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = state.selectedEmployeeId;
  const payload = {
    name: document.getElementById('editName').value.trim(),
    department: document.getElementById('editDept').value,
    base_salary: Number(document.getElementById('editBaseSalary').value),
    tax_rate: Number(document.getElementById('editTaxRate').value)
  };

  try {
    const employee = state.employees.find((item) => item.id === id);
    payload.email = employee.email;
    await apiFetch(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    editModal.classList.remove('open');
    await refreshAll();
  } catch (err) {
    alert(err.message);
  }
});

document.querySelector('.close').addEventListener('click', () => employeeModal.classList.remove('open'));
document.querySelector('.edit-close').addEventListener('click', () => editModal.classList.remove('open'));
deptFilter.addEventListener('change', renderPayrollTable);

async function bootstrap() {
  setAuthUI();
  if (state.token) {
    await getCurrentUser();
    await refreshAll();
  }
}

bootstrap();
