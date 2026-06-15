import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  showValue?: boolean;
}

export const QRCodeDisplay = ({ value, size = 160, showValue = true }: QRCodeDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-xl">
      <div className="p-4 bg-white rounded-xl shadow-sm">
        <QRCodeSVG value={value} size={size} level="H" includeMargin />
      </div>
      {showValue && (
        <div className="flex items-center gap-2 w-full max-w-xs">
          <code className="flex-1 px-3 py-2 bg-white rounded-lg text-sm text-gray-600 font-mono truncate">
            {value}
          </code>
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            title="复制预约码"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <Copy className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
