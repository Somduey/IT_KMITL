import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatMain from './components/ChatMain'
import './App.css'

const courses = [
  { id: 'it', code: 'IT', name: 'เทคโนโลยีสารสนเทศ', color: '#a78bfa' },
  { id: 'dsba', code: 'DSBA', name: 'วิทยาการข้อมูลและการวิเคราะห์ธุรกิจ', color: '#38bdf8' },
  { id: 'bit', code: 'BIT', name: 'นวัตกรรมเทคโนโลยีสารสนเทศ', color: '#34d399' },
  { id: 'ait', code: 'AIT', name: 'ปัญญาประดิษฐ์และเทคโนโลยี', color: '#f59e0b' },
]

function App() {
  const [course, setCourse] = useState(courses[0])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const sendMessage = (question = input) => {
    const trimmed = question.trim()
    if (!trimmed) return

    setMessages((current) => [...current, { role: 'user', text: trimmed }])
    setInput('')

    window.setTimeout(() => {
      setMessages((current) => [...current, {
        role: 'assistant',
        text: `ขณะนี้ ThaiLLM อยู่ในโหมดตัวอย่างสำหรับหลักสูตร${course.name} คำตอบจริงจะอ้างอิงเฉพาะข้อมูลที่อัปโหลดไว้ในคลังความรู้ของหลักสูตรเท่านั้น`,
      }])
    }, 450)
  }

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
      />
    </main>
  )
}

export default App
