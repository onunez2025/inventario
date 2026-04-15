import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import type { Articulo, ConciliacionRecord, Perfil, Inventario, PermissionKey } from './types';
import { rbacService } from './services/rbacService';


import { 
  Camera, 
  Package, 
  TrendingDown, 
  LogOut, 
  User, 
  Database, 
  Users, 
  Calendar,
  Download
} from 'lucide-react';
import { excelService } from './services/excelService';
import { ScannerComponent } from './components/ScannerComponent';
import { VerificationModal } from './components/VerificationModal';
import { ItemMaster } from './components/ItemMaster';
import { LoginPage } from './components/LoginPage';
import SupervisorAuthModal from './components/SupervisorAuthModal';
import { ItemModal } from './components/ItemModal';
import { ProfileModal } from './components/ProfileModal';
import { UserManagement } from './components/UserManagement';
import { InventorySessions } from './components/InventorySessions';
import { InventoryHeader } from './components/InventoryHeader';
import { SystemStockTable } from './components/SystemStockTable';
import { PhysicalCountsTable } from './components/PhysicalCountsTable';
import { InventorySelector } from './components/InventorySelector';
import DashboardIndicators from './components/DashboardIndicators';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [data, setData] = useState<ConciliacionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [permisos, setPermisos] = useState<PermissionKey[]>([]);

  const [view, setView] = useState<'status' | 'master' | 'users' | 'inventory'>('status');
  const [activeInventory, setActiveInventory] = useState<Inventario | null>(() => {
    const saved = localStorage.getItem('activeInventory');
    return saved ? JSON.parse(saved) : null;
  });
  const [showScanner, setShowScanner] = useState(false);
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showSupervisorAuth, setShowSupervisorAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [tempSku, setTempSku] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'system_stock' | 'physical_counts'>('summary');
  const [recentCounts, setRecentCounts] = useState<any[]>([]);

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
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data && !error) {
        setPerfil(data);
        
        // Cargar permisos del rol
        const perms = await rbacService.getPermissionsByRole(data.rol);
        setPermisos(perms);

        if (data.rol === 'operario' && !perms.includes('view_master')) setView('status');


        // Auto-seleccionar inventario si no hay uno activo guardado
        const savedInv = localStorage.getItem('activeInventory');
        if (!savedInv) {
          const { data: invs } = await supabase
            .from('inventarios')
            .select('*')
            .eq('estado', 'abierto')
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (invs && invs.length > 0) {
            setActiveInventory(invs[0]);
            localStorage.setItem('activeInventory', JSON.stringify(invs[0]));
          }
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && view === 'status') {
      fetchData();
    }
  }, [session, view, activeInventory?.id]);

  const fetchData = async () => {
    if (!activeInventory) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Paginated fetch to overcome Supabase's 1000-row default limit
    let allRecords: ConciliacionRecord[] = [];
    let from = 0;
    const batchSize = 1000;
    let fetchError = null;

    while (true) {
      const { data: batch, error } = await supabase
        .from('vista_conciliacion')
        .select('*')
        .eq('inventario_id', activeInventory.id)
        .range(from, from + batchSize - 1);

      if (error) {
        fetchError = error;
        break;
      }

      allRecords = [...allRecords, ...(batch || [])];

      // If we got fewer rows than the batch size, we've reached the end
      if (!batch || batch.length < batchSize) break;
      from += batchSize;
    }

    if (fetchError) console.error('Error fetching data:', fetchError);
    else {
      setData(allRecords);
      console.log(`Vista conciliación: ${allRecords.length} registros cargados`);
    }

    // Fetch individual recent counts for the activity feed
    const { data: recent, error: recentError } = await supabase
      .from('conteos')
      .select(`
        id,
        cantidad_fisica,
        created_at,
        observacion,
        articulos(sku, nombre)
      `)
      .eq('inventario_id', activeInventory.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (recentError) console.error('Error fetching recent counts:', recentError);
    else setRecentCounts(recent || []);

    setLoading(false);
  };

  const handleSelectInventory = (inv: Inventario) => {
    setActiveInventory(inv);
    localStorage.setItem('activeInventory', JSON.stringify(inv));
    setView('status');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleScan = async (sku: string, mode: 'standard' | 'barrido' = 'standard') => {
    const { data: articulos, error } = await supabase
      .from('articulos')
      .select('*')
      .eq('sku', sku.trim())
      .maybeSingle();

    if (articulos && !error) {
       if (mode === 'barrido') {
         // Registro automático
         if (!activeInventory) return;
         
         const { error: insertError } = await supabase.from('conteos').insert({
           articulo_id: articulos.id,
           cantidad_fisica: 1,
           inventario_id: activeInventory.id,
           usuario_id: session?.user.id,
           observacion: 'Registro por barrido (1x1)'
         });

         if (insertError) {
           console.error('Error in barrido insert:', insertError);
         } else {
           // Actualizar datos locales para ver el progreso
           fetchData();
         }
       } else {
         setSelectedArticulo(articulos);
         setShowScanner(false);
       }
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

  const hasPermission = (key: PermissionKey) => permisos.includes(key);



  const progreso = {
    total: activeInventory ? (data.length || 0) : 0,
    completados: data.filter(d => Number(d.cantidad_fisica) > 0).length
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {(view === 'master' && hasPermission('view_master')) ? (
        <ItemMaster onBack={() => setView('status')} />
      ) : view === 'inventory' && hasPermission('view_inventory_sessions') ? (

        <div className="flex-1 flex flex-col bg-surface">
           <header className="bg-primary-container p-4 text-white shadow-lg sticky top-0 z-20">
              <div className="max-w-4xl mx-auto flex justify-between items-center">
                <button onClick={() => setView('status')} className="text-sm font-bold text-blue-100 flex items-center gap-2 hover:text-white transition-colors">
                  ← Volver
                </button>
                <h1 className="text-xl font-display font-black tracking-tight">Sesiones de Inventario</h1>
                <div className="w-16"></div>
              </div>
           </header>
           <div className="flex-1 overflow-auto">
              <InventorySessions 
                activeInventoryId={activeInventory?.id || null} 
                onSelectInventory={handleSelectInventory} 
              />
           </div>
        </div>
      ) : view === 'users' && hasPermission('view_users') ? (

        <div className="flex-1 flex flex-col bg-surface">
           {/* Header duplicado para vista master/users para consistencia */}
           <header className="bg-primary-container p-4 text-white shadow-lg sticky top-0 z-20">
              <div className="max-w-4xl mx-auto flex justify-between items-center">
                <button onClick={() => setView('status')} className="text-sm font-bold text-blue-100 flex items-center gap-2 hover:text-white transition-colors">
                  ← Volver
                </button>
                <h1 className="text-xl font-display font-black tracking-tight">Administración de Usuarios</h1>
                <div className="w-16"></div>
              </div>
           </header>
           <div className="flex-1 overflow-auto">
              <UserManagement canManageRBAC={hasPermission('manage_users')} />
           </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <header className="bg-primary-container px-4 py-3 sm:p-4 text-white shadow-lg sticky top-0 z-50 transition-all">
            <div className="max-w-4xl mx-auto flex justify-between items-center gap-2">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Invent-IA" className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-black/20" />
                <h1 className="text-xl sm:text-2xl font-display font-black tracking-tighter text-white flex-shrink-0">
                  Invent<span className="text-secondary">-IA</span>
                </h1>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button 
                  onClick={() => setShowProfile(true)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-all px-2 py-1 sm:px-3 sm:py-1.5 rounded-2xl active:scale-95 border border-white/5 min-w-0"
                >
                  <div className="text-right hidden xs:block">
                    <p className="text-[9px] sm:text-[10px] uppercase font-bold text-blue-200 leading-none tracking-widest mb-0.5">{perfil?.rol}</p>
                    <p className="text-xs font-bold text-white truncate max-w-[80px] sm:max-w-[120px]">{perfil?.nombre?.split(' ')[0] || 'Mi Cuenta'}</p>
                  </div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-secondary rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <User size={14} className="text-white sm:hidden" />
                    <User size={16} className="text-white hidden sm:block" />
                  </div>
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-red-500/80 transition-all group border border-white/5 flex-shrink-0"
                  title="Cerrar Sesión"
                >
                  <LogOut size={16} className="sm:hidden group-hover:scale-110 transition-transform" />
                  <LogOut size={18} className="hidden sm:block group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </header>

          <main className="p-4 max-w-4xl mx-auto space-y-6 pb-24 flex-1">
            {!activeInventory ? (
              <InventorySelector onSelect={handleSelectInventory} />
            ) : (
              <>
                <InventoryHeader 
                  activeInventory={activeInventory} 
                  onChangeInventory={() => setActiveInventory(null)} 
                />

                {/* Progress Card */}
                <section className="bg-primary p-6 rounded-[2rem] text-white shadow-xl shadow-primary/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="flex justify-between items-end mb-4 relative z-10">
                    <div>
                      <h3 className="text-lg font-bold">Progreso Toma Física</h3>
                      <p className="text-xs text-blue-100">Tienda: {activeInventory?.tienda_nombre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-display font-black">
                        {progreso.total > 0 ? Math.round((progreso.completados / progreso.total) * 100) : 0}
                        <span className="text-sm ml-1">%</span>
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden relative z-10">
                    <div 
                      className="bg-secondary h-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,161,222,0.5)]" 
                      style={{ width: `${progreso.total > 0 ? (progreso.completados / progreso.total) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="mt-3 text-[10px] uppercase font-bold text-blue-200 tracking-widest">{progreso.completados} de {progreso.total} productos auditados</p>
                </section>

                <div className="flex bg-gray-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'summary' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Resumen Cruce
                  </button>
                  {hasPermission('view_master') && (
                    <button 
                      onClick={() => setActiveTab('system_stock')}
                      className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'system_stock' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Stock Sistema
                    </button>
                  )}
                  <button 
                    onClick={() => setActiveTab('physical_counts')}
                    className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'physical_counts' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Conteos Detalle
                  </button>
                  {hasPermission('view_dashboard') && (
                    <button 
                      onClick={() => excelService.exportInventoryReport(data, activeInventory.tienda_nombre)}
                      className="ml-2 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-600 transition-all shadow-sm active:scale-95"
                      title="Exportar a Excel"
                    >
                      <Download size={16} />
                      <span className="hidden sm:inline">Exportar</span>
                    </button>
                  )}
                </div>

                {/* Tab: Stock de Sistema */}
                {activeTab === 'system_stock' && hasPermission('view_master') && (

                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <SystemStockTable inventarioId={activeInventory.id} onUpdate={fetchData} />
                  </div>
                )}

                {/* Tab: Historial Detallado de Conteos */}
                {activeTab === 'physical_counts' && (

                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <PhysicalCountsTable inventarioId={activeInventory.id} />
                  </div>
                )}

                {/* Tab: Resumen de Cruce (y vista de Operario) */}
                {(activeTab === 'summary' || perfil?.rol === 'operario') && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Solo Supervisores/Admins ven KPIs Financieros */}
                    {/* Indicadores de Dashboard (Solo para Supervisores/Admins) */}
                    {hasPermission('view_dashboard') && (

                      <DashboardIndicators data={data} tiendaNombre={activeInventory?.tienda_nombre} />
                    )}




                {/* List of Recent counts */}
                <section className="space-y-4">
                  <h3 className="text-lg px-2">Actividad de Inventario</h3>
                  <div className="space-y-3">
                      {recentCounts.length === 0 ? (
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
                      ) : (
                        recentCounts.map(count => (
                          <div 
                            key={count.id} 
                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group active:scale-[0.98] transition-all cursor-pointer hover:border-secondary/30" 
                            onClick={() => handleScan(count.articulos?.sku)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center transition-colors">
                                <Package size={24} />
                              </div>
                              <div className="max-w-[180px]">
                                <p className="text-sm font-bold text-gray-800 line-clamp-1">{count.articulos?.nombre}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{count.articulos?.sku}</p>
                                  <span className="text-[8px] text-gray-300 font-bold">•</span>
                                  <p className="text-[9px] text-gray-400 font-bold">{new Date(count.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-lg font-display font-bold text-secondary">{count.cantidad_fisica}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase">uds</span>
                              </div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-on-surface/30 truncate max-w-[80px]">
                                {count.observacion || 'Conteo'}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                  </div>
                </section>
              </div>
            )}
            </>
          )}
          </main>
        </>
      )}

      {/* Floating Bottom Nav for Mobile - Persistent */}
      {!showScanner && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 pb-8 flex items-end z-[140] shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
          {/* Lado Izquierdo: Acciones Principales */}
          <div className="flex-1 flex justify-around items-center pb-2 px-2">
            <button 
              onClick={() => setView('status')}
              className={`flex flex-col items-center flex-1 transition-all ${view === 'status' ? 'text-primary scale-110 font-black' : 'text-gray-400 font-medium'}`}
            >
              <TrendingDown size={22} />
              <span className="text-[10px] uppercase mt-1.5 tracking-tighter">Status</span>
            </button>
            
            {hasPermission('view_master') && (

              <button 
                onClick={() => setView('master')}
                className={`flex flex-col items-center flex-1 transition-all ${view === 'master' ? 'text-primary scale-110 font-black' : 'text-gray-400 font-medium'}`}
              >
                <Database size={22} />
                <span className="text-[10px] uppercase mt-1.5 tracking-tighter">Maestro</span>
              </button>
            )}
          </div>

          {/* Centro: Cámara (Eje Central) */}
          <div className="flex-none w-24 flex justify-center pb-6">
            <button 
              onClick={() => setShowScanner(true)}
              className="bg-primary p-5 rounded-[2.5rem] -mb-4 shadow-[0_15px_30px_rgba(0,49,120,0.3)] border-[8px] border-surface text-white active:scale-90 transition-all hover:bg-primary-container z-10 relative group"
            >
              <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-active:scale-100 transition-transform duration-300"></div>
              <Camera size={30} className="relative z-10" />
            </button>
          </div>

          {/* Lado Derecho: Gestión y Configuración */}
          <div className="flex-1 flex justify-around items-center pb-2 px-2">
            {hasPermission('view_inventory_sessions') && (

              <button 
                onClick={() => setView('inventory')}
                className={`flex flex-col items-center flex-1 transition-all ${view === 'inventory' ? 'text-primary scale-110 font-black' : 'text-gray-400 font-medium'}`}
              >
                <Calendar size={22} />
                <span className="text-[10px] uppercase mt-1.5 tracking-tighter">Programar</span>
              </button>
            )}

            {hasPermission('view_users') ? (

              <button 
                onClick={() => setView('users')}
                className={`flex flex-col items-center flex-1 transition-all ${view === 'users' ? 'text-primary scale-110 font-black' : 'text-gray-400 font-medium'}`}
              >
                <Users size={22} />
                <span className="text-[10px] uppercase mt-1.5 tracking-tighter">Usuarios</span>
              </button>
            ) : (
              /* Espaciador para mantener la cámara centrada si no hay botón de Usuarios */
              <div className="flex-1"></div>
            )}
          </div>
        </nav>
      )}

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
          inventarioId={activeInventory?.id || ''}
          usuarioId={session?.user.id || ''}
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
          session={session}
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
