// WeeklyMoodChart — stacked bar chart of last 7 days (light theme)
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MOODS, MOOD_HEX } from '../utils/constants';

const WeeklyMoodChart = ({ days }) => {
  const data = (days || []).map((d) => {
    const date = new Date(d.date);
    const label = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    return { day: label, ...d.byMood };
  });

  return (
    <div className="card">
      <h3 className="font-display text-lg font-semibold text-ink-700">Weekly moods</h3>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#efeee8" vertical={false} />
            <XAxis dataKey="day" stroke="#7a7565" fontSize={12} tickLine={false} />
            <YAxis stroke="#7a7565" fontSize={12} allowDecimals={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(31,29,24,0.05)' }}
              contentStyle={{
                background: 'white',
                border: '1px solid #efeee8',
                borderRadius: 12,
                color: '#1f1d18',
                boxShadow: '0 8px 24px rgba(20,18,12,0.06)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {MOODS.map((m) => (
              <Bar key={m.value} dataKey={m.value} stackId="a" fill={MOOD_HEX[m.value]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeeklyMoodChart;
