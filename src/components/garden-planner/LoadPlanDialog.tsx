/**
 * LoadPlanDialog Component
 * Modal dialog for loading historical planting plans
 */

'use client'

interface LoadPlanDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function LoadPlanDialog({
  isOpen,
  onClose,
  onConfirm
}: LoadPlanDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md mx-4">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Load 2025 Plan</h3>
        <p className="text-gray-600 mb-4">
          This will replace your current beds with your 2025 planting plan from the Excel workbook. 
          Your beds will be set up as A, B, C, D with the vegetables you planted this year.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This will overwrite any existing bed data. 
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Load Plan
          </button>
        </div>
      </div>
    </div>
  )
}



