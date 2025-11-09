import React, { useState } from 'react';
import './Page.css';

function ScheduleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 4)); // 2025년 11월 4일 (오늘)
  const [events, setEvents] = useState([
    { date: '2025-10-18', title: 'AI 데이터 분석 공모전 마감' },
    { date: '2025-10-25', title: '빅데이터 경진대회 설명회' },
    { date: '2025-11-20', title: 'Kaggle 스터디 첫 모임' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '' });

  // --- 캘린더 헤더 ---
  const header = () => (
    <div className="calendar-header">
      <h3 className="calendar-title">
        {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
      </h3>
      <div className="calendar-nav">
        <button className="nav-btn" onClick={prevMonth}>&lt; 이전 달</button>
        <button className="nav-btn" onClick={today}>오늘</button>
        <button className="nav-btn" onClick={nextMonth}>다음 달 &gt;</button>
      </div>
      <button className="add-event-btn" onClick={() => setIsModalOpen(true)}>+ 새 활동 추가</button>
    </div>
  );

  // --- 캘린더 요일 ---
  const daysOfWeek = () => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return (
      <div className="calendar-grid days-header">
        {days.map(day => (
          <div key={day} className="calendar-day-header">{day}</div>
        ))}
      </div>
    );
  };

  // --- 캘린더 날짜 ---
  const cells = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay()); // 주의 시작(일요일)
    
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay())); // 주의 끝(토요일)

    const rows = [];
    let days = [];
    let day = startDate;
    // let formattedDate = ''; // <-- 이 줄(기존 60줄)이 삭제되었습니다.

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        // 'const'가 추가되었습니다. (기존 64줄)
        const formattedDate = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const isToday = day.toDateString() === new Date(2025, 10, 4).toDateString(); // '오늘' 날짜 하이라이트

        const dayEvents = events.filter(event => event.date === formattedDate);

        days.push(
          <div
            className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'day-today' : ''}`}
            key={day.toString()}
          >
            <span>{day.getDate()}</span>
            {dayEvents.map((event, index) => (
              <div key={index} className="calendar-event">{event.title}</div>
            ))}
          </div>
        );
        day.setDate(day.getDate() + 1);
      }
      rows.push(<div className="calendar-grid" key={day.toString()}>{days}</div>);
      days = [];
    }
    return <div>{rows}</div>;
  };

  // --- 월 이동 ---
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const today = () => {
    setCurrentDate(new Date(2025, 10, 4));
  };

  // --- 모달 로직 ---
  const handleAddEvent = () => {
    if (newEvent.title && newEvent.date) {
      setEvents([...events, newEvent]);
      setIsModalOpen(false);
      setNewEvent({ title: '', date: '' });
    } else {
      alert("활동 내용과 날짜를 모두 입력해주세요.");
    }
  };

  return (
    <div className="page-container">
      <div className="calendar-container">
        {header()}
        {daysOfWeek()}
        {cells()}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>새 활동 추가</h3>
            <div className="form-group">
              <label>활동 내용</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>날짜</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>취소</button>
              <button className="btn-save" onClick={handleAddEvent}>추가하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduleCalendar;