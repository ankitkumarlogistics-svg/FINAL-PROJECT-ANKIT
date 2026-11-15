import React from 'react';

interface JapaneseSealProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const JapaneseSeal: React.FC<JapaneseSealProps> = ({
  size = 'md',
  text = '横浜トレーディング株式会社印',
  className = '',
}) => {
  const dimension = size === 'sm' ? 44 : size === 'lg' ? 68 : 56;

  return (
    <div
      className={`inline-flex items-center justify-center select-none pointer-events-none transform -rotate-2 ${className}`}
      title={text}
      style={{ width: dimension, height: dimension }}
    >
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-red-700 filter drop-shadow-xs"
      >
        {/* Outer square border */}
        <rect
          x="3"
          y="3"
          width="94"
          height="94"
          rx="6"
          stroke="#b91c1c"
          strokeWidth="3.5"
          fill="#fef2f2"
          fillOpacity="0.85"
        />
        {/* Inner thin square border */}
        <rect
          x="8"
          y="8"
          width="84"
          height="84"
          rx="4"
          stroke="#b91c1c"
          strokeWidth="1.2"
          strokeDasharray="999"
        />

        {/* 3 columns of Kanji / Katakana for "横浜トレーディング株式会社印" */}
        {/* Right column */}
        <g fill="#b91c1c" fontFamily="'Noto Serif JP', 'Yu Mincho', serif" fontWeight="800" fontSize="16" textAnchor="middle">
          <text x="75" y="27">横</text>
          <text x="75" y="47">浜</text>
          <text x="75" y="67">ト</text>
          <text x="75" y="87">レ</text>
        </g>

        {/* Middle column */}
        <g fill="#b91c1c" fontFamily="'Noto Serif JP', 'Yu Mincho', serif" fontWeight="800" fontSize="15" textAnchor="middle">
          <text x="50" y="27">ー</text>
          <text x="50" y="47">ディ</text>
          <text x="50" y="67">ング</text>
          <text x="50" y="87">株</text>
        </g>

        {/* Left column */}
        <g fill="#b91c1c" fontFamily="'Noto Serif JP', 'Yu Mincho', serif" fontWeight="800" fontSize="16" textAnchor="middle">
          <text x="25" y="27">式</text>
          <text x="25" y="47">会</text>
          <text x="25" y="67">社</text>
          <text x="25" y="87">印</text>
        </g>
      </svg>
    </div>
  );
};
