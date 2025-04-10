/**
 * 마크다운 변환 관련 기능
 * - 옵시디언 문법을 Hexo 호환 문법으로 변환
 * - 마크다운 구문 보존
 * - 이미지 경로 추출
 */

const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * 옵시디언 문법을 Hexo 호환 문법으로 변환
 */
function convertObsidianSyntax(content, langCode = 'ko') {
  let convertedContent = content;
  
  // 1. 문서 링크 [[ ]] 변환 - 현재 언어 폴더로 변환 (이미지가 아닌 경우만)
  convertedContent = convertedContent.replace(/\[\[(.*?)\]\]/g, (match, p1) => {
    // 파일 확장자 확인 (.png, .jpg, .svg 등이 있으면 이미지로 판단)
    const hasImageExtension = /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(p1);
    
    // 이미지 링크면 건너뛰기 (아래 이미지 처리 로직에서 처리됨)
    if (hasImageExtension) {
      return match;
    }
    
    // 링크 텍스트와 URL 분리
    const parts = p1.split('|');
    const url = parts[0].trim().replace(/ /g, '-');
    const text = parts.length > 1 ? parts[1].trim() : parts[0].trim();
    
    // 현재 문서의 언어 접두사 추가
    return `[${text}](/${langCode}/${url})`;
  });
  
  // 2. Callout 박스 변환
  convertedContent = convertedContent.replace(/>\s*\[!(.*?)\](.*?)\n([\s\S]*?)(?=\n\n|\n#|\n>|\n\*|\n-|\n\d+\.|\n```|\n---|\n$)/g, (match, type, title, body) => {
    return `{% note ${type.toLowerCase()} %}
**${title.trim()}**
${body.trim()}
{% endnote %}`;
  });
  
  // 3. 이미지 링크 ![[이미지명]] 변환 - 공통 이미지 폴더 사용 (공백을 하이픈으로 변환)
  convertedContent = convertedContent.replace(/!\[\[(.*?)\]\]/g, (match, p1) => {
    const imgName = path.basename(p1);
    // 파일명에서 공백을 하이픈으로 변환
    const formattedImgName = imgName.replace(/ /g, '-');
    return `![${formattedImgName}](/images/${formattedImgName})`;
  });

  // 4. 이미 변환된 마크다운 이미지에서 언어 폴더 제거 (images/ko/ -> images/)
  // 그리고 파일명 공백을 하이픈으로 변환
  convertedContent = convertedContent.replace(/!\[(.*?)\]\(\/images\/(?:[a-z]{2}\/)?([^)]*)\)/g, (match, alt, imgPath) => {
    // 파일명에서 공백을 하이픈으로 변환
    const formattedImgPath = imgPath.replace(/ /g, '-');
    // alt 텍스트도 같이 변환
    const formattedAlt = alt.replace(/ /g, '-');
    return `![${formattedAlt}](/images/${formattedImgPath})`;
  });

  // 5. 경로가 없는 일반 마크다운 이미지에 경로 추가 (공백을 하이픈으로 변환)
  convertedContent = convertedContent.replace(/!\[(.*?)\]\(([^\/\)]*\.(?:png|jpg|jpeg|gif|svg|webp))\)/gi, (match, alt, imgPath) => {
    if (imgPath.startsWith('http')) {
      return match; // 외부 URL은 그대로 유지
    }
    // 파일명에서 공백을 하이픈으로 변환
    const formattedImgPath = imgPath.replace(/ /g, '-');
    // alt 텍스트도 같이 변환
    const formattedAlt = alt.replace(/ /g, '-');
    return `![${formattedAlt}](/images/${formattedImgPath})`;
  });

  return convertedContent;
}

/**
 * 마크다운에서 이미지 경로 추출
 * 옵시디언 이미지 링크와 마크다운 이미지 링크를 찾아서 경로를 추출합니다.
 */
function extractImagePaths(content) {
  const imagePaths = [];
  
  // 옵시디언 이미지 링크 패턴 (![[파일명.확장자]])
  const obsidianPattern = /!\[\[(.*?)\]\]/g;
  let match;
  while ((match = obsidianPattern.exec(content)) !== null) {
    // 파일명만 추출하고 공백을 하이픈으로 변환
    const imgName = path.basename(match[1]).replace(/ /g, '-');
    imagePaths.push(imgName);
  }
  
  // 일반 마크다운 이미지 패턴 (![대체텍스트](경로))
  const markdownPattern = /!\[(.*?)\]\((.*?)\)/g;
  while ((match = markdownPattern.exec(content)) !== null) {
    if (!match[2].startsWith('http')) {
      // 파일명만 추출하고 공백을 하이픈으로 변환
      const imgName = path.basename(match[2]).replace(/ /g, '-');
      imagePaths.push(imgName);
    }
  }
  
  return imagePaths;
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

/**
 * 텍스트를 청크로 분할
 */
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

module.exports = {
  convertObsidianSyntax,
  extractImagePaths,
  preserveMarkdownSyntax,
  restoreMarkdownSyntax,
  splitTextIntoChunks
};