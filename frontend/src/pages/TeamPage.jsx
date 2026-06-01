import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listTeams, createTeam, listMembers, createInvitation, listInvitations, revokeInvitation } from '../api/teams';
import { Plus, Link, Copy, Trash2, Users, Shield, ChevronRight } from 'lucide-react';

const cardStyle = {
  background: 'white',
  borderRadius: 16,
  border: '1px solid var(--slate-100)',
  boxShadow: 'var(--shadow-sm)',
  overflow: 'hidden',
};

const headerStyle = {
  padding: '20px 28px',
  borderBottom: '1px solid var(--slate-100)',
};

const listItemStyle = {
  padding: '16px 28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  transition: 'background 0.15s',
};

export default function TeamPage() {
  const queryClient = useQueryClient();
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteLink, setInviteLink] = useState('');
  const [hoveredMember, setHoveredMember] = useState(null);
  const [hoveredInv, setHoveredInv] = useState(null);

  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: () => listTeams() });
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    if (teams?.data?.length && !selectedTeam) {
      setSelectedTeam(teams.data[0].id);
    }
  }, [teams]);

  const { data: members } = useQuery({ queryKey: ['members', selectedTeam], queryFn: () => listMembers(selectedTeam), enabled: !!selectedTeam });
  const { data: invitations } = useQuery({ queryKey: ['invitations', selectedTeam], queryFn: () => listInvitations(selectedTeam), enabled: !!selectedTeam });

  const createTeamMutation = useMutation({
    mutationFn: (data) => createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowCreateTeam(false);
      setNewTeamName('');
    }
  });

  const createInvitationMutation = useMutation({
    mutationFn: (data) => createInvitation(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      setInviteLink(window.location.origin + '/invite/' + data.data.code);
    }
  });

  const revokeMutation = useMutation({
    mutationFn: (id) => revokeInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    }
  });

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    alert('链接已复制！');
  };

  const roleConfig = {
    owner: { label: '拥有者', badge: 'badge-warning', icon: Shield },
    editor: { label: '编辑者', badge: 'badge-primary', icon: null },
    viewer: { label: '查看者', badge: 'badge-success', icon: null },
  };

  return (
    <div style={{ maxWidth: 1152, margin: '0 auto' }} className="animate-fade-in">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* 页面标题 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--slate-900)' }}>团队协作</h1>
            <p style={{ fontSize: 14, marginTop: 4, color: 'var(--slate-500)' }}>
              管理你的团队和成员权限
            </p>
          </div>
          <button
            onClick={() => setShowCreateTeam(true)}
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Plus style={{ width: 20, height: 20 }} />
            新建团队
          </button>
        </div>

        {/* 创建团队表单 */}
        {showCreateTeam && (
          <div className="animate-fade-in-up" style={{ ...cardStyle, padding: 28, boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--slate-800)', marginBottom: 16 }}>创建新团队</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="团队名称"
                className="input-modern"
                style={{ flex: 1, minWidth: 200 }}
                onKeyDown={(e) => e.key === 'Enter' && newTeamName && createTeamMutation.mutate({ name: newTeamName })}
              />
              <button
                onClick={() => createTeamMutation.mutate({ name: newTeamName })}
                disabled={!newTeamName || createTeamMutation.isPending}
                className="btn-primary disabled:opacity-50"
                style={{ whiteSpace: 'nowrap' }}
              >
                {createTeamMutation.isPending ? '创建中...' : '创建'}
              </button>
              <button
                onClick={() => setShowCreateTeam(false)}
                className="btn-secondary"
                style={{ whiteSpace: 'nowrap' }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 团队选择器 */}
        <div style={cardStyle}>
          <div style={{ padding: 28, borderBottom: '1px solid var(--slate-100)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--slate-800)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users style={{ width: 20, height: 20, color: 'var(--primary)' }} />
              我的团队
            </h3>
          </div>
          <div style={{ padding: 28, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {teams?.data?.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTeam(t.id)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 12,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  border: selectedTeam === t.id ? 'none' : '1px solid var(--slate-200)',
                  background: selectedTeam === t.id
                    ? 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)'
                    : 'var(--slate-50)',
                  color: selectedTeam === t.id ? 'white' : 'var(--slate-600)',
                  boxShadow: selectedTeam === t.id ? 'var(--shadow-md)' : 'none',
                }}
              >
                {t.name}
                {selectedTeam === t.id && <ChevronRight style={{ width: 16, height: 16 }} />}
              </button>
            ))}
            {!teams?.data?.length && (
              <p style={{ padding: '16px 0', color: 'var(--slate-400)' }}>
                还没有团队，创建一个开始协作吧！
              </p>
            )}
          </div>
        </div>

        {selectedTeam && (
          <>
            {/* 团队成员 */}
            <div style={cardStyle}>
              <div style={{ ...headerStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--slate-800)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users style={{ width: 20, height: 20, color: 'var(--primary)' }} />
                  团队成员
                </h3>
                <button
                  onClick={() => { setShowInvite(true); setInviteLink(''); }}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}
                >
                  <Link style={{ width: 16, height: 16 }} />
                  邀请成员
                </button>
              </div>
              <div>
                {members?.data?.map((m) => {
                  const config = roleConfig[m.role] || roleConfig.viewer;
                  const Icon = config.icon;
                  const isHovered = hoveredMember === m.id;
                  return (
                    <div
                      key={m.id}
                      style={{ ...listItemStyle, background: isHovered ? 'rgba(248,250,252,0.6)' : 'transparent' }}
                      onMouseEnter={() => setHoveredMember(m.id)}
                      onMouseLeave={() => setHoveredMember(null)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 600, fontSize: 14,
                          background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)',
                        }}>
                          {(m.user_name || 'U')[0]}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{m.user_name || '未知'}</p>
                          <p style={{ fontSize: 13, color: 'var(--slate-400)' }}>{m.user_phone}</p>
                        </div>
                      </div>
                      <span className={`badge ${config.badge}`} style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {Icon && <Icon style={{ width: 14, height: 14 }} />}
                        {config.label}
                      </span>
                    </div>
                  );
                })}
                {members?.data?.map((m, i) => i < members.data.length - 1 ? (
                  <div key={`divider-${m.id}`} style={{ borderTop: '1px solid var(--slate-100)' }} />
                ) : null)}
                {!members?.data?.length && (
                  <div style={{ padding: '48px 28px', textAlign: 'center', color: 'var(--slate-400)' }}>
                    <Users style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.5 }} />
                    <p>暂无成员</p>
                  </div>
                )}
              </div>
            </div>

            {/* 邀请列表 */}
            <div style={cardStyle}>
              <div style={headerStyle}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--slate-800)' }}>有效邀请</h3>
              </div>
              <div>
                {invitations?.data?.filter((i) => i.status === 'pending')?.map((inv) => {
                  const isHovered = hoveredInv === inv.id;
                  return (
                    <div
                      key={inv.id}
                      style={{ ...listItemStyle, background: isHovered ? 'rgba(248,250,252,0.6)' : 'transparent' }}
                      onMouseEnter={() => setHoveredInv(inv.id)}
                      onMouseLeave={() => setHoveredInv(null)}
                    >
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--slate-800)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          角色：
                          <span className={`badge ${inv.role === 'viewer' ? 'badge-success' : 'badge-primary'}`}>
                            {inv.role === 'viewer' ? '查看者' : '编辑者'}
                          </span>
                        </p>
                        <p style={{ fontSize: 13, marginTop: 4, color: 'var(--slate-400)' }}>
                          过期：{new Date(inv.expires_at).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => handleCopyLink(inv.invite_link)}
                          style={{ padding: 8, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--slate-500)', transition: 'background 0.15s' }}
                          title="复制链接"
                        >
                          <Copy style={{ width: 16, height: 16 }} />
                        </button>
                        <button
                          onClick={() => revokeMutation.mutate(inv.id)}
                          style={{ padding: 8, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--slate-400)', transition: 'background 0.15s' }}
                          title="撤销"
                        >
                          <Trash2 style={{ width: 16, height: 16 }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {!invitations?.data?.filter((i) => i.status === 'pending')?.length && (
                  <div style={{ padding: '48px 28px', textAlign: 'center', color: 'var(--slate-400)' }}>
                    <Link style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.5, display: 'block' }} />
                    <p>暂无有效邀请</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* 邀请对话框 */}
        {showInvite && (
          <div
            className="animate-fade-in"
            style={{
              position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 50, padding: 16, background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
            }}
          >
            <div className="animate-scale-in" style={{ width: '100%', maxWidth: 448, borderRadius: 16, padding: 28, background: 'white', boxShadow: 'var(--shadow-2xl)' }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--slate-800)', marginBottom: 24 }}>邀请加入团队</h3>
              {!inviteLink ? (
                <>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--slate-700)' }}>角色</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <button
                        onClick={() => setInviteRole('viewer')}
                        style={{
                          padding: 16, borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                          border: inviteRole === 'viewer' ? '2px solid var(--primary)' : '2px solid var(--slate-200)',
                          background: inviteRole === 'viewer' ? 'rgba(212, 165, 116, 0.05)' : 'white',
                          transition: 'all 0.15s',
                        }}
                      >
                        <p style={{ fontWeight: 600, color: 'var(--slate-800)' }}>查看者</p>
                        <p style={{ fontSize: 12, marginTop: 4, color: 'var(--slate-400)' }}>只读权限</p>
                      </button>
                      <button
                        onClick={() => setInviteRole('editor')}
                        style={{
                          padding: 16, borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                          border: inviteRole === 'editor' ? '2px solid var(--primary)' : '2px solid var(--slate-200)',
                          background: inviteRole === 'editor' ? 'rgba(212, 165, 116, 0.05)' : 'white',
                          transition: 'all 0.15s',
                        }}
                      >
                        <p style={{ fontWeight: 600, color: 'var(--slate-800)' }}>编辑者</p>
                        <p style={{ fontSize: 12, marginTop: 4, color: 'var(--slate-400)' }}>可编辑客户</p>
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button onClick={() => setShowInvite(false)} className="btn-secondary">取消</button>
                    <button
                      onClick={() => createInvitationMutation.mutate({ team_id: selectedTeam, role: inviteRole })}
                      disabled={createInvitationMutation.isPending}
                      className="btn-primary disabled:opacity-50"
                    >
                      {createInvitationMutation.isPending ? '生成中...' : '生成链接'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--slate-700)' }}>分享此链接</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={inviteLink} readOnly className="input-modern" style={{ flex: 1, fontSize: 13, background: 'var(--slate-50)' }} />
                      <button onClick={() => handleCopyLink(inviteLink)} className="btn-primary" style={{ padding: '0 16px' }}>
                        <Copy style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowInvite(false); setInviteLink(''); }}
                    className="btn-secondary"
                    style={{ width: '100%' }}
                  >
                    关闭
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
