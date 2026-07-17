import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
    FileText, Plus, Search, Printer, Trash2, Eye, X, Save,
    ChevronDown, Plus as PlusIcon, Minus, Download, RefreshCw,
    CheckCircle, Clock, AlertTriangle, User, Phone, Mail,
    Package, Calendar, CreditCard, Edit
} from 'lucide-react';

// ─── Gym Info (edit here if gym details change) ───────────────────────────────
const GYM_INFO = {
    name: 'Tara Fitness Centre',
    address: '1024/1, Namrata Society, Near Blossom Play School, Survey Nagar,\nRing Road, Kalamba, Kolhapur - 416007',
    phone: '+91 9960552750',
    email: 'taraparmar2@gmail.com',
    website: 'www.tfc365.com',
};

const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Other'];
const DEFAULT_TERMS = '1. Payment once made will be non refundable and non transferable.\n2. Membership is valid only for the registered member.\n3. The management reserves the right to change terms without prior notice.';

const fmt = (n) => `Rs. ${Number(n || 0).toFixed(2)}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const pad = (n) => String(n).padStart(5, '0');

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
const emptyForm = () => ({
    userId: '',
    memberName: '',
    memberPhone: '',
    memberEmail: '',
    memberId: '',
    billingDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [{ description: '', price: '', qty: 1, total: 0, itemType: 'membership' }],
    discount: 0,
    misc: 0,
    tax: 0,
    paid: '',
    rewardPointsRedeemed: 0,
    paymentMethod: 'Cash',
    billedBy: 'Admin',
    notes: '',
    terms: DEFAULT_TERMS,
    invoiceType: 'membership',
});

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        paid: { cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-3 h-3" />, label: 'Paid' },
        pending: { cls: 'bg-red-100 text-red-600', icon: <AlertTriangle className="w-3 h-3" />, label: 'Pending' },
        partial: { cls: 'bg-amber-100 text-amber-700', icon: <Clock className="w-3 h-3" />, label: 'Partial' },
    };
    const s = map[status] || map.pending;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${s.cls}`}>
            {s.icon} {s.label}
        </span>
    );
};

// ─── PRINT INVOICE TEMPLATE ───────────────────────────────────────────────────
const InvoicePrint = React.forwardRef(({ inv }, ref) => {
    const subTotal = inv.items.reduce((s, i) => s + Number(i.total || 0), 0);
    const totalAmount = Math.max(0, subTotal - Number(inv.discount || 0) + Number(inv.misc || 0) + Number(inv.tax || 0) - Number(inv.rewardPointsRedeemed || 0));
    const pending = Math.max(0, totalAmount - Number(inv.paid || 0));

    return (
        <div ref={ref} className="invoice-print-root">
            <style>{`
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body * { visibility: hidden !important; }
                    .invoice-print-root, .invoice-print-root * { visibility: visible !important; }
                    .invoice-print-root { position: fixed; top: 0; left: 0; width: 100%; }
                }
                .invoice-print-root {
                    font-family: 'Arial', sans-serif;
                    font-size: 12px;
                    color: #111;
                    background: white;
                    max-width: 720px;
                    margin: 0 auto;
                    padding: 20px;
                    box-sizing: border-box;
                }
                .inv-header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
                .inv-gym-address { text-align: right; font-size: 11px; color: #444; line-height: 1.6; }
                .inv-logo-area { font-size: 18px; font-weight: 900; color: #1a1a1a; }
                .inv-invoice-no { font-size: 12px; color: #555; margin-top: 4px; }
                .inv-section-header {
                    background: #1e3a5f;
                    color: white;
                    font-weight: 700;
                    font-size: 11px;
                    letter-spacing: 0.08em;
                    padding: 6px 12px;
                    text-transform: uppercase;
                    margin: 0;
                }
                .inv-section-body { border: 1px solid #ddd; border-top: none; padding: 10px 12px; margin-bottom: 10px; }
                .inv-client-grid { display: flex; justify-content: space-between; }
                .inv-label { color: #666; font-size: 11px; }
                .inv-value { font-weight: 600; color: #111; font-size: 12px; }
                .inv-table { width: 100%; border-collapse: collapse; border: 1px solid #ddd; margin-bottom: 10px; }
                .inv-table th { background: #1e3a5f; color: white; padding: 7px 10px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
                .inv-table th.right, .inv-table td.right { text-align: right; }
                .inv-table th.center, .inv-table td.center { text-align: center; }
                .inv-table td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 12px; }
                .inv-table tr:last-child td { border-bottom: none; }
                .inv-billed-by { padding: 4px 10px 8px; font-size: 11px; color: #444; }
                .inv-billing-row { display: flex; justify-content: space-between; padding: 4px 12px; font-size: 12px; border-bottom: 1px solid #f0f0f0; }
                .inv-billing-row.bold { font-weight: 700; }
                .inv-pending-header { background: #1e3a5f; color: white; display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
                .inv-pending-amount { font-size: 16px; font-weight: 900; }
                .inv-terms { margin-top: 14px; }
                .inv-terms-title { font-weight: 700; font-size: 12px; margin-bottom: 5px; }
                .inv-terms-list { color: #c0392b; font-style: italic; font-size: 11px; line-height: 1.7; }
                .inv-signature { text-align: center; margin-top: 40px; font-size: 12px; }
                .inv-signature-line { border-top: 1px solid #333; width: 200px; margin: 0 auto 6px; }
                .inv-thank-you { margin-top: 8px; font-size: 12px; color: #555; text-align: center; }
                .inv-footer-bar { background: #1e3a5f; color: white; text-align: center; font-size: 10px; padding: 8px; margin-top: 20px; line-height: 1.6; }
            `}</style>

            {/* TOP HEADER */}
            <div className="inv-header-top">
                <div>
                    <div style={{ width: 40, height: 40, background: '#1e3a5f', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 14 }}>TF</div>
                </div>
                <div className="inv-gym-address">
                    <div>Address: {GYM_INFO.address.replace('\n', ', ')}</div>
                    <div>Phone: {GYM_INFO.phone}</div>
                    <div>Website: {GYM_INFO.website}</div>
                    <div>E-Mail: {GYM_INFO.email}</div>
                </div>
            </div>

            <div style={{ marginBottom: 12 }}>
                <div className="inv-logo-area">{GYM_INFO.name}</div>
                <div className="inv-invoice-no">Invoice number: {inv.invoiceNumber || '—'}</div>
            </div>

            {/* CLIENT DETAIL */}
            <div className="inv-section-header">Client Detail</div>
            <div className="inv-section-body">
                <div className="inv-client-grid">
                    <div>
                        <div><span className="inv-label">Member ID: </span><span className="inv-value">{inv.memberId || inv.userId || '—'}</span></div>
                        <div style={{ marginTop: 4 }}><span className="inv-label">Name: </span><span className="inv-value">{inv.memberName}</span></div>
                        <div style={{ marginTop: 4 }}><span className="inv-label">Phone: </span><span className="inv-value">{inv.memberPhone || '—'}</span></div>
                        {inv.memberEmail && <div style={{ marginTop: 4 }}><span className="inv-label">Email: </span><span className="inv-value">{inv.memberEmail}</span></div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div><span className="inv-label">Billing date: </span><span className="inv-value">{fmtDate(inv.billingDate)}</span></div>
                        {inv.dueDate && <div style={{ marginTop: 4 }}><span className="inv-label">Due date: </span><span className="inv-value">{fmtDate(inv.dueDate)}</span></div>}
                        <div style={{ marginTop: 4 }}><span className="inv-label">Payment: </span><span className="inv-value">{inv.paymentMethod || 'Cash'}</span></div>
                    </div>
                </div>
            </div>

            {/* DESCRIPTION TABLE */}
            <div className="inv-section-header">Description</div>
            <table className="inv-table">
                <thead>
                    <tr>
                        <th>Product / Service</th>
                        <th className="right">Price:</th>
                        <th className="center">Qty:</th>
                        <th className="right">Total:</th>
                    </tr>
                </thead>
                <tbody>
                    {inv.items.map((item, i) => (
                        <tr key={i}>
                            <td>{item.description}</td>
                            <td className="right">{Number(item.price || 0).toFixed(2)}</td>
                            <td className="center">{item.qty}</td>
                            <td className="right">{Number(item.total || 0).toFixed(2)}</td>
                        </tr>
                    ))}
                    <tr>
                        <td colSpan={4} style={{ paddingTop: 4, paddingBottom: 6 }}>
                            <span style={{ fontSize: 11, color: '#555' }}>Billed by: </span>
                            <strong>{inv.billedBy || 'Admin'}</strong>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* BILLING DETAILS */}
            <div className="inv-section-header">Billing Details</div>
            <div style={{ border: '1px solid #ddd', borderTop: 'none', marginBottom: 10 }}>
                {[
                    { label: 'Sub Total:', value: fmt(subTotal), bold: false },
                    { label: 'Discount:', value: fmt(inv.discount), bold: false },
                    { label: 'Misc:', value: fmt(inv.misc), bold: false },
                    { label: 'Tax:', value: fmt(inv.tax), bold: false },
                    { label: 'Total:', value: fmt(totalAmount), bold: true },
                    { label: 'Reward Points Redeemed:', value: fmt(inv.rewardPointsRedeemed), bold: false },
                    { label: 'Paid:', value: fmt(inv.paid), bold: false },
                ].map(({ label, value, bold }) => (
                    <div key={label} className={`inv-billing-row${bold ? ' bold' : ''}`}>
                        <span>{label}</span>
                        <span>{value}</span>
                    </div>
                ))}
            </div>

            {/* PENDING AMOUNT */}
            <div className="inv-pending-header">
                <span>Pending Amount</span>
                <span className="inv-pending-amount">{fmt(pending)}</span>
            </div>

            {/* TERMS */}
            <div className="inv-terms">
                <div className="inv-terms-title">Terms &amp; Condition</div>
                <div className="inv-terms-list">
                    {(inv.terms || DEFAULT_TERMS).split('\n').map((t, i) => <div key={i}>{t}</div>)}
                </div>
            </div>

            {inv.notes && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: '#f9f9f9', border: '1px solid #eee', borderRadius: 4, fontSize: 11, color: '#555' }}>
                    <strong>Notes:</strong> {inv.notes}
                </div>
            )}

            {/* SIGNATURE */}
            <div className="inv-signature">
                <p style={{ marginBottom: 20 }}>To accept this invoice, sign here and return <span style={{ borderBottom: '1px solid #333', display: 'inline-block', width: 160 }}>&nbsp;</span></p>
                <div className="inv-signature-line" />
                <div style={{ fontSize: 11, color: '#555' }}>Authorised Signature — {GYM_INFO.name}</div>
            </div>

            <div className="inv-thank-you">Thank you for your business and we look forward to coaching you.</div>

            {/* FOOTER */}
            <div className="inv-footer-bar">{GYM_INFO.address.replace('\n', ', ')}</div>
        </div>
    );
});
InvoicePrint.displayName = 'InvoicePrint';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const InvoicesManager = () => {
    const [invoices, setInvoices] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);

    // Filters
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Modals
    const [showCreate, setShowCreate] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewInvoice, setPreviewInvoice] = useState(null);
    const [editInvoice, setEditInvoice] = useState(null);

    // Form state
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const printRef = useRef();
    const iframeRef = useRef();
    const token = localStorage.getItem('adminToken');
    const headers = { Authorization: `Bearer ${token}` };

    // ── Fetch invoices ──────────────────────────────────────────────────────
    const fetchInvoices = useCallback(async (silent = false) => {
        try {
            const params = {};
            if (search) params.search = search;
            if (filterStatus) params.status = filterStatus;
            if (filterType) params.type = filterType;
            if (dateFrom) params.from = dateFrom;
            if (dateTo) params.to = dateTo;

            const { data } = await axios.get('/api/invoices', { headers, params });
            setInvoices(data.invoices);
            setTotal(data.total);
            if (!silent) setLoading(false);
        } catch { if (!silent) setLoading(false); }
    }, [search, filterStatus, filterType, dateFrom, dateTo]);

    // ── Fetch users for dropdown ────────────────────────────────────────────
    const fetchUsers = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/invoices/meta/users', { headers });
            setUsers(data);
        } catch { setUsers([]); }
    }, []);

    useEffect(() => { fetchInvoices(); fetchUsers(); }, []);
    useEffect(() => { const t = setTimeout(() => fetchInvoices(true), 500); return () => clearTimeout(t); }, [search, filterStatus, filterType, dateFrom, dateTo]);

    // ── Item helpers ────────────────────────────────────────────────────────
    const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: '', price: '', qty: 1, total: 0, itemType: 'membership' }] }));
    const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
    const updateItem = (idx, field, value) => {
        setForm(f => {
            const items = [...f.items];
            items[idx] = { ...items[idx], [field]: value };
            const p = Number(items[idx].price) || 0;
            const q = Number(items[idx].qty) || 1;
            items[idx].total = parseFloat((p * q).toFixed(2));
            return { ...f, items };
        });
    };

    // ── Computed totals ─────────────────────────────────────────────────────
    const subTotal = form.items.reduce((s, i) => s + Number(i.total || 0), 0);
    const totalAmount = Math.max(0, subTotal - Number(form.discount || 0) + Number(form.misc || 0) + Number(form.tax || 0) - Number(form.rewardPointsRedeemed || 0));
    const pendingAmount = Math.max(0, totalAmount - Number(form.paid || 0));

    // ── User select → auto-fill fields ─────────────────────────────────────
    const handleUserSelect = (userId) => {
        const u = users.find(u => u._id === userId);
        if (u) {
            setForm(f => ({
                ...f, userId,
                memberName: u.name,
                memberPhone: u.phone || '',
                memberEmail: u.email || '',
                memberId: userId.slice(-6).toUpperCase(),
            }));
        } else {
            setForm(f => ({ ...f, userId: '', memberName: '', memberPhone: '', memberEmail: '', memberId: '' }));
        }
    };

    // ── Open create / edit ──────────────────────────────────────────────────
    const openCreate = () => { setEditInvoice(null); setForm(emptyForm()); setShowCreate(true); };
    const openEdit = (inv) => {
        setEditInvoice(inv);
        setForm({
            ...inv,
            billingDate: inv.billingDate ? new Date(inv.billingDate).toISOString().split('T')[0] : '',
            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
            items: inv.items.map(it => ({ ...it, price: it.price, qty: it.qty, total: it.total })),
        });
        setShowCreate(true);
    };
    const closeCreate = () => { setShowCreate(false); setEditInvoice(null); };

    // ── Preview + Print / Download ───────────────────────────────────────────
    const openPreview = (inv) => { setPreviewInvoice(inv); setShowPreview(true); };

    // Build full self-contained HTML for the invoice
    const buildInvoiceHTML = () => {
        const el = printRef.current;
        if (!el) return '';
        // Collect all <style> content embedded inside the element
        const styles = Array.from(el.querySelectorAll('style'))
            .map(s => s.textContent).join('\n');
        const bodyHTML = el.innerHTML;
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${previewInvoice?.invoiceNumber || ''}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: white; }
    ${styles}
  </style>
</head>
<body>${bodyHTML}</body>
</html>`;
    };

    // ── Print via hidden iframe (no popup blocker) ──────────────────────────
    const handlePrint = () => {
        const html = buildInvoiceHTML();
        if (!html) return;
        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
        // Wait for content to render then print
        iframe.onload = () => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        };
        // Fallback timeout in case onload already fired
        setTimeout(() => {
            try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch {}
        }, 600);
    };

    // ── Download as PDF using html2pdf.js ──────────────────────────────────
    const handleDownloadPDF = async () => {
        const el = printRef.current;
        if (!el) return;
        setDownloading(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const opt = {
                margin:       [8, 8, 8, 8],
                filename:     `${previewInvoice?.invoiceNumber || 'invoice'}_${previewInvoice?.memberName?.replace(/\s+/g, '_') || 'member'}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, logging: false },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak:    { mode: ['avoid-all'] },
            };
            await html2pdf().set(opt).from(el).save();
        } catch (err) {
            console.error('PDF generation error:', err);
            alert('PDF generation failed. Use Print → Save as PDF instead.');
        } finally {
            setDownloading(false);
        }
    };

    // ── Save invoice ────────────────────────────────────────────────────────
    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const payload = {
                ...form,
                items: form.items.map(it => ({
                    ...it,
                    price: Number(it.price) || 0,
                    qty: Number(it.qty) || 1,
                    total: Number(it.total) || 0,
                })),
                discount: Number(form.discount) || 0,
                misc: Number(form.misc) || 0,
                tax: Number(form.tax) || 0,
                paid: Number(form.paid) || 0,
                rewardPointsRedeemed: Number(form.rewardPointsRedeemed) || 0,
            };
            let saved;
            if (editInvoice) {
                const { data } = await axios.put(`/api/invoices/${editInvoice._id}`, payload, { headers });
                saved = data;
            } else {
                const { data } = await axios.post('/api/invoices', payload, { headers });
                saved = data;
            }
            closeCreate();
            fetchInvoices(true);
            // Auto-open preview after creating
            if (!editInvoice) { setPreviewInvoice(saved); setShowPreview(true); }
        } catch (err) { alert(err.response?.data?.message || 'Error saving invoice'); }
        finally { setSaving(false); }
    };

    // ── Delete ──────────────────────────────────────────────────────────────
    const handleDelete = async (id, invNo) => {
        if (!window.confirm(`Delete invoice ${invNo}?`)) return;
        try { await axios.delete(`/api/invoices/${id}`, { headers }); fetchInvoices(true); }
        catch { alert('Error deleting invoice'); }
    };

    // ── SUMMARY STATS ───────────────────────────────────────────────────────
    const statsData = {
        total: invoices.length,
        paid: invoices.filter(i => i.status === 'paid').length,
        pending: invoices.filter(i => i.status === 'pending').length,
        revenue: invoices.reduce((s, i) => s + (i.paid || 0), 0),
    };

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" /> Invoices
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">{total} invoice{total !== 1 ? 's' : ''} total</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5">
                    <Plus className="w-4 h-4" /> Create Invoice
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Invoices', value: statsData.total, vc: 'text-blue-600', bg: 'bg-blue-50', b: 'border-blue-100', icon: '📄' },
                    { label: 'Paid', value: statsData.paid, vc: 'text-emerald-600', bg: 'bg-emerald-50', b: 'border-emerald-100', icon: '✅' },
                    { label: 'Pending', value: statsData.pending, vc: 'text-red-500', bg: 'bg-red-50', b: 'border-red-100', icon: '⏳' },
                    { label: 'Revenue Collected', value: `₹${statsData.revenue.toLocaleString('en-IN')}`, vc: 'text-violet-700', bg: 'bg-violet-50', b: 'border-violet-100', icon: '💰' },
                ].map(({ label, value, vc, bg, b, icon }) => (
                    <div key={label} className={`${bg} border ${b} rounded-2xl p-4 text-center`}>
                        <p className={`text-2xl font-black ${vc}`}>{value}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{icon} {label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
                <div className="flex-1 min-w-[180px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                        placeholder="Search by name, invoice no, phone…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white text-gray-600"
                    value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="paid">✅ Paid</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="partial">🕐 Partial</option>
                </select>
                <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white text-gray-600"
                    value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="">All Types</option>
                    <option value="membership">Membership</option>
                    <option value="products">Products</option>
                    <option value="mixed">Mixed</option>
                </select>
                <input type="date" className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                    value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" />
                <input type="date" className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                    value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date" />
                {(search || filterStatus || filterType || dateFrom || dateTo) && (
                    <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterType(''); setDateFrom(''); setDateTo(''); }}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 font-semibold px-2">
                        <X className="w-3.5 h-3.5" /> Clear
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-3">
                        <div className="w-8 h-8 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                        <p className="text-gray-400 text-sm font-medium">Loading invoices…</p>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="text-center py-16">
                        <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 font-bold">No invoices found</p>
                        <button onClick={openCreate} className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
                            + Create First Invoice
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    {['Invoice #', 'Member', 'Date', 'Type', 'Total', 'Paid', 'Pending', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-gray-400">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((inv) => (
                                    <tr key={inv._id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                                        <td className="px-4 py-3 font-black text-blue-600">{inv.invoiceNumber}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-800">{inv.memberName}</div>
                                            <div className="text-xs text-gray-400">{inv.memberPhone}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(inv.billingDate)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${inv.invoiceType === 'membership' ? 'bg-blue-100 text-blue-600' : inv.invoiceType === 'products' ? 'bg-orange-100 text-orange-600' : 'bg-violet-100 text-violet-600'}`}>
                                                {inv.invoiceType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-gray-800">₹{Number(inv.totalAmount || 0).toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3 text-emerald-600 font-semibold">₹{Number(inv.paid || 0).toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3 text-red-500 font-semibold">₹{Number(inv.pending || 0).toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => openPreview(inv)} title="View & Print"
                                                    className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => openEdit(inv)} title="Edit"
                                                    className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg hover:bg-indigo-100 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => handleDelete(inv._id, inv.invoiceNumber)} title="Delete"
                                                    className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ═══════ CREATE / EDIT MODAL ═══════ */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col border border-gray-100" style={{ maxHeight: '95vh' }}>
                        <div className="px-6 py-4 flex justify-between items-center shrink-0 bg-gradient-to-r from-blue-700 to-indigo-600 rounded-t-2xl">
                            <h2 className="text-sm font-black text-white flex items-center gap-2">
                                <FileText className="w-4 h-4" /> {editInvoice ? `Edit ${editInvoice.invoiceNumber}` : 'Create New Invoice'}
                            </h2>
                            <button onClick={closeCreate} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-5">

                            {/* ── Member Selection ── */}
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1"><User className="w-3 h-3" /> Member Details</p>
                                <div>
                                    <label className="label-xs">Select Registered Member</label>
                                    <select className="inp" value={form.userId} onChange={e => handleUserSelect(e.target.value)}>
                                        <option value="">— Walk-in / Manual Entry —</option>
                                        {users.map(u => <option key={u._id} value={u._id}>{u.name} — {u.phone}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="label-xs">Full Name *</label>
                                        <input required className="inp" placeholder="Member name"
                                            value={form.memberName} onChange={e => setForm(f => ({ ...f, memberName: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="label-xs">Phone</label>
                                        <input className="inp" placeholder="9876543210"
                                            value={form.memberPhone} onChange={e => setForm(f => ({ ...f, memberPhone: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="label-xs">Email</label>
                                        <input type="email" className="inp" placeholder="member@email.com"
                                            value={form.memberEmail} onChange={e => setForm(f => ({ ...f, memberEmail: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="label-xs">Member ID (display)</label>
                                        <input className="inp" placeholder="Auto or custom"
                                            value={form.memberId} onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))} />
                                    </div>
                                </div>
                            </div>

                            {/* ── Invoice Meta ── */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="label-xs">Billing Date *</label>
                                    <input required type="date" className="inp"
                                        value={form.billingDate} onChange={e => setForm(f => ({ ...f, billingDate: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="label-xs">Due Date</label>
                                    <input type="date" className="inp"
                                        value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="label-xs">Invoice Type</label>
                                    <select className="inp" value={form.invoiceType} onChange={e => setForm(f => ({ ...f, invoiceType: e.target.value }))}>
                                        <option value="membership">Membership</option>
                                        <option value="products">Products</option>
                                        <option value="mixed">Mixed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label-xs">Payment Method</label>
                                    <select className="inp" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                                        {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label-xs">Billed By</label>
                                    <input className="inp" value={form.billedBy} onChange={e => setForm(f => ({ ...f, billedBy: e.target.value }))} />
                                </div>
                            </div>

                            {/* ── Line Items ── */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1"><Package className="w-3 h-3" /> Items / Services</p>
                                    <button type="button" onClick={addItem}
                                        className="flex items-center gap-1 text-xs text-blue-600 font-bold hover:underline">
                                        <PlusIcon className="w-3.5 h-3.5" /> Add Item
                                    </button>
                                </div>
                                <div className="border border-gray-100 rounded-xl overflow-hidden">
                                    <div className="grid grid-cols-12 bg-gray-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
                                        <span className="col-span-5">Description</span>
                                        <span className="col-span-2 text-right">Price</span>
                                        <span className="col-span-1 text-center">Qty</span>
                                        <span className="col-span-2 text-right">Total</span>
                                        <span className="col-span-1 text-center">Type</span>
                                        <span className="col-span-1" />
                                    </div>
                                    {form.items.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-1 px-2 py-2 border-t border-gray-50 items-center">
                                            <input className="col-span-5 inp !rounded-lg !py-1.5 !text-xs" placeholder="Product / plan name"
                                                value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                                            <input type="number" min="0" className="col-span-2 inp !rounded-lg !py-1.5 !text-xs text-right" placeholder="0"
                                                value={item.price} onChange={e => updateItem(idx, 'price', e.target.value)} />
                                            <input type="number" min="1" className="col-span-1 inp !rounded-lg !py-1.5 !text-xs text-center" placeholder="1"
                                                value={item.qty} onChange={e => updateItem(idx, 'qty', e.target.value)} />
                                            <div className="col-span-2 text-right text-xs font-black text-gray-700 pr-2">
                                                {Number(item.total || 0).toFixed(2)}
                                            </div>
                                            <select className="col-span-1 inp !rounded-lg !py-1.5 !text-[10px] !px-1" value={item.itemType}
                                                onChange={e => updateItem(idx, 'itemType', e.target.value)}>
                                                <option value="membership">Plan</option>
                                                <option value="product">Prod</option>
                                                <option value="other">Other</option>
                                            </select>
                                            <button type="button" onClick={() => removeItem(idx)}
                                                className="col-span-1 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors">
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Billing Breakdown ── */}
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">💰 Billing Details</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                                    <div>
                                        <label className="label-xs">Discount (₹)</label>
                                        <input type="number" min="0" className="inp" placeholder="0"
                                            value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="label-xs">Misc. Charges (₹)</label>
                                        <input type="number" min="0" className="inp" placeholder="0"
                                            value={form.misc} onChange={e => setForm(f => ({ ...f, misc: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="label-xs">Tax / GST (₹)</label>
                                        <input type="number" min="0" className="inp" placeholder="0"
                                            value={form.tax} onChange={e => setForm(f => ({ ...f, tax: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="label-xs">Reward Points Redeemed (₹)</label>
                                        <input type="number" min="0" className="inp" placeholder="0"
                                            value={form.rewardPointsRedeemed} onChange={e => setForm(f => ({ ...f, rewardPointsRedeemed: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="label-xs">Amount Paid (₹)</label>
                                        <input type="number" min="0" className="inp" placeholder="0"
                                            value={form.paid} onChange={e => setForm(f => ({ ...f, paid: e.target.value }))} />
                                    </div>
                                </div>
                                {/* Live total preview */}
                                <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                                    <div className="bg-white border border-gray-100 rounded-xl p-3">
                                        <p className="text-lg font-black text-gray-800">₹{subTotal.toFixed(2)}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">Sub Total</p>
                                    </div>
                                    <div className="bg-white border border-blue-100 rounded-xl p-3">
                                        <p className="text-lg font-black text-blue-700">₹{totalAmount.toFixed(2)}</p>
                                        <p className="text-[9px] text-blue-400 font-bold uppercase">Grand Total</p>
                                    </div>
                                    <div className={`rounded-xl p-3 border ${pendingAmount > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                        <p className={`text-lg font-black ${pendingAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>₹{pendingAmount.toFixed(2)}</p>
                                        <p className={`text-[9px] font-bold uppercase ${pendingAmount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>Pending</p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Notes + Terms ── */}
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="label-xs">Internal Notes</label>
                                    <textarea className="inp resize-none" rows={2} placeholder="Internal notes (not printed on invoice)…"
                                        value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="label-xs">Terms &amp; Conditions</label>
                                    <textarea className="inp resize-none" rows={3}
                                        value={form.terms} onChange={e => setForm(f => ({ ...f, terms: e.target.value }))} />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={closeCreate} className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors">Cancel</button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-60 transition-all shadow-md shadow-blue-200">
                                    <Save className="w-4 h-4" /> {saving ? 'Saving…' : (editInvoice ? 'Save Changes' : 'Create & Preview')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════ PREVIEW / PRINT MODAL ═══════ */}
            {showPreview && previewInvoice && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full flex flex-col" style={{ maxWidth: 780, maxHeight: '95vh' }}>
                        <div className="px-6 py-4 flex justify-between items-center shrink-0 bg-gradient-to-r from-slate-700 to-slate-600 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-white/70" />
                                <div>
                                    <h2 className="text-sm font-black text-white">{previewInvoice.invoiceNumber}</h2>
                                    <p className="text-[10px] text-white/50">{previewInvoice.memberName} · {fmtDate(previewInvoice.billingDate)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handlePrint}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black hover:bg-slate-200 shadow-sm transition-all">
                                    <Printer className="w-4 h-4" /> Print
                                </button>
                                <button onClick={handleDownloadPDF} disabled={downloading}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50">
                                    <Download className="w-4 h-4" /> {downloading ? 'Generating PDF...' : 'Download PDF'}
                                </button>
                                <button onClick={() => setShowPreview(false)} className="text-white/60 hover:text-white ml-1"><X className="w-5 h-5" /></button>
                            </div>
                        </div>
                        <div className="overflow-y-auto p-6 bg-gray-100">
                            <div className="shadow-2xl rounded-xl overflow-hidden">
                                <InvoicePrint ref={printRef} inv={previewInvoice} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .label-xs { display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 5px; }
                .inp { width: 100%; padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 13px; outline: none; background: #f9fafb; transition: all 0.15s; }
                .inp:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); background: white; }
            `}</style>

            {/* Hidden iframe for native printing without popups */}
            <iframe ref={iframeRef} style={{ display: 'none' }} title="Print" />
        </div>
    );
};

export default InvoicesManager;
