const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const title = process.argv[2];
if (!title) {
  console.error('제목을 입력해주세요');
  process.exit(1);
}

// 필요한 디렉토리 생성
const enDir = path.join(__dirname, 'source/_posts/en');
const koDir = path.join(__dirname, 'source/_posts/ko');

if (!fs.existsSync(enDir)) {
  fs.mkdirSync(enDir, { recursive: true });
  console.log('영어 포스트 디렉토리 생성됨');
}

if (!fs.existsSync(koDir)) {
  fs.mkdirSync(koDir, { recursive: true });
  console.log('한국어 포스트 디렉토리 생성됨');
}

// 영어 포스트 생성
const enPostPath = path.join(enDir, `${title}.md`);
const enFrontMatter = `---
title: ${title}
date: ${new Date().toISOString().split('T')[0]}
lang: en
tags:
---

Write your English content here.
`;

fs.writeFileSync(enPostPath, enFrontMatter);
console.log(`영어 포스트 생성됨: ${enPostPath}`);

// 한국어 포스트 생성
const koPostPath = path.join(koDir, `${title}.md`);
const koFrontMatter = `---
title: ${title}
date: ${new Date().toISOString().split('T')[0]}
lang: ko
tags:
---

여기에 한국어 내용을 작성하세요.
`;

fs.writeFileSync(koPostPath, koFrontMatter);
console.log(`한국어 포스트 생성됨: ${koPostPath}`);