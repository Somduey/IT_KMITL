import { useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatMain from './components/ChatMain'
import './App.css'

const courses = [
  { id: 'it', code: 'IT', name: 'เทคโนโลยีสารสนเทศ', color: '#a78bfa' },
  { id: 'dsba', code: 'DSBA', name: 'วิทยาการข้อมูลและการวิเคราะห์เชิงธุรกิจ', color: '#38bdf8' },
  { id: 'it-inter', code: 'ITI', name: 'เทคโนโลยีสารสนเทศทางธุรกิจ (นานาชาติ)', color: '#34d399' },
  { id: 'ait', code: 'AIT', name: 'ปัญญาประดิษฐ์และเทคโนโลยี', color: '#f59e0b' },
]

function App() {
  const [course, setCourse] = useState(courses[0])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef(null)

  const sendMessage = async (question = input) => {
    const trimmed = question.trim()
    if (!trimmed) return

    setMessages((current) => [...current, { role: 'user', text: trimmed }])
    setInput('')
    setIsLoading(true)
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed, courseId: course.id }),
        signal: abortController.signal,
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.detail || 'ไม่สามารถรับคำตอบได้')
      setMessages((current) => [...current, { role: 'assistant', text: result.answer, citations: result.citations }])
    } catch (error) {
      if (error.name === 'AbortError') return
      setMessages((current) => [...current, {
        role: 'assistant',
        text: `เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ: ${error.message}`,
      }])
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
        setIsLoading(false)
      }
    }
  }

  const stopGenerating = () => abortControllerRef.current?.abort()

  const resetChat = () => {
    setMessages([])
    setInput('')
    setSidebarOpen(false)
  }

  const selectCourse = (selected) => {
    setCourse(selected)
    setMessages([])
    setInput('')
    setSidebarOpen(false)
  }

  return (
    <main className="app-shell">
      <Sidebar
        courses={courses}
        course={course}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={resetChat}
        onCourseSelect={selectCourse}
      />
      {sidebarOpen && <button className="overlay" onClick={() => setSidebarOpen(false)} aria-label="ปิดเมนู" />}
      <ChatMain
        course={course}
        messages={messages}
        input={input}
        onInputChange={setInput}
        onMenuOpen={() => setSidebarOpen(true)}
        onSend={sendMessage}
        onStop={stopGenerating}
        isLoading={isLoading}
      />
    </main>
  )
}

export default App
