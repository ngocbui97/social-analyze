import { useState, useEffect } from 'react';
import { useTracker } from '../hooks/useTracker';
import { Briefcase, Plus, Trash2, X, DollarSign, ChevronRight } from 'lucide-react';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { loadSponsorships, saveSponsorship, deleteSponsorship } from '../services/supabase';

const COLUMNS = [
  { id: 'prospect', label: '📬 Cần Liên hệ', color: 'var(--accent-blue)' },
  { id: 'negotiating', label: '🤝 Đang Thương lượng', color: 'var(--accent-yellow)' },
  { id: 'closed', label: '✅ Đã Chốt hợp đồng', color: 'var(--accent-green)' },
];

const DEMO_DEALS = [
  { id: 'demo-1', brandName: 'TechViet Tools', contactName: 'Anh Minh', status: 'prospect', amount: 5000000, notes: 'Review phần mềm thiết kế', userEmail: 'demo@user.com' },
  { id: 'demo-2', brandName: 'GoViet Academy', contactName: 'Chị Lan', status: 'negotiating', amount: 8000000, notes: 'Sponsored segment 60s', userEmail: 'demo@user.com' },
  { id: 'demo-3', brandName: 'UberEats VN', contactName: 'Anh Khoa', status: 'closed', amount: 15000000, notes: 'Video chuyên topic ẩm thực', userEmail: 'demo@user.com' },
];

const generateId = () => `deal-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function formatVND(amount) {
  if (!amount) return '—';
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M ₫`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K ₫`;
  return `${amount} ₫`;
}

function DealCard({ deal, onMove, onDelete }) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '14px',
        cursor: 'grab',
        transition: 'all 0.2s',
        position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <button
        onClick={() => onDelete(deal.id)}
        style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', opacity: 0.6 }}
      >
        <X size={14} />
      </button>

      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px', paddingRight: '20px' }}>{deal.brandName}</div>
      {deal.contactName && (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          👤 {deal.contactName}
        </div>
      )}
      {deal.notes && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.4 }}>{deal.notes}</div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-green)' }}>
          <DollarSign size={12} style={{ verticalAlign: 'middle' }} />{formatVND(deal.amount)}
        </span>
        {/* Move buttons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {COLUMNS.filter(c => c.id !== deal.status).map(c => (
            <button
              key={c.id}
              onClick={() => onMove(deal.id, c.id)}
              title={`Chuyển sang: ${c.label}`}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)' }}
            >
              {c.label.split(' ').slice(0, 2).join(' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddDealModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ brandName: '', contactName: '', status: 'prospect', amount: '', notes: '' });
  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '440px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Thêm Thương hiệu mới</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        {[
          { label: 'Tên thương hiệu *', key: 'brandName', placeholder: 'VD: TechViet, Brand XYZ' },
          { label: 'Người liên hệ', key: 'contactName', placeholder: 'VD: Anh Minh, marketing@brand.com' },
        ].map(field => (
          <div key={field.key} style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>{field.label}</label>
            <input
              className="input-field"
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder={field.placeholder}
              value={form[field.key]}
              onChange={e => update(field.key, e.target.value)}
            />
          </div>
        ))}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Trạng thái</label>
            <select
              className="input-field"
              style={{ width: '100%' }}
              value={form.status}
              onChange={e => update('status', e.target.value)}
            >
              {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Giá trị hợp đồng (₫)</label>
            <input
              className="input-field"
              style={{ width: '100%', boxSizing: 'border-box' }}
              type="number"
              placeholder="VD: 5000000"
              value={form.amount}
              onChange={e => update('amount', e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Ghi chú</label>
          <textarea
            className="input-field"
            style={{ width: '100%', boxSizing: 'border-box', height: '70px', resize: 'vertical' }}
            placeholder="Chi tiết về hợp đồng, điều khoản..."
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button
            className="btn btn-primary"
            disabled={!form.brandName.trim()}
            onClick={() => {
              onAdd({ ...form, amount: Number(form.amount) || 0 });
              onClose();
            }}
          >
            <Plus size={14} /> Thêm Deal
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CRM() {
  useTracker('Sponsorship CRM');
  const { user } = useAuth();
  const [deals, setDeals] = useState(DEMO_DEALS);
  const [showModal, setShowModal] = useState(false);

  // Load from Supabase if user is logged in
  useEffect(() => {
    if (!user?.email) return;
    loadSponsorships(user.email).then(saved => {
      if (saved.length > 0) setDeals(saved);
    });
  }, [user?.email]);

  const addDeal = (formData) => {
    const newDeal = { ...formData, id: generateId(), userEmail: user?.email || 'local' };
    setDeals(prev => [newDeal, ...prev]);
    if (user?.email) saveSponsorship({ ...newDeal, userEmail: user.email });
  };

  const moveDeal = (id, newStatus) => {
    setDeals(prev => prev.map(d => {
      if (d.id !== id) return d;
      const updated = { ...d, status: newStatus };
      if (user?.email) saveSponsorship({ ...updated, userEmail: user.email });
      return updated;
    }));
  };

  const removeDeal = (id) => {
    setDeals(prev => prev.filter(d => d.id !== id));
    deleteSponsorship(id);
  };

  const totalClosed = deals.filter(d => d.status === 'closed').reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title="Sponsorship CRM" subtitle="Quản lý hợp đồng thương hiệu" />

      <div className="page-content">
        {/* Stats Row */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          {COLUMNS.map(col => {
            const count = deals.filter(d => d.status === col.id).length;
            const val = deals.filter(d => d.status === col.id).reduce((sum, d) => sum + (d.amount || 0), 0);
            return (
              <div key={col.id} className="card" style={{ padding: '16px', borderLeft: `3px solid ${col.color}` }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{col.label}</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: col.color }}>{count} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>deals</span></div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{formatVND(val)}</div>
              </div>
            );
          })}
          <div className="card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-green)', background: 'rgba(34,211,165,0.05)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>💰 Tổng đã thu</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-green)' }}>{formatVND(totalClosed)}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Đã chốt hợp đồng</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Thêm Thương hiệu
          </button>
        </div>

        {/* Kanban Board */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'start' }}>
          {COLUMNS.map(col => {
            const colDeals = deals.filter(d => d.status === col.id);
            return (
              <div key={col.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: col.color }}>{col.label}</span>
                  <span style={{ fontSize: '12px', background: col.color + '22', color: col.color, padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>
                    {colDeals.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {colDeals.map(deal => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onMove={moveDeal}
                      onDelete={removeDeal}
                    />
                  ))}
                  {colDeals.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', opacity: 0.5, fontSize: '13px', border: '2px dashed var(--border)', borderRadius: '12px' }}>
                      Chưa có deal nào
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && <AddDealModal onAdd={addDeal} onClose={() => setShowModal(false)} />}
    </div>
  );
}
