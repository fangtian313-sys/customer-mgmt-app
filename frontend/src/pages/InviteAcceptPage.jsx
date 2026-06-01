import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvitationInfo, acceptInvitation } from '../api/teams';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Loader, Users, ArrowRight, Shield } from 'lucide-react';

export default function InviteAcceptPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  const { data: inviteInfo, isLoading, isError } = useQuery({
    queryKey: ['invite', code],
    queryFn: () => getInvitationInfo(code)
  });

  const acceptMutation = useMutation({
    mutationFn: () => acceptInvitation(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      navigate('/');
    },
    onError: (err) => {
      setError(err.response?.data?.detail || '接受邀请失败');
    }
  });

  const handleAccept = async () => {
    if (!user) {
      localStorage.setItem('invite_code', code);
      navigate('/login');
      return;
    }
    setAccepting(true);
    setError('');
    acceptMutation.mutate();
  };

  if (isLoading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--warm-bg)', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '3px solid var(--slate-200)', borderTopColor: 'var(--primary)',
          margin: '0 auto 16px', animation: 'spin 1s linear infinite',
        }} />
        <p style={{ fontWeight: 500, color: 'var(--slate-600)' }}>加载中...</p>
      </div>
    </div>
  );

  if (isError) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--warm-bg)' }} />
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: -160, right: -160, width: 320, height: 320,
          borderRadius: '50%', opacity: 0.2,
          background: 'radial-gradient(circle, var(--danger) 0%, transparent 70%)',
        }} />
      </div>

      <div className="animate-scale-in" style={{ position: 'relative', width: '100%', maxWidth: 448 }}>
        <div style={{ borderRadius: 16, padding: 32, background: 'white', boxShadow: 'var(--shadow-2xl)', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--danger-light)',
          }}>
            <XCircle style={{ width: 48, height: 48, color: 'var(--danger)' }} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: 'var(--slate-900)' }}>邀请无效</h2>
          <p style={{ fontSize: 16, marginBottom: 24, color: 'var(--slate-500)' }}>
            该邀请链接无效、已过期或已被使用。
          </p>
          <button onClick={() => navigate('/login')} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            去登录
            <ArrowRight style={{ width: 20, height: 20 }} />
          </button>
        </div>
      </div>
    </div>
  );

  const roleConfig = {
    viewer: { label: '查看者', desc: '只读权限', badge: 'badge-success' },
    editor: { label: '编辑者', desc: '可编辑客户', badge: 'badge-primary' },
  };

  const role = roleConfig[inviteInfo.data?.role] || roleConfig.viewer;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, position: 'relative', overflow: 'hidden',
    }}>
      {/* 背景 */}
      <div style={{ position: 'absolute', inset: 0, background: 'var(--warm-bg)' }} />
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: -160, right: -160, width: 320, height: 320,
          borderRadius: '50%', opacity: 0.2,
          background: 'radial-gradient(circle, var(--success) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: -160, left: -160, width: 384, height: 384,
          borderRadius: '50%', opacity: 0.15,
          background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
        }} />
      </div>

      <div className="animate-scale-in" style={{ position: 'relative', width: '100%', maxWidth: 448 }}>
        {/* 顶部图标 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 80, height: 80, borderRadius: 16, marginBottom: 16,
            boxShadow: 'var(--shadow-lg)',
            background: 'linear-gradient(135deg, var(--success) 0%, #27ae60 100%)',
          }}>
            <CheckCircle style={{ width: 40, height: 40, color: 'white' }} />
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 700, marginBottom: 8, color: 'var(--slate-900)' }}>你收到一个邀请！</h1>
        </div>

        {/* 邀请详情卡片 */}
        <div style={{ borderRadius: 16, padding: 28, background: 'white', boxShadow: 'var(--shadow-2xl)', marginBottom: 24 }}>
          {/* 邀请人信息 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: 16,
            borderRadius: 12, marginBottom: 16, background: 'var(--slate-50)',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700,
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            }}>
              {inviteInfo.data?.inviter_name?.[0] || 'I'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                {inviteInfo.data?.inviter_name}
              </p>
              <p style={{ fontSize: 14, color: 'var(--slate-500)' }}>邀请你加入</p>
            </div>
          </div>

          {/* 团队信息 */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 16, borderRadius: 12, border: '2px dashed var(--slate-200)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(212, 165, 116, 0.1)',
              }}>
                <Users style={{ width: 20, height: 20, color: 'var(--primary)' }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                  {inviteInfo.data?.team_name}
                </p>
                <p style={{ fontSize: 12, color: 'var(--slate-400)' }}>团队</p>
              </div>
            </div>
            <span className={`badge ${role.badge}`} style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Shield style={{ width: 14, height: 14 }} />
              {role.label}
            </span>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="animate-fade-in" style={{
              marginTop: 16, padding: 12, borderRadius: 12,
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--danger-light)', color: 'var(--danger)',
            }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* 操作按钮 */}
          <div style={{ marginTop: 24 }}>
            {accepting ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '12px 0' }}>
                <Loader style={{ width: 20, height: 20, animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
                <span style={{ fontWeight: 500, color: 'var(--slate-600)' }}>加入中...</span>
              </div>
            ) : (
              <button onClick={handleAccept} className="btn-primary" style={{ width: '100%', fontSize: 16 }}>
                {user ? '接受并加入' : '登录后接受'}
              </button>
            )}
          </div>
        </div>

        {/* 稍后再说 */}
        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 12, fontWeight: 500,
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: 'var(--slate-500)', transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          稍后再说
        </button>
      </div>
    </div>
  );
}
