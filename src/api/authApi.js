import axios from 'axios';

// 1. 실제 백엔드 서버 주소
const API_BASE_URL = 'https://mentoai.onrender.com';

// 2. Google 로그인 성공 후, '진짜' 백엔드와 통신하는 함수
export const loginWithGoogle = async (credential) => {
  console.log("진짜 백엔드로 Google Credential 전송:", credential);

  // 'credential' 객체에서 실제 토큰 값만 추출 (라이브러리 응답 형식에 따라 다름)
  // @react-oauth/google의 'tokenResponse'를 그대로 보낼 경우:
  const tokenData = {
    accessToken: credential.access_token,
    // 필요에 따라 id_token 등을 포함시킬 수 있습니다.
  };

  try {
    // 3. [수정] 백엔드 팀원이 알려준 실제 로그인 API 엔드포인트로 요청
    //    (예시: /api/v1/auth/google - 이 부분은 팀원에게 확인 필요)
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/google`, tokenData);

    // 4. 실제 서버가 반환한 데이터를 resolve
    return {
      success: true,
      data: response.data // 서버가 반환한 유저 정보 및 JWT 토큰
    };

  } catch (error) {
    console.error("백엔드 로그인 실패:", error);
    return { success: false, data: null };
  }
};

// 5. 프로필 설정 정보를 '진짜' 백엔드에 저장하는 함수
export const saveUserProfile = async (profileData) => {
  console.log("진짜 백엔드로 전송할 프로필 데이터:", profileData);

  try {
    // [중요]
    // 6. AuthContext에서 저장된 토큰을 가져오는 로직이 필요합니다.
    //    (지금은 임시로 AuthContext.js에서 토큰을 가져왔다고 가정)
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    const token = storedUser ? storedUser.accessToken : null;

    if (!token) {
      console.error("저장된 토큰이 없어 프로필 저장이 불가능합니다.");
      return { success: false, message: "로그인 토큰 없음" };
    }

    // 7. [수정] 백엔드 팀원이 알려준 실제 프로필 저장 엔드포인트로 요청
    //    (예시: /api/v1/users/profile - 이 부분은 팀원에게 확인 필요)
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/users/profile`,
      profileData,
      {
        headers: {
          // 8. HTTP 헤더에 JWT 토큰을 담아 인증
          'Authorization': `Bearer ${token}`
        }
      }
    );

    // 9. 실제 서버의 응답 반환
    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error("백엔드 프로필 저장 실패:", error);
    return { success: false, data: null };
  }
};
