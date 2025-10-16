# ไฟล์ Spotify.js ใช้ clientId และ redirectUri จาก .env <br>
สามารถลงทะเบียนรหัสของคุณเองได้ที่ https://developer.spotify.com/

## วิธีใช้งาน
1. `npm install`
2. สร้างไฟล์ `.env` แล้วเพิ่ม:
    REACT_APP_SPOTIFY_CLIENT_ID=เลขที่ได้จากการสมัคร
    REACT_APP_SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000(ต้องตรงกับที่ระบุใน SpotifyDev)
3. รันโปรเจกต์ด้วย `npm start`

# 🎵 Jamming (Spotify Playlist App)

โปรเจกต์นี้พัฒนาเพื่อฝึกเชื่อมต่อ API จริงของ Spotify  
โดยใช้ React และ OAuth2 PKCE Flow  
เป็นส่วนหนึ่งของการเรียน Codecademy Full-Stack Developer

## จุดประสงค์
ฝึกทำงานกับ REST API, token-based authentication และ React state management  
รวมถึงเข้าใจการทำงานของ OAuth2 PKCE Flow ตั้งแต่การขอสิทธิ์จนถึงการรีเฟรช Token

## สิ่งที่ทำได้
- ค้นหาเพลงจาก Spotify
- เพิ่มเพลงเข้า Playlist
- บันทึก Playlist ไปยังบัญชีผู้ใช้
- ใช้ PKCE เพื่อเพิ่มความปลอดภัยในการรับ Access Token
- ปุ่มแสดงตัวอย่างเพลงให้ฟัง (ถ้าตัวเพลงมี preview_url ขณะดึงข้อมูล)

## สิ่งที่ได้เรียนรู้
- การจัดการ state ระหว่าง component หลายตัวใน React
- การควบคุม flow ของ async/await
- การใช้ useEffect และ useCallback อย่างเหมาะสม
- การดีบักปัญหา authentication กับ API จริง

*(ขอขอบคุณ ChatGPT ที่ช่วยอธิบายหลักการ PKCE และโครงสร้างของโปรแกรมในระหว่างการศึกษา)*  

## License
MIT License  
© 2025 IK-MEE  
*(Developed as a learning project with guidance from ChatGPT)*  