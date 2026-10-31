// ─── Date / Formatting Helpers ───────────────────────────────────────────────

export const fmtDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return '—';
    }
};

export const getRemainingDays = (endDate) => {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
};

export const getWeekCycleRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return `${fmtDate(startOfWeek)} – ${fmtDate(endOfWeek)}`;
};

export const getMonthCycleRange = () => {
    const now = new Date();
    return now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

// ─── Config Maps ──────────────────────────────────────────────────────────────

export const CATEGORY_CONFIG = {
    all:      { id: 'all',      label: 'Total Users',    title: 'Total Users Report',    docHeaderColor: '#2563eb', pdfColor: [37, 99, 235] },
    active:   { id: 'active',   label: 'Active Plans',   title: 'Active Plans Report',   docHeaderColor: '#16a34a', pdfColor: [22, 163, 74] },
    expired:  { id: 'expired',  label: 'Expired Plans',  title: 'Expired Plans Report',  docHeaderColor: '#dc2626', pdfColor: [220, 38, 38] },
    'no-plan':{ id: 'no-plan',  label: 'No Plan',        title: 'No Plan Users Report',  docHeaderColor: '#4b5563', pdfColor: [75, 85, 99] }
};

export const TIMEFRAME_CONFIG = {
    weekly:  { id: 'weekly',  label: 'Weekly',   description: 'Current Week Cycle' },
    monthly: { id: 'monthly', label: 'Monthly',  description: 'Current Month Cycle' },
    all:     { id: 'all',     label: 'All Time', description: 'All Records' }
};

// ─── Category Filtering ───────────────────────────────────────────────────────

export const filterUsersByCategory = (users = [], category = 'all') => {
    if (!Array.isArray(users)) return [];
    return users.filter(user => {
        const m = user.latestMembership;
        const daysLeft = m ? getRemainingDays(m.endDate) : null;
        const isActive  = daysLeft !== null && daysLeft > 0;
        const isExpired = m && daysLeft !== null && daysLeft <= 0;
        const hasNoPlan = !m;
        if (category === 'active')  return isActive;
        if (category === 'expired') return isExpired;
        if (category === 'no-plan') return hasNoPlan;
        return true;
    });
};

/**
 * For table display — filters by category AND optional time window.
 */
export const filterUsersByCategoryAndTime = (users = [], category = 'all', timeRange = 'all') => {
    const categoryUsers = filterUsersByCategory(users, category);
    if (!timeRange || timeRange === 'all') return categoryUsers;

    const now = new Date();
    const thresholdDays = timeRange === 'weekly' ? 7 : 30;
    const thresholdDate = new Date(now.getTime() - thresholdDays * 24 * 60 * 60 * 1000);

    return categoryUsers.filter(user => {
        const m = user.latestMembership;
        const regDate   = user.registrationDate ? new Date(user.registrationDate) : (user.createdAt ? new Date(user.createdAt) : null);
        const startDate = m?.startDate ? new Date(m.startDate) : null;
        const endDate   = m?.endDate   ? new Date(m.endDate)   : null;

        if (category === 'expired') return endDate && endDate >= thresholdDate && endDate <= now;
        if (category === 'active')  return (startDate && startDate >= thresholdDate) || (regDate && regDate >= thresholdDate);
        return (regDate && regDate >= thresholdDate) || (startDate && startDate >= thresholdDate);
    });
};

/**
 * For report downloads — always returns ALL category members, sorted for the cycle.
 */
export const getCategoryUsersForReport = (users = [], category = 'all', timeRange = 'weekly') => {
    const categoryUsers = filterUsersByCategory(users, category);
    const sorted = [...categoryUsers];

    if (timeRange === 'weekly') {
        sorted.sort((a, b) => {
            const dueA = new Date(a.latestMembership?.dueDate || a.latestMembership?.endDate || 0);
            const dueB = new Date(b.latestMembership?.dueDate || b.latestMembership?.endDate || 0);
            return dueA - dueB;
        });
    } else if (timeRange === 'monthly') {
        sorted.sort((a, b) => {
            const dateA = new Date(a.latestMembership?.startDate || a.registrationDate || a.createdAt || 0);
            const dateB = new Date(b.latestMembership?.startDate || b.registrationDate || b.createdAt || 0);
            return dateB - dateA;
        });
    } else {
        sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return sorted;
};

export const getCategoryReportCounts = (users = [], category = 'all') => {
    const fullCount = filterUsersByCategory(users, category).length;
    return { weekly: fullCount, monthly: fullCount, all: fullCount };
};

/**
 * Maps user records to normalized report rows.
 */
export const formatUserReportData = (users = []) => {
    return users.map((user, idx) => {
        const m        = user.latestMembership;
        const daysLeft = m ? getRemainingDays(m.endDate) : null;
        let status = 'No Plan';
        if (m) status = (daysLeft !== null && daysLeft > 0) ? `Active (${daysLeft}d left)` : 'Expired';

        const dueDateRaw      = m?.dueDate || m?.endDate;
        const amount          = m?.amountPaid != null ? Number(m.amountPaid) : null;
        const amountFormatted = amount != null ? `Rs.${amount.toLocaleString('en-IN')}` : '—';

        return {
            sr:               idx + 1,
            id:               user._id,
            name:             user.name  || 'Unnamed Member',
            phone:            user.phone || '—',
            packageName:      m?.packageName || 'No Plan',
            amount,
            amountFormatted,
            startDate:        m?.startDate    ? fmtDate(m.startDate)    : '—',
            endDate:          m?.endDate      ? fmtDate(m.endDate)      : '—',
            dueDate:          dueDateRaw      ? fmtDate(dueDateRaw)     : '—',
            registrationDate: user.registrationDate ? fmtDate(user.registrationDate) : (user.createdAt ? fmtDate(user.createdAt) : '—'),
            status,
            rawUser: user
        };
    });
};

// ─── PDF Download — uses jsPDF + jspdf-autotable (no DOM screenshot) ──────────

export const downloadUserReportPDF = async ({ users, category = 'all', timeRange = 'weekly' }) => {
    const targetUsers = getCategoryUsersForReport(users, category, timeRange);
    const rows        = formatUserReportData(targetUsers);
    const catConfig   = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.all;
    const timeConfig  = TIMEFRAME_CONFIG[timeRange] || TIMEFRAME_CONFIG.weekly;

    const now         = new Date();
    const dateStamp   = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStamp   = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const cycleLabel  = timeRange === 'weekly' ? getWeekCycleRange() : (timeRange === 'monthly' ? getMonthCycleRange() : 'All Time');
    const totalAmount = rows.reduce((sum, r) => sum + (r.amount || 0), 0);
    const [r, g, b]   = catConfig.pdfColor;

    // Dynamic import so the chunk is loaded only when needed
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // ── Header block ──────────────────────────────────────────────────────────
    const pageW = doc.internal.pageSize.getWidth();

    // Coloured header bar
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, pageW, 22, 'F');

    // Gym name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('TARA FITNESS & GYM', 14, 10);

    // Report subtitle
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${catConfig.label}  —  ${timeConfig.label} Report  (${cycleLabel})`, 14, 17);

    // Right-side generated date
    doc.setFontSize(8);
    doc.text(`Generated: ${dateStamp}  ${timeStamp}`, pageW - 14, 10, { align: 'right' });
    doc.text('OFFICIAL GYM RECORD', pageW - 14, 17, { align: 'right' });

    // ── Summary cards row ─────────────────────────────────────────────────────
    const cardY = 26;
    const cardH = 12;
    const cardW = (pageW - 28 - 8) / 3;

    const cards = [
        { label: 'Reporting Cycle', value: `${timeConfig.label} (${cycleLabel})` },
        { label: 'Total Members',   value: `${rows.length} Members` },
        { label: 'Total Plan Value',value: `Rs.${totalAmount.toLocaleString('en-IN')}` }
    ];

    cards.forEach((card, i) => {
        const cx = 14 + i * (cardW + 4);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(cx, cardY, cardW, cardH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(card.label.toUpperCase(), cx + 4, cardY + 4.5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(card.value, cx + 4, cardY + 10);
    });

    // ── Data table ────────────────────────────────────────────────────────────
    const tableStartY = cardY + cardH + 4;

    const head = [['#', 'Name', 'Phone', 'Package Name', 'Amount', 'Start Date', 'End Date', 'Due Date', 'Reg. Date', 'Status']];

    const body = rows.length > 0
        ? rows.map(row => [
            String(row.sr),
            row.name,
            row.phone,
            row.packageName,
            row.amountFormatted,
            row.startDate,
            row.endDate,
            row.dueDate,
            row.registrationDate,
            row.status
        ])
        : [['', `No records found for ${catConfig.label}.`, '', '', '', '', '', '', '', '']];

    autoTable(doc, {
        head,
        body,
        startY: tableStartY,
        margin: { left: 14, right: 14 },
        styles: {
            font:      'helvetica',
            fontSize:  7.5,
            cellPadding: 3,
            valign:    'middle',
            overflow:  'linebreak',
            lineColor: [203, 213, 225],
            lineWidth: 0.2
        },
        headStyles: {
            fillColor:  [r, g, b],
            textColor:  [255, 255, 255],
            fontStyle:  'bold',
            fontSize:   8,
            halign:     'center'
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { fontStyle: 'bold',  cellWidth: 38 },
            2: { cellWidth: 28, font: 'courier' },
            3: { cellWidth: 35 },
            4: { halign: 'right',  fontStyle: 'bold', cellWidth: 22 },
            5: { halign: 'center', cellWidth: 22 },
            6: { halign: 'center', cellWidth: 22 },
            7: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
            8: { halign: 'center', cellWidth: 22 },
            9: { halign: 'center', cellWidth: 24 }
        },
        didParseCell(data) {
            // Colour status cell
            if (data.section === 'body' && data.column.index === 9) {
                const val = String(data.cell.raw || '');
                if (val.startsWith('Active')) {
                    data.cell.styles.textColor  = [21, 128, 61];
                    data.cell.styles.fillColor  = [220, 252, 231];
                    data.cell.styles.fontStyle  = 'bold';
                } else if (val === 'Expired') {
                    data.cell.styles.textColor  = [185, 28, 28];
                    data.cell.styles.fillColor  = [254, 226, 226];
                    data.cell.styles.fontStyle  = 'bold';
                } else {
                    data.cell.styles.textColor  = [75, 85, 99];
                    data.cell.styles.fillColor  = [243, 244, 246];
                }
            }
            // Bold member name
            if (data.section === 'body' && data.column.index === 1) {
                data.cell.styles.fontStyle = 'bold';
            }
            // Green amount
            if (data.section === 'body' && data.column.index === 4) {
                data.cell.styles.textColor = [4, 120, 87];
                data.cell.styles.fontStyle = 'bold';
            }
        },
        // Page footer
        didDrawPage(hookData) {
            const pW = hookData.settings.margin.left + hookData.table.width + hookData.settings.margin.right;
            const pH = doc.internal.pageSize.getHeight();
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.text('Tara Fitness Gym Management System  •  Confidential Member Report', 14, pH - 5);
            doc.text(`Page ${hookData.pageNumber}`, pW - 14, pH - 5, { align: 'right' });
        }
    });

    const safeCat  = catConfig.label.replace(/\s+/g, '_');
    const safeTime = timeConfig.label.replace(/\s+/g, '_');
    const dateFmt  = now.toISOString().split('T')[0];
    doc.save(`TaraFitness_${safeCat}_${safeTime}_Report_${dateFmt}.pdf`);
};

// ─── DOC Download — HTML/Word XML (works in MS Word & LibreOffice) ────────────

export const downloadUserReportDOC = ({ users, category = 'all', timeRange = 'weekly' }) => {
    const targetUsers = getCategoryUsersForReport(users, category, timeRange);
    const rows        = formatUserReportData(targetUsers);
    const catConfig   = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.all;
    const timeConfig  = TIMEFRAME_CONFIG[timeRange] || TIMEFRAME_CONFIG.weekly;

    const now         = new Date();
    const dateStamp   = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStamp   = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const cycleLabel  = timeRange === 'weekly' ? getWeekCycleRange() : (timeRange === 'monthly' ? getMonthCycleRange() : 'All Time');
    const totalAmount = rows.reduce((sum, r) => sum + (r.amount || 0), 0);
    const hdrColor    = catConfig.docHeaderColor || '#2563eb';

    const tableRowsHtml = rows.length > 0 ? rows.map(r => {
        const statusStyle = r.status.startsWith('Active')
            ? 'color:#15803d;background-color:#dcfce7;'
            : r.status === 'Expired'
                ? 'color:#b91c1c;background-color:#fee2e2;'
                : 'color:#4b5563;background-color:#f3f4f6;';
        return `<tr>
            <td style="text-align:center;border:1px solid #cbd5e1;padding:7px 5px;">${r.sr}</td>
            <td style="font-weight:bold;border:1px solid #cbd5e1;padding:7px 8px;color:#0f172a;">${r.name}</td>
            <td style="border:1px solid #cbd5e1;padding:7px 8px;font-family:Courier New,monospace;">${r.phone}</td>
            <td style="border:1px solid #cbd5e1;padding:7px 8px;font-weight:500;">${r.packageName}</td>
            <td style="text-align:right;font-weight:bold;border:1px solid #cbd5e1;padding:7px 8px;color:#047857;">${r.amountFormatted}</td>
            <td style="text-align:center;border:1px solid #cbd5e1;padding:7px 8px;">${r.startDate}</td>
            <td style="text-align:center;border:1px solid #cbd5e1;padding:7px 8px;">${r.endDate}</td>
            <td style="text-align:center;font-weight:bold;border:1px solid #cbd5e1;padding:7px 8px;color:#1e3a8a;">${r.dueDate}</td>
            <td style="text-align:center;border:1px solid #cbd5e1;padding:7px 8px;">${r.registrationDate}</td>
            <td style="text-align:center;border:1px solid #cbd5e1;padding:7px 5px;">
                <span style="display:inline-block;padding:3px 8px;border-radius:4px;font-size:8.5pt;font-weight:bold;${statusStyle}">${r.status}</span>
            </td>
        </tr>`;
    }).join('') : `<tr><td colspan="10" style="text-align:center;padding:25px;color:#64748b;font-style:italic;border:1px solid #cbd5e1;">No records found for ${catConfig.label}.</td></tr>`;

    const htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Tara Fitness - ${catConfig.label} ${timeConfig.label} Report</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
<style>
body{font-family:Calibri,'Segoe UI',Arial,sans-serif;font-size:10pt;color:#111827;background:#fff;margin:20px;}
h1{font-size:20pt;font-weight:bold;color:#0f172a;margin:0;text-transform:uppercase;letter-spacing:.5px;}
.sub{font-size:13pt;font-weight:bold;color:${hdrColor};margin:4px 0 12px 0;}
.meta{width:100%;border-collapse:collapse;margin-bottom:16px;background:#f8fafc;border:1px solid #e2e8f0;}
.meta td{padding:8px 12px;font-size:9.5pt;}
table.data{width:100%;border-collapse:collapse;margin-top:10px;}
table.data th{background-color:${hdrColor};color:#fff;font-weight:bold;padding:8px 6px;border:1px solid #0f172a;font-size:9pt;text-transform:uppercase;letter-spacing:.5px;}
table.data td{font-size:9pt;}
.footer{margin-top:24px;font-size:8.5pt;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:8px;}
</style>
</head>
<body>
<div style="border-bottom:3px solid ${hdrColor};padding-bottom:10px;margin-bottom:14px;">
<h1>TARA FITNESS &amp; GYM</h1>
<p class="sub">${catConfig.label} — ${timeConfig.label} Report (${cycleLabel})</p>
</div>
<table class="meta">
<tr>
<td style="width:33%;"><strong>Generated On:</strong> ${dateStamp} at ${timeStamp}</td>
<td style="width:33%;"><strong>Total Members:</strong> ${rows.length}</td>
<td style="width:34%;text-align:right;"><strong>Total Plan Value:</strong> Rs.${totalAmount.toLocaleString('en-IN')}</td>
</tr>
</table>
<table class="data">
<thead>
<tr>
<th style="width:35px;text-align:center;">#</th>
<th style="text-align:left;">Name</th>
<th style="text-align:left;">Phone Number</th>
<th style="text-align:left;">Package Name</th>
<th style="text-align:right;">Amount</th>
<th style="text-align:center;">Start Date</th>
<th style="text-align:center;">End Date</th>
<th style="text-align:center;">Due Date</th>
<th style="text-align:center;">Registration Date</th>
<th style="text-align:center;">Status</th>
</tr>
</thead>
<tbody>
${tableRowsHtml}
</tbody>
</table>
<div class="footer"><p>Tara Fitness Gym Management System • Official Member Details Report • Confidential Document</p></div>
</body>
</html>`;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href  = url;
    link.download = `TaraFitness_${catConfig.label.replace(/\s+/g,'_')}_${timeConfig.label.replace(/\s+/g,'_')}_Report_${now.toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
