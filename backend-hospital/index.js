const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db'); 

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// --- 1. INFRAESTRUCTURA ---
app.get('/api/consultorios', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_consultorio as id_ui, nombre_consultorio as nombre, 
      CASE WHEN disponible = true THEN 'disponible' ELSE 'ocupada' END as estado, 
      'Consultorio' as tipo 
      FROM consultorios
      ORDER BY id_consultorio
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- 2. PERSONAL: Doctores ---
app.get('/api/doctores/estado', async (req, res) => {
  try {
    const query = `
      SELECT d.id_doctor, d.nombre_doctor, e.nombre as especialidad,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM citas c 
            WHERE c.id_doctor = d.id_doctor 
            AND c.fecha = CURRENT_DATE 
            AND c.hora <= CURRENT_TIME 
            AND c.hora > CURRENT_TIME - INTERVAL '1 hour'
            AND c.estado NOT IN ('Cancelada', 'Finalizada')
          ) THEN 'En Consulta'
          ELSE 'Disponible'
        END as estado_actual
      FROM doctores d
      LEFT JOIN especialidades e ON d.id_especialidad = e.id_especialidad
      WHERE d.estado = 'Activo'
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- 3. PACIENTES ---
app.get('/api/pacientes/completo', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id_paciente, p.nombre_paciente, p.curp, p.numero_telefono, s.status as estado 
      FROM pacientes p 
      LEFT JOIN status s ON p.status = s.id_status
      ORDER BY p.id_paciente DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- 4. AGENDA: Obtener todas las citas (¡ESTA RUTA FALTABA!) ---
app.get('/api/citas', async (req, res) => {
  try {
    const query = `
      SELECT c.id_cita, p.nombre_paciente, d.nombre_doctor, con.nombre_consultorio, 
             TO_CHAR(c.fecha, 'YYYY-MM-DD') as fecha, c.hora, c.estado, c.tipo_cita
      FROM citas c
      JOIN pacientes p ON c.id_paciente = p.id_paciente
      JOIN doctores d ON c.id_doctor = d.id_doctor
      LEFT JOIN consultorios con ON c.id_consultorio = con.id_consultorio
      ORDER BY c.fecha DESC, c.hora DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- 5. AGENDA: Crear cita y automatizar consultorio ---
app.post('/api/citas', async (req, res) => {
  const { id_paciente, fecha, id_consultorio, id_doctor, tipo_cita, hora } = req.body;
  if (!id_paciente || !id_doctor || !fecha || !hora) {
    return res.status(400).json({ error: "Faltan datos obligatorios." });
  }

  try {
    const check = await pool.query(`
      SELECT id_doctor, id_consultorio FROM citas 
      WHERE fecha = $1 AND hora = $2 AND estado NOT IN ('Cancelada', 'Finalizada')
      AND (id_doctor = $3 OR id_consultorio = $4)
    `, [fecha, hora, id_doctor, id_consultorio || null]);

    if (check.rows.length > 0) {
      const conflicto = check.rows[0];
      if (conflicto.id_doctor == id_doctor) return res.status(400).json({ error: "El doctor ya tiene una cita en ese horario." });
      else return res.status(400).json({ error: "El consultorio ya está reservado en ese horario." });
    }

    const nuevaCita = await pool.query(
      `INSERT INTO citas (id_paciente, fecha, id_consultorio, id_doctor, tipo_cita, hora, estado) 
       VALUES ($1, $2, $3, $4, $5, $6, 'Pendiente') RETURNING *`,
      [id_paciente, fecha, id_consultorio || null, id_doctor, tipo_cita || 'Consulta', hora]
    );

    // Automatización: Cambiar consultorio a ocupado
    if (id_consultorio) {
      await pool.query('UPDATE consultorios SET disponible = false WHERE id_consultorio = $1', [id_consultorio]);
    }

    res.json(nuevaCita.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- 6. AGENDA: Finalizar/Cancelar cita y liberar consultorio ---
app.put('/api/citas/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  
  try {
    await pool.query('UPDATE citas SET estado = $1 WHERE id_cita = $2', [estado, id]);
    
    // Automatización: Liberar consultorio si se finaliza o cancela
    if (estado === 'Cancelada' || estado === 'Finalizada') {
      const citaRes = await pool.query('SELECT id_consultorio FROM citas WHERE id_cita = $1', [id]);
      
      if (citaRes.rows.length > 0 && citaRes.rows[0].id_consultorio) {
        await pool.query('UPDATE consultorios SET disponible = true WHERE id_consultorio = $1', [citaRes.rows[0].id_consultorio]);
      }
    }

    res.json({ message: `Cita actualizada a ${estado}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo sin problemas en el puerto ${PORT}`);
});