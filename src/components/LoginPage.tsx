import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, AlertCircle, Key, ArrowLeft, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'login' | 'recovery'>('login');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      if (error) throw error;
      setSuccessMessage('Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.');
    } catch (err: any) {
      setError(err.message || 'Error al enviar el correo de recuperación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Professional Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] animate-pulse delay-700" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px]" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden relative z-10 animate-in zoom-in-95 duration-700">
        <div className="bg-primary p-10 text-white text-center relative">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/20 overflow-hidden transform hover:scale-110 transition-transform">
             <img src="/logo.png" alt="Invent-IA Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-4xl font-display font-black tracking-tighter mb-2">
            Invent<span className="text-secondary">-IA</span>
          </h1>
          <p className="text-blue-100/70 text-sm font-bold uppercase tracking-widest">Gestión Inteligente de Activos</p>
        </div>

        <div className="p-10 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-sm flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p>{successMessage}</p>
            </div>
          )}

          {view === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-on-surface/40 ml-1 tracking-widest">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/30" size={18} />
                  <input 
                    type="email" 
                    required
                    className="input-field pl-12 focus:ring-primary shadow-sm"
                    placeholder="nombre@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">Contraseña</label>
                  <button 
                    type="button"
                    onClick={() => setView('recovery')}
                    className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/30" size={18} />
                  <input 
                    type="password" 
                    required
                    className="input-field pl-12 focus:ring-primary shadow-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full relative group overflow-hidden bg-primary text-white py-4 rounded-2xl flex items-center justify-center gap-3 mt-6 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_40px_-12px_rgba(0,49,120,0.3)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-container to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center gap-3">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                  {loading ? 'Iniciando...' : 'Entrar al Sistema'}
                </div>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecovery} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-on-surface/40 ml-1 tracking-widest">Correo de Recuperación</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/30" size={18} />
                  <input 
                    type="email" 
                    required
                    className="input-field pl-12 focus:ring-primary shadow-sm"
                    placeholder="nombre@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full relative group overflow-hidden bg-primary text-white py-4 rounded-2xl flex items-center justify-center gap-3 mt-6 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_40px_-12px_rgba(0,49,120,0.3)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-container to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center gap-3">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Key size={20} />}
                  {loading ? 'Enviando...' : 'Recuperar Contraseña'}
                </div>
              </button>

              <button 
                type="button" 
                onClick={() => setView('login')}
                className="w-full text-xs font-bold text-on-surface/50 flex items-center justify-center gap-2 hover:text-on-surface transition-colors"
              >
                <ArrowLeft size={16} /> Volver al inicio de sesión
              </button>
            </form>
          )}
        </div>
        
        <div className="bg-surface-container-low/50 backdrop-blur-md p-6 text-center border-t border-black/5">
           <p className="text-[10px] text-on-surface/40 font-bold uppercase tracking-[0.2em]">© 2026 MT INDUSTRIAL S.A.C - Sistema Interno</p>
        </div>
      </div>
    </div>
  );
};
