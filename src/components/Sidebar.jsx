import { useState } from 'react'
import furtherIcon from '../assets/further.svg'
import Icon from './Icon'

function Sidebar({ courses, course, isOpen, onClose, onNewChat, onCourseSelect }) {
  const [courseMenuOpen, setCourseMenuOpen] = useState(false)

  const selectCourse = (selected) => {
    setCourseMenuOpen(false)
    onCourseSelect(selected)
  }

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="brand">
        <div className="brand-mark"><span>IT</span></div>
        <div><strong>IT KMITL</strong><small>ThaiLLM Assistant</small></div>
        <button className="mobile-close" onClick={onClose} aria-label="ปิดเมนู"><Icon name="close" /></button>
      </div>

      <button className="new-chat" onClick={onNewChat}><Icon name="plus" /> เริ่มแชตใหม่</button>
      <button className="search-chat"><Icon name="search" /> ค้นหาบทสนทนา</button>

      <div className="course-picker">
        <div className="side-label">หลักสูตรที่ต้องการสอบถาม</div>
        <button className={`course-select ${courseMenuOpen ? 'course-select--open' : ''}`} onClick={() => setCourseMenuOpen((open) => !open)} aria-expanded={courseMenuOpen}>
          <span className="course-icon" style={{ '--course-color': course.color }}>{course.code.slice(0, 2)}</span>
          <span>{course.name}</span>
          <img className="select-chevron" src={furtherIcon} alt="" />
        </button>
        {courseMenuOpen && (
          <div className="course-menu">
            {courses.map((item) => (
              <button key={item.id} className={`course ${course.id === item.id ? 'course--active' : ''}`} onClick={() => selectCourse(item)}>
                <span className="course-icon" style={{ '--course-color': item.color }}>{item.code.slice(0, 2)}</span>
                <span>{item.name}</span>
                {course.id === item.id && <span className="active-dot" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
