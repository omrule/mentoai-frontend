// src/pages/MyPage.js

import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import './Page.css';
import CustomSelect from '../components/CustomSelect';

// (옵션 정의...)
const skillOptions = [{ value: '상', label: '상 (업무 활용)' }, { value: '중', label: '중 (토이 프로젝트)' }, { value: '하', label: '하 (학습 경험)' }];
const experienceOptions = [{ value: 'PROJECT', label: '프로젝트' }, { value: 'INTERN', label: '인턴' }];
const gradeOptions = [
  { value: '1', label: '1학년' },
  { value: '2', label: '2학년' },
  { value: '3', label: '3학년' },
  { value: '4', label: '4학년' },
  { value: '5', label: '5학년 이상' }
];

// sessionStorage에서 'userId'만 가져오는 헬퍼 (토큰은 apiClient가 관리)
const getUserIdFromStorage = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return storedUser ? storedUser.user.userId : null;
  } catch (e) {
    return null;
  }
};

function MyPage() {
  // (State 정의...)
  const [education, setEducation] = useState({ school: '', major: '', grade: '' });
  const [careerGoal, setCareerGoal] = useState('');
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState({ name: '', level: '중' });
  const [experiences, setExperiences] = useState([]);
  const [currentExperience, setCurrentExperience] = useState({ type: 'PROJECT', role: '', period: '', techStack: '' });
  const [evidence, setEvidence] = useState({ certifications: [] });
  const [currentCert, setCurrentCert] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [showToast, setShowToast] = useState(false);

  // 페이지 로드 시 /profile API를 호출하여 기존 정보 로드
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = getUserIdFromStorage();
        if (!userId) throw new Error("No auth data");

        // apiClient 사용 (헤더 자동 주입)
        const response = await apiClient.get(
          `/users/${userId}/profile`
        );
        
        const profile = response.data;
        if (profile) {
          // OpenAPI UserProfile 스펙에서 기존 형식으로 변환
          if (profile.university) {
            setEducation({
              school: profile.university.universityName || '',
              major: profile.university.major || '',
              grade: profile.university.grade ? String(profile.university.grade) : ''
            });
          }
          
          // interestDomains의 첫 번째 항목을 careerGoal로 사용
          setCareerGoal(profile.interestDomains && profile.interestDomains.length > 0 
            ? profile.interestDomains[0] 
            : '');
          
          // techStack을 skills 형식으로 변환
          if (profile.techStack) {
            setSkills(profile.techStack.map(skill => ({
              name: skill.name,
              level: skill.level === 'ADVANCED' ? '상' :
                     skill.level === 'INTERMEDIATE' ? '중' :
                     skill.level === 'EXPERT' ? '상' : '하'
            })));
          }
          
          // experiences를 기존 형식으로 변환
          if (profile.experiences) {
            setExperiences(profile.experiences.map(exp => ({
              type: exp.type,
              role: exp.role,
              period: exp.startDate && exp.endDate 
                ? `${exp.startDate} ~ ${exp.endDate}`
                : exp.startDate || '',
              techStack: exp.techStack ? exp.techStack.join(', ') : ''
            })));
          }
          
          // certifications을 기존 형식으로 변환
          if (profile.certifications) {
            setEvidence({
              certifications: profile.certifications.map(cert => cert.name)
            });
          }
        }
      } catch (error) {
        console.error("마이페이지 프로필 로드 실패:", error);
        if (error.response?.status !== 404) {
          alert(`프로필 로딩에 실패했습니다: ${error.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []); // 마운트 시 1회 실행

  // (이벤트 핸들러들...)
  const handleAddSkill = () => { if (currentSkill.name) { setSkills([...skills, currentSkill]); setCurrentSkill({ name: '', level: '중' }); } };
  const handleRemoveSkill = (index) => setSkills(skills.filter((_, i) => i !== index));
  const handleAddExperience = () => { if (currentExperience.role && currentExperience.period) { setExperiences([...experiences, currentExperience]); setCurrentExperience({ type: 'PROJECT', role: '', period: '', techStack: '' }); } };
  const handleRemoveExperience = (index) => setExperiences(experiences.filter((_, i) => i !== index));
  const handleAddCert = () => { if (currentCert) { setEvidence({ ...evidence, certifications: [...evidence.certifications, currentCert] }); setCurrentCert(''); } };
  const handleRemoveCert = (index) => { setEvidence({ ...evidence, certifications: evidence.certifications.filter((_, i) => i !== index) }); };

  // apiClient를 사용하는 handleSave (OpenAPI 스펙에 맞게 변환)
  const handleSave = async () => {
    setIsSaving(true);

    try {
      const userId = getUserIdFromStorage();
      if (!userId) throw new Error("인증 정보가 없습니다.");

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
          // period를 startDate/endDate로 파싱
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

      // apiClient 사용 (헤더 자동 주입)
      await apiClient.put(
        `/users/${userId}/profile`, 
        profileData
      );
      
      // 토스트 메시지 표시
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);

    } catch (error) {
      console.error("프로필 저장 실패:", error);
      const alertMessage = error.message || "알 수 없는 오류";
      if (error.code === 'ERR_NETWORK' || alertMessage.includes('Network Error')) {
        alert('프로필 저장에 실패했습니다. (Network Error / CORS 오류)');
      } else {
        alert(`프로필 저장 중 오류가 발생했습니다: ${alertMessage}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="profile-setup-container"><div className="profile-card">프로필 정보를 불러오는 중...</div></div>;
  }

  // (JSX)
  return (
    <div className="profile-setup-container"> 
      <div className="profile-card"> 
        <h2 className="profile-card-title">📝 프로필 수정</h2>
        <p className="profile-card-description">
          AI 추천 정확도를 높이기 위해 프로필 정보를 최신으로 유지해주세요.
        </p>
        
        {/* --- 1. 기본 정보 섹션 --- */}
        <div className="form-section">
          <h3>기본 학력</h3>
          <div className="form-grid two-cols">
            <div className="form-group">
              <label>학교</label>
              <input type="text" value={education.school} onChange={(e) => setEducation({ ...education, school: e.target.value })} required placeholder="예: 경희대학교" />
            </div>
            <div className="form-group">
              <label>전공</label>
              <input type="text" value={education.major} onChange={(e) => setEducation({ ...education, major: e.target.value })} required placeholder="예: 컴퓨터공학과" />
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
              <input type="text" value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)} required placeholder="예: AI 엔지니어" />
            </div>
          </div>
        </div>

        {/* --- 2. 기술 스택 섹션 --- */}
        <div className="form-section">
          <h3>기술 스택</h3>
          <div className="form-grid skill-grid">
            <div className="form-group">
              <label>기술 이름</label>
              <input type="text" placeholder="예: React" value={currentSkill.name} onChange={(e) => setCurrentSkill({ ...currentSkill, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>수준</label>
              <CustomSelect
                options={skillOptions}
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
              <input type="text" placeholder="예: React, Spring" value={currentExperience.techStack} onChange={(e) => setCurrentExperience({ ...currentExperience, techStack: e.target.value })} />
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
              <input type="text" placeholder="자격증 이름 (예: 정보처리기사)" value={currentCert} onChange={(e) => setCurrentCert(e.target.value)} />
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

        <button onClick={handleSave} className="submit-button" disabled={isSaving}>
          {isSaving ? '저장 중...' : '프로필 저장'}
        </button>
      </div>

      {showToast && (
        <div className="toast-message">
          ✅ 프로필이 저장되었습니다!
        </div>
      )}
    </div>
  );
}

export default MyPage;