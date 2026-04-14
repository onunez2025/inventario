import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import type { Articulo, ConciliacionRecord, Perfil } from './types';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import SupervisorAuthModal from './components/SupervisorAuthModal';
import { ItemModal } from './components/ItemModal';
import { ProfileModal } from './components/ProfileModal';
import { Camera, Package, AlertTriangle, TrendingDown, LogOut, User, Database } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [data, setData] = useState<ConciliacionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'status' | 'master'>('status');
  const [showScanner, setShowScanner] = useState(false);
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showSupervisorAuth, setShowSupervisorAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [tempSku, setTempSku] = useState('');

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
      .maybeSingle();

    if (articulos && !error) {
       setSelectedArticulo(articulos);
       setShowScanner(false);
    } else {
       // Si no existe, pedir autorización de supervisor
       setTempSku(sku.trim());
       setShowSupervisorAuth(true);
       setShowScanner(false);
    }
  };

  const handleSupervisorSuccess = () => {
    setShowSupervisorAuth(false);
    setShowItemModal(true); // Abrir formulario de creación
  };

  const handleItemCreated = () => {
    setShowItemModal(false);
    // Una vez creado, podemos proceder a la verificación de stock automáticamente
    // O simplemente recargar la lista
    fetchData();
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
          <header className="bg-primary-container p-4 text-white shadow-lg sticky top-0 z-10 transition-all">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
              <h1 className="text-2xl font-display font-black tracking-tighter text-white">Invent<span className="text-secondary">-IA</span></h1>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowProfile(true)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-all px-3 py-1.5 rounded-2xl active:scale-95 border border-white/5"
                >
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-blue-200 leading-none tracking-widest">{perfil?.rol}</p>
                    <p className="text-xs font-bold text-white">{perfil?.nombre?.split(' ')[0] || 'Mi Cuenta'}</p>
                  </div>
                  <div className="w-8 h-8 bg-secondary rounded-xl flex items-center justify-center shadow-lg">
                    <User size={16} className="text-white" />
                  </div>
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-red-500/80 transition-all group border border-white/5"
                  title="Cerrar Sesión"
                >
                  <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </header>

          <main className="p-4 max-w-4xl mx-auto space-y-6 pb-24 flex-1">
            {/* Solo Supervisores ven KPIs Financieros */}
            {perfil?.rol === 'supervisor' && (
              <section className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-500">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-1 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingDown className="text-red-500" size={48} />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pérdida Valorizada</p>
                  <h2 className="text-2xl font-display font-bold text-red-600">S/. {Math.abs(totalPerdida).toLocaleString()}</h2>
                  <div className="h-1 w-12 bg-red-100 rounded-full mt-2"></div>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-1 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <AlertTriangle className="text-amber-500" size={48} />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Descuadres Críticos</p>
                  <h2 className="text-2xl font-display font-bold text-gray-800">{descuadresCriticos}</h2>
                  <div className="h-1 w-12 bg-amber-100 rounded-full mt-2"></div>
                </div>
              </section>
            )}

            {/* Progress Card */}
            <section className="bg-primary p-6 rounded-[2rem] text-white shadow-xl shadow-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <div className="flex justify-between items-end mb-4 relative z-10">
                <div>
                  <h3 className="text-lg font-bold">Progreso Toma Física</h3>
                  <p className="text-xs text-blue-100">Tienda: Lima Central</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-display font-black">{Math.round((progreso.completados / progreso.total) * 100)}<span className="text-sm ml-1">%</span></p>
                </div>
              </div>
              <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden relative z-10">
                <div 
                  className="bg-secondary h-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,161,222,0.5)]" 
                  style={{ width: `${(progreso.completados / progreso.total) * 100}%` }}
                />
              </div>
              <p className="mt-3 text-[10px] uppercase font-bold text-blue-200 tracking-widest">{progreso.completados} de {progreso.total} productos auditados</p>
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
                    <div className="text-center py-16 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                      <Package size={48} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-sm text-gray-400 font-medium">No se han registrado conteos hoy</p>
                      <button 
                        onClick={() => setShowScanner(true)}
                        className="mt-4 text-primary font-bold text-xs uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm"
                      >
                        Empezar a Escanear
                      </button>
                    </div>
                  ) : data.filter(d => d.cantidad_fisica > 0).map(record => (
                    <div 
                      key={record.sku} 
                      className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group active:scale-[0.98] transition-all cursor-pointer hover:border-secondary/30" 
                      onClick={() => handleScan(record.sku)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${record.diferencia_unidades === 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          <Package size={24} />
                        </div>
                        <div className="max-w-[180px]">
                          <p className="text-sm font-bold text-gray-800 truncate">{record.articulo_nombre}</p>
                          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{record.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-lg font-display font-bold text-gray-800">{record.cantidad_fisica}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">uds</span>
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${record.diferencia_unidades < 0 ? 'text-red-500' : 'text-green-600'}`}>
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-outline-variant/30 px-4 py-3 pb-8 flex justify-between items-center z-[140]">
        <button 
          onClick={() => setView('status')}
          className={`flex flex-col items-center flex-1 transition-all ${view === 'status' ? 'text-primary scale-110 font-bold' : 'text-gray-400'}`}
        >
          <TrendingDown size={22} />
          <span className="text-[9px] uppercase mt-1">Status</span>
        </button>
        
        <button 
          onClick={() => setShowScanner(true)}
          className="bg-primary p-4 rounded-[1.5rem] -mt-12 shadow-2xl shadow-primary/40 border-[6px] border-white text-white active:scale-90 transition-all hover:bg-primary-container z-10"
        >
          <Camera size={26} />
        </button>
        
        {/* Solo Supervisores ven el Maestro */}
        {perfil?.rol === 'supervisor' && (
          <button 
            onClick={() => setView('master')}
            className={`flex flex-col items-center flex-1 transition-all ${view === 'master' ? 'text-primary scale-110 font-bold' : 'text-gray-400'}`}
          >
            <Database size={22} />
            <span className="text-[9px] uppercase mt-1">Maestro</span>
          </button>
        )}

        {/* Botón de Perfil en Nav para Mobile */}
        <button 
          onClick={() => setShowProfile(true)}
          className={`flex flex-col items-center flex-1 transition-all text-gray-400`}
        >
          <User size={22} />
          <span className="text-[9px] uppercase mt-1">Perfil</span>
        </button>
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
      {showItemModal && (
        <ItemModal
          initialSku={tempSku}
          onClose={() => setShowItemModal(false)}
          onSave={handleItemCreated}
        />
      )}

      {showSupervisorAuth && (
        <SupervisorAuthModal
          isOpen={showSupervisorAuth}
          sku={tempSku}
          onClose={() => setShowSupervisorAuth(false)}
          onSuccess={handleSupervisorSuccess}
        />
      )}

      {showProfile && (
        <ProfileModal
          perfil={perfil}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
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
