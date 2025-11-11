import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
// [수정] saveUserProfile 임포트 주석 처리 (임시)
// import { saveUserProfile } from '../api/authApi'; 
import './Page.css';

function ProfileSetup() {
  const [education, setEducation] = useState({ school: '멘토대학교', major: '컴퓨터공학과', grade: 3 });
  const [careerGoal, setCareerGoal] = useState('AI 엔지니어');
  
  // SkillFit
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState({ name: '', level: '중' });
  
  // ExperienceFit
  const [experiences, setExperiences] = useState([]);
  const [currentExperience, setCurrentExperience] = useState({ type: 'PROJECT', role: '', period: '', techStack: '', url: '' });
  
  // EvidenceFit
  const [evidence, setEvidence] = useState({ certifications: [] });
  const [currentCert, setCurrentCert] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const { completeProfile } = useAuth(); // AuthContext의 completeProfile 사용

  // --- SkillFit 핸들러 ---
  const handleAddSkill = () => {
    if (currentSkill.name) {
      setSkills([...skills, currentSkill]);
      setCurrentSkill({ name: '', level: '중' });
    }
  };
  const handleRemoveSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  // --- ExperienceFit 핸들러 ---
  const handleAddExperience = () => {
    if (currentExperience.role && currentExperience.period) {
      setExperiences([...experiences, currentExperience]);
      setCurrentExperience({ type: 'PROJECT', role: '', period: '', techStack: '', url: '' });
    }
  };
  const handleRemoveExperience = (index) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  // --- EvidenceFit 핸들러 ---
  const handleAddCert = () => {
    if (currentCert) {
      setEvidence({ ...evidence, certifications: [...evidence.certifications, currentCert] });
      setCurrentCert('');
    }
  };
  const handleRemoveCert = (index) => {
    setEvidence({
      ...evidence,
      certifications: evidence.certifications.filter((_, i) => i !== index),
    });
  };

  // --- 최종 제출 핸들러 ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const profileData = {
      education,
      careerGoal,
      skillFit: skills,
      experienceFit: experiences,
      evidenceFit: evidence
    };

    try {
      // [수정] 실제 API 호출을 주석 처리 (CORS 임시 우회)
      // await saveUserProfile(profileData);
      
      // [수정] AuthContext의 completeProfile만 호출
      // (이 함수는 AuthContext.js에서 API 호출 없이 상태만 업데이트하도록 수정되었음)
      completeProfile(profileData); 

    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-setup-container">
      <form className="profile-card" onSubmit={handleSubmit}>
        <h1 className="auth-logo">멘토아이</h1>
        <h2>상세 프로필 설정</h2>
        <p>AI 추천 점수(RoleFitScore) 계산의 정확도를 높이기 위해 정보를 입력해주세요. (나중에 마이페이지에서 수정할 수 있습니다)</p>

        {/* --- 1. 기본 정보 섹션 (EducationFit, CareerGoal) --- */}
        <div className="form-section">
          <h3>기본 학력</h3>
          <div className="form-grid two-cols">
            <div className="form-group">
              <label>학교</label>
              <input type="text" value={education.school} onChange={(e) => setEducation({ ...education, school: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>전공</label>
              <input type="text" value={education.major} onChange={(e) => setEducation({ ...education, major: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>학년</label>
              <input type="number" value={education.grade} onChange={(e) => setEducation({ ...education, grade: e.target.value })} required min="1" max="5" />
            </div>
            <div className="form-group">
              <label>목표 직무</label>
              <input type="text" value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)} required />
            </div>
          </div>
        </div>

        {/* --- 2. 기술 스택 섹션 (SkillFit) --- */}
        <div className="form-section">
          <h3>기술 스택</h3>
          <div className="input-group">
            <input type="text" placeholder="기술 이름 (예: React)" value={currentSkill.name} onChange={(e) => setCurrentSkill({ ...currentSkill, name: e.target.value })} />
            <select value={currentSkill.level} onChange={(e) => setCurrentSkill({ ...currentSkill, level: e.target.value })}>
              <option value="상">상 (업무 활용)</option>
              <option value="중">중 (토이 프로젝트)</option>
              <option value="하">하 (학습 경험)</option>
            </select>
            <button type="button" className="add-item-btn" onClick={handleAddSkill}>추가</button>
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

        {/* --- 3. 주요 경험 섹션 (ExperienceFit) --- */}
        <div className="form-section">
          <h3>주요 경험</h3>
          {/* [수정] 레이아웃 오류를 수정하기 위해 인라인 style 속성 제거 */}
          <div className="input-group experience-group">
            <select value={currentExperience.type} onChange={(e) => setCurrentExperience({ ...currentExperience, type: e.target.value })}>
              <option value="PROJECT">프로젝트</option>
              <option value="INTERN">인턴</option>
            </select>
            <input type="text" placeholder="역할 (예: 프론트엔드 개발)" value={currentExperience.role} onChange={(e) => setCurrentExperience({ ...currentExperience, role: e.target.value })} />
            <input type="text" placeholder="기간 (예: 3개월)" value={currentExperience.period} onChange={(e) => setCurrentExperience({ ...currentExperience, period: e.target.value })} />
            <input type="text" placeholder="사용 기술 (예: React, Spring)" value={currentExperience.techStack} onChange={(e) => setCurrentExperience({ ...currentExperience, techStack: e.target.value })} />
            <input type="text" placeholder="관련 URL (GitHub, 포트폴리오)" value={currentExperience.url} onChange={(e) => setCurrentExperience({ ...currentExperience, url: e.target.value })} />
            <button type="button" className="add-item-btn" onClick={handleAddExperience}>추가</button>
          </div>
          <ul className="added-list">
            {experiences.map((exp, index) => (
              <li key={index} className="added-item">
                [{exp.type}] {exp.role} ({exp.period}) - {exp.techStack} {exp.url && `(${exp.url})`}
                <button type="button" className="remove-item-btn" onClick={() => handleRemoveExperience(index)}>×</button>
              </li>
            ))}
          </ul>
        </div>

        {/* --- 4. 증빙 자료 섹션 (EvidenceFit) --- */}
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

        <button type="submit" className="submit-button" disabled={isSaving}>
          {isSaving ? '저장 중...' : '설정 완료하고 시작하기'}
        </button>
      </form>
    </div>
  );
}

export default ProfileSetup;