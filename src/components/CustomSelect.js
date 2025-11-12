import React, { useState, useRef, useEffect } from 'react';
import './CustomSelect.css'; // 이 CSS 파일도 새로 만듭니다.

/**
 * 커스텀 드롭다운 컴포넌트
 * @param {Array} options - { value: string, label: string } 형태의 객체 배열
 * @param {string} value - 현재 선택된 값
 * @param {function} onChange - 값 변경 시 호출될 함수 (새로운 value를 인자로 받음)
 */
function CustomSelect({ options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // 드롭다운 열고 닫기
  const handleToggle = () => setIsOpen(!isOpen);

  // 옵션 선택 시
  const handleSelect = (optionValue) => {
    onChange(optionValue); // 부모 컴포넌트(ProfileSetup)의 state 변경
    setIsOpen(false); // 드롭다운 닫기
  };

  // 컴포넌트 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    // 이벤트 리스너 등록
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // 컴포넌트 unmount 시 리스너 제거
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // 현재 값(value)에 해당하는 라벨(label)을 찾습니다.
  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : '';

  return (
    <div className="custom-select-wrapper" ref={wrapperRef}>
      {/* 1. 현재 선택된 값을 보여주는 트리거 버튼 */}
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
      >
        {displayValue}
        {/* 화살표 (CSS로 모양과 애니메이션 제어) */}
        <div className="custom-arrow"></div> 
      </div>
      
      {/* 2. 옵션 목록 (isOpen이 true일 때만 보임) */}
      {isOpen && (
        <ul className="custom-options-list">
          {options.map(option => (
            <li 
              key={option.value}
              className={`custom-option ${option.value === value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CustomSelect;