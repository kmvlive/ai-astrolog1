"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";

const API = process.env.NEXT_PUBLIC_API_URL || "";

type Plan = {
  id?: number;
  slug: string;
  name: string;
  price: number;
  original_price: number | null;
  duration_days: number;
  features: string[];
  active: boolean;
  popular: boolean;
  sort_order: number;
};

const emptyPlan: Plan = {
  slug: "", name: "", price: 0, original_price: null, duration_days: 7,
  features: [], active: true, popular: false, sort_order: 0,
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
    if (!token) { router.push("/login"); return; }

    fetch(`${API}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => {
        if (!d.user?.is_admin) { router.push("/"); return; }
        loadPlans();
      })
      .catch(() => router.push("/login"));
  }, []);

  const loadPlans = () => {
    setLoading(true);
    const token = (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null)!;
    fetch(`${API}/api/admin/plans`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setPlans(d.plans || []); setLoading(false); });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const token = (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null)!;
    const url = editing.id
      ? `${API}/api/admin/plans/${editing.id}`
      : `${API}/api/admin/plans`;
    const method = editing.id ? "PUT" : "POST";

    try {
      const r = await fetch(url, {
        method, headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editing),
      });
      if (r.ok) { setEditing(null); loadPlans(); }
      else alert("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить тариф?")) return;
    const token = (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null)!;
    await fetch(`${API}/api/admin/plans/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadPlans();
  };

  const updateFeature = (idx: number, val: string) => {
    if (!editing) return;
    const f = [...editing.features];
    f[idx] = val;
    setEditing({ ...editing, features: f });
  };

  const addFeature = () => {
    if (!editing) return;
    setEditing({ ...editing, features: [...editing.features, ""] });
  };

  const removeFeature = (idx: number) => {
    if (!editing) return;
    setEditing({ ...editing, features: editing.features.filter((_, i) => i !== idx) });
  };

  if (loading) {
    return (
      <main className="min-h-screen text-white">
        <SiteHeader />
        <div className="text-center py-20 text-slate-400">Загрузка...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white">
      <SiteHeader />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">⚙️ Админ-панель</h1>
        <p className="text-slate-400 mb-8">Управление тарифами сайта</p>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Тарифы ({plans.length})</h2>
          <button
            onClick={() => setEditing({ ...emptyPlan, sort_order: plans.length + 1 })}
            className="bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-xl text-sm font-semibold"
          >
            + Новый тариф
          </button>
        </div>

        {/* Таблица */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50 text-left text-sm text-slate-400">
              <tr>
                <th className="px-4 py-3">Название</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Цена</th>
                <th className="px-4 py-3">Дней</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {plans.map(p => (
                <tr key={p.id} className="border-t border-white/5 hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium">
                    {p.name} {p.popular && <span className="text-xs text-amber-400 ml-1">★</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-sm">{p.slug}</td>
                  <td className="px-4 py-3">
                    {p.original_price && (
                      <span className="text-slate-500 line-through text-xs mr-1">
                        {(p.original_price / 100).toLocaleString("ru")}
                      </span>
                    )}
                    {(p.price / 100).toLocaleString("ru")} ₽
                  </td>
                  <td className="px-4 py-3 text-slate-400">{p.duration_days}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${p.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {p.active ? "активен" : "выключен"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(p)}
                      className="text-violet-400 hover:text-violet-300 mr-3 text-sm"
                    >✏️</button>
                    <button
                      onClick={() => remove(p.id!)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Модалка редактирования */}
        {editing && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">{editing.id ? "Редактировать тариф" : "Новый тариф"}</h3>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Название</label>
                  <input
                    value={editing.name}
                    onChange={e => setEditing({ ...editing, name: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
                    placeholder="Месяц"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Slug (латиница)</label>
                  <input
                    value={editing.slug}
                    onChange={e => setEditing({ ...editing, slug: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono"
                    placeholder="month"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Цена (₽)</label>
                  <input
                    type="number"
                    value={editing.price / 100}
                    onChange={e => setEditing({ ...editing, price: parseInt(e.target.value || "0") * 100 })}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Старая цена (₽, пусто = нет)</label>
                  <input
                    type="number"
                    value={editing.original_price ? editing.original_price / 100 : ""}
                    onChange={e => {
                      const v = parseInt(e.target.value || "0");
                      setEditing({ ...editing, original_price: v > 0 ? v * 100 : null });
                    }}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
                    placeholder="499"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Дней</label>
                  <input
                    type="number"
                    value={editing.duration_days}
                    onChange={e => setEditing({ ...editing, duration_days: parseInt(e.target.value || "0") })}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Порядок</label>
                  <input
                    type="number"
                    value={editing.sort_order}
                    onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value || "0") })}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} />
                    Активен
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editing.popular} onChange={e => setEditing({ ...editing, popular: e.target.checked })} />
                    ★ Популярный
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-slate-400">Фичи</label>
                  <button onClick={addFeature} className="text-xs text-violet-400 hover:text-violet-300">+ Добавить</button>
                </div>
                <div className="space-y-2">
                  {editing.features.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={f}
                        onChange={e => updateFeature(i, e.target.value)}
                        className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
                        placeholder="Натальная карта"
                      />
                      <button onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-300 px-2">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm"
                >Отмена</button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
