// Format date helper
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
    const dayOfWeek = now.getDay(); // 0 is Sunday
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

export const CATEGORY_CONFIG = {
    all: {
        id: 'all',
        label: 'Total Users',
        title: 'Total Users Report',
        badgeColor: 'blue',
        docHeaderColor: '#2563eb'
    },
    active: {
        id: 'active',
        label: 'Active Plans',
        title: 'Active Plans Report',
        badgeColor: 'green',
        docHeaderColor: '#16a34a'
    },
    expired: {
        id: 'expired',
        label: 'Expired Plans',
        title: 'Expired Plans Report',
        badgeColor: 'red',
        docHeaderColor: '#dc2626'
    },
    'no-plan': {
        id: 'no-plan',
        label: 'No Plan',
        title: 'No Plan Users Report',
        badgeColor: 'gray',
        docHeaderColor: '#4b5563'
    }
};

export const TIMEFRAME_CONFIG = {
    weekly: {
        id: 'weekly',
        label: 'Weekly',
        description: 'Current Week Cycle'
    },
    monthly: {
        id: 'monthly',
        label: 'Monthly',
        description: 'Current Month Cycle'
    },
    all: {
        id: 'all',
        label: 'All Time',
        description: 'All Records'
    }
};

/**
 * Filter users by category:
 * - 'all': all users
 * - 'active': users with active plans (remaining days > 0)
 * - 'expired': users with expired plans (remaining days <= 0)
 * - 'no-plan': users with no membership
 */
export const filterUsersByCategory = (users = [], category = 'all') => {
    if (!Array.isArray(users)) return [];

    return users.filter(user => {
        const m = user.latestMembership;
        const daysLeft = m ? getRemainingDays(m.endDate) : null;
        const isActive = daysLeft !== null && daysLeft > 0;
        const isExpired = m && daysLeft !== null && daysLeft <= 0;
        const hasNoPlan = !m;

        if (category === 'active') return isActive;
        if (category === 'expired') return isExpired;
        if (category === 'no-plan') return hasNoPlan;
        return true; // 'all' includes everyone
    });
};

/**
 * For table filtering:
 * Filters users by category AND optional time range.
 * If time range has 0 matches (e.g. no new members joined in the last 7/30 days),
 * it returns the empty list so the table shows the accurate count for that date filter.
 */
export const filterUsersByCategoryAndTime = (users = [], category = 'all', timeRange = 'all') => {
    const categoryUsers = filterUsersByCategory(users, category);
    if (!timeRange || timeRange === 'all') return categoryUsers;

    const now = new Date();
    const thresholdDays = timeRange === 'weekly' ? 7 : 30;
    const thresholdDate = new Date(now.getTime() - thresholdDays * 24 * 60 * 60 * 1000);

    const matches = categoryUsers.filter(user => {
        const m = user.latestMembership;
        const regDate = user.registrationDate ? new Date(user.registrationDate) : (user.createdAt ? new Date(user.createdAt) : null);
        const startDate = m?.startDate ? new Date(m.startDate) : null;
        const endDate = m?.endDate ? new Date(m.endDate) : null;

        if (category === 'expired') {
            return endDate && endDate >= thresholdDate && endDate <= now;
        }

        if (category === 'active') {
            return (startDate && startDate >= thresholdDate) || (regDate && regDate >= thresholdDate);
        }

        return (regDate && regDate >= thresholdDate) || (startDate && startDate >= thresholdDate);
    });

    return matches;
};

/**
 * For generating downloadable reports:
 * Always ensures the category's members are included.
 * In Weekly report: sorts by Due Date / Expiry Date (primary for weekly operations).
 * In Monthly report: sorts by Registration Date / Start Date (primary for monthly operations).
 * In All-Time: sorts newest joined first.
 */
export const getCategoryUsersForReport = (users = [], category = 'all', timeRange = 'weekly') => {
    const categoryUsers = filterUsersByCategory(users, category);
    const sorted = [...categoryUsers];

    if (timeRange === 'weekly') {
        // Sort by Due Date / End Date ascending so upcoming dues & expiries are front and center
        sorted.sort((a, b) => {
            const dueA = new Date(a.latestMembership?.dueDate || a.latestMembership?.endDate || 0);
            const dueB = new Date(b.latestMembership?.dueDate || b.latestMembership?.endDate || 0);
            return dueA - dueB;
        });
    } else if (timeRange === 'monthly') {
        // Sort by start date / registration date descending
        sorted.sort((a, b) => {
            const dateA = new Date(a.latestMembership?.startDate || a.registrationDate || a.createdAt || 0);
            const dateB = new Date(b.latestMembership?.startDate || b.registrationDate || b.createdAt || 0);
            return dateB - dateA;
        });
    } else {
        // Sort newest joined
        sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return sorted;
};

/**
 * Returns record counts for categories
 */
export const getCategoryReportCounts = (users = [], category = 'all') => {
    const fullCount = filterUsersByCategory(users, category).length;
    return {
        weekly: fullCount,
        monthly: fullCount,
        all: fullCount
    };
};

/**
 * Map user records to report row data
 */
export const formatUserReportData = (users = []) => {
    return users.map((user, idx) => {
        const m = user.latestMembership;
        const daysLeft = m ? getRemainingDays(m.endDate) : null;
        let status = 'No Plan';
        if (m) {
            status = (daysLeft !== null && daysLeft > 0) ? `Active (${daysLeft}d left)` : 'Expired';
        }

        const dueDateRaw = m?.dueDate || m?.endDate;
        const dueDate = dueDateRaw ? fmtDate(dueDateRaw) : '—';
        const startDate = m?.startDate ? fmtDate(m.startDate) : '—';
        const endDate = m?.endDate ? fmtDate(m.endDate) : '—';
        const regDate = user.registrationDate ? fmtDate(user.registrationDate) : (user.createdAt ? fmtDate(user.createdAt) : '—');
        const amount = m?.amountPaid != null ? Number(m.amountPaid) : null;
        const amountFormatted = amount != null ? `₹${amount.toLocaleString('en-IN')}` : '—';

        return {
            sr: idx + 1,
            id: user._id,
            name: user.name || 'Unnamed Member',
            phone: user.phone || '—',
            packageName: m?.packageName || 'No Plan',
            amount,
            amountFormatted,
            startDate,
            endDate,
            dueDate,
            registrationDate: regDate,
            status,
            rawUser: user
        };
    });
};

/**
 * Download Report as DOC (.doc format with Word XML markup)
 */
export const downloadUserReportDOC = ({ users, category = 'all', timeRange = 'weekly' }) => {
    const targetUsers = getCategoryUsersForReport(users, category, timeRange);
    const rows = formatUserReportData(targetUsers);

    const catConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.all;
    const timeConfig = TIMEFRAME_CONFIG[timeRange] || TIMEFRAME_CONFIG.weekly;
    const now = new Date();
    const dateStamp = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStamp = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const cycleLabel = timeRange === 'weekly' ? getWeekCycleRange() : getMonthCycleRange();

    const totalAmount = rows.reduce((sum, r) => sum + (r.amount || 0), 0);

    const tableRowsHtml = rows.length > 0 ? rows.map(r => {
        const statusStyle = r.status.startsWith('Active')
            ? 'color: #15803d; background-color: #dcfce7;'
            : r.status === 'Expired'
                ? 'color: #b91c1c; background-color: #fee2e2;'
                : 'color: #4b5563; background-color: #f3f4f6;';

        return `
            <tr>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 7px 6px;">${r.sr}</td>
                <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 7px 8px; color: #0f172a;">${r.name}</td>
                <td style="border: 1px solid #cbd5e1; padding: 7px 8px; font-family: monospace;">${r.phone}</td>
                <td style="border: 1px solid #cbd5e1; padding: 7px 8px; font-weight: 500;">${r.packageName}</td>
                <td style="text-align: right; font-weight: bold; border: 1px solid #cbd5e1; padding: 7px 8px; color: #047857;">${r.amountFormatted}</td>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 7px 8px;">${r.startDate}</td>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 7px 8px;">${r.endDate}</td>
                <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 7px 8px; color: #1e3a8a;">${r.dueDate}</td>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 7px 8px;">${r.registrationDate}</td>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 7px 6px;">
                    <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 8.5pt; font-weight: bold; ${statusStyle}">
                        ${r.status}
                    </span>
                </td>
            </tr>
        `;
    }).join('') : `
        <tr>
            <td colspan="10" style="text-align: center; padding: 25px; color: #64748b; font-style: italic; border: 1px solid #cbd5e1;">
                No member records found for ${catConfig.label}.
            </td>
        </tr>
    `;

    const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="utf-8">
            <title>Tara Fitness - ${catConfig.label} ${timeConfig.label} Report</title>
            <!--[if gte mso 9]>
            <xml>
                <w:WordDocument>
                    <w:View>Print</w:View>
                    <w:Zoom>100</w:Zoom>
                    <w:DoNotOptimizeForBrowser/>
                </w:WordDocument>
            </xml>
            <![endif]-->
            <style>
                body {
                    font-family: Calibri, 'Segoe UI', Arial, sans-serif;
                    font-size: 10pt;
                    color: #111827;
                    background-color: #ffffff;
                    margin: 20px;
                }
                .header-title {
                    color: #0f172a;
                    font-size: 20pt;
                    font-weight: bold;
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .sub-title {
                    font-size: 13pt;
                    font-weight: bold;
                    color: ${catConfig.docHeaderColor || '#1e40af'};
                    margin: 4px 0 12px 0;
                }
                .meta-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 16px;
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                }
                .meta-table td {
                    padding: 8px 12px;
                    font-size: 9.5pt;
                    border: none;
                }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }
                .data-table th {
                    background-color: ${catConfig.docHeaderColor || '#1e40af'};
                    color: #ffffff !important;
                    font-weight: bold;
                    padding: 8px 6px;
                    border: 1px solid #0f172a;
                    font-size: 9pt;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .data-table td {
                    font-size: 9pt;
                }
                .footer {
                    margin-top: 24px;
                    font-size: 8.5pt;
                    color: #6b7280;
                    border-top: 1px solid #e5e7eb;
                    padding-top: 8px;
                }
            </style>
        </head>
        <body>
            <div style="border-bottom: 3px solid ${catConfig.docHeaderColor || '#2563eb'}; padding-bottom: 10px; margin-bottom: 14px;">
                <p class="header-title">TARA FITNESS & GYM</p>
                <p class="sub-title">${catConfig.label} — ${timeConfig.label} Report (${cycleLabel})</p>
            </div>

            <table class="meta-table">
                <tr>
                    <td style="width: 33%;"><strong>Generated On:</strong> ${dateStamp} at ${timeStamp}</td>
                    <td style="width: 33%;"><strong>Total Members:</strong> ${rows.length}</td>
                    <td style="width: 34%; text-align: right;"><strong>Total Plan Value:</strong> ₹${totalAmount.toLocaleString('en-IN')}</td>
                </tr>
            </table>

            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 35px; text-align: center;">#</th>
                        <th style="text-align: left;">Name</th>
                        <th style="text-align: left;">Phone Number</th>
                        <th style="text-align: left;">Package Name</th>
                        <th style="text-align: right;">Amount</th>
                        <th style="text-align: center;">Start Date</th>
                        <th style="text-align: center;">End Date</th>
                        <th style="text-align: center;">Due Date</th>
                        <th style="text-align: center;">Registration Date</th>
                        <th style="text-align: center;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHtml}
                </tbody>
            </table>

            <div class="footer">
                <p>Tara Fitness Gym Management System • Official Member Details Report • Confidential Document</p>
            </div>
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeCat = catConfig.label.replace(/\s+/g, '_');
    const safeTime = timeConfig.label.replace(/\s+/g, '_');
    const dateFormatted = now.toISOString().split('T')[0];
    link.href = url;
    link.download = `TaraFitness_${safeCat}_${safeTime}_Report_${dateFormatted}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Download Report as PDF (using html2pdf.js in landscape A4)
 * Guaranteed non-blank by rendering into active DOM coordinates during conversion
 */
export const downloadUserReportPDF = async ({ users, category = 'all', timeRange = 'weekly' }) => {
    const targetUsers = getCategoryUsersForReport(users, category, timeRange);
    const rows = formatUserReportData(targetUsers);

    const catConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.all;
    const timeConfig = TIMEFRAME_CONFIG[timeRange] || TIMEFRAME_CONFIG.weekly;
    const now = new Date();
    const dateStamp = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStamp = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const cycleLabel = timeRange === 'weekly' ? getWeekCycleRange() : getMonthCycleRange();

    const totalAmount = rows.reduce((sum, r) => sum + (r.amount || 0), 0);

    // Create container directly at top:0, left:0 on screen so html2canvas renders with 100% visibility
    const printEl = document.createElement('div');
    printEl.id = 'temp-pdf-report-container';
    printEl.style.position = 'fixed';
    printEl.style.top = '0';
    printEl.style.left = '0';
    printEl.style.width = '1120px';
    printEl.style.minHeight = '100vh';
    printEl.style.backgroundColor = '#ffffff';
    printEl.style.color = '#111827';
    printEl.style.fontFamily = 'Segoe UI, Helvetica, Arial, sans-serif';
    printEl.style.padding = '24px 30px';
    printEl.style.zIndex = '999999'; // on top while rendering
    printEl.style.boxSizing = 'border-box';
    printEl.style.overflow = 'visible';

    const tableRowsHtml = rows.length > 0 ? rows.map(r => {
        const isAct = r.status.startsWith('Active');
        const isExp = r.status.startsWith('Expired');
        const statusBadge = isAct
            ? '<span style="background-color: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 8pt;">' + r.status + '</span>'
            : isExp
                ? '<span style="background-color: #fee2e2; color: #b91c1c; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 8pt;">Expired</span>'
                : '<span style="background-color: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 8pt;">No Plan</span>';

        return `
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 8.5pt; page-break-inside: avoid; break-inside: avoid;">
                <td style="padding: 7px 6px; text-align: center; color: #64748b; border: 1px solid #cbd5e1;">${r.sr}</td>
                <td style="padding: 7px 8px; font-weight: 700; color: #0f172a; border: 1px solid #cbd5e1;">${r.name}</td>
                <td style="padding: 7px 8px; color: #334155; font-family: monospace; font-size: 8pt; border: 1px solid #cbd5e1;">${r.phone}</td>
                <td style="padding: 7px 8px; color: #1e293b; font-weight: 600; border: 1px solid #cbd5e1;">${r.packageName}</td>
                <td style="padding: 7px 8px; text-align: right; font-weight: 700; color: #047857; border: 1px solid #cbd5e1;">${r.amountFormatted}</td>
                <td style="padding: 7px 8px; text-align: center; color: #475569; border: 1px solid #cbd5e1;">${r.startDate}</td>
                <td style="padding: 7px 8px; text-align: center; color: #475569; border: 1px solid #cbd5e1;">${r.endDate}</td>
                <td style="padding: 7px 8px; text-align: center; font-weight: 700; color: #1e3a8a; border: 1px solid #cbd5e1;">${r.dueDate}</td>
                <td style="padding: 7px 8px; text-align: center; color: #475569; border: 1px solid #cbd5e1;">${r.registrationDate}</td>
                <td style="padding: 7px 6px; text-align: center; border: 1px solid #cbd5e1;">${statusBadge}</td>
            </tr>
        `;
    }).join('') : `
        <tr>
            <td colspan="10" style="text-align: center; padding: 28px; color: #64748b; font-style: italic; border: 1px solid #cbd5e1;">
                No member records found for ${catConfig.label}.
            </td>
        </tr>
    `;

    printEl.innerHTML = `
        <div style="margin-bottom: 16px; border-bottom: 3px solid ${catConfig.docHeaderColor || '#2563eb'}; padding-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h1 style="font-size: 20pt; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.5px; text-transform: uppercase;">
                        TARA <span style="color: #ea580c;">FITNESS</span> & GYM
                    </h1>
                    <p style="font-size: 12pt; font-weight: 700; color: ${catConfig.docHeaderColor || '#1e40af'}; margin: 4px 0 0 0;">
                        ${catConfig.label} — ${timeConfig.label} Report (${cycleLabel})
                    </p>
                </div>
                <div style="text-align: right;">
                    <span style="display: inline-block; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; font-size: 8pt; font-weight: 600; color: #475569;">
                        OFFICIAL GYM RECORD
                    </span>
                    <p style="margin: 4px 0 0 0; font-size: 8pt; color: #64748b;">
                        Generated: ${dateStamp} ${timeStamp}
                    </p>
                </div>
            </div>
        </div>

        <div style="display: flex; gap: 12px; margin-bottom: 14px;">
            <div style="flex: 1; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px;">
                <p style="font-size: 7.5pt; text-transform: uppercase; color: #64748b; margin: 0; font-weight: 600;">Reporting Cycle</p>
                <p style="font-size: 11pt; font-weight: 700; color: #0f172a; margin: 2px 0 0 0;">${timeConfig.label} (${cycleLabel})</p>
            </div>
            <div style="flex: 1; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px;">
                <p style="font-size: 7.5pt; text-transform: uppercase; color: #64748b; margin: 0; font-weight: 600;">Total Members</p>
                <p style="font-size: 11pt; font-weight: 700; color: #0f172a; margin: 2px 0 0 0;">${rows.length} Members</p>
            </div>
            <div style="flex: 1; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px;">
                <p style="font-size: 7.5pt; text-transform: uppercase; color: #64748b; margin: 0; font-weight: 600;">Total Plan Value</p>
                <p style="font-size: 11pt; font-weight: 700; color: #047857; margin: 2px 0 0 0;">₹${totalAmount.toLocaleString('en-IN')}</p>
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 6px; background-color: #ffffff;">
            <thead>
                <tr style="background-color: ${catConfig.docHeaderColor || '#1e293b'}; color: #ffffff;">
                    <th style="padding: 8px 6px; border: 1px solid #0f172a; font-size: 8pt; width: 30px; text-align: center; text-transform: uppercase;">#</th>
                    <th style="padding: 8px 8px; border: 1px solid #0f172a; font-size: 8pt; text-align: left; text-transform: uppercase;">Name</th>
                    <th style="padding: 8px 8px; border: 1px solid #0f172a; font-size: 8pt; text-align: left; text-transform: uppercase;">Phone Number</th>
                    <th style="padding: 8px 8px; border: 1px solid #0f172a; font-size: 8pt; text-align: left; text-transform: uppercase;">Package Name</th>
                    <th style="padding: 8px 8px; border: 1px solid #0f172a; font-size: 8pt; text-align: right; text-transform: uppercase;">Amount</th>
                    <th style="padding: 8px 8px; border: 1px solid #0f172a; font-size: 8pt; text-align: center; text-transform: uppercase;">Start Date</th>
                    <th style="padding: 8px 8px; border: 1px solid #0f172a; font-size: 8pt; text-align: center; text-transform: uppercase;">End Date</th>
                    <th style="padding: 8px 8px; border: 1px solid #0f172a; font-size: 8pt; text-align: center; text-transform: uppercase;">Due Date</th>
                    <th style="padding: 8px 8px; border: 1px solid #0f172a; font-size: 8pt; text-align: center; text-transform: uppercase;">Reg. Date</th>
                    <th style="padding: 8px 6px; border: 1px solid #0f172a; font-size: 8pt; text-align: center; text-transform: uppercase; width: 85px;">Status</th>
                </tr>
            </thead>
            <tbody>
                ${tableRowsHtml}
            </tbody>
        </table>

        <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center; font-size: 8pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px;">
            <span>Tara Fitness Gym Management System</span>
            <span>Report Generated: ${dateStamp} at ${timeStamp}</span>
        </div>
    `;

    document.body.appendChild(printEl);

    const safeCat = catConfig.label.replace(/\s+/g, '_');
    const safeTime = timeConfig.label.replace(/\s+/g, '_');
    const dateFormatted = now.toISOString().split('T')[0];

    const opt = {
        margin: [6, 6, 6, 6],
        filename: `TaraFitness_${safeCat}_${safeTime}_Report_${dateFormatted}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            scrollX: 0,
            scrollY: 0,
            windowWidth: 1200
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
        const html2pdf = (await import('html2pdf.js')).default;
        await html2pdf().set(opt).from(printEl).save();
    } finally {
        if (printEl.parentNode) {
            printEl.parentNode.removeChild(printEl);
        }
    }
};
