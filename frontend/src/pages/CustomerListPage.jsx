import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listCustomers, getTags, deleteCustomer } from '../api/customers';
import { Search, Plus, Filter, Trash2, Edit, Users } from 'lucide-react';

export default function CustomerListPage() {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customers', page, search, selectedTag],
    queryFn: () => listCustomers({ page, per_page: perPage, search: search || undefined, tag: selectedTag || undefined }),
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => getTags(),
  });

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个客户吗？')) return;
    await deleteCustomer(id);
    refetch();
  };

  const thStyle = { padding: '16px 24px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-500)', textAlign: 'left' };
  const tdStyle = { padding: '18px 24px' };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--slate-900)' }}>客户管理</h1>
          <p style={{ fontSize: 14, marginTop: 4, color: 'var(--slate-500)' }}>
            {data?.data?.total || 0} 位客户
          </p>
        </div>
        <Link to="/customers/new" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <Plus style={{ width: 18, height: 18 }} />
          新增客户
        </Link>
      </div>

      {/* 搜索和筛选栏 */}
      <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid var(--slate-100)', boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--slate-400)' }} />
            <input
              type="text"
              placeholder="搜索姓名、公司、电话、邮箱..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '12px 16px 12px 44px', border: '1.5px solid var(--slate-200)', borderRadius: 12, fontSize: 14, outline: 'none', transition: 'all 0.2s', background: 'white' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,165,116,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--slate-200)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedTag}
              onChange={(e) => { setSelectedTag(e.target.value); setPage(1); }}
              style={{ padding: '12px 36px 12px 16px', border: '1.5px solid var(--slate-200)', borderRadius: 12, fontSize: 14, outline: 'none', background: 'white', cursor: 'pointer', appearance: 'none' }}
            >
              <option value="">全部标签</option>
              {tagsData?.data?.tags?.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <Filter style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--slate-400)', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* 客户列表 */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--slate-100)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--slate-50)' }}>
                <th style={thStyle}>姓名</th>
                <th style={{ ...thStyle }} className="hidden md:table-cell">公司</th>
                <th style={{ ...thStyle }} className="hidden lg:table-cell">联系方式</th>
                <th style={{ ...thStyle }} className="hidden sm:table-cell">标签</th>
                <th style={{ ...thStyle }} className="hidden lg:table-cell">更新时间</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.items?.map((c, index) => (
                <tr key={c.id}
                    style={{ borderBottom: index < data.data.items.length - 1 ? '1px solid var(--slate-100)' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--slate-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={tdStyle}>
                    <Link to={`/customers/${c.id}`} style={{ fontWeight: 600, color: 'var(--primary-dark)', textDecoration: 'none' }}>
                      {c.name}
                    </Link>
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--slate-600)' }} className="hidden md:table-cell">
                    {c.company || '-'}
                  </td>
                  <td style={{ ...tdStyle, fontSize: 14, color: 'var(--slate-500)' }} className="hidden lg:table-cell">
                    {c.phone || c.email || '-'}
                  </td>
                  <td style={tdStyle} className="hidden sm:table-cell">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {c.tags?.slice(0, 2).map((tag, i) => (
                        <span key={i} className="badge badge-primary">{tag}</span>
                      ))}
                      {c.tags?.length > 2 && (
                        <span className="badge" style={{ background: 'var(--slate-100)', color: 'var(--slate-600)' }}>
                          +{c.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontSize: 14, color: 'var(--slate-400)' }} className="hidden lg:table-cell">
                    {new Date(c.updated_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                      <Link to={`/customers/${c.id}/edit`}
                            style={{ padding: 8, borderRadius: 8, color: 'var(--slate-500)', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--slate-100)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Edit style={{ width: 16, height: 16 }} />
                      </Link>
                      <button onClick={() => handleDelete(c.id)}
                              style={{ padding: 8, borderRadius: 8, color: 'var(--slate-400)', border: 'none', background: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-light)'; e.currentTarget.style.color = 'var(--danger)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--slate-400)'; }}>
                        <Trash2 style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!data?.data?.items?.length && !isLoading && (
          <div style={{ padding: '60px 32px', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--slate-50)' }}>
              <Users style={{ width: 36, height: 36, color: 'var(--slate-300)' }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: 'var(--slate-600)' }}>没有找到客户</p>
            <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--slate-400)' }}>尝试调整搜索条件或添加新客户</p>
            <Link to="/customers/new" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <Plus style={{ width: 16, height: 16 }} /> 添加客户
            </Link>
          </div>
        )}

        {isLoading && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
            <p>加载中...</p>
          </div>
        )}

        {data?.data?.total > perPage && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--slate-100)', background: 'var(--slate-50)' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--slate-500)' }}>
              共 {data.data.total} 条
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                      style={{ padding: '8px 16px', border: '1px solid var(--slate-200)', borderRadius: 8, fontSize: 14, fontWeight: 500, color: 'var(--slate-600)', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>
                上一页
              </button>
              <button disabled={page * perPage >= data?.data?.total} onClick={() => setPage(p => p + 1)}
                      style={{ padding: '8px 16px', border: '1px solid var(--slate-200)', borderRadius: 8, fontSize: 14, fontWeight: 500, color: 'var(--slate-600)', background: 'white', cursor: page * perPage >= data?.data?.total ? 'not-allowed' : 'pointer', opacity: page * perPage >= data?.data?.total ? 0.5 : 1 }}>
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
