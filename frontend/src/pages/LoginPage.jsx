import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { Shield, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!phone || phone.length < 7) {
      setError('请输入有效的手机号');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.post('/auth/login', {
        phone,
        name: name || undefined,
      });
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((e) => e.msg).join('；'));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('登录失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      
      {/* 装饰性元素 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20" 
             style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15" 
             style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10" 
             style={{ background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 60%)' }} />
      </div>

      {/* 网格纹理 */}
      <div className="absolute inset-0 opacity-[0.03]" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
             backgroundSize: '60px 60px' 
           }} />

      {/* 登录卡片 */}
      <div className="relative w-full max-w-md animate-scale-in">
        {/* 顶部品牌标识 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
               style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' }}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">客户管理系统</h1>
          <p className="text-slate-400 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            安全 · 高效 · 智能
          </p>
        </div>

        {/* 玻璃态卡片 */}
        <div className="glass-effect rounded-2xl p-8 shadow-2xl backdrop-blur-xl"
             style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
          {error && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-3 animate-fade-in"
                 style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--danger)' }}>
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">手机号</label>
              <input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={handleKeyDown}
                className="input-modern"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                姓名 <span className="text-slate-400 font-normal">（新用户可选）</span>
              </label>
              <input
                type="text"
                placeholder="你的姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="input-modern"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 mt-6 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  登录中...
                </span>
              ) : (
                <>
                  登录
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-center text-slate-500">
              首次登录将自动创建账户
            </p>
          </div>
        </div>

        {/* 底部版权 */}
        <p className="text-center text-slate-500 text-xs mt-8">
          © 2026 Customer Management Platform
        </p>
      </div>
    </div>
  );
}
