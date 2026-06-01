import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCustomer, createCustomer, updateCustomer, listCustomers } from '../api/customers';
import { listTeams } from '../api/teams';
import { listRelations, createRelation, deleteRelation } from '../api/relations';
import { ArrowLeft, Save, User, Building, Phone, Mail, Globe, Tag, MapPin, FileText, Users, Link2, Plus, X, Trash2 } from 'lucide-react';

const customerSchema = z.object({
  name: z.string().min(1, '姓名必填').max(200),
  company: z.string().max(200).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  tags: z.string().optional(),
  notes: z.string().optional(),
  address: z.string().max(500).optional().or(z.literal('')),
  website: z.string().url('网址格式不正确').optional().or(z.literal('')),
  team_id: z.number().nullable().optional(),
});

const inputStyle = { width: '100%', padding: '12px 16px', border: '1.5px solid var(--slate-200)', borderRadius: 12, fontSize: 14, outline: 'none', transition: 'all 0.2s', background: 'white' };
const labelStyle = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--slate-700)' };

export default function CustomerEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'new';
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAddRelation, setShowAddRelation] = useState(false);
  const [relTarget, setRelTarget] = useState('');
  const [relType, setRelType] = useState('');
  const [relStrength, setRelStrength] = useState(3);
  const [pendingRelations, setPendingRelations] = useState([]);

  const queryClient = useQueryClient();

  const { data: existing } = useQuery({ queryKey: ['customer', id], queryFn: () => getCustomer(id), enabled: isEdit });
  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: () => listTeams() });
  const { data: relationsData } = useQuery({ queryKey: ['relations', id], queryFn: () => listRelations(parseInt(id)), enabled: isEdit });
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
    if (isEdit) {
      createRelMutation.mutate({
        source_id: parseInt(id),
        target_id: parseInt(relTarget),
        relation_type: relType,
        strength: relStrength,
      });
    } else {
      const targetCustomer = customers.find((c) => String(c.id) === String(relTarget));
      setPendingRelations((prev) => [...prev, { target_id: parseInt(relTarget), target_name: targetCustomer?.name || '', relation_type: relType, strength: relStrength }]);
      setShowAddRelation(false);
      setRelTarget('');
      setRelType('');
    }
  };

  const handleRemovePending = (idx) => {
    setPendingRelations((prev) => prev.filter((_, i) => i !== idx));
  };

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: existing?.data?.name || '', company: existing?.data?.company || '', phone: existing?.data?.phone || '',
      email: existing?.data?.email || '', tags: existing?.data?.tags?.join(', ') || '', notes: existing?.data?.notes || '',
      address: existing?.data?.address || '', website: existing?.data?.website || '', team_id: existing?.data?.team_id || null,
    },
  });

  const onSubmit = async (data) => {
    setSaving(true); setError('');
    try {
      const payload = { ...data, tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [], team_id: data.team_id || null };
      if (isEdit) {
        await updateCustomer(id, payload);
      } else {
        const res = await createCustomer(payload);
        const newId = res.data?.id;
        if (newId && pendingRelations.length) {
          await Promise.all(pendingRelations.map((r) =>
            createRelation({ source_id: newId, target_id: r.target_id, relation_type: r.relation_type, strength: r.strength })
          ));
          queryClient.invalidateQueries({ queryKey: ['relations'] });
          queryClient.invalidateQueries({ queryKey: ['relations-all'] });
        }
      }
      navigate('/customers');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) setError(detail.map(e => e.msg).join('；'));
      else if (typeof detail === 'string') setError(detail);
      else setError('保存失败');
    } finally { setSaving(false); }
  };

  const handleFocus = (e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,165,116,0.1)'; };
  const handleBlur = (e) => { e.target.style.borderColor = 'var(--slate-200)'; e.target.style.boxShadow = 'none'; };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* 顶部导航 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <Link to={isEdit ? `/customers/${id}` : '/customers'} style={{ padding: 10, borderRadius: 12, color: 'var(--slate-600)', textDecoration: 'none' }}>
          <ArrowLeft style={{ width: 20, height: 20 }} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--slate-900)' }}>{isEdit ? '编辑客户' : '新增客户'}</h1>
          <p style={{ fontSize: 14, marginTop: 4, color: 'var(--slate-500)' }}>{isEdit ? '修改客户信息' : '添加新的客户到系统'}</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: 16, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, background: 'var(--danger-light)', color: 'var(--danger)' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--danger)' }}>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>!</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ background: 'white', borderRadius: 16, border: '1px solid var(--slate-100)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--slate-100)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--slate-800)' }}>客户信息</h2>
        </div>
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={labelStyle}><User style={{ width: 16, height: 16, color: 'var(--primary)' }} /> 姓名 <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input {...register('name')} style={{ ...inputStyle, borderColor: errors.name ? 'var(--danger)' : undefined }} placeholder="客户姓名" onFocus={handleFocus} onBlur={handleBlur} />
            {errors.name && <p style={{ marginTop: 6, fontSize: 13, color: 'var(--danger)' }}>{errors.name.message}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={labelStyle}><Building style={{ width: 16, height: 16, color: 'var(--primary)' }} /> 公司</label>
              <input {...register('company')} style={inputStyle} placeholder="公司名称" onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div>
              <label style={labelStyle}><Phone style={{ width: 16, height: 16, color: 'var(--primary)' }} /> 电话</label>
              <input {...register('phone')} style={inputStyle} placeholder="电话号码" onFocus={handleFocus} onBlur={handleBlur} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={labelStyle}><Mail style={{ width: 16, height: 16, color: 'var(--primary)' }} /> 邮箱</label>
              <input {...register('email')} type="email" style={inputStyle} placeholder="email@example.com" onFocus={handleFocus} onBlur={handleBlur} />
              {errors.email && <p style={{ marginTop: 6, fontSize: 13, color: 'var(--danger)' }}>{errors.email.message}</p>}
            </div>
            <div>
              <label style={labelStyle}><Globe style={{ width: 16, height: 16, color: 'var(--primary)' }} /> 网站</label>
              <input {...register('website')} style={inputStyle} placeholder="https://example.com" onFocus={handleFocus} onBlur={handleBlur} />
              {errors.website && <p style={{ marginTop: 6, fontSize: 13, color: 'var(--danger)' }}>{errors.website.message}</p>}
            </div>
          </div>

          <div>
            <label style={labelStyle}><Tag style={{ width: 16, height: 16, color: 'var(--primary)' }} /> 标签</label>
            <input {...register('tags')} style={inputStyle} placeholder="VIP, 企业, 技术（用逗号分隔）" onFocus={handleFocus} onBlur={handleBlur} />
          </div>

          <div>
            <label style={labelStyle}><Users style={{ width: 16, height: 16, color: 'var(--primary)' }} /> 所属团队</label>
            <select {...register('team_id', { setValueAs: v => v ? parseInt(v) : null })} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={handleFocus} onBlur={handleBlur}>
              <option value="">个人（无团队）</option>
              {teams?.data?.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
          </div>

          <div>
            <label style={labelStyle}><MapPin style={{ width: 16, height: 16, color: 'var(--primary)' }} /> 地址</label>
            <input {...register('address')} style={inputStyle} placeholder="详细地址" onFocus={handleFocus} onBlur={handleBlur} />
          </div>

          <div>
            <label style={labelStyle}><FileText style={{ width: 16, height: 16, color: 'var(--primary)' }} /> 备注</label>
            <textarea {...register('notes')} rows={4} style={{ ...inputStyle, resize: 'none' }} placeholder="补充说明..." onFocus={handleFocus} onBlur={handleBlur} />
          </div>
        </div>

        <>
          <div style={{ padding: '20px 28px', borderTop: '1px solid var(--slate-100)', borderBottom: '1px solid var(--slate-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--slate-800)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link2 style={{ width: 18, height: 18, color: 'var(--primary)' }} /> 客户关系{!isEdit ? '（保存后生效）' : ''}
            </h2>
            <button
              type="button"
              onClick={() => setShowAddRelation(!showAddRelation)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid var(--slate-200)', background: showAddRelation ? 'var(--slate-100)' : 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--slate-600)', transition: 'all 0.15s' }}
            >
              {showAddRelation ? <X style={{ width: 14, height: 14 }} /> : <Plus style={{ width: 14, height: 14 }} />}
              {showAddRelation ? '取消' : '添加关系'}
            </button>
          </div>

          {showAddRelation && (
            <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--slate-100)', background: 'var(--slate-50)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--slate-500)', marginBottom: 4 }}>关联客户</label>
                  <select value={relTarget} onChange={(e) => setRelTarget(e.target.value)} style={{ ...inputStyle, padding: '10px 14px' }}>
                    <option value="">选择客户...</option>
                    {otherCustomers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.company ? ` @ ${c.company}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--slate-500)', marginBottom: 4 }}>关系类型</label>
                  <input
                    list="edit-relation-type-list"
                    value={relType}
                    onChange={(e) => setRelType(e.target.value)}
                    placeholder="输入或选择..."
                    style={{ ...inputStyle, padding: '10px 14px', minWidth: 140 }}
                  />
                  <datalist id="edit-relation-type-list">
                    {relationTypes.map((t) => <option key={t} value={t} />)}
                  </datalist>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--slate-500)', marginBottom: 4 }}>强度 ({relStrength})</label>
                  <input type="range" min={1} max={5} value={relStrength} onChange={(e) => setRelStrength(Number(e.target.value))} style={{ width: 100, accentColor: 'var(--primary)' }} />
                </div>
                <button type="button" onClick={handleAddRelation} disabled={!relTarget || !relType.trim() || createRelMutation.isPending} className="btn-primary" style={{ padding: '10px 20px', fontSize: 13, opacity: (!relTarget || !relType.trim()) ? 0.5 : 1 }}>
                  {createRelMutation.isPending ? '添加中...' : '添加'}
                </button>
              </div>
            </div>
          )}

          {isEdit ? (
            <>
              {relations.length > 0 && (
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
                          type="button"
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
                </div>
              )}
              {!relations.length && !showAddRelation && (
                <div style={{ padding: '28px', textAlign: 'center', color: 'var(--slate-400)', fontSize: 14 }}>
                  暂无关联客户，点击"添加关系"建立客户间的关联
                </div>
              )}
            </>
          ) : (
            <>
              {pendingRelations.length > 0 && (
                <div>
                  {pendingRelations.map((r, idx) => {
                    const color = relationColors[r.relation_type] || '#8b93a3';
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px', borderBottom: '1px solid var(--slate-100)', transition: 'background 0.15s' }}
                           onMouseEnter={(e) => e.currentTarget.style.background = 'var(--slate-50)'}
                           onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 4, height: 28, borderRadius: 2, background: color }} />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 600, color: 'var(--slate-700)' }}>→</span>
                              <span style={{ fontWeight: 600, color: 'var(--primary-dark)', fontSize: 14 }}>{r.target_name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: `${color}18`, color, fontWeight: 600 }}>{r.relation_type}</span>
                              <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>强度 {'●'.repeat(r.strength)}{'○'.repeat(5 - r.strength)}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePending(idx)}
                          style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--slate-400)', transition: 'all 0.15s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-light)'; e.currentTarget.style.color = 'var(--danger)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--slate-400)'; }}
                        >
                          <Trash2 style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {!pendingRelations.length && !showAddRelation && (
                <div style={{ padding: '28px', textAlign: 'center', color: 'var(--slate-400)', fontSize: 14 }}>
                  暂无关联客户，点击"添加关系"建立客户间的关联
                </div>
              )}
            </>
          )}
        </>

        <div style={{ padding: '20px 28px', borderTop: '1px solid var(--slate-100)', background: 'var(--slate-50)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={() => navigate(isEdit ? `/customers/${id}` : '/customers')} className="btn-secondary">取消</button>
          <button type="submit" disabled={saving} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, opacity: saving ? 0.5 : 1 }}>
            <Save style={{ width: 16, height: 16 }} /> {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
