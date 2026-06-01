import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, LayoutDashboard, Settings, LogOut, Menu, X, Activity, ChevronRight, Sparkles, Network } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard, desc: '数据概览' },
  { path: '/customers', label: '客户管理', icon: Users, desc: '客户信息' },
  { path: '/customers/network', label: '关系网络', icon: Network, desc: '客户关联' },
  { path: '/team', label: '团队协作', icon: Settings, desc: '成员权限' },
  { path: '/activity', label: '操作日志', icon: Activity, desc: '变更记录' },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--warm-bg)' }}>
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
            display: 'block',
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside style={{
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 50,
        width: 280, display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #1a1d23 0%, #14171c 100%)',
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }} className={`lg:!relative lg:!translate-x-0 ${sidebarOpen ? '!translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* 装饰性渐变光晕 */}
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 180, height: 180,
          borderRadius: '50%', opacity: 0.08,
          background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: 80, left: -40, width: 120, height: 120,
          borderRadius: '50%', opacity: 0.05,
          background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo 区域 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              boxShadow: '0 4px 16px rgba(212, 165, 116, 0.3)',
              position: 'relative',
            }}>
              <Sparkles style={{ width: 20, height: 20, color: 'white' }} />
              <div style={{
                position: 'absolute', inset: -2, borderRadius: 14,
                border: '1px solid rgba(212, 165, 116, 0.3)',
              }} />
            </div>
            <div>
              <h1 style={{ color: 'white', fontWeight: 700, fontSize: 17, lineHeight: 1.2, letterSpacing: '-0.02em' }}>客户管理</h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>CRM Platform</p>
            </div>
          </div>
          <button
            style={{
              display: 'none', padding: 4, border: 'none', background: 'transparent',
              color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
            }}
            className="lg:!hidden !flex"
            onClick={() => setSidebarOpen(false)}
          >
            <X style={{ width: 22, height: 22 }} />
          </button>
        </div>

        {/* 导航标签 */}
        <div style={{ padding: '20px 24px 8px', position: 'relative' }}>
          <span style={{
            fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)',
          }}>主菜单</span>
        </div>

        {/* 导航菜单 */}
        <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto', position: 'relative' }}>
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path ||
              (item.path === '/customers' && location.pathname.startsWith('/customers/') && !location.pathname.startsWith('/customers/network')) ||
              (item.path !== '/' && item.path !== '/customers' && location.pathname.startsWith(item.path));
            const isHovered = hoveredItem === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="animate-slide-in-left"
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px', borderRadius: 12,
                  marginBottom: 4, textDecoration: 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  animationDelay: `${index * 60}ms`,
                  animationFillMode: 'both',
                  position: 'relative',
                  ...(isActive
                    ? {
                        background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(201, 149, 107, 0.08) 100%)',
                        color: 'white',
                      }
                    : {
                        background: isHovered ? 'rgba(255,255,255,0.04)' : 'transparent',
                        color: isHovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)',
                      }
                  ),
                }}
                onClick={() => setSidebarOpen(false)}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* 左侧激活指示条 */}
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 20, borderRadius: 2,
                    background: 'linear-gradient(180deg, var(--primary) 0%, var(--accent) 100%)',
                    boxShadow: '0 0 8px rgba(212, 165, 116, 0.5)',
                  }} />
                )}

                {/* 图标容器 */}
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.2s',
                  background: isActive
                    ? 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)'
                    : isHovered
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(255,255,255,0.03)',
                  boxShadow: isActive ? '0 2px 8px rgba(212, 165, 116, 0.25)' : 'none',
                }}>
                  <Icon style={{
                    width: 18, height: 18,
                    color: isActive ? 'white' : isHovered ? 'var(--primary-light)' : 'rgba(255,255,255,0.5)',
                    transition: 'color 0.2s',
                  }} />
                </div>

                {/* 文字 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 14, display: 'block', lineHeight: 1.3,
                  }}>{item.label}</span>
                  <span style={{
                    fontSize: 11, display: 'block', lineHeight: 1.3, marginTop: 1,
                    color: isActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
                  }}>{item.desc}</span>
                </div>

                {/* 箭头 */}
                {isActive && (
                  <ChevronRight style={{
                    width: 16, height: 16, flexShrink: 0,
                    color: 'rgba(255,255,255,0.4)',
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* 底部用户区 */}
        <div style={{ padding: '16px 16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 14px', borderRadius: 14,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.04)',
            marginBottom: 8,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 15,
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              boxShadow: '0 2px 8px rgba(212, 165, 116, 0.2)',
            }}>
              {user?.name?.[0] || user?.phone?.[0] || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || '用户'}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                {user?.phone || ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '10px 14px', borderRadius: 12, border: 'none',
              background: 'transparent', color: 'rgba(255,255,255,0.35)',
              cursor: 'pointer', transition: 'all 0.2s', fontSize: 13, fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
            }}
          >
            <LogOut style={{ width: 16, height: 16 }} />
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* 顶部栏 */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '18px 48px 18px 48px',
          borderBottom: '1px solid var(--slate-100)',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          transition: 'box-shadow 0.2s',
        }}>
          <button
            className="lg:!hidden"
            style={{
              display: 'none', padding: 8, borderRadius: 8, border: 'none',
              background: 'transparent', cursor: 'pointer', color: 'var(--slate-600)',
            }}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu style={{ width: 20, height: 20 }} />
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--slate-800)', letterSpacing: '-0.02em' }}>
              {navItems.find((n) => n.path === location.pathname)?.label || '工作台'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--slate-400)' }}>
            <span>{new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</span>
          </div>
        </header>

        {/* 内容区域 */}
        <main className="animate-fade-in" style={{ flex: 1, overflow: 'auto', padding: '40px 48px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
