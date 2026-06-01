import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Graph } from '@antv/g6';
import { listCustomers } from '../api/customers';
import { listRelations, createRelation, deleteRelation } from '../api/relations';
import { Network, Search, ZoomIn, ZoomOut, RotateCcw, User, Building, Mail, Phone, MapPin, ExternalLink, X, Calendar, Globe, Link2, Plus, Trash2 } from 'lucide-react';

const tagTypes = {
  'VIP': { label: 'VIP', color: '#d4a574', glow: 'rgba(212, 165, 116, 0.3)' },
  '企业': { label: '企业', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)' },
  '个人': { label: '个人', color: '#22c55e', glow: 'rgba(34, 197, 94, 0.25)' },
  '潜在': { label: '潜在', color: '#a78bfa', glow: 'rgba(167, 139, 250, 0.25)' },
};

const defaultType = { label: '默认', color: '#6366f1', glow: 'rgba(99,102,241,0.35)' };

function getCustomerType(tags) {
  if (!tags || !tags.length) return { ...defaultType, size: 36 };
  for (const tag of tags) {
    if (tagTypes[tag]) return { ...tagTypes[tag], size: 36 };
  }
  return { ...defaultType, size: 36 };
}

const relationColorPalette = ['#d4a574', '#3b82f6', '#22c55e', '#f59e0b', '#a78bfa', '#06b6d4', '#ec4899', '#ef4444', '#f97316', '#14b8a6', '#8b5cf6', '#84cc16'];
const knownRelationColors = {
  '转介绍': '#d4a574',
  '合作伙伴': '#3b82f6',
  '同行业': '#22c55e',
  '投资关系': '#f59e0b',
  '朋友': '#a78bfa',
  '供应商': '#06b6d4',
  '客户': '#ec4899',
  '竞争对手': '#ef4444',
  '亲属': '#f97316',
  '同事': '#14b8a6',
};

function buildRelationColors(types) {
  const map = { ...knownRelationColors };
  let idx = 0;
  for (const t of types) {
    if (!map[t]) {
      map[t] = relationColorPalette[idx % relationColorPalette.length];
      idx++;
    }
  }
  return map;
}

const cardStyle = {
  background: 'white',
  borderRadius: 16,
  border: '1px solid var(--slate-100)',
  boxShadow: 'var(--shadow-sm)',
  overflow: 'hidden',
};


export default function NetworkPage() {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddRelation, setShowAddRelation] = useState(false);
  const [relTarget, setRelTarget] = useState('');
  const [relType, setRelType] = useState('');
  const [relStrength, setRelStrength] = useState(3);
  const [tagFilter, setTagFilter] = useState(null);
  const [ownerFilter, setOwnerFilter] = useState(null);

  const queryClient = useQueryClient();

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => listCustomers({ per_page: 100 }),
  });

  const { data: relationsData } = useQuery({
    queryKey: ['relations-all'],
    queryFn: () => listRelations(),
  });

  const { data: customerRelationsData } = useQuery({
    queryKey: ['relations', selectedCustomer?.id],
    queryFn: () => listRelations(parseInt(selectedCustomer?.id)),
    enabled: !!selectedCustomer,
  });

  const customers = customersData?.data?.items || customersData?.data || [];
  const apiRelations = relationsData?.data?.items || relationsData?.data || [];

  const customerRelations = customerRelationsData?.data?.items || customerRelationsData?.data || [];
  const otherCustomers = customers.filter((c) => String(c.id) !== String(selectedCustomer?.id));
  const relationTypes = ['转介绍', '合作伙伴', '同行业', '投资关系', '朋友', '供应商', '客户', '竞争对手', '亲属', '同事'];

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
    if (!selectedCustomer || !relTarget || !relType.trim()) return;
    createRelMutation.mutate({
      source_id: parseInt(selectedCustomer.id),
      target_id: parseInt(relTarget),
      relation_type: relType,
      strength: relStrength,
    });
  };

  const filteredCustomers = useMemo(() => {
    let list = customers;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      );
    }
    if (tagFilter) {
      list = list.filter((c) => c.tags && c.tags.includes(tagFilter));
    }
    if (ownerFilter) {
      list = list.filter((c) => c.owner_name === ownerFilter);
    }
    return list;
  }, [customers, search, tagFilter, ownerFilter]);

  const filteredIds = useMemo(() => new Set(filteredCustomers.map((c) => String(c.id))), [filteredCustomers]);

  const resolvedEdges = useMemo(() => {
    return apiRelations
      .filter((e) => filteredIds.has(String(e.source_id)) && filteredIds.has(String(e.target_id)))
      .map((e, i) => ({
        id: `e-${i}`,
        source: String(e.source_id),
        target: String(e.target_id),
        data: { relation: e.relation_type, strength: e.strength },
      }));
  }, [apiRelations, filteredIds]);

  const relationColors = useMemo(() => {
    const types = [...new Set(apiRelations.map((r) => r.relation_type))];
    return buildRelationColors(types);
  }, [apiRelations]);

  useEffect(() => {
    if (!containerRef.current || filteredCustomers.length === 0) return;

    if (graphRef.current) {
      graphRef.current.destroy();
      graphRef.current = null;
    }

    const graph = new Graph({
      container: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      padding: [40, 40, 40, 40],
      data: {
        nodes: filteredCustomers.map((c) => {
          const cfg = getCustomerType(c.tags);
          return {
            id: String(c.id),
            data: { ...c },
            style: {
              size: cfg.size,
              labelText: c.name,
              labelFontSize: 12,
              labelFontWeight: 600,
              labelFill: '#334155',
              labelOffsetY: cfg.size / 2 + 16,
              labelPlacement: 'bottom',
              fill: cfg.color,
              stroke: cfg.color,
              lineWidth: 2,
              fillOpacity: 0.6,
              strokeOpacity: 1,
              shadowColor: cfg.glow,
              shadowBlur: 16,
            },
          };
        }),
        edges: resolvedEdges.map((e) => ({
          ...e,
          style: {
            stroke: relationColors[e.data.relation] || '#d4dae3',
            lineWidth: Math.max(1, e.data.strength * 0.6),
            strokeOpacity: 0.4,
            endArrow: false,
            labelText: e.data.relation,
            labelFontSize: 10,
            labelFontWeight: 500,
            labelFill: relationColors[e.data.relation] || '#8b93a3',
            labelOpacity: 0.8,
            labelBackground: true,
            labelBackgroundFill: 'white',
            labelBackgroundOpacity: 0.9,
            labelBackgroundRadius: 4,
            labelBackgroundPadding: [2, 6, 2, 6],
          },
        })),
      },
      layout: {
        type: 'd3-force',
        manyBody: { strength: -320 },
        link: { distance: 160 },
        collide: { radius: 50 },
        center: { x: containerRef.current.clientWidth / 2, y: containerRef.current.clientHeight / 2 },
      },
      behaviors: [
        'drag-canvas',
        'zoom-canvas',
        'drag-element',
        { type: 'hover-activate', state: 'active', degree: 1 },
      ],
      node: {
        type: 'circle',
        style: { cursor: 'pointer' },
        state: {
          active: { fillOpacity: 0.35, strokeOpacity: 1, lineWidth: 3, shadowBlur: 24, labelFontWeight: 700 },
          inactive: { fillOpacity: 0.05, strokeOpacity: 0.2, labelOpacity: 0.3 },
        },
      },
      edge: {
        type: 'line',
        style: { cursor: 'pointer' },
        state: {
          active: { strokeOpacity: 0.9, lineWidth: 3, labelOpacity: 1 },
          inactive: { strokeOpacity: 0.08, labelOpacity: 0 },
        },
      },
      animation: true,
    });

    graph.on('node:click', (evt) => {
      const id = evt.target?.id;
      if (id) {
        const customer = filteredCustomers.find((c) => String(c.id) === id);
        if (customer) setSelectedCustomer(customer);
      }
    });

    graph.render();
    graphRef.current = graph;

    const handleResize = () => {
      if (graphRef.current && containerRef.current) {
        graphRef.current.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (graphRef.current) {
        graphRef.current.destroy();
        graphRef.current = null;
      }
    };
  }, [filteredCustomers, resolvedEdges]);

  const handleZoom = (factor) => {
    if (!graphRef.current) return;
    graphRef.current.zoomTo(graphRef.current.getZoom() * factor, true);
  };

  const handleReset = () => {
    if (!graphRef.current) return;
    graphRef.current.fitView({ padding: [40, 40, 40, 40], effect: { duration: 300, easing: 'ease-in-out' } });
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: 'calc(100vh - 140px)' }} className="animate-fade-in">
      {/* 标题行 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Network style={{ width: 24, height: 24, color: 'var(--primary)' }} />
            客户关系网络
          </h1>
          <p style={{ fontSize: 14, marginTop: 4, color: 'var(--slate-500)' }}>
            {isLoading ? '加载中...' : `可视化客户间的关联关系 · ${filteredCustomers.length} 位客户 · ${resolvedEdges.length} 条关系`}
          </p>
        </div>

        {/* 缩放控制 */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => handleZoom(1.3)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--slate-200)', background: 'white', cursor: 'pointer', color: 'var(--slate-600)', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--slate-200)'; e.currentTarget.style.color = 'var(--slate-600)'; }}><ZoomIn style={{ width: 16, height: 16 }} /></button>
          <button onClick={() => handleZoom(0.7)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--slate-200)', background: 'white', cursor: 'pointer', color: 'var(--slate-600)', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--slate-200)'; e.currentTarget.style.color = 'var(--slate-600)'; }}><ZoomOut style={{ width: 16, height: 16 }} /></button>
          <button onClick={handleReset} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--slate-200)', background: 'white', cursor: 'pointer', color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--slate-200)'; e.currentTarget.style.color = 'var(--slate-600)'; }}><RotateCcw style={{ width: 14, height: 14 }} />重置</button>
        </div>
      </div>

      {/* 搜索 + 筛选 + 图例 */}
      <div style={{ display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* 搜索框 */}
        <div style={{ ...cardStyle, position: 'relative', padding: 0, display: 'flex', alignItems: 'center' }}>
          <Search style={{ position: 'absolute', left: 14, width: 16, height: 16, color: 'var(--slate-400)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索客户名称、公司..."
            style={{
              border: 'none', outline: 'none', padding: '10px 36px 10px 40px',
              fontSize: 14, width: 240, background: 'transparent', color: 'var(--slate-800)',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--slate-400)', display: 'flex', padding: 2 }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        {/* 标签筛选 */}
        <div style={{ ...cardStyle, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)' }}>标签：</span>
          <button
            onClick={() => setTagFilter(null)}
            style={{ padding: '3px 10px', borderRadius: 12, border: `1px solid ${tagFilter === null ? 'var(--primary)' : 'var(--slate-200)'}`, background: tagFilter === null ? 'var(--primary)' : 'white', color: tagFilter === null ? 'white' : 'var(--slate-600)', fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
          >全部</button>
          {Object.entries(tagTypes).map(([tag, cfg]) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              style={{ padding: '3px 10px', borderRadius: 12, border: `1px solid ${tagFilter === tag ? cfg.color : 'var(--slate-200)'}`, background: tagFilter === tag ? cfg.color : 'white', color: tagFilter === tag ? 'white' : cfg.color, fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
            >{tag}</button>
          ))}
        </div>

        {/* 添加人筛选 */}
        {(() => {
          const owners = [...new Set(customers.map((c) => c.owner_name).filter(Boolean))];
          if (!owners.length) return null;
          return (
            <div style={{ ...cardStyle, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)' }}>添加人：</span>
              <button
                onClick={() => setOwnerFilter(null)}
                style={{ padding: '3px 10px', borderRadius: 12, border: `1px solid ${ownerFilter === null ? 'var(--primary)' : 'var(--slate-200)'}`, background: ownerFilter === null ? 'var(--primary)' : 'white', color: ownerFilter === null ? 'white' : 'var(--slate-600)', fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
              >全部</button>
              {owners.map((name) => (
                <button
                  key={name}
                  onClick={() => setOwnerFilter(ownerFilter === name ? null : name)}
                  style={{ padding: '3px 10px', borderRadius: 12, border: `1px solid ${ownerFilter === name ? 'var(--primary)' : 'var(--slate-200)'}`, background: ownerFilter === name ? 'var(--primary)' : 'white', color: ownerFilter === name ? 'white' : 'var(--slate-600)', fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                >{name}</button>
              ))}
            </div>
          );
        })()}

        {/* 关系图例 */}
        <div style={{ ...cardStyle, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)' }}>关系：</span>
          {[...new Set(apiRelations.map((r) => r.relation_type))].map((label) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 18, height: 2, background: relationColors[label] || '#8b93a3', borderRadius: 1 }} />
              <span style={{ fontSize: 11, color: 'var(--slate-500)', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 图形 + 详情面板 */}
      <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 400 }}>
        {/* 图形容器 */}
        <div style={{ ...cardStyle, flex: 1, position: 'relative' }}>
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
          {filteredCustomers.length === 0 && !isLoading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.9)' }}>
              <Network style={{ width: 48, height: 48, color: 'var(--slate-300)', marginBottom: 12 }} />
              <p style={{ fontWeight: 600, color: 'var(--slate-500)' }}>暂无匹配的客户</p>
              <p style={{ fontSize: 13, color: 'var(--slate-400)', marginTop: 4 }}>调整搜索或筛选条件</p>
            </div>
          )}
        </div>

        {/* 客户详情侧栏 */}
        {selectedCustomer && (
          <div className="animate-slide-in-left" style={{ ...cardStyle, width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            {/* 详情头部 */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--slate-100)', position: 'relative' }}>
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--slate-400)', padding: 4 }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {(() => {
                  const ct = getCustomerType(selectedCustomer.tags);
                  return (
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: 18,
                      background: `linear-gradient(135deg, ${ct.color} 0%, ${ct.color}dd 100%)`,
                      boxShadow: `0 4px 12px ${ct.glow}`,
                    }}>
                      {selectedCustomer.name[0]}
                    </div>
                  );
                })()}
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--slate-900)' }}>{selectedCustomer.name}</h3>
                  {selectedCustomer.company && (
                    <p style={{ fontSize: 13, color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Building style={{ width: 12, height: 12 }} />{selectedCustomer.company}
                    </p>
                  )}
                </div>
              </div>
              {/* 标签 */}
              {selectedCustomer.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                  {selectedCustomer.tags.map((tag) => (
                    <span key={tag} className="badge badge-primary" style={{ padding: '4px 10px' }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* 详情内容 */}
            <div style={{ flex: 1, padding: '16px 24px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {selectedCustomer.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.1)', flexShrink: 0 }}>
                      <Phone style={{ width: 15, height: 15, color: '#22c55e' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>电话</p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--slate-700)' }}>{selectedCustomer.phone}</p>
                    </div>
                  </div>
                )}
                {selectedCustomer.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,130,246,0.1)', flexShrink: 0 }}>
                      <Mail style={{ width: 15, height: 15, color: '#3b82f6' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>邮箱</p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--slate-700)' }}>{selectedCustomer.email}</p>
                    </div>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', flexShrink: 0 }}>
                      <MapPin style={{ width: 15, height: 15, color: '#ef4444' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>地址</p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--slate-700)' }}>{selectedCustomer.address}</p>
                    </div>
                  </div>
                )}
                {selectedCustomer.website && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(139,92,246,0.1)', flexShrink: 0 }}>
                      <Globe style={{ width: 15, height: 15, color: '#8b5cf6' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>网站</p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--slate-700)' }}>{selectedCustomer.website}</p>
                    </div>
                  </div>
                )}
                {selectedCustomer.notes && (
                  <div style={{ marginTop: 8, padding: 14, borderRadius: 10, background: 'var(--slate-50)' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>备注</p>
                    <p style={{ fontSize: 13, color: 'var(--slate-600)', lineHeight: 1.6 }}>{selectedCustomer.notes}</p>
                  </div>
                )}
              </div>

              {/* 关系编辑 */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--slate-200)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Link2 style={{ width: 13, height: 13 }} /> 关系
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddRelation(!showAddRelation)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--slate-200)', background: showAddRelation ? 'var(--slate-100)' : 'white', cursor: 'pointer', fontSize: 11, fontWeight: 500, color: 'var(--slate-500)', transition: 'all 0.15s' }}
                  >
                    {showAddRelation ? <X style={{ width: 11, height: 11 }} /> : <Plus style={{ width: 11, height: 11 }} />}
                    {showAddRelation ? '取消' : '添加'}
                  </button>
                </div>

                {showAddRelation && (
                  <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <select value={relTarget} onChange={(e) => setRelTarget(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--slate-200)', borderRadius: 8, fontSize: 12, outline: 'none', background: 'white' }}>
                      <option value="">选择客户...</option>
                      {otherCustomers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}{c.company ? ` @ ${c.company}` : ''}</option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input list="net-rel-type-list" value={relType} onChange={(e) => setRelType(e.target.value)} placeholder="输入或选择..." style={{ flex: 1, padding: '8px 10px', border: '1.5px solid var(--slate-200)', borderRadius: 8, fontSize: 12, outline: 'none', background: 'white' }} />
                      <datalist id="net-rel-type-list">{relationTypes.map((t) => <option key={t} value={t} />)}</datalist>
                      <button type="button" onClick={handleAddRelation} disabled={!relTarget || !relType.trim() || createRelMutation.isPending} className="btn-primary" style={{ padding: '8px 14px', fontSize: 12, whiteSpace: 'nowrap', opacity: (!relTarget || !relType.trim()) ? 0.5 : 1 }}>
                        添加
                      </button>
                    </div>
                  </div>
                )}

                {customerRelations.map((r) => {
                  const isSource = String(r.source_id) === String(selectedCustomer.id);
                  const otherName = isSource ? r.target_name : r.source_name;
                  const otherId = isSource ? r.target_id : r.source_id;
                  const direction = isSource ? '→' : '←';
                  const color = relationColors[r.relation_type] || '#8b93a3';
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--slate-50)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 3, height: 22, borderRadius: 2, background: color }} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>{direction}</span>
                            <Link to={`/customers/${otherId}`} style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-dark)', textDecoration: 'none' }}>{otherName}</Link>
                          </div>
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: `${color}18`, color, fontWeight: 600 }}>{r.relation_type}</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => deleteRelMutation.mutate(r.id)} style={{ padding: 4, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--slate-400)' }}>
                        <Trash2 style={{ width: 12, height: 12 }} />
                      </button>
                    </div>
                  );
                })}
                {!customerRelations.length && !showAddRelation && (
                  <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: 'var(--slate-400)' }}>暂无关联</div>
                )}
              </div>

              {/* 元数据区域 */}
              {(selectedCustomer.owner_name || selectedCustomer.created_at) && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--slate-200)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  {selectedCustomer.owner_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User style={{ width: 13, height: 13, color: 'var(--slate-400)' }} />
                      <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>{selectedCustomer.owner_name} 添加</span>
                    </div>
                  )}
                  {selectedCustomer.created_at && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar style={{ width: 13, height: 13, color: 'var(--slate-400)' }} />
                      <span style={{ fontSize: 12, color: 'var(--slate-400)' }}>{new Date(selectedCustomer.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 底部操作 */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--slate-100)' }}>
              <button
                onClick={() => navigate(`/customers/${selectedCustomer.id}`)}
                className="btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14 }}
              >
                <ExternalLink style={{ width: 16, height: 16 }} />
                查看完整详情
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
