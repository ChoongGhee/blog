/**
 * 번역 관련 기능
 * - DeepL API를 사용한 텍스트 번역
 */

const axios = require('axios');
const { preserveMarkdownSyntax, restoreMarkdownSyntax, splitTextIntoChunks } = require('./markdown-converter');
const { convertToDeepLLanguageCode } = require('./language-config');

/**
 * 텍스트 번역 (Google Translate API, DeepL, Microsoft 등 사용)
 * @param {string} text - 번역할 텍스트
 * @param {string} targetLang - 대상 언어 코드 
 * @param {string} sourceLanguage - 소스 언어 코드
 * @param {string} translationProvider - 번역 제공자
 * @returns {Promise<string>} 번역된 텍스트
 */
async function translateText(text, targetLang, sourceLanguage, translationProvider) {
  if (!text || text.trim() === '') {
    return text;
  }
  
  const TRANSLATION_API_KEY = process.env.TRANSLATION_API_KEY;
  // const TRANSLATION_API_KEY = "11";
  // console.log(TRANSLATION_API_KEY);
  if (!TRANSLATION_API_KEY) {
    console.warn('⚠️ 번역 API 키가 설정되지 않았습니다. 샘플 번역을 반환합니다.');
    return `[${targetLang.toUpperCase()}] ${text}`;
  }
  
  try {
    // 마크다운 특수 구문 보존
    const { processedText, placeholders } = preserveMarkdownSyntax(text);
    
    // 텍스트를 작은 청크로 분할 (DeepL 권장 최대 크기는 5000자)
    const chunks = splitTextIntoChunks(processedText, 4000);
    let translatedChunks = [];
    
    // 각 청크 번역
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`청크 ${i+1}/${chunks.length} 번역 중... (${chunk.length}자)`);
      
      // DeepL API 사용
      if (translationProvider === 'deepl') {
        const deeplLangCode = convertToDeepLLanguageCode(targetLang);
        const sourceLangCode = convertToDeepLLanguageCode(sourceLanguage);
        
        console.log(`DeepL 요청: 소스=${sourceLangCode}, 대상=${deeplLangCode}`);
        
        const response = await axios.post(
          'https://api-free.deepl.com/v2/translate',
          {
            text: [chunk],
            target_lang: deeplLangCode,
            source_lang: sourceLangCode,
            preserve_formatting: true
          },
          {
            headers: {
              'Authorization': `DeepL-Auth-Key ${TRANSLATION_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data && response.data.translations && response.data.translations.length > 0) {
          translatedChunks.push(response.data.translations[0].text);
          
          // API 호출 사이에 짧은 지연 추가 (비율 제한 방지)
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      }
      // Google Translate API 구현은 여기에 추가
      // Microsoft Translator API 구현은 여기에 추가
    }
    
    // 모든 번역된 청크 합치기
    const translatedText = translatedChunks.join(' ');
    
    // 보존된 마크다운 구문 복원
    return restoreMarkdownSyntax(translatedText, placeholders);
  } catch (error) {
    console.error(`❌ ${targetLang} 번역 중 오류 발생:`, error.message);
    if (error.response) {
      console.error('오류 상세정보:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    return text; // 오류 시 원본 반환
  }
}

module.exports = {
  translateText
};