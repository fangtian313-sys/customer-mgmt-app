import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { listCustomers } from '../api/customers';
import { listActivity } from '../api/activity';
import { Users, Plus, TrendingUp, Clock, ArrowRight, Sparkles } from 'lucide-react';

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default function DashboardPage() {
  const { data: customers } = useQuery({
    queryKey: ['customers-stats'],
    queryFn: () => listCustomers({ page: 1, per_page: 5 }),
  });

  const { data: allCustomers } = useQuery({
    queryKey: ['customers-all-stats'],
    queryFn: () => listCustomers({ page: 1, per_page: 100 }),
  });

  const weekNewCount = useMemo(() => {
    const items = allCustomers?.data?.items || allCustomers?.data || [];
    const weekStart = getWeekStart();
    return items.filter(c => {
      const created = new Date(c.created_at);
      // API returns UTC time, add 'Z' suffix if missing for correct parsing
      const utcCreated = c.created_at.endsWith('Z') || c.created_at.includes('+') ? created : new Date(c.created_at + 'Z');
      return utcCreated >= weekStart;
    }).length;
  }, [allCustomers]);

  const { data: activity } = useQuery({
    queryKey: ['activity-recent'],
    queryFn: () => listActivity({ page: 1, per_page: 5 }),
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* 欢迎区域 */}
      <div className="animate-fade-in" style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 10, color: 'var(--slate-900)', letterSpacing: '-0.02em' }}>
          欢迎回来 👋
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--slate-500)' }}>
          这是您的业务概览，一切运行良好
        </p>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28, marginBottom: 40 }}>
        {/* 客户总数 */}
        <div className="animate-fade-in-up stagger-1 card-hover"
             style={{ background: 'white', borderRadius: 16, padding: 32, border: '1px solid var(--slate-100)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--slate-500)' }}>客户总数</p>
              <p style={{ fontSize: 36, fontWeight: 700, color: 'var(--slate-900)', lineHeight: 1.1 }}>
                {customers?.data?.total || 0}
              </p>
            </div>
            <div style={{ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.05))' }}>
              <Users style={{ width: 26, height: 26, color: '#3b82f6' }} />
            </div>
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--slate-100)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--slate-500)' }}>
            <TrendingUp style={{ width: 16, height: 16, color: '#22c55e' }} />
            <span>持续增长中</span>
          </div>
        </div>

        {/* 本周新增 */}
        <div className="animate-fade-in-up stagger-2 card-hover"
             style={{ background: 'white', borderRadius: 16, padding: 32, border: '1px solid var(--slate-100)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--slate-500)' }}>本周新增</p>
              <p style={{ fontSize: 36, fontWeight: 700, color: 'var(--slate-900)', lineHeight: 1.1 }}>{weekNewCount}</p>
            </div>
            <div style={{ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.05))' }}>
              <TrendingUp style={{ width: 26, height: 26, color: '#22c55e' }} />
            </div>
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--slate-100)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--slate-500)' }}>
            <Sparkles style={{ width: 16, height: 16, color: 'var(--primary)' }} />
            <span>新的一周，新的开始</span>
          </div>
        </div>

        {/* 新增客户按钮 */}
        <Link to="/customers/new" className="animate-fade-in-up stagger-3 card-hover"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', boxShadow: '0 8px 24px rgba(212,165,116,0.35)', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textDecoration: 'none', color: 'white', transition: 'all 0.25s ease' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus style={{ width: 30, height: 30 }} />
          </div>
          <span style={{ fontSize: 17, fontWeight: 600 }}>新增客户</span>
          <ArrowRight style={{ width: 20, height: 20 }} />
        </Link>
      </div>

      {/* 最近客户 */}
      <div className="animate-fade-in-up stagger-4 card-hover"
           style={{ background: 'white', borderRadius: 16, border: '1px solid var(--slate-100)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', marginBottom: 28 }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--slate-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--slate-800)' }}>最近客户</h3>
          <Link to="/customers" style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            查看全部 <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
        <div>
          {customers?.data?.items?.map((c, i) => (
            <Link key={c.id} to={`/customers/${c.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 32px', textDecoration: 'none', borderBottom: i < customers.data.items.length - 1 ? '1px solid var(--slate-100)' : 'none', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--slate-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 17, flexShrink: 0, background: 'linear-gradient(135deg, var(--primary-light), var(--primary))', color: 'white' }}>
                {c.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: 'var(--slate-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                <p style={{ fontSize: 13, color: 'var(--slate-500)' }}>{c.company || '暂无公司'}</p>
              </div>
              <div style={{ fontSize: 13, color: 'var(--slate-400)' }}>{c.phone || c.email}</div>
            </Link>
          ))}
          {!customers?.data?.items?.length && (
            <div style={{ padding: '60px 32px', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--slate-50)' }}>
                <Users style={{ width: 28, height: 28, color: 'var(--slate-300)' }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: 'var(--slate-600)' }}>还没有客户</p>
              <p style={{ fontSize: 13, marginBottom: 16, color: 'var(--slate-400)' }}>添加您的第一个客户开始使用</p>
              <Link to="/customers/new" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <Plus style={{ width: 16, height: 16 }} /> 添加客户
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 最近操作 */}
      <div className="animate-fade-in-up card-hover"
           style={{ background: 'white', borderRadius: 16, border: '1px solid var(--slate-100)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--slate-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--slate-800)' }}>
            <Clock style={{ width: 18, height: 18, color: 'var(--primary)' }} /> 最近操作
          </h3>
          <Link to="/activity" style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            查看全部 <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
        <div>
          {activity?.data?.items?.map((a, i) => (
            <div key={a.id}
                 style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < activity.data.items.length - 1 ? '1px solid var(--slate-100)' : 'none', transition: 'background 0.2s' }}
                 onMouseEnter={e => e.currentTarget.style.background = 'var(--slate-50)'}
                 onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span className={`badge ${a.action === 'created' ? 'badge-success' : a.action === 'updated' ? 'badge-primary' : 'badge-danger'}`}>
                {a.action === 'created' ? '创建' : a.action === 'updated' ? '更新' : '删除'}
              </span>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--slate-700)' }}>{a.user_name}</span>
              <span style={{ fontSize: 14, color: 'var(--slate-500)' }}>了 {a.entity_type}</span>
              <span style={{ fontSize: 12, marginLeft: 'auto', color: 'var(--slate-400)' }}>{new Date(a.created_at).toLocaleString('zh-CN')}</span>
            </div>
          ))}
          {!activity?.data?.items?.length && (
            <div style={{ padding: '60px 32px', textAlign: 'center', color: 'var(--slate-400)' }}>
              <Clock style={{ width: 44, height: 44, margin: '0 auto 12px', opacity: 0.4 }} />
              <p>暂无操作记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
