import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import type { Articulo, ConciliacionRecord, Perfil } from './types';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Camera, Package, AlertTriangle, TrendingDown, LogOut } from 'lucide-react';
import { ScannerComponent } from './components/ScannerComponent';
import { VerificationModal } from './components/VerificationModal';
import { ItemMaster } from './components/ItemMaster';
import { LoginPage } from './components/LoginPage';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [data, setData] = useState<ConciliacionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'status' | 'master'>('status');
  const [showScanner, setShowScanner] = useState(false);
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null);

  useEffect(() => {
    // 1. Manejar sesión inicial y cambios
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchPerfil(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchPerfil(session.user.id);
      else setPerfil(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPerfil = async (userId: string) => {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data && !error) {
      setPerfil(data);
      // Si el usuario es operario, forzar vista status (no tiene acceso a master)
      if (data.rol === 'operario') setView('status');
    }
  };

  useEffect(() => {
    if (session && view === 'status') {
      fetchData();
    }
  }, [session, view]);

  const fetchData = async () => {
    setLoading(true);
    const { data: records, error } = await supabase
      .from('vista_conciliacion')
      .select('*');

    if (error) console.error('Error fetching data:', error);
    else setData(records || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleScan = async (sku: string) => {
    const { data: articulos, error } = await supabase
      .from('articulos')
      .select('*')
      .eq('sku', sku.trim())
      .single();

    if (articulos && !error) {
       setSelectedArticulo(articulos);
       setShowScanner(false);
    } else {
       alert('Producto no encontrado en el maestro');
    }
  };

  // Redirigir a Login si no hay sesión
  if (!session) return <LoginPage />;
  if (!perfil && loading) return <div className="min-h-screen flex items-center justify-center bg-surface"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  const totalPerdida = data.reduce((acc, curr) => acc + Math.min(0, curr.diferencia_valorizada), 0);
  const descuadresCriticos = data.filter(d => Math.abs(d.diferencia_unidades) > 5).length;
  const progreso = {
    total: data.length || 1,
    completados: data.filter(d => d.cantidad_fisica > 0).length
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {view === 'master' && perfil?.rol === 'supervisor' ? (
        <ItemMaster onBack={() => setView('status')} />
      ) : (
        <>
          {/* Header */}
          <header className="bg-primary-container p-4 text-white shadow-lg sticky top-0 z-10">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
              <h1 className="text-xl font-display uppercase tracking-widest">Inventory Curator</h1>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] uppercase font-bold text-primary-fixed/50 leading-none">{perfil?.rol}</p>
                  <p className="text-xs font-bold">{perfil?.nombre || perfil?.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-red-500 transition-colors group"
                  title="Cerrar Sesión"
                >
                  <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </header>

          <main className="p-4 max-w-4xl mx-auto space-y-6 pb-24 flex-1">
            {/* Solo Supervisores ven KPIs Financieros */}
            {perfil?.rol === 'supervisor' && (
              <section className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-500">
                <div className="card space-y-1">
                  <TrendingDown className="text-red-500 mb-2" size={24} />
                  <p className="text-sm text-on-surface/60">Pérdida Valorizada</p>
                  <h2 className="text-2xl font-display text-red-600">S/. {Math.abs(totalPerdida).toLocaleString()}</h2>
                </div>
                <div className="card space-y-1">
                  <AlertTriangle className="text-amber-500 mb-2" size={24} />
                  <p className="text-sm text-on-surface/60">Descuadres Críticos</p>
                  <h2 className="text-2xl font-display">{descuadresCriticos}</h2>
                </div>
              </section>
            )}

            {/* Progress Card */}
            <section className="card bg-primary-fixed/30 border-primary/10">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-lg">Progreso Toma Física</h3>
                  <p className="text-sm text-on-surface/60">Tienda: Lima Central</p>
                </div>
                <p className="text-primary font-bold">{Math.round((progreso.completados / progreso.total) * 100)}%</p>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-1000" 
                  style={{ width: `${(progreso.completados / progreso.total) * 100}%` }}
                />
              </div>
            </section>

            {/* Solo Supervisores ven Gráfico */}
            {perfil?.rol === 'supervisor' && data.length > 0 && (
              <section className="card h-64 animate-in fade-in duration-700">
                <h3 className="mb-4 text-sm uppercase tracking-wider text-on-surface/50">Diferencias por Producto</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.filter(d => d.diferencia_unidades !== 0).slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="sku" hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', background: '#fff' }}
                    />
                    <Bar dataKey="diferencia_valorizada" radius={[4, 4, 0, 0]}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.diferencia_valorizada < 0 ? '#dc2626' : '#059669'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </section>
            )}

            {/* List of Recent counts */}
            <section className="space-y-4">
              <h3 className="text-lg px-2">Actividad de Inventario</h3>
              <div className="space-y-3">
                  {data.filter(d => d.cantidad_fisica > 0).length === 0 ? (
                    <div className="text-center py-10 opacity-30 border-2 border-dashed border-on-surface/20 rounded-3xl">
                      <Package size={48} className="mx-auto mb-2" />
                      <p className="text-sm">No hay registros hoy</p>
                    </div>
                  ) : data.filter(d => d.cantidad_fisica > 0).map(record => (
                    <div key={record.sku} className="card p-4 flex justify-between items-center group active:scale-95 transition-all cursor-pointer" onClick={() => handleScan(record.sku)}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${record.diferencia_unidades === 0 ? 'bg-secondary/10 text-secondary' : 'bg-red-50 text-red-500'}`}>
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold truncate max-w-[150px]">{record.articulo_nombre}</p>
                          <p className="text-[10px] opacity-40 uppercase font-bold tracking-tighter">{record.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-display">{record.cantidad_fisica} <span className="text-[10px] opacity-40">uds</span></p>
                        <p className={`text-[10px] font-bold ${record.diferencia_unidades < 0 ? 'text-red-500' : 'text-secondary'}`}>
                          {record.diferencia_unidades === 0 ? 'CONCILIADO' : `${record.diferencia_unidades} UDS`}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </main>
        </>
      )}

      {/* Floating Bottom Nav for Mobile - Persistent */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant/30 px-6 py-4 pb-8 flex justify-between items-center z-20">
        <button 
          onClick={() => setView('status')}
          className={`flex flex-col items-center flex-1 transition-all ${view === 'status' ? 'text-primary scale-110' : 'text-on-surface/30'}`}
        >
          <TrendingDown size={24} />
          <span className="text-[10px] uppercase mt-1 font-bold">Status</span>
        </button>
        
        <button 
          onClick={() => setShowScanner(true)}
          className="bg-primary p-4 rounded-full -mt-14 shadow-xl border-[6px] border-surface text-white active:scale-90 transition-all hover:bg-primary-container"
        >
          <Camera size={28} />
        </button>
        
        {/* Solo Supervisores ven el Maestro */}
        {perfil?.rol === 'supervisor' && (
          <button 
            onClick={() => setView('master')}
            className={`flex flex-col items-center flex-1 transition-all ${view === 'master' ? 'text-primary scale-110' : 'text-on-surface/30'}`}
          >
            <Package size={24} />
            <span className="text-[10px] uppercase mt-1 font-bold">Master</span>
          </button>
        )}
      </nav>

      {/* Modals */}
      {showScanner && (
        <ScannerComponent 
          onScan={handleScan} 
          onCancel={() => setShowScanner(false)} 
        />
      )}

      {selectedArticulo && (
        <VerificationModal 
          articulo={selectedArticulo} 
          onClose={() => setSelectedArticulo(null)}
          onSave={() => {
            setSelectedArticulo(null);
            fetchData();
          }}
        />
      )}

      {loading && !data.length && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export default App;
