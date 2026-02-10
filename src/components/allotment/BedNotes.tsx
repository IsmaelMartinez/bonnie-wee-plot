'use client'

import { useState } from 'react'
import { AlertTriangle, AlertCircle, CheckCircle, Info, Plus, Pencil, Trash2 } from 'lucide-react'
import { AreaNote, AreaNoteType, NewAreaNote, AreaNoteUpdate } from '@/types/unified-allotment'

interface AreaNotesProps {
  notes: AreaNote[]
  onAdd: (note: NewAreaNote) => void
  onUpdate: (noteId: string, updates: AreaNoteUpdate) => void
  onRemove: (noteId: string) => void
}

const NOTE_TYPE_CONFIG: Record<AreaNoteType, {
  bg: string
  border: string
  text: string
  icon: typeof AlertTriangle
  label: string
}> = {
  warning: {
    bg: 'bg-zen-bamboo-50',
    border: 'border-zen-bamboo-200',
    text: 'text-zen-bamboo-700',
    icon: AlertTriangle,
    label: 'Warning',
  },
  error: {
    bg: 'bg-zen-kitsune-50',
    border: 'border-zen-kitsune-200',
    text: 'text-zen-kitsune-700',
    icon: AlertCircle,
    label: 'Error',
  },
  success: {
    bg: 'bg-zen-moss-50',
    border: 'border-zen-moss-200',
    text: 'text-zen-moss-700',
    icon: CheckCircle,
    label: 'Success',
  },
  info: {
    bg: 'bg-zen-water-50',
    border: 'border-zen-water-200',
    text: 'text-zen-water-700',
    icon: Info,
    label: 'Info',
  },
}

const NOTE_TYPES: AreaNoteType[] = ['info', 'success', 'warning', 'error']

export default function AreaNotes({ notes, onAdd, onUpdate, onRemove }: AreaNotesProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newContent, setNewContent] = useState('')
  const [newType, setNewType] = useState<AreaNoteType>('info')
  const [editContent, setEditContent] = useState('')
  const [editType, setEditType] = useState<AreaNoteType>('info')

  const handleAdd = () => {
    if (newContent.trim()) {
      onAdd({ content: newContent.trim(), type: newType })
      setNewContent('')
      setNewType('info')
      setIsAdding(false)
    }
  }

  const handleStartEdit = (note: AreaNote) => {
    setEditingId(note.id)
    setEditContent(note.content)
    setEditType(note.type)
  }

  const handleSaveEdit = (noteId: string) => {
    if (editContent.trim()) {
      onUpdate(noteId, { content: editContent.trim(), type: editType })
      setEditingId(null)
      setEditContent('')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  // Only allow 1 note per bed
  const hasNote = notes.length > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Note</h4>
        {!isAdding && !hasNote && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add note
          </button>
        )}
      </div>

      {/* Add note form */}
      {isAdding && (
        <div className="border border-gray-200 rounded-lg p-3 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {NOTE_TYPES.map((type) => {
              const config = NOTE_TYPE_CONFIG[type]
              const Icon = config.icon
              return (
                <button
                  key={type}
                  onClick={() => setNewType(type)}
                  className={`px-3 py-2.5 min-h-[44px] rounded-full text-xs font-medium flex items-center gap-1.5 border transition-colors ${
                    newType === type
                      ? `${config.bg} ${config.border} ${config.text}`
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {config.label}
                </button>
              )
            })}
          </div>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Enter your note..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={2}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsAdding(false)
                setNewContent('')
                setNewType('info')
              }}
              className="px-4 py-2.5 min-h-[44px] text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newContent.trim()}
              className="px-4 py-2.5 min-h-[44px] text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Note
            </button>
          </div>
        </div>
      )}

      {/* Note display */}
      {notes.length === 0 && !isAdding ? (
        <p className="text-sm text-gray-400 italic">No note for this bed</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => {
            const config = NOTE_TYPE_CONFIG[note.type]
            const Icon = config.icon
            const isEditing = editingId === note.id

            if (isEditing) {
              return (
                <div key={note.id} className="border border-gray-200 rounded-lg p-3 space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {NOTE_TYPES.map((type) => {
                      const typeConfig = NOTE_TYPE_CONFIG[type]
                      const TypeIcon = typeConfig.icon
                      return (
                        <button
                          key={type}
                          onClick={() => setEditType(type)}
                          className={`px-3 py-2.5 min-h-[44px] rounded-full text-xs font-medium flex items-center gap-1.5 border transition-colors ${
                            editType === type
                              ? `${typeConfig.bg} ${typeConfig.border} ${typeConfig.text}`
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <TypeIcon className="w-4 h-4" />
                          {typeConfig.label}
                        </button>
                      )
                    })}
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2.5 min-h-[44px] text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(note.id)}
                      disabled={!editContent.trim()}
                      className="px-4 py-2.5 min-h-[44px] text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={note.id}
                className={`${config.bg} ${config.border} border rounded-lg p-3`}
              >
                <div className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 ${config.text} mt-0.5 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${config.text}`}>{note.content}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleStartEdit(note)}
                      className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center ${config.text} opacity-60 hover:opacity-100 transition-opacity rounded-zen`}
                      title="Edit note"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemove(note.id)}
                      className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center ${config.text} opacity-60 hover:opacity-100 transition-opacity rounded-zen`}
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
