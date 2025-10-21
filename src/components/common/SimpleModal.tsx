import React from 'react'

interface SimpleModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

const SimpleModal: React.FC<SimpleModalProps> = ({ open, title, onClose, children }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Modal container uses column layout so the body can flex and scroll */}
      <div className="relative bg-white w-[95vw] max-w-3xl max-h-[85vh] rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 px-2 py-1">✕</button>
        </div>
        {/* Make body take remaining height and scroll on overflow */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

export default SimpleModal
