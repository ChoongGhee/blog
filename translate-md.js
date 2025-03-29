/**
 * 옵시디언 마크다운 변환 및 다국어 번역 스크립트
 * 
 * 기능:
 * 1. 옵시디언 문법을 Hexo 호환 문법으로 변환
 * 2. 한국어 콘텐츠를 여러 언어(영어, 일본어, 중국어, 스페인어, 프랑스어 등)로 자동 번역
 * 3. 이미지 파일 처리 및 복사
 * 4. Front Matter 유지 및 처리
 * 
 * 사용법: 
 * node translate-md.js <입력폴더_경로> <Hexo_posts_폴더_경로> [대상언어1,대상언어2,...]
 * 
 * 예시:
 * node translate-md.js ./md-to-translate ./source/_posts en,ja,zh-CN,es,fr
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// 번역 API 키 (환경 변수에서 가져오기)
require('dotenv').config();
const TRANSLATION_API_KEY = process.env.TRANSLATION_API_KEY;

// 명령행 인자 처리
const inputDir = process.argv[2] || './md-to-translate';
const outputDir = process.argv[3] || './source/_posts';
const targetLangs = process.argv[4] ? process.argv[4].split(',') : ['en']; // 기본값은 영어만

// 지원되는 언어 목록
const supportedLanguages = {
  'ko': '한국어',
  'en': '영어',
  'ja': '일본어' 
//   'zh-CN': '중국어(간체)',
//   'zh-TW': '중국어(번체)',
//   'es': '스페인어',
//   'fr': '프랑스어',
//   'de': '독일어',
//   'ru': '러시아어',
//   'it': '이탈리아어',
//   'pt': '포르투갈어',
//   'vi': '베트남어',
//   'id': '인도네시아어',
//   'th': '태국어'
};

// 설정
const config = {
  sourceLanguage: 'ko', // 원본 언어
  targetLanguages: targetLangs, // 번역 대상 언어 배열
  translationProvider: 'deepl', // 'google' 또는 'deepl' 또는 'microsoft'
};

// 메인 함수
async function main() {
  try {
    console.log('🚀 마크다운 변환 및 다국어 번역 시작');
    
    // 지원 언어 확인
    for (const lang of config.targetLanguages) {
      if (!supportedLanguages[lang]) {
        console.warn(`⚠️ 경고: '${lang}'은(는) 지원되지 않는 언어 코드입니다. 계속 진행합니다.`);
      }
    }
    
    // 1. 입력 폴더 확인
    if (!fs.existsSync(inputDir)) {
      throw new Error(`입력 폴더가 존재하지 않습니다: ${inputDir}`);
    }
    
    // 2. 출력 폴더 생성 (없는 경우)
    // 소스 언어 폴더
    const sourceOutputDir = path.join(outputDir, config.sourceLanguage);
    
    // 대상 언어 폴더들
    const targetOutputDirs = {};
    config.targetLanguages.forEach(lang => {
      targetOutputDirs[lang] = path.join(outputDir, lang);
    });
    
    // 이미지 폴더
    const imageOutputDir = path.join(path.dirname(outputDir), 'images');
    
    // 모든 필요한 폴더 생성
    [sourceOutputDir, ...Object.values(targetOutputDirs), imageOutputDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 폴더 생성됨: ${dir}`);
      }
    });
    
    // 3. 마크다운 파일 찾기
    const mdFiles = fs.readdirSync(inputDir)
      .filter(file => file.endsWith('.md'))
      .map(file => path.join(inputDir, file));
    
    console.log(`📝 ${mdFiles.length}개의 마크다운 파일을 찾았습니다.`);
    
    // 4. 각 파일 처리
    for (const file of mdFiles) {
      await processMarkdownFile(file, sourceOutputDir, targetOutputDirs, imageOutputDir);
    }
    
    console.log('✅ 모든 파일 처리 완료!');
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

/**
 * 마크다운 파일 처리
 */
async function processMarkdownFile(filePath, sourceOutputDir, targetOutputDirs, imageOutputDir) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 처리 중: ${fileName}`);
  console.log('API 키:', process.env.TRANSLATION_API_KEY);

  try {
    // 1. 파일 읽기
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // 2. Front Matter 파싱
    const { data: frontMatter, content: markdownContent } = matter(fileContent);
    
    // 3. 옵시디언 문법 변환
    const convertedContent = convertObsidianSyntax(markdownContent);
    
    // 4. 이미지 파일 처리
    const imagePaths = extractImagePaths(markdownContent);
    processImageFiles(filePath, imagePaths, imageOutputDir);
    
    // 5. 원본 언어(한국어) 버전 저장
    const sourceFrontMatter = {
      ...frontMatter,
      lang: config.sourceLanguage,
      date: frontMatter.date || new Date().toISOString()
    };
    
    const sourceContent = matter.stringify(convertedContent, sourceFrontMatter);
    const sourceFilePath = path.join(sourceOutputDir, fileName);
    fs.writeFileSync(sourceFilePath, sourceContent, 'utf8');
    console.log(`💾 ${supportedLanguages[config.sourceLanguage] || config.sourceLanguage} 버전 저장됨: ${path.basename(sourceFilePath)}`);
    
    // 6. 각 대상 언어로 번역 및 저장
    for (const targetLang of config.targetLanguages) {
      console.log(`🔄 ${supportedLanguages[targetLang] || targetLang} 버전 번역 중...`);
      
      try {
        // 제목 번역
        const translatedTitle = await translateText(
          frontMatter.title || path.basename(filePath, '.md'), 
          targetLang
        );
        
        // 내용 번역
        const translatedContent = await translateText(
          convertedContent,
          targetLang
        );
        
        // Front Matter 구성
        const targetFrontMatter = {
          ...sourceFrontMatter,
          title: translatedTitle,
          lang: targetLang
        };
        
        // 번역된 파일 저장
        const targetContent = matter.stringify(translatedContent, targetFrontMatter);
        const targetFilePath = path.join(targetOutputDirs[targetLang], fileName);
        fs.writeFileSync(targetFilePath, targetContent, 'utf8');
        console.log(`💾 ${supportedLanguages[targetLang] || targetLang} 버전 저장됨: ${path.basename(targetFilePath)}`);
      } catch (error) {
        console.error(`❌ ${targetLang} 번역 중 오류 발생: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ 파일 처리 중 오류 발생: ${error.message}`);
  }
}

/**
 * 옵시디언 문법을 Hexo 호환 문법으로 변환
 */
function convertObsidianSyntax(content) {
  let convertedContent = content;
  
  // 1. 임베딩 링크 [[ ]] 변환
  convertedContent = convertedContent.replace(/\[\[(.*?)\]\]/g, (match, p1) => {
    // 링크 텍스트와 URL 분리
    const parts = p1.split('|');
    const url = parts[0].trim().replace(/ /g, '-');
    const text = parts.length > 1 ? parts[1].trim() : parts[0].trim();
    return `[${text}](/${url})`;
  });
  
  // 2. Callout 박스 변환
  convertedContent = convertedContent.replace(/>\s*\[!(.*?)\](.*?)\n([\s\S]*?)(?=\n\n|\n#|\n>|\n\*|\n-|\n\d+\.|\n```|\n---|\n$)/g, (match, type, title, body) => {
    return `{% note ${type.toLowerCase()} %}
**${title.trim()}**
${body.trim()}
{% endnote %}`;
  });
  
  // 3. 이미지 임베딩 변환
  convertedContent = convertedContent.replace(/!\[\[(.*?)\]\]/g, (match, p1) => {
    const imgName = path.basename(p1);
    return `![${imgName}](/images/${imgName})`;
  });
  
  return convertedContent;
}

/**
 * 마크다운에서 이미지 경로 추출
 */
function extractImagePaths(content) {
  const imagePaths = [];
  
  // 옵시디언 이미지 링크 패턴
  const obsidianPattern = /!\[\[(.*?)\]\]/g;
  let match;
  while ((match = obsidianPattern.exec(content)) !== null) {
    imagePaths.push(match[1]);
  }
  
  // 일반 마크다운 이미지 패턴
  const markdownPattern = /!\[(.*?)\]\((.*?)\)/g;
  while ((match = markdownPattern.exec(content)) !== null) {
    if (!match[2].startsWith('http')) {
      imagePaths.push(match[2]);
    }
  }
  
  return imagePaths;
}

/**
 * 이미지 파일 처리
 */
function processImageFiles(mdFilePath, imagePaths, imageOutputDir) {
  if (imagePaths.length === 0) return;
  
  const mdFileDir = path.dirname(mdFilePath);
  
  // 각 이미지 파일 복사
  for (const imagePath of imagePaths) {
    try {
      // 이미지 파일 전체 경로 계산
      let fullImagePath = imagePath;
      
      // 상대 경로인 경우 절대 경로로 변환
      if (!path.isAbsolute(fullImagePath)) {
        fullImagePath = path.resolve(mdFileDir, imagePath);
      }
      
      // 파일이 없는 경우 입력 디렉토리에서 이미지 파일명으로 검색
      if (!fs.existsSync(fullImagePath)) {
        const imgName = path.basename(imagePath);
        const possiblePaths = [
          path.join(mdFileDir, imgName),
          path.join(inputDir, imgName),
          path.join(inputDir, 'images', imgName),
          path.join(inputDir, 'attachments', imgName)
        ];
        
        for (const testPath of possiblePaths) {
          if (fs.existsSync(testPath)) {
            fullImagePath = testPath;
            break;
          }
        }
      }
      
      if (fs.existsSync(fullImagePath)) {
        const destPath = path.join(imageOutputDir, path.basename(fullImagePath));
        fs.copyFileSync(fullImagePath, destPath);
        console.log(`📷 이미지 복사됨: ${path.basename(fullImagePath)}`);
      } else {
        console.warn(`⚠️ 이미지를 찾을 수 없음: ${imagePath}`);
      }
    } catch (error) {
      console.error(`❌ 이미지 처리 중 오류 발생: ${imagePath}`, error);
    }
  }
}

/**
 * 텍스트 번역 (Google Translate API, DeepL, Microsoft 등 사용)
 * @param {string} text - 번역할 텍스트
 * @param {string} targetLang - 대상 언어 코드 
 * @returns {Promise<string>} 번역된 텍스트
 */
async function translateText(text, targetLang) {
    if (!text || text.trim() === '') {
      return text;
    }
    
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
        if (config.translationProvider === 'deepl') {
          const deeplLangCode = convertToDeepLLanguageCode(targetLang);
          const sourceLangCode = convertToDeepLLanguageCode(config.sourceLanguage);
          
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
  
// 텍스트를 청크로 분할하는 새 함수
function splitTextIntoChunks(text, maxChunkSize) {
    if (text.length <= maxChunkSize) {
      return [text];
    }
    
    const chunks = [];
    let startPos = 0;
    
    while (startPos < text.length) {
      // 최대 청크 크기를 넘지 않는 선에서 가장 가까운 문장 끝 찾기
      let endPos = startPos + maxChunkSize;
      if (endPos >= text.length) {
        endPos = text.length;
      } else {
        // 문장 경계 찾기 (마침표, 느낌표, 물음표 뒤 공백)
        const sentenceEnd = text.substring(startPos, endPos).lastIndexOf('. ');
        if (sentenceEnd > 0) {
          endPos = startPos + sentenceEnd + 2; // 마침표와 공백 포함
        } else {
          // 문장 경계를 찾을 수 없으면 공백 기준으로 분할
          const lastSpace = text.substring(startPos, endPos).lastIndexOf(' ');
          if (lastSpace > 0) {
            endPos = startPos + lastSpace + 1; // 공백 포함
          }
          // 공백도 없으면 그냥 maxChunkSize로 자름
        }
      }
      
      chunks.push(text.substring(startPos, endPos));
      startPos = endPos;
    }
    
    return chunks;
  }

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

/**
 * 마크다운 특수 구문 보존
 */
function preserveMarkdownSyntax(text) {
  const placeholders = new Map();
  let processedText = text;
  
  // 코드 블록 보존
  processedText = processedText.replace(/```[\s\S]*?```/g, match => {
    const id = `__CODE_BLOCK_${uuidv4()}__`;
    placeholders.set(id, match);
    return id;
  });
  
  // 인라인 코드 보존
  processedText = processedText.replace(/`[^`]*`/g, match => {
    const id = `__INLINE_CODE_${uuidv4()}__`;
    placeholders.set(id, match);
    return id;
  });
  
  // HTML 태그 보존
  processedText = processedText.replace(/<[\s\S]*?>/g, match => {
    const id = `__HTML_TAG_${uuidv4()}__`;
    placeholders.set(id, match);
    return id;
  });
  
  // Hexo 태그 보존 (예: {% note info %})
  processedText = processedText.replace(/\{%[\s\S]*?%\}/g, match => {
    const id = `__HEXO_TAG_${uuidv4()}__`;
    placeholders.set(id, match);
    return id;
  });
  
  // 링크 URL 보존
  processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    const id = `__LINK_URL_${uuidv4()}__`;
    placeholders.set(id, url);
    return `[${text}](${id})`;
  });
  
  return { processedText, placeholders };
}

/**
 * 마크다운 특수 구문 복원
 */
function restoreMarkdownSyntax(text, placeholders) {
  let restoredText = text;
  
  // 모든 플레이스홀더 복원
  for (const [id, originalText] of placeholders.entries()) {
    restoredText = restoredText.replace(new RegExp(id, 'g'), originalText);
  }
  
  return restoredText;
}

// 스크립트 실행
main().catch(console.error);