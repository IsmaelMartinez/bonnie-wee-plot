'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Image from 'next/image'
import type { ChatMessage as ChatMessageType, MarkdownComponentProps } from '@/types/api'

// Markdown components for styling
const markdownComponents = {
  h1: ({ children }: MarkdownComponentProps) => <h1 className="text-xl font-bold mb-2 text-gray-800">{children}</h1>,
  h2: ({ children }: MarkdownComponentProps) => <h2 className="text-lg font-semibold mb-2 text-gray-800">{children}</h2>,
  h3: ({ children }: MarkdownComponentProps) => <h3 className="text-md font-semibold mb-1 text-gray-800">{children}</h3>,
  p: ({ children }: MarkdownComponentProps) => <p className="mb-2 leading-relaxed">{children}</p>,
  strong: ({ children }: MarkdownComponentProps) => <strong className="font-semibold text-gray-900">{children}</strong>,
  em: ({ children }: MarkdownComponentProps) => <em className="italic">{children}</em>,
  ul: ({ children }: MarkdownComponentProps) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }: MarkdownComponentProps) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
  li: ({ children }: MarkdownComponentProps) => <li className="leading-relaxed">{children}</li>,
  code: ({ children, className }: MarkdownComponentProps) => {
    const isInline = !className
    return isInline ? (
      <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>
    ) : (
      <pre className="bg-gray-200 p-2 rounded text-sm font-mono overflow-x-auto mb-2">
        <code>{children}</code>
      </pre>
    )
  },
  blockquote: ({ children }: MarkdownComponentProps) => (
    <blockquote className="border-l-4 border-green-500 pl-3 italic text-gray-700 mb-2">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: MarkdownComponentProps) => (
    <a href={href} className="text-zen-water-600 hover:text-zen-water-800 underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  hr: () => <hr className="my-3 border-gray-300" />,
}

interface ChatMessageProps {
  message: ChatMessageType & { image?: string }
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const roleLabel = isUser ? 'You' : 'Aitor'

  return (
    <article
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      aria-label={`${roleLabel} said`}
    >
      <div className={`max-w-3xl p-4 rounded-lg ${
        isUser
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 text-gray-800'
      }`}>
        {/* Screen reader only role indicator */}
        <span className="sr-only">{roleLabel}: </span>
        {isUser ? (
          <div>
            {message.image && (
              <div className="mb-2">
                <Image
                  src={message.image}
                  alt="Plant image attached to message"
                  className="max-w-full h-auto rounded border"
                  style={{ maxHeight: '200px' }}
                  width={400}
                  height={200}
                  unoptimized={true}
                />
              </div>
            )}
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </article>
  )
}

export function LoadingMessage() {
  return (
    <div className="flex justify-start" role="status" aria-label="Aitor is typing">
      <div className="bg-gray-100 p-4 rounded-lg">
        <span className="sr-only">Aitor is typing a response...</span>
        <div className="flex space-x-2" aria-hidden="true">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  )
}



