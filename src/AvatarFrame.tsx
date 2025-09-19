// Đặt file Frame_Avatar.png vào thư mục src/assets để sử dụng làm khung avatar.
// Nếu chưa có, hãy thêm file này vào thư mục src/assets.


// Tuỳ chỉnh vị trí và wrap text ở đây:
const TEXT_X = 400; // toạ độ X (giữa ảnh)
const TEXT_Y = 752; // toạ độ Y (gần cuối ảnh)
const MAX_CHARS_PER_LINE = 40; // S40ký tự tối đa mỗi dòng
const LINE_HEIGHT = 32; // khoảng cách dòng

// Component AvatarFrame: Cho phép người dùng tải ảnh lên, chèn vào khung, xem trước và xuất ảnh.
import React, { useRef, useState } from 'react';

// const FRAME_SRC = '/src/assets/Frame_Avatar.png';
const FRAME_SRC = '/Frame_Avatar.png';
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1000;

const AvatarFrame: React.FC = () => {
  // Load font Lexend cho canvas
  React.useEffect(() => {
    const font = new FontFace(
      'Lexend',
  // 'url(/src/assets/Font/Lexend-Regular.ttf)'
  'url(/font/Lexend-Regular.ttf)'
    );  
    font.load().then((loadedFont) => {
      // @ts-ignore
      document.fonts.add(loadedFont);
    });
  }, []);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [isStep1Confirmed, setIsStep1Confirmed] = useState<boolean>(false);
  const [isValidatingCode, setIsValidatingCode] = useState<boolean>(false);
  const [codeError, setCodeError] = useState<string>('');
  const [codeToMessageMap, setCodeToMessageMap] = useState<Record<string, string> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  // Xử lý khi upload ảnh
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const imgSrc = ev.target?.result as string;
        setUserImage(imgSrc);
      };
      reader.readAsDataURL(file);
    }
  };

  // Luôn cập nhật preview khi message hoặc userImage thay đổi
  React.useEffect(() => {
    if (userImage) {
      generatePreview(userImage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userImage, message]);

  // Hàm wrap text cho canvas
  // Hàm wrap text theo từ thay vì theo ký tự để tránh cắt giữa từ
  function drawWrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxCharsPerLine: number, lineHeight: number) {
    // Tách dòng thủ công nếu có ký tự xuống dòng
    const paragraphs = text.split(/\r?\n/);
    for (let p = 0; p < paragraphs.length; p++) {
      let str = paragraphs[p];
      while (str.length > 0) {
        let line = '';
        let words = str.split(' ');
        
        for (let i = 0; i < words.length; i++) {
          let testLine = line + (line ? ' ' : '') + words[i];
          if (testLine.length <= maxCharsPerLine) {
            line = testLine;
          } else {
            break;
          }
        }
        
        if (line.length === 0) {
          // Nếu từ đầu tiên quá dài, cắt theo ký tự
          line = str.slice(0, maxCharsPerLine);
          str = str.slice(maxCharsPerLine);
        } else {
          // Loại bỏ phần đã vẽ khỏi chuỗi gốc
          str = str.slice(line.length + (str.startsWith(line + ' ') ? 1 : 0));
        }
        
        ctx.fillText(line, x, y);
        y += lineHeight;
      }
    }
  }

  // Tạo preview với ảnh, khung và text
  const generatePreview = async (imgSrc: string) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgUser = new window.Image();
    const imgFrame = new window.Image();
    imgUser.src = imgSrc;
    imgFrame.src = FRAME_SRC;

    await Promise.all([
      new Promise((res) => (imgUser.onload = res)),
      new Promise((res) => (imgFrame.onload = res)),
    ]);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgUser, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgFrame, 0, 0, canvas.width, canvas.height);

    // Vẽ text câu chúc lên ảnh
    if (message) {
      ctx.save();
      ctx.fillStyle = '#fff600';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      // Đảm bảo font đã load trước khi vẽ
      await document.fonts.ready;
      ctx.font = '25px Lexend, Arial, sans-serif';
      drawWrappedText(ctx, message, TEXT_X, TEXT_Y, MAX_CHARS_PER_LINE, LINE_HEIGHT);
      ctx.restore();
    }

    const url = canvas.toDataURL('image/png');
    setResultUrl(url);
  };

  // Reset form
  const handleReset = () => {
    setUserImage(null);
    setResultUrl(null);
    setMessage('');
    setEmployeeId('');
    setIsStep1Confirmed(false);
    setIsValidatingCode(false);
    setCodeError('');
  };

  // Tải và parse CSV chỉ 1 lần khi cần
  const loadCodeMessageCsv = async (): Promise<Record<string, string>> => {
    if (codeToMessageMap) return codeToMessageMap;
    const response = await fetch('/CodeMessage.csv');
    if (!response.ok) throw new Error('Không tải được CodeMessage.csv');
    const text = await response.text();
    const lines = text.split(/\r?\n/);
    const map: Record<string, string> = {};
    // Bỏ header
    for (let i = 1; i < lines.length; i++) {
      const rawLine = lines[i];
      if (!rawLine) continue;
      // Tách tại dấu phẩy đầu tiên để giữ nguyên dấu phẩy trong Message
      const firstComma = rawLine.indexOf(',');
      if (firstComma === -1) continue;
      let code = rawLine.slice(0, firstComma).trim();
      let msgRaw = rawLine.slice(firstComma + 1).trim();
      if (!code) continue;
      // Xử lý message có dấu nháy
      if (msgRaw.startsWith('"') && msgRaw.endsWith('"')) {
        msgRaw = msgRaw.slice(1, -1).replace(/""/g, '"');
      }
      map[code] = msgRaw;
    }
    setCodeToMessageMap(map);
    return map;
  };

  return (
    <div className="avatar-frame-container horizontal-layout no-bg">
      <div className="left-panel">
        <h1 className="company-title">SOTRANS GROUP</h1>
        <h2 className="celebration-title">Frame Avatar for the 50th Anniversary Celebration</h2>

        <div className="steps-container">
          {/* Bước 1: Nhập mã + Xác nhận */}
          <div className="step">
            <span className="step-number">1</span>
            <div style={{ flex: 1, display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Nhập mã nhân viên"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="message-input"
                style={{ flex: 1, maxWidth: '200px' }}
                disabled={isStep1Confirmed}
              />
              <button
                type="button"
                className={`colorful-btn confirm-btn${(!employeeId || isStep1Confirmed || isValidatingCode) ? ' disabled' : ''}`}
                  style={{ flex: 1,marginTop: '0px' }}
                  onClick={async () => {
                    if (!employeeId || isStep1Confirmed || isValidatingCode) return;
                    try {
                      setIsValidatingCode(true);
                      setCodeError('');
                      const map = await loadCodeMessageCsv();
                    const normalized = employeeId.trim();
                    if (normalized && map[normalized] !== undefined) {
                      const csvMsg = map[normalized];
                      if (csvMsg) setMessage(csvMsg);
                      setIsStep1Confirmed(true);
                    } else {
                      setCodeError('Mã không tồn tại.');
                    }
                  } catch (err) {
                    setCodeError('Không thể kiểm tra mã. Vui lòng thử lại.');
                  } finally {
                    setIsValidatingCode(false);
                  }
                }}
              >
                {isValidatingCode ? 'ĐANG KIỂM TRA...' : 'XÁC NHẬN'}
              </button>
            </div>
          </div>
          {codeError && (
            <div className="message-note red" style={{ marginTop: 4, marginLeft: 56 }}>
              {codeError}
            </div>
          )}

          {/* Bước 2: Lấy ảnh */}
          <div className="step">
            <span className="step-number">2</span>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="file-upload"
                className={`colorful-btn file-upload-label full-width-btn${userImage ? ' red' : ''}${!isStep1Confirmed ? ' disabled' : ''}`}
                style={{ width: '100%' }}
              >
                {userImage ? 'CHỌN ẢNH KHÁC' : 'LẤY ẢNH'}
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (!isStep1Confirmed) return;
                  handleImageUpload(e);
                }}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Bước 3: Nhập câu chúc */}
          <div className="step">
            <span className="step-number">3</span>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="Nhập câu chúc mừng sinh nhật"
                value={message}
                onChange={(e) => {
                  if (e.target.value.length <= 100) setMessage(e.target.value);
                }}
                className="message-input"
                maxLength={100}
                disabled={!userImage}
              />
              <div className={`message-note${message.length === 100 ? ' red' : ''}`}>Tối đa 100 ký tự</div>
            </div>
          </div>

          <div className="button-group" style={{ marginTop: 16 }}>
            <button
              className={`colorful-btn full-width-btn${(!isStep1Confirmed || !userImage || !message) ? ' disabled' : ''}`}
              style={{ marginBottom: 0 }}
              onClick={(e) => {
                if (!isStep1Confirmed || !userImage || !message) {
                  e.preventDefault();
                } else {
                  const link = document.createElement("a");
                  link.href = resultUrl as string;
                  link.download = "sotrans_50th_avatar.png";
                  link.click();
                }
              }}
            >
              TẢI ẢNH
            </button>
            <button onClick={handleReset} className="reset-btn full-width-btn" style={{ marginTop: 0 }}>
              LÀM MỚI
            </button>
          </div>
        </div>
      </div>

      <div className="right-panel">
        {resultUrl ? (
          <img
            src={resultUrl}
            alt="Avatar kết quả"
            className="preview-image"
          />
        ) : (
          <div className="result-placeholder">
            Chưa có ảnh kết quả
          </div>
        )}
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default AvatarFrame;
