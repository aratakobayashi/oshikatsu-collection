const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/public/CelebrityProfile.tsx');

console.log('🧹 デバッグ情報を削除中...');

// ファイルを読み込む
let content = fs.readFileSync(filePath, 'utf-8');

// デバッグ関連のコードを削除
const replacements = [
  // debugInfo state削除
  {
    pattern: /const \[debugInfo, setDebugInfo\] = useState\(''\)\n/g,
    replacement: ''
  },
  // debugMsg変数削除
  {
    pattern: /    const debugMsg = .*?\n    console\.log\(debugMsg\)\n/g,
    replacement: ''
  },
  // debugSteps配列削除
  {
    pattern: /    let debugSteps = \[debugMsg\]\n/g,
    replacement: ''
  },
  // console.log削除
  {
    pattern: /      const msg = .*?\n      console\.log\('🔍 \[DEBUG\]', msg\)\n      debugSteps\.push\(msg\)\n/g,
    replacement: ''
  },
  {
    pattern: /      const distMsg = .*?\n      console\.log\('🔍 \[DEBUG\]', distMsg\)\n      debugSteps\.push\(distMsg\)\n/g,
    replacement: ''
  },
  {
    pattern: /    const finalMsg = .*?\n    console\.log\('🔍 \[DEBUG\]', finalMsg\)\n    debugSteps\.push\(finalMsg\)\n    \n    setDebugInfo\(debugSteps\.join\('\\n'\)\)\n/g,
    replacement: ''
  },
  // platformCounts削除
  {
    pattern: /      const platformCounts = \{\}\n      filtered\.forEach\(episode => \{\n        const platform = getPlatformFromUrl\(episode\.video_url\)\n        platformCounts\[platform\] = \(platformCounts\[platform\] \|\| 0\) \+ 1\n      \}\)\n/g,
    replacement: ''
  },
  // matches変数の簡略化
  {
    pattern: /        const matches = platform === platformFilter\n        return matches/g,
    replacement: '        return platform === platformFilter'
  },
  // デバッグ表示UI削除
  {
    pattern: /        \{\/\* Debug Info.*?\}\n        \{debugInfo && \([\s\S]*?\)\}\n        \n/g,
    replacement: ''
  }
];

replacements.forEach((rep, index) => {
  const before = content.length;
  content = content.replace(rep.pattern, rep.replacement);
  const after = content.length;
  if (before !== after) {
    console.log(`✅ パターン${index + 1}: ${before - after}文字削除`);
  }
});

// ファイルを書き込む
fs.writeFileSync(filePath, content);

console.log('✅ デバッグ情報の削除完了！');
console.log('\n次のステップ:');
console.log('1. npm run build');
console.log('2. git add -A && git commit -m "Remove debug info" && git push');