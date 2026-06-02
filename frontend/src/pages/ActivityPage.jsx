import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listActivity } from '../api/activity';
import { listTeams } from '../api/teams';
import { Filter, Clock, History } from 'lucide-react';

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

export default function ActivityPage() {
  const [teamId, setTeamId] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);

  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: () => listTeams() });
  const { data, isLoading } = useQuery({
    queryKey: ['activity', page, teamId, entityType],
    queryFn: () => listActivity({ team_id: teamId || undefined, entity_type: entityType || undefined, page, per_page: 30 }),
  });

  const actionConfig = {
    created: { label: '创建', badge: 'badge-success', color: '#22c55e' },
    updated: { label: '更新', badge: 'badge-primary', color: '#3b82f6' },
    deleted: { label: '删除', badge: 'badge-danger', color: '#ef4444' },
  };

  const entityLabel = {
    customer: '客户',
    team: '团队',
    invitation: '邀请',
  };

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto' }} className="animate-fade-in">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* 页面标题 */}
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--slate-900)' }}>操作日志</h1>
          <p style={{ fontSize: 14, marginTop: 4, color: 'var(--slate-500)' }}>
            查看所有操作记录和变更历史
          </p>
        </div>

        {/* 筛选栏 */}
        <div style={{ ...cardStyle, padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <select
                value={teamId}
                onChange={(e) => { setTeamId(e.target.value); setPage(1); }}
                className="input-modern"
                style={{ appearance: 'none', paddingRight: 40, cursor: 'pointer', width: '100%' }}
              >
                <option value="">全部团队</option>
                {teams?.data?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <Filter style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, pointerEvents: 'none', color: 'var(--slate-400)' }} />
            </div>
            <select
              value={entityType}
              onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
              className="input-modern"
              style={{ cursor: 'pointer' }}
            >
              <option value="">全部类型</option>
              <option value="customer">客户</option>
              <option value="team">团队</option>
              <option value="invitation">邀请</option>
            </select>
          </div>
        </div>

        {/* 日志列表 */}
        <div style={cardStyle}>
          <div style={{ ...headerStyle, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(212, 165, 116, 0.1)',
            }}>
              <History style={{ width: 20, height: 20, color: 'var(--primary)' }} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 18, color: 'var(--slate-800)' }}>操作记录</h3>
          </div>
          <div>
            {data?.data?.items?.map((a) => {
              const config = actionConfig[a.action] || actionConfig.updated;
              let description = '';
              try {
                const details = a.details ? JSON.parse(a.details) : null;
                if (details?.description) {
                  description = details.description;
                } else if (details?.fields?.name) {
                  description = `创建客户：${details.fields.name}`;
                } else if (details?.changes) {
                  const changedFields = Object.keys(details.changes);
                  if (changedFields.length) {
                    description = `更新了${changedFields.length}个字段`;
                  }
                }
              } catch (e) { /* ignore parse error */ }
              return (
                <div key={a.id} style={{ padding: '16px 28px', display: 'flex', alignItems: 'flex-start', gap: 16, borderBottom: '1px solid var(--slate-100)', transition: 'background 0.15s' }}
                     onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(248,250,252,0.6)'}
                     onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 10, flexShrink: 0, background: config.color }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{a.user_name}</span>
                      <span className={`badge ${config.badge}`}>{config.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--slate-700)' }}>
                        {description || entityLabel[a.entity_type] || a.entity_type}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--slate-400)' }}>
                      <Clock style={{ width: 14, height: 14 }} />
                      {new Date(a.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              );
            })}
            {!data?.data?.items?.length && !isLoading && (
              <div style={{ padding: '64px 28px', textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--slate-50)',
                }}>
                  <History style={{ width: 32, height: 32, color: 'var(--slate-300)' }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: 'var(--slate-600)' }}>暂无记录</p>
                <p style={{ fontSize: 14, color: 'var(--slate-400)' }}>操作记录将在这里显示</p>
              </div>
            )}
            {isLoading && (
              <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  border: '2px solid var(--slate-300)', borderTopColor: 'var(--primary)',
                  margin: '0 auto 12px', animation: 'spin 1s linear infinite',
                }} />
                <p>加载中...</p>
              </div>
            )}
          </div>

          {data?.data?.total > 30 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 28px', borderTop: '1px solid var(--slate-100)', background: 'var(--slate-50)',
            }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--slate-500)' }}>
                共 {data.data.total} 条
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  style={{
                    padding: '8px 16px', border: '1px solid var(--slate-200)', borderRadius: 8,
                    fontSize: 14, fontWeight: 500, background: 'white', cursor: page === 1 ? 'default' : 'pointer',
                    opacity: page === 1 ? 0.5 : 1, color: 'var(--slate-600)', transition: 'background 0.15s',
                  }}
                >
                  上一页
                </button>
                <button
                  disabled={page * 30 >= data?.data?.total}
                  onClick={() => setPage((p) => p + 1)}
                  style={{
                    padding: '8px 16px', border: '1px solid var(--slate-200)', borderRadius: 8,
                    fontSize: 14, fontWeight: 500, background: 'white', cursor: page * 30 >= data?.data?.total ? 'default' : 'pointer',
                    opacity: page * 30 >= data?.data?.total ? 0.5 : 1, color: 'var(--slate-600)', transition: 'background 0.15s',
                  }}
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
