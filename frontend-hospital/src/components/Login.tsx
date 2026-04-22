import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, User, Activity } from "lucide-react";
import { Boton } from "./comunes/Boton";
import { Input } from "./comunes/Input";
import { apiFetch } from "../api";

interface LoginProps {
  onLoginExitoso: () => void;
}

export function Login({ onLoginExitoso }: LoginProps) {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const res = await apiFetch("http://localhost:3333/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasena }),
      });

      const data = await res.json();

      if (res.ok) {
        // Guardamos el Gafete (Token)
        localStorage.setItem("hospital_token", data.token);
        localStorage.setItem("hospital_usuario", data.usuario);
        
        // Avisamos a App.tsx que ya podemos entrar
        onLoginExitoso(); 
      } else {
        setError(data.error || "Credenciales incorrectas");
      }
    } catch (err) {
      setError("Error al conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col justify-center items-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-black/[0.05] p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#1d1d1f]">CHEPA'S Hospital</h2>
          <p className="text-sm text-[#86868b] mt-1">Portal de Gestión Interna</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              required
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl text-sm transition-all outline-none"
              placeholder="Usuario"
            />
          </div>

          <div className="relative">
            <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="password" 
              required
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl text-sm transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          <Boton type="submit" className="w-full py-3" disabled={cargando}>
            {cargando ? "Validando acceso..." : "Iniciar Sesión"}
          </Boton>
        </form>
      </motion.div>
    </div>
  );
}