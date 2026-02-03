import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Printer,
  Check,
  Loader2,
} from 'lucide-react'
import {
  prepareRunExport,
  exportAsJSON,
  exportAsCSV,
  printRunReport,
} from '@/services/export'
import type { Run, Commit } from '@/types/database'

interface ExportRunModalProps {
  run: Run | null
  commit: Commit | null
  repoTitle: string
  isOpen: boolean
  onClose: () => void
}

type ExportFormat = 'json' | 'csv' | 'print'

export function ExportRunModal({
  run,
  commit,
  repoTitle,
  isOpen,
  onClose,
}: ExportRunModalProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null)
  const [success, setSuccess] = useState<ExportFormat | null>(null)

  const handleExport = async (format: ExportFormat) => {
    if (!run || !commit) return

    setExporting(format)
    setSuccess(null)

    try {
      const data = prepareRunExport(run, commit, repoTitle)

      switch (format) {
        case 'json':
          exportAsJSON(data)
          break
        case 'csv':
          exportAsCSV(data)
          break
        case 'print':
          printRunReport(data)
          break
      }

      setSuccess(format)
      setTimeout(() => setSuccess(null), 2000)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(null)
    }
  }

  if (!run || !commit) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Download className="h-4 w-4 text-primary" />
            </div>
            Export Run
          </DialogTitle>
          <DialogDescription>
            Export this run as a report or download the data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <ExportOption
            icon={<Printer className="h-5 w-5" />}
            title="Print / PDF"
            description="Open print dialog to save as PDF or print"
            onClick={() => handleExport('print')}
            loading={exporting === 'print'}
            success={success === 'print'}
          />

          <ExportOption
            icon={<FileSpreadsheet className="h-5 w-5" />}
            title="CSV Spreadsheet"
            description="Download as CSV for Excel or Google Sheets"
            onClick={() => handleExport('csv')}
            loading={exporting === 'csv'}
            success={success === 'csv'}
          />

          <ExportOption
            icon={<FileJson className="h-5 w-5" />}
            title="JSON Data"
            description="Download raw data in JSON format"
            onClick={() => handleExport('json')}
            loading={exporting === 'json'}
            success={success === 'json'}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ExportOptionProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  loading: boolean
  success: boolean
}

function ExportOption({
  icon,
  title,
  description,
  onClick,
  loading,
  success,
}: ExportOptionProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
    >
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : success ? (
          <Check className="h-5 w-5 text-success" />
        ) : (
          icon
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  )
}
