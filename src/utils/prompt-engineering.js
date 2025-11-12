// src/utils/prompt-engineering.js

/**
 * 사용자의 질문, 프로필, 그리고 '검색 증강(RAG)' 데이터를 바탕으로
 * AI가 더 잘 이해할 수 있는 상세한 프롬프트를 가공하는 함수
 * @param {string} userPrompt - 사용자가 입력한 원본 질문
 * @param {object} userProfile - 사용자의 프로필 정보
 * @param {Array<object>} retrievedContext - [신규] 백엔드 RAG API가 벡터 DB에서 검색해 온 정보 (예: sampleResults)
 * @returns {string} - 최종적으로 AI에게 전달될 가공된 프롬프트
 */
export const createFinalPrompt = (userPrompt, userProfile, retrievedContext) => { 
  const profile = userProfile || {};
  const university = profile.university || '정보 없음';
  const major = profile.major || '정보 없음';
  const grade = profile.grade || '정보 없음';
  const interests = Array.isArray(profile.interests) && profile.interests.length > 0
    ? `[${profile.interests.join(', ')}]`
    : '정보 없음';

  const profileInfo = `저는 ${university} ${major} ${grade}학년 학생입니다. 저의 관심 분야는 ${interests} 입니다.`;

  // --- [신규] RAG로 검색된 컨텍스트를 문자열로 포맷팅 ---
  let contextInfo = "정보 없음";
  if (retrievedContext && retrievedContext.length > 0) {
    contextInfo = retrievedContext
      .map((item, index) => {
        return `[검색된 정보 ${index + 1}: ${item.title}]\n${item.summary}\n`;
      })
      .join('\n');
  }
  // ----------------------------------------------------

  const systemInstruction = `
    # ROLE
    {/* [수정] 멘토아이 -> MentoAI */}
    당신은 대한민국 대학생의 진로 설계를 돕는 전문 AI 멘토 'MentoAI'입니다.

    # CRITICAL INSTRUCTIONS (RAG) 
    - 당신의 최우선 임무는 [STUDENT QUESTION]에 답하기 위해, [RETRIEVED CONTEXT] 섹션에 제공된 '검색된 정보'를 '반드시' 활용하는 것입니다.
    - '검색된 정보'를 기반으로 답변을 요약, 재구성, 및 추천해야 합니다.
    - '검색된 정보'에 없는 내용은 절대 지어내지 마세요(No Hallucination).
    - '검색된 정보'가 질문과 관련이 없다면, "검색된 정보 중에는 적합한 내용을 찾지 못했습니다."라고 솔직하게 답변하세요.

    # RESPONSE FORMAT INSTRUCTIONS
    1.  **추천 요약:** 학생의 질문과 상황을 고려하여 가장 중요하다고 생각되는 활동 1~2개를 먼저 요약해서 제시해주세요. (예: "3학년 1학기라는 점을 고려했을 때, 1순위로 'AI 학부연구생' 참여를 추천합니다.")
    2.  **개별 활동 추천:** 추천하는 구체적인 활동(공모전, 스터디, 대외활동, 자격증 등)을 2~3가지 제시해주세요.
    3.  **추천 이유:** 각 활동에 대해 왜 추천하는지, 학생의 진로 목표 달성에 어떤 도움이 되는지 구체적인 이유를 반드시 명확하게 설명해야 합니다.
    4.  **실행 조언 (Optional):** 가능하다면, 해당 활동을 시작하기 위한 구체적인 방법이나 팁(예: 관련 웹사이트, 준비 방법)을 간략하게 덧붙여주세요.
    5.  **어조:** 항상 친절하고 존중하는 전문가의 말투를 사용해주세요.

    # IMPORTANT NOTE
    -   절대 진로와 관련 없는 답변(예: 날씨, 메뉴 추천, 농담)을 하지 마세요.
  `;

  // 최종 프롬프트 조합 (RAG 컨텍스트 블록 추가)
  const finalPrompt = `
[SYSTEM INSTRUCTION]
${systemInstruction.trim()}

[RETRIEVED CONTEXT]
${contextInfo.trim()}

[STUDENT PROFILE]
${profileInfo.trim()}

[STUDENT QUESTION]
${userPrompt.trim()}

[MENTOAI's RESPONSE]
`.trim();

  console.log("--- RAG 기반 최종 생성된 프롬프트 ---");
  console.log(finalPrompt);
  console.log("-----------------------------------");

  return finalPrompt;
};