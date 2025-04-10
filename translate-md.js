/**
 * 옵시디언 마크다운 변환 및 다국어 번역 스크립트
 * 
 * 기능:
 * 1. 옵시디언 문법을 Hexo 호환 문법으로 변환
 * 2. 한국어 콘텐츠를 여러 언어(영어, 일본어, 중국어, 스페인어, 프랑스어 등)로 자동 번역
 * 3. 이미지 파일 처리 및 복사
 * 4. Front Matter 유지 및 처리
 * 
 * 
 * 사용법 1:
 * 기본 node translate-md.js 입력 -> 자동으로 포스트를 작성해줌. 기본값 : node translate-md.js ./md-to-translate ./source/_posts en 취급
 * 
 * 사용법 2:
 * node translate-md.js <입력폴더_경로> <Hexo_posts_폴더_경로> [대상언어1,대상언어2,...]
 * 
 * 예시:
 * node translate-md.js ./md-to-translate ./source/_posts en,ja,zh-CN,es,fr
 * 
 * @@@@@@@@@@@유의사항@@@@@@@@@@@
 * 특징 : md 폴더에 넣는 Obsidian 파일의 내용을 통째로 번역함.
 * 나의 경우 1: 파일마다 영어 단어를 상단에 적음 (예시 ###tree), So 해당 ### 헤딩을 지워줘야 Hexo-NEXT 블로그 Content 표시가 제대로 작동함.
 * 나의 경우 2: 제목을 "한국어 영어" 형식으로 제목을 짓는데 특징에 의해 제목도 번역되어 "영어 영어" 형식이 됨. So 한국어 하나로 저장해야함.   
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// 모듈 가져오기
const { translateText } = require('./lib/translator');
const { convertObsidianSyntax, extractImagePaths } = require('./lib/markdown-converter');
const { processImageFiles } = require('./lib/image-handler');
const { supportedLanguages } = require('./lib/language-config');

// 명령행 인자 처리 : 실제 명령어를 받는 것을 처리하는 부분 (아래 수정을 통해 기본 세팅 가능)
const inputDir = process.argv[2] || './md-to-translate';
const outputDir = process.argv[3] || './source/_posts';
const targetLangs = process.argv[4] ? process.argv[4].split(',') : ['en']; // 기본값은 영어만

// 설정
const config = {
  sourceLanguage: 'ko', // 원본 언어
  targetLanguages: targetLangs, // 번역 대상 언어 배열
  translationProvider: 'deepl', // 'google' 또는 'deepl' 또는 'microsoft'
};

/**
 * 영어 제목을 Title Case로 변환하는 함수
 * 각 단어의 첫 글자를 대문자로 변환
 */
function toTitleCase(str) {
  // 전치사, 접속사, 관사 등 소문자로 유지할 단어 목록
  const minorWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 
                     'to', 'from', 'by', 'of', 'in', 'as', 'with'];
  
  return str.replace(/\w\S*/g, function(txt, index) {
    // 첫 단어는 항상 대문자로 시작
    if (index === 0) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
    // 전치사, 접속사, 관사 등은 소문자로 유지
    if (minorWords.includes(txt.toLowerCase())) {
      return txt.toLowerCase();
    }
    // 나머지 단어는 첫 글자만 대문자로
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

/**
 * 파일명을 슬러그화하는 함수
 * 한글, 영어, 숫자, 특수문자 등을 URL 친화적으로 변환
 */
function slugify(text) {
  return text
    .toString()
    .normalize('NFD')                   // 유니코드 정규화
    .replace(/[\u0300-\u036f]/g, '')    // 발음 구별 기호 제거
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '')         // 영어, 숫자, 공백만 남김
    .replace(/\s+/g, '-')               // 공백을 하이픈으로 변환
    .replace(/-+/g, '-');               // 연속된 하이픈을 하나로 변환
}

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

  try {
    // 1. 파일 읽기
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // 2. Front Matter 파싱
    const { data: frontMatter, content: markdownContent } = matter(fileContent);
    
    // 파일명에서 확장자를 제외한 이름 가져오기
    const baseFileName = path.basename(filePath, '.md');
    
    // 제목이 없으면 파일명을 제목으로 사용
    const originalTitle = frontMatter.title || baseFileName;
    
    // 3. 옵시디언 문법 변환
    const convertedContent = convertObsidianSyntax(markdownContent, config.sourceLanguage);
    
    // 4. 이미지 파일 처리
    const imagePaths = extractImagePaths(markdownContent);
    processImageFiles(filePath, imagePaths, imageOutputDir, inputDir);
    
    // 5. 원본 언어(한국어) 버전 저장
    const sourceFrontMatter = {
      ...frontMatter,
      title: originalTitle, // 원본 제목 유지
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
        let translatedTitle = await translateText(
          originalTitle, 
          targetLang,
          config.sourceLanguage,
          config.translationProvider
        );
        
        // 영어인 경우 Title Case 적용
        if (targetLang === 'en') {
          translatedTitle = toTitleCase(translatedTitle);
        }
        
        // 내용 번역 후 해당 언어에 맞는 링크 변환
        const translatedRawContent = await translateText(
          markdownContent,
          targetLang,
          config.sourceLanguage,
          config.translationProvider
        );
        
        // 번역된 내용에 해당 언어의 링크 경로 적용
        const translatedAndConvertedContent = convertObsidianSyntax(
          translatedRawContent, 
          targetLang
        );
        
        // Front Matter 구성
        const targetFrontMatter = {
          ...sourceFrontMatter,
          title: translatedTitle,
          lang: targetLang
        };
        
        // 번역된 파일 저장 - 번역된 제목을 기반으로 파일명 생성
        const translatedSlug = slugify(translatedTitle);
        const targetFileName = `${translatedSlug}.md`;
        const targetFilePath = path.join(targetOutputDirs[targetLang], targetFileName);
        
        const targetContent = matter.stringify(translatedAndConvertedContent, targetFrontMatter);
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

// 스크립트 실행
main().catch(console.error);