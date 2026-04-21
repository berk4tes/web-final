// RegisterPage — username/email/password + confirm registration
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/mood" replace />;
  }

  const validate = () => {
    const e = {};
    if (form.username.trim().length < 3) e.username = 'Kullanıcı adı en az 3 karakter';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Geçerli bir email gir';
    if (form.password.length < 6) e.password = 'Şifre en az 6 karakter olmalı';
    if (form.password !== form.confirm) e.confirm = 'Şifreler eşleşmiyor';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register(form.username.trim(), form.email, form.password);
      toast.success('Hesap oluşturuldu!');
      navigate('/mood', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Kayıt başarısız oldu';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12">
      <div className="card w-full animate-slide-up">
        <h1 className="text-2xl font-bold text-white">Hesap Oluştur</h1>
        <p className="mt-1 text-sm text-slate-400">Mood'una uygun film, dizi ve müzik önerileri için kayıt ol.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-300">
              Kullanıcı Adı
            </label>
            <input
              id="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="input"
              placeholder="moodlover"
            />
            {errors.username && <p className="mt-1 text-xs text-red-400">{errors.username}</p>}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              placeholder="ornek@mail.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-300">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              placeholder="En az 6 karakter"
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-slate-300">
              Şifre (Tekrar)
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className="input"
            />
            {errors.confirm && <p className="mt-1 text-xs text-red-400">{errors.confirm}</p>}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Zaten hesabın var mı?{' '}
          <Link to="/login" className="font-medium text-purple-300 hover:text-purple-200">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
