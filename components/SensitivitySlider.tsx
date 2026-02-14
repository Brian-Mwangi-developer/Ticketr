'use client';

import { useState } from 'react';

export default function SensitivitySlider({ defaultValue = 0.82 }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="bg-[#1c2431]/30 p-6 rounded-3xl border border-white/5">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
            Auto-Count Sensitivity
          </h3>
          <p className="text-[10px] text-blue-500/80">
            Adjust vision AI detection threshold
          </p>
        </div>
        {/* This value now updates in real-time */}
        <span className="text-3xl font-bold text-blue-500 font-mono">
          {value.toFixed(2)}
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-2"
      />

      <div className="flex justify-between text-[8px] text-gray-500 font-black uppercase tracking-widest">
        <span>Low</span>
        <span>Precision</span>
        <span>High</span>
      </div>
    </div>
  );
}