# SignaturePad 電子簽名畫板

純 JavaScript 電子簽名元件，零依賴、可嵌入任何 Web 應用程式。

## 功能

- 🖊️ 畫筆繪製（可選顏色、粗細）
- 🧹 橡皮擦
- ↩️ 復原 (Undo)
- 🗑️ 清除畫布
- 📱 RWD 響應式，支援觸控裝置
- 🖼️ 簽名完成後回傳 DataURL 圖片

## 快速開始

### 1. 引入 JS

```html
<script src="signature-pad.js"></script>
```

> CSS 已內嵌於 JS 中，會自動注入。若需自訂樣式，可改引入 `signature-pad.css`。

### 2. 建立實例並開啟

```javascript
var pad = new SignaturePad({
  onComplete: function (dataUrl) {
    // dataUrl 即為簽名圖片的 Base64 字串
    document.getElementById('preview').src = dataUrl;
  },
  onCancel: function () {
    console.log('使用者取消簽名');
  }
});

// 綁定按鈕點擊事件
document.getElementById('signBtn').addEventListener('click', function () {
  pad.open();
});
```

## 選項 (Options)

| 參數 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `penColor` | `string` | `'#000000'` | 預設畫筆顏色 |
| `penSize` | `number` | `3` | 預設畫筆粗細 |
| `eraserSize` | `number` | `20` | 橡皮擦大小 |
| `backgroundColor` | `string` | `'#ffffff'` | 畫布背景色 |
| `colors` | `string[]` | `['#000000', '#ff0000', ...]` | 可選顏色陣列 |
| `sizes` | `number[]` | `[1, 3, 5, 8, 12]` | 可選筆劃粗細 |
| `title` | `string` | `'請在此處簽名'` | 對話框標題 |
| `confirmText` | `string` | `'完成'` | 確認按鈕文字 |
| `cancelText` | `string` | `'取消'` | 取消按鈕文字 |
| `clearText` | `string` | `'清除'` | 清除按鈕文字 |
| `undoText` | `string` | `'復原'` | 復原按鈕文字 |
| `outputType` | `string` | `'image/png'` | 輸出格式 (`image/png` 或 `image/jpeg`) |
| `outputQuality` | `number` | `1.0` | JPEG 輸出品質 (0~1) |
| `onComplete` | `function` | `null` | 簽名完成回呼，參數為 DataURL |
| `onCancel` | `function` | `null` | 取消簽名回呼 |

## API 方法

```javascript
var pad = new SignaturePad(options);

pad.open();         // 開啟簽名畫板
pad.close();        // 關閉簽名畫板
pad.toDataURL();    // 取得目前畫布的 DataURL
pad.destroy();      // 銷毀實例
```

## 模組化引入

支援 AMD / CommonJS / ES Module（透過 UMD 包裝）：

```javascript
// CommonJS
const SignaturePad = require('./signature-pad');

// ES Module (需搭配打包工具)
import SignaturePad from './signature-pad';
```

## 檔案結構

```
signature-pad/
├── signature-pad.js    ← 核心元件（含內嵌 CSS）
├── signature-pad.css   ← 外部 CSS（選用，覆蓋樣式用）
├── demo.html           ← 展示頁面
└── README.md
```

## 瀏覽器支援

支援所有現代瀏覽器（Chrome、Firefox、Safari、Edge）及行動裝置瀏覽器。
需要 Pointer Events API 支援（IE 11 需 polyfill）。

## 授權

MIT License
