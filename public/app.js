'use strict';

// The frontend is served by the same Express app, so API requests use relative URLs.
const API_BASE = '/api';
const state = {
  token: localStorage.getItem('expensewise_token') || '',
  authMode: 'login',
  transactions: [],
  page: 1,
  totalPages: 1,
  total: 0,
  editingId: null,
  deletingId: null,
  user: null
};
const $ = (id) => document.getElementById(id);
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const monthNow = new Date().toISOString().slice(0, 7);
$('monthPicker').value = monthNow;
$('txDate').value = new Date().toISOString().slice(0, 10);

function showToast(message, isError = false) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 3200);
}
function money(value) { return currency.format(Number(value) || 0); }
function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}
function localDate(date) {
  if (!date) return '—';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
async function api(path, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}), ...(options.headers || {}) };
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (error) {
    throw new Error('Could not reach the API. Check that your ExpenseWise server is running.');
  }
  let data = {};
  try { data = await response.json(); } catch (_) { /* non-JSON response */ }
  if (!response.ok) {
    if (response.status === 401 && state.token) logout(false);
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}
function setAuthMode(mode) {
  state.authMode = mode;
  const isRegister = mode === 'register';
  $('nameField').hidden = !isRegister;
  $('name').required = isRegister;
  $('password').autocomplete = isRegister ? 'new-password' : 'current-password';
  $('loginTab').classList.toggle('active', !isRegister);
  $('registerTab').classList.toggle('active', isRegister);
  $('authSubmit').textContent = isRegister ? 'Create account' : 'Log in';
}
$('loginTab').addEventListener('click', () => setAuthMode('login'));
$('registerTab').addEventListener('click', () => setAuthMode('register'));
$('authForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = $('authSubmit'); button.disabled = true;
  const payload = { email: $('email').value.trim(), password: $('password').value };
  if (state.authMode === 'register') payload.name = $('name').value.trim();
  try {
    if (state.authMode === 'register') {
      await api('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Account created. You can now log in.');
      setAuthMode('login');
      $('password').value = '';
    } else {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
      if (!data.token) throw new Error('The API did not return a login token.');
      state.token = data.token;
      localStorage.setItem('expensewise_token', data.token);
      state.user = { name: $('name').value.trim() || payload.email.split('@')[0], email: payload.email };
      localStorage.setItem('expensewise_user', JSON.stringify(state.user));
      await enterApp();
      showToast('Welcome to ExpenseWise!');
    }
  } catch (error) { showToast(error.message, true); }
  finally { button.disabled = false; }
});

async function enterApp() {
  $('authScreen').hidden = true;
  $('appScreen').hidden = false;
  const storedUser = JSON.parse(localStorage.getItem('expensewise_user') || 'null');
  state.user = state.user || storedUser;
  const email = state.user?.email || '';
  const name = state.user?.name || email.split('@')[0] || 'Your account';
  $('profileName').textContent = name;
  $('profileEmail').textContent = email;
  $('avatar').textContent = name.charAt(0).toUpperCase();
  await refreshDashboard();
}
function logout(showMessage = true) {
  state.token = ''; state.user = null;
  localStorage.removeItem('expensewise_token');
  localStorage.removeItem('expensewise_user');
  $('appScreen').hidden = true; $('authScreen').hidden = false;
  if (showMessage) showToast('You have logged out.');
}
$('logoutBtn').addEventListener('click', () => logout());

async function refreshDashboard() {
  if (!state.token) return;
  await Promise.allSettled([loadSummary(), loadCategories(), loadTrend(), loadTransactions()]);
}
async function loadSummary() {
  const month = $('monthPicker').value || monthNow;
  try {
    const data = await api(`/analytics/summary?month=${encodeURIComponent(month)}`);
    $('balanceValue').textContent = money(data.balance);
    $('incomeValue').textContent = money(data.totalIncome);
    $('expenseValue').textContent = money(data.totalExpenses);
  } catch (error) { showToast(error.message, true); }
}
async function loadCategories() {
  const month = $('monthPicker').value || monthNow;
  try {
    const data = await api(`/analytics/categories?month=${encodeURIComponent(month)}`);
    const items = Array.isArray(data.categories) ? data.categories : [];
    const total = items.reduce((sum, item) => sum + Number(item.totalSpent || 0), 0);
    if (!items.length) { $('categoryChart').innerHTML = '<p class="empty">No expenses recorded for this month yet.</p>'; return; }
    $('categoryChart').innerHTML = items.map((item) => {
      const amount = Number(item.totalSpent) || 0;
      const percent = total ? Math.max(2, amount / total * 100) : 0;
      return `<div class="category-item"><span class="category-name" title="${escapeHtml(item._id)}">${escapeHtml(item._id || 'Other')}</span><div class="category-track"><div class="category-fill" style="width:${percent}%"></div></div><strong class="category-value">${money(amount)}</strong></div>`;
    }).join('');
  } catch (error) { $('categoryChart').innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`; }
}
function monthLabel(year, month) { return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-IN', { month: 'short' }); }
async function loadTrend() {
  try {
    const data = await api('/analytics/monthly-trend');
    const rows = Array.isArray(data.trend) ? data.trend : [];
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear(), month = d.getMonth() + 1;
      const found = rows.find((r) => Number(r._id?.year) === year && Number(r._id?.month) === month) || {};
      months.push({ label: monthLabel(year, month), income: Number(found.totalIncome) || 0, expense: Number(found.totalExpenses) || 0 });
    }
    const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]));
    $('trendChart').innerHTML = months.map((m) => `<div class="trend-col"><div class="bar-pair"><div class="bar income" style="height:${Math.max(m.income ? 3 : 0, m.income / max * 100)}%" title="Income: ${money(m.income)}"></div><div class="bar expense" style="height:${Math.max(m.expense ? 3 : 0, m.expense / max * 100)}%" title="Expenses: ${money(m.expense)}"></div></div><span class="trend-month">${escapeHtml(m.label)}</span></div>`).join('');
  } catch (error) { $('trendChart').innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`; }
}
function transactionQuery() {
  const params = new URLSearchParams({ page: String(state.page), limit: '10', sortBy: 'date', order: 'desc' });
  const type = $('typeFilter').value;
  const sort = $('sortFilter').value.split('-');
  if (type) params.set('type', type);
  params.set('sortBy', sort[0]); params.set('order', sort[1]);
  return params.toString();
}
async function loadTransactions() {
  try {
    const data = await api(`/transactions?${transactionQuery()}`);
    state.transactions = Array.isArray(data.transactions) ? data.transactions : [];
    state.total = Number(data.total) || 0;
    state.totalPages = Math.max(1, Number(data.totalPages) || 1);
    renderTransactions();
  } catch (error) {
    $('transactionRows').innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(error.message)}</td></tr>`;
    showToast(error.message, true);
  }
}
function renderTransactions() {
  const search = $('searchInput').value.trim().toLowerCase();
  const filtered = state.transactions.filter((tx) => `${tx.description || ''} ${tx.category || ''}`.toLowerCase().includes(search));
  if (!filtered.length) {
    $('transactionRows').innerHTML = `<tr><td colspan="6" class="empty">${search ? 'No matching transactions on this page.' : 'No transactions found. Add your first transaction above.'}</td></tr>`;
  } else {
    $('transactionRows').innerHTML = filtered.map((tx) => {
      const isIncome = tx.type === 'income';
      return `<tr><td><div class="transaction-name"><span class="transaction-symbol ${isIncome ? '' : 'expense'}">${isIncome ? '↙' : '↗'}</span><div><strong>${escapeHtml(tx.description)}</strong><small>${escapeHtml(tx.category || 'Other')}</small></div></div></td><td><span class="category-pill">${escapeHtml(tx.category || 'Other')}</span></td><td>${localDate(tx.date)}</td><td><span class="type-pill ${isIncome ? 'income' : 'expense'}">${isIncome ? 'Income' : 'Expense'}</span></td><td class="amount-value ${isIncome ? 'income' : 'expense'}">${isIncome ? '+' : '−'}${money(tx.amount)}</td><td><div class="row-actions"><button data-action="edit" data-id="${escapeHtml(tx._id)}" title="Edit" aria-label="Edit transaction">✎</button><button data-action="delete" data-id="${escapeHtml(tx._id)}" title="Delete" aria-label="Delete transaction">⌫</button></div></td></tr>`;
    }).join('');
  }
  $('resultsText').textContent = `${state.total} transaction${state.total === 1 ? '' : 's'} · page results ${filtered.length}`;
  $('pageText').textContent = `Page ${state.page} of ${state.totalPages}`;
  $('prevPage').disabled = state.page <= 1;
  $('nextPage').disabled = state.page >= state.totalPages;
}
$('monthPicker').addEventListener('change', async () => { await Promise.allSettled([loadSummary(), loadCategories()]); });
$('typeFilter').addEventListener('change', () => { state.page = 1; loadTransactions(); });
$('sortFilter').addEventListener('change', () => { state.page = 1; loadTransactions(); });
$('searchInput').addEventListener('input', renderTransactions);
$('prevPage').addEventListener('click', () => { if (state.page > 1) { state.page--; loadTransactions(); } });
$('nextPage').addEventListener('click', () => { if (state.page < state.totalPages) { state.page++; loadTransactions(); } });
$('transactionRows').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]'); if (!button) return;
  const tx = state.transactions.find((item) => item._id === button.dataset.id); if (!tx) return;
  if (button.dataset.action === 'edit') openTransactionModal(tx); else { state.deletingId = tx._id; $('deleteModal').hidden = false; }
});

function openTransactionModal(tx = null) {
  state.editingId = tx?._id || null;
  $('modalTitle').textContent = tx ? 'Edit transaction' : 'Add transaction';
  $('saveTransaction').textContent = tx ? 'Save changes' : 'Save transaction';
  $('txDescription').value = tx?.description || '';
  $('txAmount').value = tx?.amount ?? '';
  $('txType').value = tx?.type || 'expense';
  const category = tx?.category || 'Food';
  if (![...$('txCategory').options].some((o) => o.value === category)) $('txCategory').add(new Option(category, category));
  $('txCategory').value = category;
  $('txDate').value = tx?.date ? new Date(tx.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  $('transactionModal').hidden = false;
  $('txDescription').focus();
}
function closeTransactionModal() { $('transactionModal').hidden = true; $('transactionForm').reset(); state.editingId = null; }
$('addTopBtn').addEventListener('click', () => openTransactionModal());
$('addTableBtn').addEventListener('click', () => openTransactionModal());
$('closeModal').addEventListener('click', closeTransactionModal);
$('cancelModal').addEventListener('click', closeTransactionModal);
$('transactionModal').addEventListener('click', (event) => { if (event.target === $('transactionModal')) closeTransactionModal(); });
$('transactionForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = $('saveTransaction'); button.disabled = true;
  const payload = { description: $('txDescription').value.trim(), amount: Number($('txAmount').value), category: $('txCategory').value, type: $('txType').value, date: $('txDate').value };
  try {
    if (state.editingId) {
      await api(`/transactions/${encodeURIComponent(state.editingId)}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Transaction updated successfully.');
    } else {
      await api('/transactions', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Transaction added successfully.');
      state.page = 1;
    }
    closeTransactionModal();
    await refreshDashboard();
  } catch (error) { showToast(error.message, true); }
  finally { button.disabled = false; }
});
$('cancelDelete').addEventListener('click', () => { state.deletingId = null; $('deleteModal').hidden = true; });
$('confirmDelete').addEventListener('click', async () => {
  if (!state.deletingId) return;
  const button = $('confirmDelete'); button.disabled = true;
  try {
    await api(`/transactions/${encodeURIComponent(state.deletingId)}`, { method: 'DELETE' });
    $('deleteModal').hidden = true; state.deletingId = null;
    if (state.page > 1 && state.transactions.length === 1) state.page--;
    showToast('Transaction deleted.');
    await refreshDashboard();
  } catch (error) { showToast(error.message, true); }
  finally { button.disabled = false; }
});
$('deleteModal').addEventListener('click', (event) => { if (event.target === $('deleteModal')) $('deleteModal').hidden = true; });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeTransactionModal(); $('deleteModal').hidden = true; } });

if (state.token) {
  enterApp().catch((error) => { console.error(error); logout(false); });
}
