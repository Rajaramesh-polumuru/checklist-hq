import type { Run, Commit } from '@/types/database'
import { formatDateTime } from '@/lib/date-utils'

// ============================================
// Types
// ============================================

export interface RunExportData {
  run: {
    id: string
    name: string | null
    status: string
    started_at: string
    completed_at: string | null
    total_duration_seconds: number
    notes: string | null
  }
  checklist: {
    title: string
    version: string
  }
  items: ExportItem[]
  summary: {
    total_items: number
    completed_items: number
    completion_rate: number
  }
  metadata: {
    exported_at: string
    format_version: string
  }
}

export interface ExportItem {
  id: string
  text: string
  completed: boolean
  completed_at: string | null
  completed_by: string | null
  parent_id: string | null
  order: number
}

// ============================================
// Export Functions
// ============================================

/**
 * Prepare run data for export
 */
export function prepareRunExport(
  run: Run,
  commit: Commit,
  repoTitle: string
): RunExportData {
  const items = commit.content?.items || {}
  const progress = run.progress || {}

  // Build flat list of items with completion status
  const exportItems: ExportItem[] = Object.values(items).map((item) => {
    const itemProgress = progress[item.id]
    return {
      id: item.id,
      text: item.text,
      completed: itemProgress?.completed || false,
      completed_at: itemProgress?.timestamp || null,
      completed_by: itemProgress?.user_id || null,
      parent_id: item.parent || null,
      order: item.order,
    }
  })

  // Sort by order
  exportItems.sort((a, b) => a.order - b.order)

  const completedCount = exportItems.filter((i) => i.completed).length
  const totalCount = exportItems.length

  return {
    run: {
      id: run.id,
      name: run.name || null,
      status: run.status,
      started_at: run.started_at,
      completed_at: run.completed_at || null,
      total_duration_seconds: run.total_active_time_seconds || 0,
      notes: run.notes || null,
    },
    checklist: {
      title: repoTitle,
      version: commit.content?.version || '1.0',
    },
    items: exportItems,
    summary: {
      total_items: totalCount,
      completed_items: completedCount,
      completion_rate: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
    },
    metadata: {
      exported_at: new Date().toISOString(),
      format_version: '1.0',
    },
  }
}

/**
 * Export run data as JSON file
 */
export function exportAsJSON(data: RunExportData, filename?: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  downloadBlob(blob, filename || `run-${data.run.id}.json`)
}

/**
 * Export run data as CSV file
 */
export function exportAsCSV(data: RunExportData, filename?: string): void {
  const headers = ['Item', 'Status', 'Completed At', 'Order']
  const rows = data.items.map((item) => [
    escapeCSV(item.text),
    item.completed ? 'Completed' : 'Pending',
    item.completed_at ? formatDateTime(item.completed_at) : '',
    item.order.toString(),
  ])

  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...rows.map((row) => row.join(',')),
    // Summary
    '',
    `Total Items,${data.summary.total_items}`,
    `Completed,${data.summary.completed_items}`,
    `Completion Rate,${data.summary.completion_rate.toFixed(1)}%`,
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename || `run-${data.run.id}.csv`)
}

/**
 * Generate printable HTML for the run
 */
export function generatePrintableHTML(data: RunExportData): string {
  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return '-'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const itemsHTML = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          ${item.completed ? '✓' : '○'}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          ${escapeHTML(item.text)}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${item.completed ? '#16a34a' : '#9ca3af'};">
          ${item.completed ? 'Completed' : 'Pending'}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 12px; color: #6b7280;">
          ${item.completed_at ? formatDateTime(item.completed_at) : '-'}
        </td>
      </tr>
    `
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${escapeHTML(data.run.name || data.checklist.title)} - Run Report</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          color: #1f2937;
        }
        h1 { margin-bottom: 8px; }
        .subtitle { color: #6b7280; margin-bottom: 24px; }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .summary-card {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
        }
        .summary-card .value {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
        }
        .summary-card .label {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          text-align: left;
          padding: 12px 8px;
          border-bottom: 2px solid #e5e7eb;
          font-size: 12px;
          text-transform: uppercase;
          color: #6b7280;
        }
        .notes {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          margin-top: 32px;
        }
        .notes h3 { margin-top: 0; }
        .footer {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #9ca3af;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${escapeHTML(data.run.name || data.checklist.title)}</h1>
      <p class="subtitle">${escapeHTML(data.checklist.title)}</p>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="value">${data.summary.total_items}</div>
          <div class="label">Total Items</div>
        </div>
        <div class="summary-card">
          <div class="value">${data.summary.completed_items}</div>
          <div class="label">Completed</div>
        </div>
        <div class="summary-card">
          <div class="value">${data.summary.completion_rate.toFixed(0)}%</div>
          <div class="label">Completion Rate</div>
        </div>
        <div class="summary-card">
          <div class="value">${formatDuration(data.run.total_duration_seconds)}</div>
          <div class="label">Duration</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px;"></th>
            <th>Item</th>
            <th style="width: 100px;">Status</th>
            <th style="width: 150px;">Completed At</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      ${
        data.run.notes
          ? `
        <div class="notes">
          <h3>Notes</h3>
          <p>${escapeHTML(data.run.notes)}</p>
        </div>
      `
          : ''
      }

      <div class="footer">
        <p>Started: ${formatDateTime(data.run.started_at)}</p>
        ${data.run.completed_at ? `<p>Completed: ${formatDateTime(data.run.completed_at)}</p>` : ''}
        <p>Exported: ${formatDateTime(data.metadata.exported_at)}</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Open print dialog with run report
 */
export function printRunReport(data: RunExportData): void {
  const html = generatePrintableHTML(data)
  const printWindow = window.open('', '_blank')

  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Escape string for CSV
 */
function escapeCSV(str: string): string {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Escape string for HTML
 */
function escapeHTML(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
