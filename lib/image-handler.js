/**
 * 이미지 처리 관련 기능
 * - 이미지 파일 처리 및 복사
 */

const fs = require('fs');
const path = require('path');

/**
 * 이미지 파일 처리
 */
function processImageFiles(mdFilePath, imagePaths, imageOutputDir, inputDir) {
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
        // 새 파일명으로 복사
        const destPath = path.join(imageOutputDir, path.basename(fullImagePath).replace(/ /g, '-'));
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

module.exports = {
  processImageFiles
};