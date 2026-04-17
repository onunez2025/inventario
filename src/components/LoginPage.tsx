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
  };  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-105 animate-pulse-slow"
        style={{ 
          backgroundImage: 'url("/login-bg.png")',
          filter: 'brightness(0.85) contrast(1.1)'
        }} 
      />
      <div className="absolute inset-0 z-1 bg-gradient-to-br from-primary/40 via-primary/20 to-secondary/30 backdrop-blur-[2px]" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,49,120,0.35)] border border-white/20 overflow-hidden relative z-10 animate-in zoom-in-95 duration-700">
        {/* Header Section */}
        <div className="bg-primary/95 p-10 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -m-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -m-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl overflow-hidden transform hover:rotate-3 transition-transform duration-500 group">
             <img src="/logo.png" alt="Invent-IA Logo" className="w-20 h-20 object-contain group-hover:scale-110 transition-transform" />
          </div>
          <h1 className="text-5xl font-display font-black tracking-tighter mb-2">
            Invent<span className="text-secondary">-IA</span>
          </h1>
          <p className="text-blue-100/70 text-[10px] font-black uppercase tracking-[0.2em]">Gestión Inteligente de Activos</p>
        </div>

        {/* Form Section */}
        <div className="p-10 space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="font-medium">{successMessage}</p>
            </div>
          )}

          {view === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] uppercase font-black text-on-surface/70 ml-1 tracking-widest">Correo Electrónico</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/40 group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type="email" 
                    required
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl focus:outline-none transition-all shadow-sm"
                    placeholder="nombre@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[11px] uppercase font-black text-on-surface/70 tracking-widest">Contraseña</label>
                  <button 
                    type="button"
                    onClick={() => setView('recovery')}
                    className="text-[10px] font-black text-primary hover:text-secondary transition-colors uppercase tracking-widest"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/40 group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type="password" 
                    required
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl focus:outline-none transition-all shadow-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn-premium w-full py-5 rounded-[1.5rem] flex items-center justify-center gap-3 mt-8 text-lg font-black tracking-tight"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <LogIn size={24} />}
                {loading ? 'Iniciando Sesión...' : 'Entrar al Sistema'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecovery} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] uppercase font-black text-on-surface/70 ml-1 tracking-widest">Correo de Recuperación</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/40 group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type="email" 
                    required
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl focus:outline-none transition-all shadow-sm"
                    placeholder="nombre@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn-premium w-full py-5 rounded-[1.5rem] flex items-center justify-center gap-3 mt-8 text-lg font-black tracking-tight"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <Key size={24} />}
                {loading ? 'Enviando...' : 'Recuperar Contraseña'}
              </button>

              <button 
                type="button" 
                onClick={() => setView('login')}
                className="w-full text-xs font-black text-on-surface/60 flex items-center justify-center gap-2 hover:text-primary transition-all uppercase tracking-widest"
              >
                <ArrowLeft size={16} /> Volver al inicio
              </button>
            </form>
          )}
        </div>
        
        <div className="bg-surface-container-low/50 p-8 text-center border-t border-on-surface/5">
           <p className="text-[10px] text-on-surface/60 font-black uppercase tracking-[0.3em]">© 2026 MT INDUSTRIAL S.A.C • Sistema Interno</p>
        </div>
      </div>
    </div>
  );
};
