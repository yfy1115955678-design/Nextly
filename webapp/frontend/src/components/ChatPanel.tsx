import { IconChat, IconRefresh, IconUser, IconRobot, IconArrowRight } from './Icons'

interface ChatMsg {
  role: string
  content: string
}

interface ChatPanelProps {
  chatMessages: ChatMsg[]
  chatInput: string
  setChatInput: (v: string) => void
  sendChat: () => void
  chatSending: boolean
  loadChatHistory: () => void
  chatEndRef: React.RefObject<HTMLDivElement>
  chatContainerRef: React.RefObject<HTMLDivElement>
  compact?: boolean
}

export function ChatPanel({
  chatMessages,
  chatInput,
  setChatInput,
  sendChat,
  chatSending,
  loadChatHistory,
  chatEndRef,
  chatContainerRef,
  compact,
}: ChatPanelProps) {
  const headerClasses = compact
    ? 'px-3 py-2 border-b border-hairline'
    : 'px-5 py-3 border-b border-hairline'
  const inputPad = compact ? 'p-3' : 'p-4'

  return (
    <div className="card !p-0 flex flex-col" style={{ maxHeight: chatMessages.length > 0 ? (compact ? '280px' : '380px') : 'auto' }}>
      <div className={`${headerClasses} flex items-center justify-between`}>
        <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
          <IconChat size={16} />
          Brief 对话
        </h3>
        {chatMessages.length > 0 && (
          <button
            className="text-xs text-muted hover:text-ink"
            onClick={loadChatHistory}
            title="刷新"
          >
            <IconRefresh size={12} />
          </button>
        )}
      </div>
      {chatMessages.length > 0 && (
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: '120px' }}>
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-surface-soft rounded-md p-2.5 ml-4'
                  : 'border border-hairline rounded-md p-2.5 mr-4'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {msg.role === 'user' ? (
                  <IconUser size={10} />
                ) : (
                  <IconRobot size={10} />
                )}
                <span className="font-medium text-ink">
                  {msg.role === 'user' ? '你' : 'AI 助手'}
                </span>
              </div>
              <div className="text-muted whitespace-pre-wrap">{msg.content}</div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      )}
      <div className={`${inputPad} border-t border-hairline flex gap-2`}>
        <input
          type="text"
          className="flex-1 text-sm border border-hairline rounded-sm px-3 py-2 bg-canvas text-ink placeholder:text-muted outline-none focus:border-ink"
          placeholder={chatSending ? '发送中...' : '输入问题...'}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendChat()}
          disabled={chatSending}
        />
        <button
          className="btn-primary !px-3 text-sm flex-shrink-0"
          onClick={sendChat}
          disabled={chatSending || !chatInput.trim()}
        >
          <IconArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
