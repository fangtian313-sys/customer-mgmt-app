import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomer, deleteCustomer, listCustomers } from '../api/customers';
import { listActivity } from '../api/activity';
import { listRelations, createRelation, deleteRelation } from '../api/relations';
import { ArrowLeft, Edit, Trash2, Mail, Phone, Building, Globe, MapPin, Clock, Tag, Link2, Plus, X } from 'lucide-react';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddRelation, setShowAddRelation] = useState(false);
  const [relTarget, setRelTarget] = useState('');
  const [relType, setRelType] = useState('');
  const [relStrength, setRelStrength] = useState(3);

  const { data, isLoading } = useQuery({ queryKey: ['customer', id], queryFn: () => getCustomer(id) });
  const { data: activity } = useQuery({ queryKey: ['customer-activity', id], queryFn: () => listActivity({ entity_type: 'customer', entity_id: parseInt(id), page: 1, per_page: 10 }) });
  const { data: relationsData } = useQuery({ queryKey: ['relations', id], queryFn: () => listRelations(parseInt(id)) });
  const { data: allCustomers } = useQuery({ queryKey: ['customers-all'], queryFn: () => listCustomers({ per_page: 100 }) });

  const relations = relationsData?.data?.items || relationsData?.data || [];
  const customers = allCustomers?.data?.items || allCustomers?.data || [];
  const otherCustomers = customers.filter((c) => String(c.id) !== String(id));

  const relationTypes = ['转介绍', '合作伙伴', '同行业', '投资关系', '朋友', '供应商', '客户', '竞争对手', '亲属', '同事'];
  const relationColors = { '转介绍': '#d4a574', '合作伙伴': '#3b82f6', '同行业': '#22c55e', '投资关系': '#f59e0b', '朋友': '#a78bfa', '供应商': '#06b6d4', '客户': '#ec4899', '竞争对手': '#ef4444', '亲属': '#f97316', '同事': '#14b8a6' };

  const createRelMutation = useMutation({
    mutationFn: (data) => createRelation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relations'] });
      queryClient.invalidateQueries({ queryKey: ['relations-all'] });
      setShowAddRelation(false);
      setRelTarget('');
      setRelType('');
    },
  });

  const deleteRelMutation = useMutation({
    mutationFn: (relId) => deleteRelation(relId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relations'] });
      queryClient.invalidateQueries({ queryKey: ['relations-all'] });
    },
  });

  const handleAddRelation = () => {
    if (!relTarget || !relType.trim()) return;
    createRelMutation.mutate({
      source_id: parseInt(id),
      target_id: parseInt(relTarget),
      relation_type: relType,
      strength: relStrength,
    });
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个客户吗？')) return;
    await deleteCustomer(id);
    navigate('/customers');
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--slate-200)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );
  if (!data?.data) return (
    <div style={{ textAlign: 'center', padding: '64px 0' }}>
      <p style={{ fontSize: 17, color: 'var(--slate-500)' }}>客户不存在</p>
      <Link to="/customers" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16, textDecoration: 'none' }}>
        <ArrowLeft style={{ width: 16, height: 16 }} /> 返回列表
      </Link>
    </div>
  );

  const c = data.data;
  const cardStyle = { background: 'white', borderRadius: 16, border: '1px solid var(--slate-100)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' };
  const headerStyle = { padding: '20px 28px', borderBottom: '1px solid var(--slate-100)' };
  const bodyStyle = { padding: 28 };
  const infoItem = { display: 'flex', alignItems: 'flex-start', gap: 14, padding: 16, borderRadius: 12, transition: 'background 0.2s' };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* 顶部操作栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <Link to="/customers" style={{ padding: 10, borderRadius: 12, color: 'var(--slate-600)', textDecoration: 'none', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'white'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <ArrowLeft style={{ width: 20, height: 20 }} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--slate-900)' }}>{c.name}</h1>
          {c.company && (
            <p style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: 'var(--slate-500)' }}>
              <Building style={{ width: 14, height: 14 }} /> {c.company}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to={`/customers/${c.id}/edit`} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Edit style={{ width: 16, height: 16 }} /> 编辑
          </Link>
          <button onClick={handleDelete}
                  style={{ padding: '10px 18px', border: '1px solid #fecaca', color: 'var(--danger)', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 500, cursor: 'pointer', background: 'white', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-light)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
            <Trash2 style={{ width: 16, height: 16 }} /> 删除
          </button>
        </div>
      </div>

      {/* 基本信息 */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={headerStyle}>
          <h2 style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--slate-800)' }}>
            <Building style={{ width: 18, height: 18, color: 'var(--primary)' }} /> 基本信息
          </h2>
        </div>
        <div style={bodyStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {c.phone && (
              <div style={infoItem} onMouseEnter={e => e.currentTarget.style.background = 'var(--slate-50)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(34,197,94,0.1)' }}>
                  <Phone style={{ width: 20, height: 20, color: '#22c55e' }} />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, color: 'var(--slate-400)' }}>电话</p>
                  <p style={{ fontWeight: 500, color: 'var(--slate-800)' }}>{c.phone}</p>
                </div>
              </div>
            )}
            {c.email && (
              <div style={infoItem} onMouseEnter={e => e.currentTarget.style.background = 'var(--slate-50)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(59,130,246,0.1)' }}>
                  <Mail style={{ width: 20, height: 20, color: '#3b82f6' }} />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, color: 'var(--slate-400)' }}>邮箱</p>
                  <p style={{ fontWeight: 500, color: 'var(--slate-800)' }}>{c.email}</p>
                </div>
              </div>
            )}
            {c.website && (
              <div style={infoItem} onMouseEnter={e => e.currentTarget.style.background = 'var(--slate-50)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(139,92,246,0.1)' }}>
                  <Globe style={{ width: 20, height: 20, color: '#8b5cf6' }} />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, color: 'var(--slate-400)' }}>网站</p>
                  <a href={c.website} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 500, color: 'var(--primary-dark)' }}>{c.website}</a>
                </div>
              </div>
            )}
            {c.address && (
              <div style={{ ...infoItem, gridColumn: 'span 2' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--slate-50)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(239,68,68,0.1)' }}>
                  <MapPin style={{ width: 20, height: 20, color: '#ef4444' }} />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, color: 'var(--slate-400)' }}>地址</p>
                  <p style={{ fontWeight: 500, color: 'var(--slate-800)' }}>{c.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 标签 */}
      {c.tags?.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <div style={headerStyle}>
            <h2 style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--slate-800)' }}>
              <Tag style={{ width: 18, height: 18, color: 'var(--primary)' }} /> 标签
            </h2>
          </div>
          <div style={{ ...bodyStyle, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {c.tags.map((tag, i) => (
              <span key={i} className="badge badge-primary" style={{ padding: '6px 14px' }}>{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* 备注 */}
      {c.notes && (
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <div style={headerStyle}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--slate-800)' }}>备注</h2>
          </div>
          <div style={bodyStyle}>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--slate-600)', whiteSpace: 'pre-wrap' }}>{c.notes}</p>
          </div>
        </div>
      )}

      {/* 客户关系 */}
      <div style={cardStyle}>
        <div style={{ ...headerStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--slate-800)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link2 style={{ width: 18, height: 18, color: 'var(--primary)' }} /> 客户关系
          </h2>
          <button
            onClick={() => setShowAddRelation(!showAddRelation)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid var(--slate-200)', background: showAddRelation ? 'var(--slate-100)' : 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--slate-600)', transition: 'all 0.15s' }}
          >
            {showAddRelation ? <X style={{ width: 14, height: 14 }} /> : <Plus style={{ width: 14, height: 14 }} />}
            {showAddRelation ? '取消' : '添加关系'}
          </button>
        </div>

        {/* 添加关系表单 */}
        {showAddRelation && (
          <div className="animate-fade-in" style={{ padding: '16px 28px', borderBottom: '1px solid var(--slate-100)', background: 'var(--slate-50)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--slate-500)', marginBottom: 4 }}>关联客户</label>
                <select value={relTarget} onChange={(e) => setRelTarget(e.target.value)} className="input-modern" style={{ padding: '10px 14px' }}>
                  <option value="">选择客户...</option>
                  {otherCustomers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.company ? ` @ ${c.company}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--slate-500)', marginBottom: 4 }}>关系类型</label>
                <input
                  list="relation-type-list"
                  value={relType}
                  onChange={(e) => setRelType(e.target.value)}
                  placeholder="输入或选择..."
                  className="input-modern"
                  style={{ padding: '10px 14px', minWidth: 140 }}
                />
                <datalist id="relation-type-list">
                  {relationTypes.map((t) => <option key={t} value={t} />)}
                </datalist>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--slate-500)', marginBottom: 4 }}>强度 ({relStrength})</label>
                <input type="range" min={1} max={5} value={relStrength} onChange={(e) => setRelStrength(Number(e.target.value))} style={{ width: 100, accentColor: 'var(--primary)' }} />
              </div>
              <button onClick={handleAddRelation} disabled={!relTarget || !relType.trim() || createRelMutation.isPending} className="btn-primary disabled:opacity-50" style={{ padding: '10px 20px', fontSize: 13 }}>
                {createRelMutation.isPending ? '添加中...' : '添加'}
              </button>
            </div>
          </div>
        )}

        {/* 关系列表 */}
        <div>
          {relations.map((r) => {
            const isSource = String(r.source_id) === String(id);
            const otherName = isSource ? r.target_name : r.source_name;
            const otherId = isSource ? r.target_id : r.source_id;
            const direction = isSource ? '→' : '←';
            const color = relationColors[r.relation_type] || '#8b93a3';
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px', borderBottom: '1px solid var(--slate-100)', transition: 'background 0.15s' }}
                   onMouseEnter={(e) => e.currentTarget.style.background = 'var(--slate-50)'}
                   onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 4, height: 28, borderRadius: 2, background: color }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, color: 'var(--slate-700)' }}>{direction}</span>
                      <Link to={`/customers/${otherId}`} style={{ fontWeight: 600, color: 'var(--primary-dark)', textDecoration: 'none', fontSize: 14 }}>{otherName}</Link>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: `${color}18`, color, fontWeight: 600 }}>{r.relation_type}</span>
                      <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>强度 {'●'.repeat(r.strength)}{'○'.repeat(5 - r.strength)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteRelMutation.mutate(r.id)}
                  style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--slate-400)', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-light)'; e.currentTarget.style.color = 'var(--danger)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--slate-400)'; }}
                >
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
            );
          })}
          {!relations.length && (
            <div style={{ padding: '36px 28px', textAlign: 'center', color: 'var(--slate-400)' }}>
              <Link2 style={{ width: 36, height: 36, margin: '0 auto 10px', opacity: 0.4, display: 'block' }} />
              <p style={{ fontSize: 14 }}>暂无关联客户</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>点击"添加关系"建立客户间的关联</p>
            </div>
          )}
        </div>
      </div>

      {/* 操作记录 */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--slate-500)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock style={{ width: 16, height: 16, opacity: 0.7 }} /> 操作记录
        </h3>
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          {/* 时间轴竖线 */}
          <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 1, background: 'var(--slate-200)' }} />
          {activity?.data?.items?.map((a, i) => {
            const fieldName = { name: '姓名', company: '公司', phone: '电话', email: '邮箱', tags: '标签', notes: '备注', address: '地址', website: '网站', team_id: '团队' };
            let detailEl = null;
            try {
              const d = a.details ? JSON.parse(a.details) : null;
              if (d?.changes) {
                const items = Object.entries(d.changes).map(([k, v]) => (
                  <span key={k} style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                    {fieldName[k] || k}：<span style={{ textDecoration: 'line-through', color: 'var(--slate-400)' }}>{v.old === 'None' ? '空' : v.old}</span> → <span style={{ color: 'var(--slate-700)', fontWeight: 500 }}>{v.new === 'None' ? '空' : v.new}</span>
                  </span>
                ));
                detailEl = <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}>{items}</div>;
              } else if (d?.fields) {
                const items = Object.entries(d.fields).map(([k, v]) => (
                  <span key={k} style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                    {fieldName[k] || k}：<span style={{ color: 'var(--slate-700)', fontWeight: 500 }}>{v}</span>
                  </span>
                ));
                detailEl = <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}>{items}</div>;
              }
            } catch {}
            const dotColor = a.action === 'created' ? '#22c55e' : a.action === 'updated' ? '#3b82f6' : '#ef4444';
            return (
              <div key={a.id} style={{ position: 'relative', paddingBottom: 24, transition: 'opacity 0.15s' }}>
                {/* 时间轴圆点 */}
                <div style={{ position: 'absolute', left: -24, top: 4, width: 14, height: 14, borderRadius: '50%', background: 'white', border: `2.5px solid ${dotColor}`, zIndex: 1 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--slate-700)' }}>{a.user_name}</span>
                  <span className={`badge ${a.action === 'created' ? 'badge-success' : a.action === 'updated' ? 'badge-primary' : 'badge-danger'}`} style={{ fontSize: 11, padding: '2px 8px' }}>
                    {a.action === 'created' ? '创建' : a.action === 'updated' ? '更新' : '删除'}
                  </span>
                  <span style={{ fontSize: 12, marginLeft: 'auto', color: 'var(--slate-400)' }}>{new Date(a.created_at).toLocaleString('zh-CN')}</span>
                </div>
                {detailEl}
              </div>
            );
          })}
          {!activity?.data?.items?.length && (
            <div style={{ padding: '24px 0', color: 'var(--slate-400)', fontSize: 14 }}>暂无操作记录</div>
          )}
        </div>
      </div>
    </div>
  );
}
