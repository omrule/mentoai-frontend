// src/pages/MyPage.js

import React, { useState, useEffect } from 'react';
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

function MyPage() {
  const { majorOptions, jobOptions, skillOptions, certOptions } = useMetaData();

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
  const [batchResults, setBatchResults] = useState([]);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isCalculatingBatch, setIsCalculatingBatch] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // 학교 검색 (AsyncSelect 용)
  const loadSchoolOptions = (inputValue) => {
    return apiClient.get(`/meta/data/schools?q=${inputValue}`)
      .then(res => {
        return res.data.map(s => ({ value: s, label: s }));
      });
  };

  // 페이지 로드 시 /profile API를 호출하여 기존 정보 로드
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = getUserIdFromStorage();
        if (!userId) throw new Error("No auth data");

        // [신규] 추가 API 연동 확인 (태그, 직무, 메타데이터) - 병렬 호출
        const [profileResponse, tagsResponse, rolesResponse] = await Promise.allSettled([
          apiClient.get(`/users/${userId}/profile`),
          apiClient.get('/tags'),
          apiClient.get('/roles')
        ]);

        // 1. 프로필 응답 처리
        if (profileResponse.status === 'fulfilled') {
          const profile = profileResponse.value.data;
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
        } else {
          console.error("마이페이지 프로필 로드 실패:", profileResponse.reason);
          if (profileResponse.reason?.response?.status !== 404) {
             // 404는 프로필이 없는 경우이므로 무시, 그 외 에러는 알림
             console.warn(`프로필 로딩 실패: ${profileResponse.reason.message}`);
          }
        }

        // 2. [신규] 추가 API 로그 출력
        if (tagsResponse.status === 'fulfilled') {
          console.log('[MyPage] GET /tags 응답:', tagsResponse.value.data);
        } else {
          console.warn('[MyPage] GET /tags 실패:', tagsResponse.reason);
        }

        if (rolesResponse.status === 'fulfilled') {
          console.log('[MyPage] GET /roles 응답:', rolesResponse.value.data);
        } else {
          console.warn('[MyPage] GET /roles 실패:', rolesResponse.reason);
        }

      } catch (error) {
        console.error("마이페이지 초기화 중 오류:", error);
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

      console.log('[MyPage] ===== 프로필 저장 시작 =====');
      console.log('[MyPage] [요청 시작] PUT /users/{userId}/profile');
      console.log('[MyPage] 요청 URL:', `${apiClient.defaults.baseURL}/users/${userId}/profile`);
      console.log('[MyPage] 요청 본문 (profileData):', profileData);

      // apiClient 사용 (헤더 자동 주입)
      const profileResponse = await apiClient.put(
        `/users/${userId}/profile`,
        profileData
      );

      console.log('[MyPage] [프로필 저장 성공] ✅');
      console.log('[MyPage] 응답 상태 코드:', profileResponse.status);
      console.log('[MyPage] 응답 데이터:', profileResponse.data);

      // RoleFitScore 계산 요청
      if (careerGoal) {
        console.log('[MyPage] ===== RoleFitScore 계산 시작 =====');
        console.log('[MyPage] POST /users/{userId}/role-fit');
        console.log('[MyPage] 요청 URL:', `${apiClient.defaults.baseURL}/users/${userId}/role-fit`);
        console.log('[MyPage] 목표 직무 (target):', careerGoal);

        const roleFitRequestBody = {
          target: careerGoal,
          topNImprovements: 5
        };

        console.log('[MyPage] 요청 본문 (roleFitRequestBody):', roleFitRequestBody);

        try {
          const roleFitResponse = await apiClient.post(
            `/users/${userId}/role-fit`,
            roleFitRequestBody
          );

          console.log('[MyPage] [점수 계산 성공] ✅');
          console.log('[MyPage] 응답 상태 코드:', roleFitResponse.status);
          console.log('[MyPage] 전체 RoleFitResponse:', roleFitResponse.data);
          console.log('[MyPage] 🎯 계산된 RoleFitScore:', roleFitResponse.data?.roleFitScore);
          console.log('[MyPage] 📊 RoleFitScore Breakdown:', roleFitResponse.data?.breakdown);

          if (roleFitResponse.data?.breakdown) {
            console.log('[MyPage]    - SkillFit:', roleFitResponse.data.breakdown.skillFit);
            console.log('[MyPage]    - ExperienceFit:', roleFitResponse.data.breakdown.experienceFit);
            console.log('[MyPage]    - EducationFit:', roleFitResponse.data.breakdown.educationFit);
            console.log('[MyPage]    - EvidenceFit:', roleFitResponse.data.breakdown.evidenceFit);
          }
          console.log('[MyPage] Missing Skills:', roleFitResponse.data?.missingSkills);
          console.log('[MyPage] Recommendations:', roleFitResponse.data?.recommendations);
        } catch (roleFitError) {
          console.error('[MyPage] [점수 계산 실패] ❌');
          console.error('[MyPage] 에러:', roleFitError);
          console.error('[MyPage] 에러 응답:', roleFitError.response?.data);
        }
      } else {
        console.log('[MyPage] ⚠️ 목표 직무(careerGoal)가 없어 RoleFitScore 계산을 건너뜁니다.');
      }

      // 토스트 메시지 표시
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);

      console.log('[MyPage] ===== 프로필 저장 완료 =====');

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

  // 여러 직무에 대한 일괄 계산
  const handleBatchRoleFit = async () => {
    setIsCalculatingBatch(true);
    try {
      const userId = getUserIdFromStorage();
      if (!userId) throw new Error("인증 정보가 없습니다.");

      const targets = ['backend_entry', 'frontend_entry', 'data_analyst']; // 예시 직무 목록

      console.log('[MyPage] ===== 일괄 RoleFitScore 계산 시작 =====');
      console.log('[MyPage] POST /users/{userId}/role-fit/batch');
      console.log('[MyPage] 요청 URL:', `${apiClient.defaults.baseURL}/users/${userId}/role-fit/batch`);
      console.log('[MyPage] 계산할 직무 목록 (targets):', targets);

      const batchRequestBody = {
        targets: targets,
        topNImprovements: 5
      };

      console.log('[MyPage] 요청 본문 (batchRequestBody):', batchRequestBody);

      const batchResponse = await apiClient.post(
        `/users/${userId}/role-fit/batch`,
        batchRequestBody
      );

      console.log('[MyPage] [일괄 계산 성공] ✅');
      console.log('[MyPage] 응답 상태 코드:', batchResponse.status);
      console.log('[MyPage] 전체 일괄 계산 결과:', batchResponse.data);
      console.log('[MyPage] 계산된 직무 개수:', batchResponse.data?.length);

      if (batchResponse.data) {
        batchResponse.data.forEach((result, index) => {
          console.log(`[MyPage] 직무 ${index + 1} (${result.target}):`);
          console.log(`[MyPage]   - RoleFitScore: ${result.roleFitScore}`);
          console.log(`[MyPage]   - Breakdown:`, result.breakdown);
        });
        setBatchResults(batchResponse.data);
      }
    } catch (error) {
      console.error('[MyPage] [일괄 계산 실패] ❌');
      console.error('[MyPage] 에러 객체:', error);
      console.error('[MyPage] 에러 메시지:', error.message);
      console.error('[MyPage] 에러 응답:', error.response?.data);
      alert('일괄 계산에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setIsCalculatingBatch(false);
    }
  };

  // 시뮬레이션 (예: AWS 스킬 추가 시 점수 변화)
  const handleSimulateRoleFit = async () => {
    setIsSimulating(true);
    try {
      const userId = getUserIdFromStorage();
      if (!userId) throw new Error("인증 정보가 없습니다.");

      if (!careerGoal) {
        alert('목표 직무를 먼저 설정해주세요.');
        return;
      }

      console.log('[MyPage] ===== RoleFitScore 시뮬레이션 시작 =====');
      console.log('[MyPage] POST /users/{userId}/role-fit/simulate');
      console.log('[MyPage] 요청 URL:', `${apiClient.defaults.baseURL}/users/${userId}/role-fit/simulate`);
      console.log('[MyPage] 목표 직무 (target):', careerGoal);

      // 예시: AWS 스킬 추가 시뮬레이션
      const simulationRequestBody = {
        target: careerGoal,
        addSkills: [
          { name: 'AWS', level: 'INTERMEDIATE' }
        ],
        addCertifications: [
          { name: '정보처리기사' }
        ]
      };

      console.log('[MyPage] 요청 본문 (simulationRequestBody):', simulationRequestBody);

      const simulationResponse = await apiClient.post(
        `/users/${userId}/role-fit/simulate`,
        simulationRequestBody
      );

      console.log('[MyPage] [시뮬레이션 성공] ✅');
      console.log('[MyPage] 응답 상태 코드:', simulationResponse.status);
      console.log('[MyPage] 전체 시뮬레이션 결과:', simulationResponse.data);
      console.log('[MyPage] 현재 점수 (baseScore):', simulationResponse.data?.baseScore);
      console.log('[MyPage] 예상 점수 (newScore):', simulationResponse.data?.newScore);
      console.log('[MyPage] 점수 변화 (delta):', simulationResponse.data?.delta);
      console.log('[MyPage] Breakdown 변화:', simulationResponse.data?.breakdownDelta);

      if (simulationResponse.data) {
        setSimulationResult(simulationResponse.data);
      }
    } catch (error) {
      console.error('[MyPage] [시뮬레이션 실패] ❌');
      console.error('[MyPage] 에러 객체:', error);
      console.error('[MyPage] 에러 메시지:', error.message);
      console.error('[MyPage] 에러 응답:', error.response?.data);
      alert('시뮬레이션에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setIsSimulating(false);
    }
  };

  // 공통 Select 스타일
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '40px',
      height: '40px', // [수정] 높이 강제 고정
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
      padding: '0 12px', // 패딩 조정 (상하 패딩 제거)
      height: '38px', // control height - borders (2px)
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
        color: '#333',
        caretColor: 'transparent' // [수정] 커서 숨김
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

  if (isLoading) {
    return <div className="profile-setup-container"><div className="profile-card">프로필 정보를 불러오는 중...</div></div>;
  }

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
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={loadSchoolOptions}
                onChange={(selected) => setEducation({ ...education, school: selected ? selected.value : '' })}
                value={education.school ? { label: education.school, value: education.school } : null}
                placeholder="학교 검색" // [수정] Placeholder 변경
                styles={{
                    ...selectStyles,
                    input: (base) => ({ ...base, margin: 0, padding: 0, color: '#333', caretColor: 'auto' }) // [수정] 학교 검색은 커서 유지
                }}
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
                isSearchable={false} // [수정] 검색 비활성화
              />
            </div>
            <div className="form-group">
              <label>학년</label>
              <CustomSelect
                options={gradeOptions}
                value={education.grade}
                onChange={(newValue) => setEducation({ ...education, grade: newValue })}
                placeholder="학년 선택" // [수정] Placeholder 추가
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
                isSearchable={false}
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
                placeholder="기술 선택" // [수정] Placeholder 변경
                styles={selectStyles}
                components={{ DropdownIndicator: CustomDropdownIndicator }}
                isSearchable={false}
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