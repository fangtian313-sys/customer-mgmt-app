from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_db():
    """Create all tables if they don't exist."""
    # Ensure data directory exists for SQLite BEFORE creating tables
    if "sqlite" in settings.DATABASE_URL:
        import os
        from pathlib import Path
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        if not db_path.startswith("/"):
            db_path = str(Path(__file__).parent.parent / db_path)
        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    _seed_demo_data()


def _seed_demo_data():
    """Insert demo data if the database is empty."""
    from app.models import User, Team, TeamMember, Customer, CustomerRelation, ActivityLog
    import json

    db = SessionLocal()
    try:
        if db.query(User).first() is not None:
            return  # Already has data, skip seeding

        # --- Users ---
        admin = User(phone="13800000001", name="张三（管理员）", status="active")
        xiaoming = User(phone="13800000002", name="小明", status="active")
        erhunag = User(phone="13800000003", name="二黄", status="active")
        lisi = User(phone="13800000004", name="李四", status="active")
        db.add_all([admin, xiaoming, erhunag, lisi])
        db.flush()

        # --- Team ---
        team = Team(name="销售一部", description="核心销售团队", owner_id=admin.id)
        db.add(team)
        db.flush()

        db.add_all([
            TeamMember(team_id=team.id, user_id=admin.id, role="owner"),
            TeamMember(team_id=team.id, user_id=xiaoming.id, role="editor"),
            TeamMember(team_id=team.id, user_id=erhunag.id, role="editor"),
            TeamMember(team_id=team.id, user_id=lisi.id, role="viewer"),
        ])

        # --- Customers ---
        customers_data = [
            {"name": "王建国", "company": "华腾科技有限公司", "phone": "13912345001", "email": "wangjg@huateng.com",
             "tags": json.dumps(["VIP", "企业"]), "address": "北京市朝阳区建国路88号", "website": "https://huateng.com",
             "notes": "大客户，年合同额200万，对接人：王总", "owner_id": xiaoming.id, "team_id": team.id},
            {"name": "李梅", "company": "星辰教育集团", "phone": "13912345002", "email": "limei@xingchen.edu",
             "tags": json.dumps(["企业", "潜在"]), "address": "上海市浦东新区陆家嘴环路100号", "website": "https://xingchen.edu",
             "notes": "教育行业客户，正在洽谈年度合作方案", "owner_id": xiaoming.id, "team_id": team.id},
            {"name": "赵强", "company": "鼎盛地产集团", "phone": "13912345003", "email": "zhaoq@dingsheng.com",
             "tags": json.dumps(["VIP", "企业"]), "address": "深圳市南山区科技园南路20号", "website": "https://dingsheng.com",
             "notes": "老客户，已合作三年，续费稳定", "owner_id": erhunag.id, "team_id": team.id},
            {"name": "陈雪", "company": "悦享文化传媒", "phone": "13912345004", "email": "chenxue@yuexiang.cn",
             "tags": json.dumps(["企业"]), "address": "广州市天河区天河路300号", "website": "https://yuexiang.cn",
             "notes": "新媒体行业，有数字化转型需求", "owner_id": erhunag.id, "team_id": team.id},
            {"name": "刘明明", "company": "", "phone": "13912345005", "email": "liuyang@gmail.com",
             "tags": json.dumps(["个人", "VIP"]), "address": "杭州市西湖区文三路50号", "website": "",
             "notes": "个人投资者，对我们的产品非常感兴趣", "owner_id": admin.id, "team_id": team.id},
            {"name": "周婷", "company": "绿源环保科技", "phone": "13912345006", "email": "zhout@greensource.com",
             "tags": json.dumps(["企业", "潜在"]), "address": "成都市高新区天府大道999号", "website": "https://greensource.com",
             "notes": "环保行业，首次接触，需要跟进", "owner_id": lisi.id, "team_id": team.id},
            {"name": "吴磊", "company": "锐思咨询", "phone": "13912345007", "email": "wulei@ruisi.com",
             "tags": json.dumps(["企业"]), "address": "南京市鼓楼区中山路200号", "website": "https://ruisi.com",
             "notes": "咨询公司，有长期合作潜力", "owner_id": xiaoming.id, "team_id": team.id},
            {"name": "孙丽丽", "company": "美加国际贸易", "phone": "13912345008", "email": "sunll@meijia.com",
             "tags": json.dumps(["VIP", "企业"]), "address": "厦门市思明区鹭江道100号", "website": "https://meijia.com",
             "notes": "外贸企业，合同额150万/年", "owner_id": admin.id, "team_id": team.id},
            {"name": "马超", "company": "", "phone": "13912345009", "email": "machao@qq.com",
             "tags": json.dumps(["个人"]), "address": "武汉市江汉区解放大道500号", "website": "",
             "notes": "个人客户，朋友介绍", "owner_id": erhunag.id, "team_id": team.id},
            {"name": "黄芳", "company": "金桥物流", "phone": "13912345010", "email": "huangf@jinqiao.com",
             "tags": json.dumps(["企业", "潜在"]), "address": "重庆市渝北区新南路50号", "website": "https://jinqiao.com",
             "notes": "物流行业，有仓储管理系统需求", "owner_id": lisi.id, "team_id": team.id},
        ]
        customers = []
        for data in customers_data:
            c = Customer(**data)
            db.add(c)
            customers.append(c)
        db.flush()

        # --- Customer Relations ---
        relations = [
            (0, 1, "合作伙伴", 4),
            (0, 2, "转介绍", 5),
            (1, 3, "同行业", 3),
            (2, 7, "客户", 4),
            (3, 4, "转介绍", 3),
            (5, 9, "同行业", 2),
            (6, 0, "合作伙伴", 3),
            (4, 8, "朋友", 2),
            (9, 1, "朋友", 4),
        ]
        for src, tgt, rel_type, strength in relations:
            db.add(CustomerRelation(
                source_id=customers[src].id,
                target_id=customers[tgt].id,
                relation_type=rel_type,
                strength=strength,
                created_by=admin.id,
            ))

        # --- Activity Logs ---
        activities = [
            (xiaoming.id, team.id, "created", "customer", customers[0].id, "创建客户：王建国"),
            (xiaoming.id, team.id, "created", "customer", customers[1].id, "创建客户：李梅"),
            (erhunag.id, team.id, "created", "customer", customers[2].id, "创建客户：赵强"),
            (erhunag.id, team.id, "created", "customer", customers[3].id, "创建客户：陈雪"),
            (admin.id, team.id, "created", "customer", customers[4].id, "创建客户：刘明明"),
            (lisi.id, team.id, "created", "customer", customers[5].id, "创建客户：周婷"),
            (xiaoming.id, team.id, "updated", "customer", customers[0].id, "更新客户标签"),
            (admin.id, team.id, "created", "team", team.id, "创建团队：销售一部"),
        ]
        for uid, tid, action, etype, eid, detail in activities:
            db.add(ActivityLog(
                user_id=uid, team_id=tid, action=action,
                entity_type=etype, entity_id=eid,
                details=json.dumps({"description": detail}),
            ))

        db.commit()
        print(f"Demo data seeded: {len(customers_data)} customers, {len(relations)} relations")
    except Exception as e:
        db.rollback()
        print(f"Seed data error (non-fatal): {e}")
    finally:
        db.close()


# Auto-initialize on import
init_db()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
