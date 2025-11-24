import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select, { components } from 'react-select';
import AsyncSelect from 'react-select/async';
import apiClient from '../api/apiClient';
import { useMetaData } from '../hooks/useMetaData';
import './Page.css';
import CustomSelect from '../components/CustomSelect'; 

// (옵션 정의...)
const levelOptions = [{ value: '상', label: '상 (업무 활용)' }, { value: '중', label: '중 (토이 프로젝트)' }, { value: '하', label: '하 (학습 경험)' }];
const experienceOptions = [{ value: 'PROJECT', label: '프로젝트' }, { value: 'INTERN', label: '인턴' }];
const gradeOptions = [
  { value: '1', label: '1학년' },
  { value: '2', label: '2학년' },
  { value: '3', label: '3학년' },
  { value: '4', label: '4학년' },
  { value: '5', label: '5학년 이상' } // 5학년제 또는 졸업 이상
];

/**
 * sessionStorage에서 인증 정보를 가져오는 헬퍼
 */
const getAuthDataFromStorage = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return { 
      userId: storedUser?.user?.userId || null
    };
  } catch (e) {
    return { userId: null };
  }
};

// [수정] CustomSelect와 동일한 화살표 아이콘 컴포넌트
const CustomDropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <div style={{
        width: 0,
        height: 0,
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderTop: '6px solid #6c757d',
        transform: props.selectProps.menuIsOpen ? 'rotate(180deg)' : 'none',
        transition: 'transform 0.2s ease',
        cursor: 'pointer'
      }} />
    </components.DropdownIndicator>
  );
};

function ProfileSetup() {
  const { majorOptions, jobOptions, skillOptions, certOptions } = useMetaData();
  
  // [수정] State 기본값을 빈 문자열로 변경
  const [education, setEducation] = useState({ school: '', major: '', grade: '' });
  const [careerGoal, setCareerGoal] = useState('');

  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState({ name: '', level: '중' });
  const [experiences, setExperiences] = useState([]);
  // [수정] API 명세에 url이 없으므로 제거
  const [currentExperience, setCurrentExperience] = useState({ type: 'PROJECT', role: '', period: '', techStack: '' });
  const [evidence, setEvidence] = useState({ certifications: [] });
  const [currentCert, setCurrentCert] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  // 학교 검색 (AsyncSelect 용)
  const loadSchoolOptions = (inputValue) => {
    return apiClient.get(`/meta/schools?q=${inputValue}`)
      .then(res => {
        return res.data.map(s => ({ value: s, label: s }));
      });
  };

  // (이벤트 핸들러들...)
  const handleAddSkill = () => { if (currentSkill.name) { setSkills([...skills, currentSkill]); setCurrentSkill({ name: '', level: '중' }); } };
  const handleRemoveSkill = (index) => setSkills(skills.filter((_, i) => i !== index));
  // [수정] API 명세에 맞게 url 필드 제거
  const handleAddExperience = () => { if (currentExperience.role && currentExperience.period) { setExperiences([...experiences, currentExperience]); setCurrentExperience({ type: 'PROJECT', role: '', period: '', techStack: '' }); } };
  const handleRemoveExperience = (index) => setExperiences(experiences.filter((_, i) => i !== index));
  const handleAddCert = () => { if (currentCert) { setEvidence({ ...evidence, certifications: [...evidence.certifications, currentCert] }); setCurrentCert(''); } };
  const handleRemoveCert = (index) => { setEvidence({ ...evidence, certifications: evidence.certifications.filter((_, i) => i !== index) }); };

  /**
   * OpenAPI 스펙에 맞게 데이터 변환 및 API 호출
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const { userId } = getAuthDataFromStorage();
      if (!userId) {
        throw new Error("인증 정보(userId)가 없습니다. 다시 로그인해주세요.");
      }

      // OpenAPI UserProfileUpsert 스펙에 맞게 데이터 변환
      const profileData = {
        university: {
          universityName: education.school || undefined,
          major: education.major || undefined,
          grade: education.grade ? parseInt(education.grade) : undefined
        },
        interestDomains: careerGoal ? [careerGoal] : [],
        techStack: skills.map(skill => ({
          name: skill.name,
          level: skill.level === '상' ? 'ADVANCED' : 
                 skill.level === '중' ? 'INTERMEDIATE' : 'BEGINNER'
        })),
        experiences: experiences.map(exp => {
          // period를 startDate/endDate로 파싱 (예: "2023-01 ~ 2023-06" 또는 "3개월")
          const periodParts = exp.period.split('~').map(s => s.trim());
          const startDate = periodParts[0] || undefined;
          const endDate = periodParts[1] || undefined;
          
          return {
            type: exp.type === 'PROJECT' ? 'PROJECT' : 'INTERNSHIP',
            role: exp.role,
            startDate: startDate,
            endDate: endDate,
            techStack: exp.techStack ? exp.techStack.split(',').map(t => t.trim()) : []
          };
        }),
        certifications: evidence.certifications.map(cert => ({
          name: cert
        }))
      };

      console.log('[ProfileSetup] ===== 프로필 저장 시작 =====');
      console.log('[ProfileSetup] [요청 시작] PUT /users/{userId}/profile');
      console.log('[ProfileSetup] 요청 URL:', `${apiClient.defaults.baseURL}/users/${userId}/profile`);
      console.log('[ProfileSetup] 요청 본문 (profileData):', profileData);

      // apiClient.put 사용
      const profileResponse = await apiClient.put(
        `/users/${userId}/profile`, 
        profileData
      );

      console.log('[ProfileSetup] [프로필 저장 성공] ✅');
      console.log('[ProfileSetup] 응답 상태 코드:', profileResponse.status);
      console.log('[ProfileSetup] 응답 데이터:', profileResponse.data);
      
      // sessionStorage의 profileComplete 상태 수동 업데이트
      const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
      if (storedUser) {
        if (storedUser.user) {
          storedUser.user.profileComplete = true;
        } else {
          storedUser.user = { profileComplete: true }; 
        }
        sessionStorage.setItem('mentoUser', JSON.stringify(storedUser));
      }

      // RoleFitScore 계산 요청
      if (careerGoal) {
        console.log('[ProfileSetup] ===== RoleFitScore 계산 시작 =====');
        console.log('[ProfileSetup] POST /users/{userId}/role-fit');
        console.log('[ProfileSetup] 요청 URL:', `${apiClient.defaults.baseURL}/users/${userId}/role-fit`);
        console.log('[ProfileSetup] 목표 직무 (target):', careerGoal);
        
        const roleFitRequestBody = {
          target: careerGoal,
          topNImprovements: 5
        };
        
        console.log('[ProfileSetup] 요청 본문 (roleFitRequestBody):', roleFitRequestBody);

        try {
          const roleFitResponse = await apiClient.post(
            `/users/${userId}/role-fit`,
            roleFitRequestBody
          );

          console.log('[ProfileSetup] [점수 계산 성공] ✅');
          console.log('[ProfileSetup] 응답 상태 코드:', roleFitResponse.status);
          console.log('[ProfileSetup] 전체 RoleFitResponse:', roleFitResponse.data);
          console.log('[ProfileSetup] 🎯 계산된 RoleFitScore:', roleFitResponse.data?.roleFitScore);
          console.log('[ProfileSetup] 📊 RoleFitScore Breakdown:', roleFitResponse.data?.breakdown);
          
          if (roleFitResponse.data?.breakdown) {
            console.log('[ProfileSetup]    - SkillFit:', roleFitResponse.data.breakdown.skillFit);
            console.log('[ProfileSetup]    - ExperienceFit:', roleFitResponse.data.breakdown.experienceFit);
            console.log('[ProfileSetup]    - EducationFit:', roleFitResponse.data.breakdown.educationFit);
            console.log('[ProfileSetup]    - EvidenceFit:', roleFitResponse.data.breakdown.evidenceFit);
          }
          console.log('[ProfileSetup] Missing Skills:', roleFitResponse.data?.missingSkills);
          console.log('[ProfileSetup] Recommendations:', roleFitResponse.data?.recommendations);
        } catch (roleFitError) {
          console.error('[ProfileSetup] [점수 계산 실패] ❌');
          console.error('[ProfileSetup] 에러:', roleFitError);
          console.error('[ProfileSetup] 에러 응답:', roleFitError.response?.data);
        }
      } else {
        console.log('[ProfileSetup] ⚠️ 목표 직무(careerGoal)가 없어 RoleFitScore 계산을 건너뜁니다.');
      }

      console.log('[ProfileSetup] ===== 프로필 저장 완료 =====');
      
      window.location.href = '/recommend';

    } catch (error) {
      console.error("프로필 저장 실패:", error);
      const alertMessage = error.message || "알 수 없는 오류";
      if (error.code === 'ERR_NETWORK' || alertMessage.includes('Network Error')) {
        alert('프로필 저장에 실패했습니다. (Network Error / CORS 오류)');
      } else {
        alert(`프로필 저장 중 오류가 발생했습니다: ${alertMessage}`);
      }
      setIsSaving(false);
    }
  };

  // 공통 Select 스타일
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '40px', // 최소 높이
      // [수정] height 고정 제거 - flex items center로 중앙 정렬 유도, wrap 시 늘어나도록
      // height: '40px', 
      borderRadius: '8px',
      borderColor: state.isFocused ? '#1a73e8' : '#ccc',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(26, 115, 232, 0.2)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#1a73e8' : '#888'
      },
      fontSize: '15px',
      backgroundColor: 'white'
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '2px 12px', // 패딩 조정
      // [수정] 높이 강제 제거
      // height: '40px',
      minHeight: '38px', // control border 고려
      display: 'flex',
      alignItems: 'center'
    }),
    placeholder: (base) => ({
      ...base,
      color: '#888',
      margin: 0
    }),
    menu: (base) => ({
        ...base,
        borderRadius: '8px',
        marginTop: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        zIndex: 9999
    }),
    option: (base, state) => ({
      ...base,
      padding: '10px',
      backgroundColor: state.isSelected ? '#e7f3ff' : state.isFocused ? '#f1f3f5' : 'white',
      color: state.isSelected ? '#007bff' : '#333',
      fontWeight: state.isSelected ? '500' : 'normal',
      cursor: 'pointer',
      ':active': {
        backgroundColor: '#e7f3ff'
      }
    }),
    singleValue: (base) => ({
        ...base,
        color: '#333',
        margin: 0
    }),
    input: (base) => ({
        ...base,
        margin: 0,
        padding: 0,
        color: '#333'
    }),
    indicatorSeparator: () => ({
        display: 'none'
    }),
    dropdownIndicator: (base) => ({
        ...base,
        padding: '8px',
        color: '#6c757d',
        '&:hover': {
            color: '#333'
        }
    })
  };

  return (
    <div className="profile-setup-container">
      <form className="profile-card" onSubmit={handleSubmit}>
        <h2 className="profile-card-title">📝 상세 프로필 설정</h2>
        <p className="profile-card-description">AI 추천 정확도를 높이기 위해 정보를 입력해주세요. (나중에 마이페이지에서 수정할 수 있습니다)</p>
        
        {/* --- 1. 기본 정보 섹션 --- */}
        <div className="form-section">
          <h3>기본 학력</h3>
          <div className="form-grid two-cols">
            <div className="form-group">
              <label>학교</label>
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={loadSchoolOptions}
                onChange={(selected) => setEducation({ ...education, school: selected ? selected.value : '' })}
                value={education.school ? { label: education.school, value: education.school } : null}
                placeholder="학교 검색 (예: 경희대학교)"
                styles={selectStyles}
                components={{ DropdownIndicator: CustomDropdownIndicator }}
                required
              />
            </div>
            <div className="form-group">
              <label>전공</label>
              <Select
                options={majorOptions}
                onChange={(selected) => setEducation({ ...education, major: selected ? selected.value : '' })}
                value={education.major ? { label: education.major, value: education.major } : null}
                placeholder="전공 선택"
                styles={selectStyles}
                components={{ DropdownIndicator: CustomDropdownIndicator }}
                required
              />
            </div>
            <div className="form-group">
              <label>학년</label>
              <CustomSelect
                options={gradeOptions}
                value={education.grade}
                onChange={(newValue) => setEducation({ ...education, grade: newValue })}
              />
            </div>
            <div className="form-group">
              <label>목표 직무</label>
              <Select
                options={jobOptions}
                onChange={(selected) => setCareerGoal(selected ? selected.value : '')}
                value={careerGoal ? { label: careerGoal, value: careerGoal } : null}
                placeholder="목표 직무 선택"
                styles={selectStyles}
                components={{ DropdownIndicator: CustomDropdownIndicator }}
                required
              />
            </div>
          </div>
        </div>

        {/* --- 2. 기술 스택 섹션 --- */}
        <div className="form-section">
          <h3>기술 스택</h3>
          <div className="form-grid skill-grid">
            <div className="form-group">
              <label>기술 이름</label>
              <Select
                options={skillOptions}
                onChange={(selected) => setCurrentSkill({ ...currentSkill, name: selected ? selected.value : '' })}
                value={currentSkill.name ? { label: currentSkill.name, value: currentSkill.name } : null}
                placeholder="기술 선택 (예: React)"
                styles={selectStyles}
                components={{ DropdownIndicator: CustomDropdownIndicator }}
              />
            </div>
            <div className="form-group">
              <label>수준</label>
              <CustomSelect
                options={levelOptions}
                value={currentSkill.level}
                onChange={(newValue) => setCurrentSkill({ ...currentSkill, level: newValue })}
              />
            </div>
            <button type="button" className="add-item-btn grid-align-end" onClick={handleAddSkill}>추가</button>
          </div>
          <ul className="added-list">
            {skills.map((skill, index) => (
              <li key={index} className="added-item">
                {skill.name} ({skill.level})
                <button type="button" className="remove-item-btn" onClick={() => handleRemoveSkill(index)}>×</button>
              </li>
            ))}
          </ul>
        </div>

        {/* --- 3. 주요 경험 섹션 --- */}
        <div className="form-section">
          <h3>주요 경험</h3>
          <div className="form-grid two-cols">
            <div className="form-group">
              <label>유형</label>
              <CustomSelect
                options={experienceOptions}
                value={currentExperience.type}
                onChange={(newValue) => setCurrentExperience({ ...currentExperience, type: newValue })}
              />
            </div>
            <div className="form-group">
              <label>역할</label>
              <input type="text" placeholder="예: 프론트엔드 개발" value={currentExperience.role} onChange={(e) => setCurrentExperience({ ...currentExperience, role: e.target.value })} />
            </div>
            <div className="form-group">
              <label>기간</label>
              <input type="text" placeholder="예: 3개월" value={currentExperience.period} onChange={(e) => setCurrentExperience({ ...currentExperience, period: e.target.value })} />
            </div>
            <div className="form-group">
              <label>사용 기술</label>
              <Select
                isMulti
                options={skillOptions}
                onChange={(selectedOptions) => {
                  const techString = selectedOptions ? selectedOptions.map(s => s.value).join(', ') : '';
                  setCurrentExperience({ ...currentExperience, techStack: techString });
                }}
                value={
                    currentExperience.techStack 
                    ? currentExperience.techStack.split(',').map(s => s.trim()).filter(s=>s).map(s => ({ label: s, value: s }))
                    : []
                }
                placeholder="사용 기술 선택 (다중 선택)"
                styles={selectStyles}
                components={{ DropdownIndicator: CustomDropdownIndicator }}
              />
            </div>
            
            <div className="form-group grid-col-span-2 grid-align-end">
              <button type="button" className="add-item-btn" onClick={handleAddExperience}>추가</button>
            </div>
          </div>
          <ul className="added-list">
            {experiences.map((exp, index) => (
              <li key={index} className="added-item">
                [{exp.type}] {exp.role} ({exp.period}) - {exp.techStack}
                <button type="button" className="remove-item-btn" onClick={() => handleRemoveExperience(index)}>×</button>
              </li>
            ))}
          </ul>
        </div>

        {/* --- 4. 증빙 자료 섹션 --- */}
        <div className="form-section">
          <h3>증빙 자료</h3>
          <div className="form-group">
            <label>자격증</label>
            <div className="input-group">
              <div style={{ flex: 1 }}>
                  <Select
                    options={certOptions}
                    onChange={(selected) => setCurrentCert(selected ? selected.value : '')}
                    value={currentCert ? { label: currentCert, value: currentCert } : null}
                    placeholder="자격증 검색 및 선택"
                    styles={selectStyles}
                    components={{ DropdownIndicator: CustomDropdownIndicator }}
                  />
              </div>
              <button type="button" className="add-item-btn" onClick={handleAddCert}>추가</button>
            </div>
            <ul className="added-list">
              {evidence.certifications.map((cert, index) => (
                <li key={index} className="added-item">
                  {cert}
                  <button type="button" className="remove-item-btn" onClick={() => handleRemoveCert(index)}>×</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* ... (폼 섹션 끝) ... */}

        <button type="submit" className="submit-button" disabled={isSaving}>
          {isSaving ? '저장 중...' : '설정 완료하고 시작하기'}
        </button>
      </form>
    </div>
  );
}

export default ProfileSetup;