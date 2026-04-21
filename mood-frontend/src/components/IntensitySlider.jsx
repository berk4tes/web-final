// IntensitySlider — 1-10 styled range with current value badge
const IntensitySlider = ({ value, onChange }) => {
  const pct = ((value - 1) / 9) * 100;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="intensity" className="text-sm font-medium text-slate-300">
          Yoğunluk
        </label>
        <span className="rounded-full bg-purple-600/20 px-3 py-1 text-sm font-semibold text-purple-300">
          {value} / 10
        </span>
      </div>
      <input
        id="intensity"
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-purple-500"
        style={{
          background: `linear-gradient(90deg, #a855f7 0%, #a855f7 ${pct}%, #1e293b ${pct}%, #1e293b 100%)`,
        }}
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>Hafif</span>
        <span>Çok Yoğun</span>
      </div>
    </div>
  );
};

export default IntensitySlider;
