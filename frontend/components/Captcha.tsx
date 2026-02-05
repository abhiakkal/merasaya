import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

interface CaptchaProps {
  onVerify: (token: string) => void;
}

export default function Captcha({ onVerify }: CaptchaProps) {
  const [captchaImage, setCaptchaImage] = useState<string>('');
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const { get } = useApi();

  const fetchCaptcha = async () => {
    const data = await get<{ image: string; token: string }>('/auth/captcha');
    if (data) {
      setCaptchaImage(data.image);
      setCaptchaToken(data.token);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleVerify = () => {
    if (userInput) {
      onVerify(captchaToken + ':' + userInput);
    }
  };

  return (
    <div className="captcha-container">
      {captchaImage && (
        <img 
          src={`data:image/png;base64,${captchaImage}`} 
          alt="CAPTCHA" 
          className="captcha-image"
        />
      )}
      <div className="captcha-input-group">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter CAPTCHA"
          className="input"
          onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
        />
        <button 
          type="button" 
          onClick={fetchCaptcha} 
          className="btn-icon"
          title="Refresh CAPTCHA"
        >
          ↻
        </button>
      </div>
    </div>
  );
}