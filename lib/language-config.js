/**
 * 지원되는 언어 목록 및 언어 코드 변환 함수
 */

// 지원되는 언어 목록
const supportedLanguages = {
    'ko': '한국어',
    'en': '영어',
    'ja': '일본어',
    'zh-CN': '중국어(간체)',
    'zh-TW': '중국어(번체)',
    'es': '스페인어',
    'fr': '프랑스어',
    'de': '독일어',
    'ru': '러시아어',
    'it': '이탈리아어',
    'pt': '포르투갈어',
    'vi': '베트남어',
    'id': '인도네시아어',
    'th': '태국어'
  };
  
  /**
   * 언어 코드를 DeepL 형식으로 변환
   */
  function convertToDeepLLanguageCode(langCode) {
    // 언어 코드 매핑 테이블
    const mapping = {
      'zh-CN': 'ZH', // 중국어 간체
      'zh-TW': 'ZH', // 중국어 번체 - DeepL은 구분 안 함
      'en-US': 'EN-US',
      'en-GB': 'EN-GB',
      'en': 'EN',
      'ja': 'JA',
      'ko': 'KO',
      'fr': 'FR',
      'de': 'DE',
      'es': 'ES',
      'it': 'IT',
      'nl': 'NL',
      'pl': 'PL',
      'pt': 'PT',
      'ru': 'RU'
    };
    
    // 매핑 테이블에 있으면 변환, 없으면 대문자로
    return mapping[langCode] || langCode.toUpperCase();
  }
  
  module.exports = {
    supportedLanguages,
    convertToDeepLLanguageCode
  };