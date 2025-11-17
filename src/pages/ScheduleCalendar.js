// src/pages/ScheduleCalendar.js

import React, { useState, useEffect } from 'react';
// [수정] Page.css 대신 ScheduleCalendar.module.css를 import
import styles from './ScheduleCalendar.module.css';
import apiClient from '../api/apiClient';

// sessionStorage에서 userId를 가져오는 헬퍼
const getUserIdFromStorage = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return storedUser ? storedUser.user.userId : null;
  } catch (e) {
    return null;
  }
};

function ScheduleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', activityId: null });
  
  // [신규] 수정/삭제할 이벤트를 추적하는 state
  const [selectedEvent, setSelectedEvent] = useState(null);

  // 페이지 로드 시 캘린더 이벤트를 가져오는 로직
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const userId = getUserIdFromStorage();
        if (!userId) {
          console.warn("사용자 ID를 찾을 수 없습니다.");
          setIsLoading(false);
          return;
        }

        // GET /users/{userId}/calendar/events API 호출
        const response = await apiClient.get(`/users/${userId}/calendar/events`);
        
        if (response.data && Array.isArray(response.data)) {
          // CalendarEvent를 캘린더 표시 형식으로 변환
          const formattedEvents = response.data.map(event => {
            // startAt을 YYYY-MM-DD 형식으로 변환
            const startDate = new Date(event.startAt);
            const dateString = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
            
            return {
              id: event.eventId,
              date: dateString,
              title: event.activityId ? `활동 #${event.activityId}` : '일정',
              startAt: event.startAt,
              endAt: event.endAt,
              activityId: event.activityId,
              eventId: event.eventId
            };
          });
          
          setEvents(formattedEvents);
        }
      } catch (error) {
        console.error("캘린더 이벤트 로딩 실패:", error);
        if (error.response?.status !== 404) {
          console.error("이벤트 로딩 중 오류:", error.message);
        }
        // 에러 시 빈 배열로 설정
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []); // 마운트 시 1회 실행

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

  // --- [수정] 모달 로직 (추가/수정) - API 통합 ---
  const handleAddOrUpdateEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      alert("활동 내용과 날짜를 모두 입력해주세요.");
      return;
    }

    try {
      const userId = getUserIdFromStorage();
      if (!userId) {
        throw new Error("인증 정보가 없습니다.");
      }

      if (selectedEvent) {
        // '수정' 모드 - 현재는 API에 수정 엔드포인트가 없으므로 로컬 상태만 업데이트
        setEvents(events.map(ev => 
          ev.id === selectedEvent.id ? { ...ev, title: newEvent.title, date: newEvent.date } : ev
        ));
        alert("이벤트 수정 기능은 현재 지원되지 않습니다.");
      } else {
        // '추가' 모드 - POST /users/{userId}/calendar/events
        const eventData = {
          activityId: newEvent.activityId || null, // 활동 ID가 없으면 null
          startAt: new Date(newEvent.date).toISOString(), // 날짜를 ISO 형식으로 변환
          endAt: newEvent.date ? new Date(newEvent.date).toISOString() : undefined,
          alertMinutes: 1440 // 기본값: 24시간 전 알림
        };

        const response = await apiClient.post(
          `/users/${userId}/calendar/events`,
          eventData
        );

        // 응답에서 반환된 이벤트를 로컬 상태에 추가
        if (response.data) {
          const createdEvent = response.data;
          const startDate = new Date(createdEvent.startAt);
          const dateString = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
          
          const formattedEvent = {
            id: createdEvent.eventId,
            date: dateString,
            title: newEvent.title,
            startAt: createdEvent.startAt,
            endAt: createdEvent.endAt,
            activityId: createdEvent.activityId,
            eventId: createdEvent.eventId
          };
          
          setEvents([...events, formattedEvent]);
        }
      }
      
      closeModal();
    } catch (error) {
      console.error("이벤트 저장 실패:", error);
      alert(`이벤트 저장 중 오류가 발생했습니다: ${error.message}`);
    }
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