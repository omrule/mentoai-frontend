import React, { useState } from 'react';
import './Page.css';

// [수정] 70점대 유저에게 80~90점대 목표를 제안하는 가상 추천 데이터
const mockRecommendations = [
  {
    id: 'naver_ai',
    title: 'NAVER (AI 엔지니어) - 85점', // 점수 추가
    content: `NAVER는 국내 최고 수준의 AI 기술(HyperCLOVA)을 보유하고 있으며, 탄탄한 CS 기본기와 실제 서비스 적용 경험을 중요하게 봅니다. 
    <br/><br/>
    현재 70점대 역량을 보유하신 님에게는 다음 활동들을 추천합니다.
    <ul>
      <li><strong>정보처리기사 자격증 취득:</strong>
        CS 전공 지식과 SW 공학 전반의 이해도를 증명할 수 있는 기본 자격증입니다. (목표 점수: +5점)
      </li>
      <li><strong>NAVER AI RUSH 또는 D2 경진대회 참여:</strong>
        네이버가 직접 주최하는 AI 경진대회에 참여하여 실무 문제를 경험하고 입상 시 강력한 스펙이 됩니다. (목표 점수: +10점)
      </li>
      <li><strong>논문 구현 스터디 (e.g., Transformer):</strong>
        주요 AI 모델(e.g., Transformer, BERT)의 논문을 직접 읽고 PyTorch/TensorFlow로 구현해보는 스터디를 진행하세요. (목표 점수: +8점)
      </li>
    </ul>`,
    recommendation: "<strong>NAVER AI</strong> 직무는 <strong>'알고리즘/CS 지식'</strong>과 <strong>'최신 논문 이해도'</strong>를 가장 중요하게 평가합니다.",
    links: ['NAVER 채용', 'AI RUSH', 'D2']
  },
  {
    id: 'kakao_data',
    title: 'Kakao (데이터 분석가) - 82점', // 점수 추가
    content: `Kakao는 대용량 트래픽에서 발생하는 데이터를 분석하여 비즈니스 인사이트를 도출하는 역량을 중요하게 봅니다.
    <br/><br/>
    현재 70점대 역량을 보유하신 님에게는 다음 활동들을 추천합니다.
    <ul>
      <li><strong>SQLD 자격증 취득:</strong>
        데이터 분석의 가장 기본이 되는 SQL 활용 능력을 증명합니다. 데이터 추출 및 가공의 핵심입니다. (목표 점수: +5점)
      </li>
      <li><strong>Kaggle 또는 DACON 경진대회 (상위 20% 목표):</strong>
        실제 데이터를 다루는 공모전에 참여하여 데이터 전처리, 피처 엔지니어링, 모델링 전 과정을 경험하세요. (목표 점수: +12점)
      </li>
      <li><strong>대용량 데이터 처리 프로젝트 (Spark/Hadoop):</strong>
        개인 프로젝트나 스터디를 통해 대용량 데이터(e.g., 1GB 이상)를 Spark나 Hadoop 환경에서 처리해본 경험을 만드세요. (목표 점수: +10점)
      </li>
    </ul>`,
    recommendation: "<strong>Kakao 데이터 분석</strong> 직무는 <strong>'SQL 숙련도'</strong>와 <strong>'실제 데이터 핸들링 경험'</strong>을 가장 중요하게 평가합니다.",
    links: ['Kakao 채용', 'Kaggle', 'DACON']
  },
  {
    id: 'skt_research',
    title: 'SKT (AI 리서치) - 90점', // 점수 추가
    content: `SKT는 통신 데이터를 기반으로 AI 모델을 연구/개발하며, 특히 MLOps와 백엔드 개발 역량을 갖춘 AI 엔지니어를 선호합니다.
    <br/><br/>
    현재 70점대 역량을 보유하신 님에게는 다음 활동들을 추천합니다.
    <ul>
      <li><strong>클라우드 자격증 (AWS/Azure/GCP):</strong>
        AI 모델은 클라우드 환경에서 학습/배포됩니다. AWS SAA 또는 Azure Fundamentals 자격증을 추천합니다. (목표 점수: +7점)
      </li>
      <li><strong>MLOps 파이프라인 구축 프로젝트:</strong>
        모델 서빙(Serving) 경험이 중요합니다. Docker/Kubernetes를 사용하여 모델을 API로 배포하는 MLOps 프로젝트를 진행하세요. (목표 점수: +15점)
      </li>
      <li><strong>백엔드 프레임워크 스터디 (Spring/FastAPI):</strong>
        AI 모델을 서빙하기 위한 백엔드 지식이 필요합니다. FastAPI(Python) 또는 Spring(Java) 스터디를 추천합니다. (목표 점수: +8점)
      </li>
    </ul>`,
    recommendation: "<strong>SKT AI 리서치</strong> 직무는 <strong>'모델 연구'</strong>뿐만 아니라 <strong>'모델을 서빙(배포)하는 능력(MLOps)'</strong>을 중요하게 평가합니다.",
    links: ['SKT 채용', 'T-Academy', 'AWS Certification']
  }
];

function ActivityRecommender() {
  const [activeTab, setActiveTab] = useState(mockRecommendations[0].id);

  const selectedActivity = mockRecommendations.find(act => act.id === activeTab);

  return (
    <div className="page-container">
      {/* <h2> 태그 삭제됨 */}
      {/* <p> 태그 삭제됨 */}
      
      {/* 사용자 현재 점수 표시 카드 */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        marginBottom: '40px',
        textAlign: 'center'
      }}>
        {/* [수정] 멘트 수정 */}
        <h3 style={{ margin: '0', color: '#343a40', fontSize: '1.25rem' }}>
          현재 점수는 <span style={{ color: '#007bff', fontSize: '1.5em', fontWeight: 'bold' }}>70점</span> 입니다.
        </h3>
        {/* [수정] 멘트 수정 */}
        <p style={{ margin: '10px 0 0', color: '#495057', fontSize: '1rem' }}>
          아래 '추천 항목'을 확인하고 목표 달성을 시작해 보세요!
        </p>
      </div>

      <div className="recommender-layout">
        <div className="task-list-card">
          <h4>추천 항목</h4>
          <ul>
            {mockRecommendations.map(activity => (
              <li
                key={activity.id}
                className={activeTab === activity.id ? 'active' : ''}
                onClick={() => setActiveTab(activity.id)}
              >
                {activity.title}
              </li>
            ))}
          </ul>
        </div>

        {selectedActivity && (
          <div className="activity-detail-card">
            <h3>{selectedActivity.title} 활동 추천 목록</h3>
            
            <div className="activity-section" dangerouslySetInnerHTML={{ __html: selectedActivity.content }} />
            
            <div className="activity-section recommendation" dangerouslySetInnerHTML={{ __html: selectedActivity.recommendation }} />
            
            <div className="activity-links">
              {selectedActivity.links.map(link => (
                <button key={link}>{link}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityRecommender;