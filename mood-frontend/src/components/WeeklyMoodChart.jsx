// WeeklyMoodChart — stacked bar chart of mood entries over the last 7 days
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
    const label = date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' });
    return { day: label, ...d.byMood };
  });

  return (
    <div className="card">
      <h3 className="mb-4 text-base font-semibold text-white">Haftalık Mood Dağılımı</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: '#1e293b66' }}
              contentStyle={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 12,
                color: '#e2e8f0',
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
