import { Customer, Call, CallSummary, Task, Deal } from '../types'

export interface CustomerExportData {
  customer: Customer
  calls: Call[]
  summaries: CallSummary[]
  tasks: Task[]
  deals: Deal[]
}

const escapeCsv = (value: unknown): string => {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const toCsvRow = (cells: unknown[]): string => cells.map(escapeCsv).join(',')

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-US')
}

/**
 * Build a sectioned CSV containing a customer's summaries, tasks and deals.
 */
export function buildCustomerCsv(data: CustomerExportData): string {
  const { customer, calls, summaries, tasks, deals } = data
  const lines: string[] = []

  lines.push(toCsvRow(['EchoCRM Customer Export']))
  lines.push(toCsvRow(['Customer', customer.name]))
  lines.push(toCsvRow(['Email', customer.email || '']))
  lines.push(toCsvRow(['Phone', customer.phone || '']))
  lines.push(toCsvRow(['Company / Brokerage', customer.company || '']))
  lines.push(toCsvRow(['Exported At', new Date().toLocaleString('en-US')]))
  lines.push('')

  lines.push(toCsvRow(['Type', 'Customer', 'Description', 'Stage / Status', 'Value', 'Date', 'Details']))

  summaries.forEach((summary) => {
    const call = calls.find((c) => c.id === summary.call_id)
    lines.push(toCsvRow([
      'Call Summary',
      customer.name,
      summary.summary_text || '',
      summary.deal_stage || '',
      '',
      formatDateTime(call?.started_at),
      `Sentiment: ${summary.sentiment || 'n/a'}`
    ]))
  })

  tasks.forEach((task) => {
    lines.push(toCsvRow([
      'Task',
      customer.name,
      task.description,
      task.status,
      '',
      formatDateTime(task.due_date),
      ''
    ]))
  })

  deals.forEach((deal) => {
    lines.push(toCsvRow([
      'Deal',
      customer.name,
      deal.product,
      deal.stage,
      deal.value ?? '',
      formatDateTime(deal.expected_close_date),
      ''
    ]))
  })

  return lines.join('\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Export the customer's history as a CSV file.
 */
export function exportCustomerCsv(data: CustomerExportData) {
  const safeName = data.customer.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()
  downloadCsv(`echocrm_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`, buildCustomerCsv(data))
}

/**
 * Build a printable HTML document for the customer's history.
 */
export function buildCustomerHtml(data: CustomerExportData): string {
  const { customer, calls, summaries, tasks, deals } = data

  const summaryRows = summaries.map((s) => {
    const call = calls.find((c) => c.id === s.call_id)
    return `<tr>
      <td>${call ? new Date(call.started_at).toLocaleDateString() : '—'}</td>
      <td>${(s.summary_text || '').replace(/</g, '&lt;')}</td>
      <td>${s.deal_stage || '—'}</td>
      <td>${s.sentiment || '—'}</td>
    </tr>`
  }).join('')

  const taskRows = tasks.map((t) => `<tr>
    <td>${(t.description || '').replace(/</g, '&lt;')}</td>
    <td>${t.status}</td>
    <td>${t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</td>
  </tr>`).join('')

  const dealRows = deals.map((d) => `<tr>
    <td>${(d.product || '').replace(/</g, '&lt;')}</td>
    <td>${d.stage}</td>
    <td>${d.value != null ? Number(d.value).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : '—'}</td>
    <td>${d.expected_close_date ? new Date(d.expected_close_date).toLocaleDateString() : '—'}</td>
  </tr>`).join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>EchoCRM — ${customer.name}</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #1e293b; padding: 32px; }
  h1 { margin: 0; font-size: 22px; }
  .meta { color: #64748b; font-size: 12px; margin: 6px 0 24px; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .05em; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 28px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid #eef2f7; vertical-align: top; }
  th { color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: .04em; }
  .empty { color: #94a3b8; font-style: italic; font-size: 12px; }
</style>
</head>
<body>
  <h1>${customer.name}</h1>
  <div class="meta">
    ${customer.email ? `Email: ${customer.email} &nbsp;•&nbsp; ` : ''}
    ${customer.phone ? `Phone: ${customer.phone} &nbsp;•&nbsp; ` : ''}
    ${customer.company ? `Brokerage: ${customer.company} &nbsp;•&nbsp; ` : ''}
    Exported ${new Date().toLocaleString('en-US')}
  </div>

  <h2>Call Summaries</h2>
  ${summaryRows ? `<table><thead><tr><th>Date</th><th>Summary</th><th>Deal Stage</th><th>Sentiment</th></tr></thead><tbody>${summaryRows}</tbody></table>` : '<p class="empty">No call summaries.</p>'}

  <h2>Tasks</h2>
  ${taskRows ? `<table><thead><tr><th>Task</th><th>Status</th><th>Due</th></tr></thead><tbody>${taskRows}</tbody></table>` : '<p class="empty">No tasks.</p>'}

  <h2>Deals</h2>
  ${dealRows ? `<table><thead><tr><th>Property / Listing</th><th>Stage</th><th>Value</th><th>Target Close</th></tr></thead><tbody>${dealRows}</tbody></table>` : '<p class="empty">No deals.</p>'}
</body>
</html>`
}

/**
 * Export the customer's history as a PDF. Uses Electron's printToPDF when
 * available, otherwise falls back to the browser print dialog.
 */
export async function exportCustomerPdf(data: CustomerExportData) {
  const html = buildCustomerHtml(data)
  const safeName = data.customer.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()
  const filename = `echocrm_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`

  if (window.electronAPI?.exportPdf) {
    await window.electronAPI.exportPdf(html, filename)
    return
  }

  const win = window.open('', '_blank')
  if (!win) throw new Error('Unable to open print window.')
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}
