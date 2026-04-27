import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import type { Articulo, Perfil, Inventario, PermissionKey, Zona } from './types';
import { rbacService } from './services/rbacService';

// Components
import { ScannerComponent } from './components/ScannerComponent';
import { VerificationModal } from './components/VerificationModal';
import { LoginPage } from './components/LoginPage';
import SupervisorAuthModal from './components/SupervisorAuthModal';
import { ItemModal } from './components/ItemModal';
import { ProfileModal } from './components/ProfileModal';
import { ZoneSelector } from './components/ZoneSelector';

// Pages & Layout
import MainLayout from './layouts/MainLayout';
import StatusPage from './pages/StatusPage';
import MasterPage from './pages/MasterPage';
import UsersPage from './pages/UsersPage';
import InventorySessionsPage from './pages/InventorySessionsPage';

// Hooks
import { useInventory } from './hooks/useInventory';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [permisos, setPermisos] = useState<PermissionKey[]>([]);

  const [activeInventory, setActiveInventory] = useState<Inventario | null>(() => {
    const saved = localStorage.getItem('activeInventory');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeZone, setActiveZone] = useState<Zona | null>(() => {
    const saved = localStorage.getItem('activeZone');
    return saved ? JSON.parse(saved) : null;
  });


  const { data, recentCounts, refresh: refreshData, debouncedRefresh } = useInventory(activeInventory);

  // ── Barrido scan queue: fire-and-forget inserts ──
  const barridoQueueRef = useRef<Array<{ articulo_id: string; sku: string; nombre: string }>>([]);
  const barridoProcessingRef = useRef(false);
  const [barridoCount, setBarridoCount] = useState(0);
  const [barridoPending, setBarridoPending] = useState(0);

  const processBarridoQueue = useCallback(async () => {
    if (barridoProcessingRef.current) return;
    barridoProcessingRef.current = true;

    while (barridoQueueRef.current.length > 0) {
      const item = barridoQueueRef.current.shift()!;
      setBarridoPending(barridoQueueRef.current.length);

      try {
        const { error: insertError } = await supabase.from('conteos').insert({
          articulo_id: item.articulo_id,
          cantidad_fisica: 1,
          inventario_id: activeInventory?.id,
          zona_id: activeZone?.id || null,
          usuario_id: session?.user.id,
          observacion: 'Registro por barrido (1x1)'
        });

        if (!insertError) {
          setBarridoCount(prev => prev + 1);
        } else {
          // Re-queue on transient error
          console.warn('Barrido insert error, re-queuing:', insertError.message);
          barridoQueueRef.current.unshift(item);
          // Small backoff to avoid hammering on persistent errors
          await new Promise(r => setTimeout(r, 500));
        }
      } catch (err) {
        console.error('Barrido insert exception:', err);
        barridoQueueRef.current.unshift(item);
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    setBarridoPending(0);
    barridoProcessingRef.current = false;
  }, [activeInventory?.id, activeZone?.id, session?.user?.id]);

  const [showScanner, setShowScanner] = useState(false);
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showSupervisorAuth, setShowSupervisorAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [tempSku, setTempSku] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchPerfil(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchPerfil(session.user.id);
      else {
        setPerfil(null);
        setLoading(false);
      }
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
        const perms = await rbacService.getPermissionsByRole(data.rol);
        setPermisos(perms);

        const savedInv = localStorage.getItem('activeInventory');
        if (!savedInv) {
          const { data: invs } = await supabase
            .from('inventarios')
            .select('*')
            .eq('estado', 'abierto')
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (invs && invs.length > 0) {
            handleSelectInventory(invs[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInventory = (inv: Inventario) => {
    setActiveInventory(inv);
    localStorage.setItem('activeInventory', JSON.stringify(inv));
    // Reset zone when changing inventory
    setActiveZone(null);
    localStorage.removeItem('activeZone');
  };

  const handleSelectZone = (zona: Zona | null) => {
    setActiveZone(zona);
    if (zona) {
      localStorage.setItem('activeZone', JSON.stringify(zona));
    } else {
      localStorage.removeItem('activeZone');
    }
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
        if (!activeInventory) return;

        // ── OPTIMIZED: Enqueue instead of blocking ──
        // The insert goes to a background queue so the scanner
        // never freezes waiting for the DB response.
        barridoQueueRef.current.push({
          articulo_id: articulos.id,
          sku: articulos.sku,
          nombre: articulos.nombre
        });
        setBarridoPending(barridoQueueRef.current.length);

        // Process queue in background (non-blocking)
        processBarridoQueue();

        // Debounced refresh: only hits the DB once scanning pauses for 3s
        debouncedRefresh(3000);

      } else {
        setSelectedArticulo(articulos);
        setShowScanner(false);
      }
    } else {
      setTempSku(sku.trim());
      setShowSupervisorAuth(true);
      setShowScanner(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return <LoginPage />;

  const hasPermission = (key: PermissionKey) => permisos.includes(key);

  return (
    <>
      <Routes>
        <Route element={
          <MainLayout 
            perfil={perfil} 
            permisos={permisos} 
            onLogout={handleLogout} 
            setShowProfile={setShowProfile}
            setShowScanner={setShowScanner}
          />
        }>
          <Route path="/" element={
            <StatusPage 
              activeInventory={activeInventory}
              activeZone={activeZone}
              onSelectZone={handleSelectZone}
              data={data}
              recentCounts={recentCounts}
              perfil={perfil}
              permisos={permisos}
              onSelectInventory={handleSelectInventory}
              onChangeInventory={() => setActiveInventory(null)}
              onScan={handleScan}
              setShowScanner={setShowScanner}
              fetchData={refreshData}
            />

          } />
          
          {hasPermission('view_master') && (
            <Route path="/master" element={<MasterPage />} />
          )}

          {hasPermission('view_users') && (
            <Route path="/users" element={<UsersPage permisos={permisos} />} />
          )}

          {hasPermission('view_inventory_sessions') && (
            <Route path="/inventory" element={
              <InventorySessionsPage 
                activeInventory={activeInventory} 
                onSelectInventory={handleSelectInventory} 
              />
            } />
          )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      {/* Modals */}
      {showScanner && (
        <ScannerComponent 
          onScan={handleScan} 
          onCancel={() => {
            setShowScanner(false);
            setBarridoCount(0); // Reset for next session
          }}
          barridoCount={barridoCount}
          barridoPending={barridoPending}
        />
      )}

      {selectedArticulo && (
        <VerificationModal 
          articulo={selectedArticulo} 
          inventarioId={activeInventory?.id || ''}
          zonaId={activeZone?.id}
          usuarioId={session?.user.id || ''}
          onClose={() => setSelectedArticulo(null)}
          onSave={() => {

            setSelectedArticulo(null);
            refreshData();
          }}
        />
      )}

      {showItemModal && (
        <ItemModal
          initialSku={tempSku}
          onClose={() => setShowItemModal(false)}
          onSave={() => {
            setShowItemModal(false);
            refreshData();
          }}
        />
      )}

      {showSupervisorAuth && (
        <SupervisorAuthModal
          isOpen={showSupervisorAuth}
          sku={tempSku}
          onClose={() => setShowSupervisorAuth(false)}
          onSuccess={() => {
            setShowSupervisorAuth(false);
            setShowItemModal(true);
          }}
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
    </>
  );
};

export default App;
