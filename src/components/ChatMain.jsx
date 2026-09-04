import { useEffect, useRef } from 'react'
import Icon from './Icon'

const suggestions = [
  'รายวิชาพื้นฐานของหลักสูตรมีอะไรบ้าง?',
  'ต้องเรียนกี่หน่วยกิตจึงจะจบ?',
  'มีวิชาเลือกที่น่าสนใจอะไรบ้าง?',
]

function ChatMain({ course, messages, input, onInputChange, onMenuOpen, onSend, onStop, isLoading }) {
  const conversationRef = useRef(null)

  useEffect(() => {
    const conversation = conversationRef.current
    if (conversation && messages.length > 0) {
      conversation.scrollTo({ top: conversation.scrollHeight, behavior: 'smooth' })
    }
  }, [messages])

  return (
    <section className="chat-area">
      <header className="chat-header">
        <button className="menu-button" onClick={onMenuOpen} aria-label="เปิดเมนู"><Icon name="menu" /></button>
        <div className="current-course">
          <span className="course-icon" style={{ '--course-color': course.color }}>{course.code.slice(0, 2)}</span>
          <span>{course.name}</span>
        </div>
        <div className="header-actions">
          <button className="icon-button" aria-label="ข้อมูลหลักสูตร"><Icon name="book" /></button>
          <button className="icon-button" aria-label="ปรับมุมมอง"><Icon name="panel" /></button>
        </div>
      </header>

      <div className={`conversation ${messages.length ? 'conversation--active' : ''}`} ref={conversationRef}>
        {messages.length === 0 ? (
          <div className="welcome">
            <div className="welcome-icon"><Icon name="sparkles" size={29} /></div>
            <p className="eyebrow">THAILLM × IT KMITL</p>
            <h1>สวัสดี! มีอะไรให้ช่วยไหม</h1>
            <p className="welcome-copy">ถามทุกเรื่องเกี่ยวกับ <b>หลักสูตร{course.name}</b><br />ฉันจะตอบจากข้อมูลหลักสูตรที่ได้รับเท่านั้น</p>
            <div className="suggestions">
              {suggestions.map((suggestion) => (
                <button key={suggestion} onClick={() => onSend(suggestion)}>
                  <span>{suggestion}</span><Icon name="send" size={16} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((message, index) => (
              <article className={`message message--${message.role}`} key={`${message.role}-${index}`}>
                {message.role === 'assistant' && <div className="ai-avatar"><Icon name="sparkles" size={15} /></div>}
                <div>
                  <span className="message-author">{message.role === 'assistant' ? 'ThaiLLM' : 'คุณ'}</span>
                  <p>{message.text}</p>
                  {message.citations?.length > 0 && <p className="citations">อ้างอิง: {message.citations.map((citation) => `${citation.source_file} หน้า ${citation.page_start}${citation.page_end !== citation.page_start ? `-${citation.page_end}` : ''}`).join(', ')}</p>}
                </div>
              </article>
            ))}
            {isLoading && <article className="message message--assistant"><div className="ai-avatar"><Icon name="sparkles" size={15} /></div><div><span className="message-author">ThaiLLM</span><p className="loading-answer">กำลังค้นหาข้อมูลในเอกสาร...</p></div></article>}
          </div>
        )}
      </div>

      <div className="composer-wrap">
        <div className="composer">
          <textarea value={input} disabled={isLoading} onChange={(event) => onInputChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSend() } }} placeholder={`ถามเกี่ยวกับหลักสูตร${course.name}...`} rows="1" />
          <div className="composer-actions">
            <span>ThaiLLM • Knowledge grounded</span>
            {isLoading ? (
              <button className="send-button send-button--stop" onClick={onStop} aria-label="หยุดการตอบ"><Icon name="stop" size={15} /></button>
            ) : (
              <button className={`send-button ${input.trim() ? 'send-button--ready' : ''}`} onClick={() => onSend()} aria-label="ส่งข้อความ"><Icon name="send" size={18} /></button>
            )}
          </div>
        </div>
        <p className="disclaimer">ThaiLLM ตอบคำถามจากข้อมูลของหลักสูตรที่เลือกเท่านั้น อาจมีข้อผิดพลาดได้ โปรดตรวจสอบข้อมูลสำคัญอีกครั้ง</p>
      </div>
    </section>
  )
}

export default ChatMain
