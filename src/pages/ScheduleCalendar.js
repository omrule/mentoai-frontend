// src/pages/ScheduleCalendar.js

import React, { useState } from 'react';
// [수정] Page.css 대신 ScheduleCalendar.module.css를 import
import styles from './ScheduleCalendar.module.css';

function ScheduleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [events, setEvents] = useState([
    // [수정] 식별을 위해 unique id 추가 (실제로는 DB PK 사용)
    { id: 1, date: '2025-10-18', title: 'AI 데이터 분석 공모전 마감' },
    { id: 2, date: '2025-10-25', title: '빅데이터 경진대회 설명회' },
    // Kaggle 스터디 이벤트 제거
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '' });
  
  // [신규] 수정/삭제할 이벤트를 추적하는 state
  const [selectedEvent, setSelectedEvent] = useState(null);

  // --- [신규] 모달 닫기 함수 ---
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setNewEvent({ title: '', date: '' });
  };
  
  // --- [신규] 새 활동 추가 모달 열기 ---
  const openNewEventModal = () => {
    setSelectedEvent(null); // 새 활동이므로 selectedEvent는 null
    setNewEvent({ title: '', date: '' }); // 폼 비우기
    setIsModalOpen(true);
  };

  // --- [신규] 기존 일정 클릭 시 모달 열기 ---
  const handleEventClick = (event) => {
    setSelectedEvent(event); // 클릭한 이벤트를 '선택됨'으로 설정
    setNewEvent(event); // 폼에 내용 채우기
    setIsModalOpen(true);
  };

  // --- 캘린더 헤더 ---
  const header = () => (
    // [수정] className 적용
    <div className={styles.calendarHeader}>
      <h3 className={styles.calendarTitle}>
        {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
      </h3>
      <div className={styles.calendarNav}>
        <button className={styles.navBtn} onClick={prevMonth}>&lt; 이전 달</button>
        <button className={styles.navBtn} onClick={today}>오늘</button>
        <button className={styles.navBtn} onClick={nextMonth}>다음 달 &gt;</button>
      </div>
      <button className={styles.addEventBtn} onClick={openNewEventModal}>+ 새 활동 추가</button>
    </div>
  );

  // --- 캘린더 요일 ---
  const daysOfWeek = () => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return (
      // [수정] className 적용
      <div className={`${styles.calendarGrid} ${styles.daysHeader}`}>
        {days.map(day => (
          <div key={day} className={styles.calendarDayHeader}>{day}</div>
        ))}
      </div>
    );
  };
  
  // [신규] ESLint (no-loop-func) 경고를 해결하기 위한 헬퍼 함수
  const getEventsForDate = (dateString) => {
    return events.filter(event => event.date === dateString);
  };

  // --- 캘린더 날짜 ---
  const cells = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const isToday = day.toDateString() === new Date().toDateString(); 

        const dayEvents = getEventsForDate(formattedDate);

        // [수정] className 적용
        const dayClasses = `
          ${styles.calendarDay} 
          ${!isCurrentMonth ? styles.otherMonth : ''} 
          ${isToday ? styles.dayToday : ''}
        `;

        days.push(
          <div
            className={dayClasses}
            key={day.toString()}
          >
            <span>{day.getDate()}</span>
            {dayEvents.map((event, index) => (
              <div 
                key={index} 
                className={styles.calendarEvent} // [수정]
                onClick={() => handleEventClick(event)}
              >
                {event.title}
              </div>
            ))}
          </div>
        );
        day.setDate(day.getDate() + 1);
      }
      rows.push(<div className={styles.calendarGrid} key={day.toString()}>{days}</div>); // [수정]
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
    setCurrentDate(new Date());
  };

  // --- [수정] 모달 로직 (추가/수정) ---
  const handleAddOrUpdateEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      alert("활동 내용과 날짜를 모두 입력해주세요.");
      return;
    }

    if (selectedEvent) {
      // '수정' 모드
      setEvents(events.map(ev => 
        ev.id === selectedEvent.id ? { ...ev, title: newEvent.title, date: newEvent.date } : ev
      ));
    } else {
      // '추가' 모드
      setEvents([
        ...events, 
        { ...newEvent, id: new Date().getTime() } // (임시) unique id 생성
      ]);
    }
    closeModal();
  };

  // --- [신규] 삭제 로직 ---
  const handleDeleteEvent = () => {
    if (!selectedEvent) return;

    if (window.confirm(`'${selectedEvent.title}' 일정을 삭제하시겠습니까?`)) {
      setEvents(events.filter(ev => ev.id !== selectedEvent.id));
      closeModal();
    }
  };

  return (
    // [수정] className 적용 (page-container는 공통 스타일이므로 유지)
    <div className="page-container">
      <div className={styles.calendarContainer}>
        {header()}
        {daysOfWeek()}
        {cells()}
      </div>

      {isModalOpen && (
        // [수정] className 적용
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>{selectedEvent ? '활동 수정' : '새 활동 추가'}</h3>
            {/* [수정] className 적용 */}
            <div className={styles.formGroup}>
              <label>활동 내용</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </div>
            {/* [수정] className 적용 */}
            <div className={styles.formGroup}>
              <label>날짜</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
            </div>
            {/* [수정] className 적용 */}
            <div className={styles.modalActions}>
              {selectedEvent && (
                <button className={styles.btnDelete} onClick={handleDeleteEvent}>삭제하기</button>
              )}
              <button className={styles.btnCancel} onClick={closeModal}>취소</button>
              <button className={styles.btnSave} onClick={handleAddOrUpdateEvent}>
                {selectedEvent ? '저장하기' : '추가하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduleCalendar;