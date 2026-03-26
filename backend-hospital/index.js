const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt'); // <-- Importamos bcrypt para hashear
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

// --- 1.5 NUEVO: Consultorios Disponibles para los Menús Desplegables ---
app.get('/api/consultorios-disponibles', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_consultorio, nombre_consultorio 
      FROM consultorios 
      WHERE disponible = true
      ORDER BY id_consultorio ASC;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener consultorios disponibles' });
  }
});

// --- 2. PERSONAL: Doctores (Obtener) ---
app.get('/api/doctores/estado', async (req, res) => {
  try {
    const query = `
      SELECT d.id_doctor, d.nombre_doctor, e.nombre as especialidad,
             d.cedula_profesional, d.telefono, d.correo, d.usuario,
             d.consultorio, -- Columna real de tu tabla doctores
             con.nombre_consultorio as nombre_consultorio_asignado, -- Para mostrar el nombre si quieres
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM citas c 
            WHERE c.id_doctor = d.id_doctor 
            AND c.fecha = CURRENT_DATE 
            AND c.hora <= CURRENT_TIME 
            AND c.hora > CURRENT_TIME - INTERVAL '1 hour'
            AND c.estado NOT IN ('Cancelada', 'Finalizada')
          ) THEN 'En Consulta'
          ELSE d.estado 
        END as estado_actual
      FROM doctores d
      LEFT JOIN especialidades e ON d.id_especialidad = e.id_especialidad
      LEFT JOIN consultorios con ON d.consultorio = con.id_consultorio -- Unimos correctamente
      WHERE d.estado != 'Inactivo' 
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- 3. PACIENTES (Obtener) ---
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

// --- 4. AGENDA: Obtener todas las citas ---
app.get('/api/citas', async (req, res) => {
  try {
    const query = `
      SELECT c.id_cita, p.nombre_paciente, d.nombre_doctor, con.nombre_consultorio, 
             TO_CHAR(c.fecha, 'YYYY-MM-DD') as fecha, c.hora, c.estado, c.tipo_cita,
             c.id_paciente, c.id_doctor, c.id_consultorio
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

    if (id_consultorio) {
      await pool.query('UPDATE consultorios SET disponible = false WHERE id_consultorio = $1', [id_consultorio]);
    }

    res.json(nuevaCita.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- 6. AGENDA: Finalizar, Confirmar o Cancelar cita ---
app.put('/api/citas/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body; 
  
  try {
    await pool.query('UPDATE citas SET estado = $1 WHERE id_cita = $2', [estado, id]);
    
    if (estado === 'Cancelada' || estado === 'Finalizada') {
      const citaRes = await pool.query('SELECT id_consultorio FROM citas WHERE id_cita = $1', [id]);
      
      if (citaRes.rows.length > 0 && citaRes.rows[0].id_consultorio) {
        await pool.query('UPDATE consultorios SET disponible = true WHERE id_consultorio = $1', [citaRes.rows[0].id_consultorio]);
      }
    }

    res.json({ message: `Cita actualizada a ${estado} correctamente` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- 7. PERSONAL: Añadir nuevo Doctor ---
app.post('/api/doctores', async (req, res) => {
  // Ahora recibimos 'consultorio' desde el frontend
  const { nombre, cedula_profesional, telefono, correo, usuario, contrasena, consultorio } = req.body;
  
  if (!nombre) {
    return res.status(400).json({ error: "El nombre es obligatorio." });
  }

  try {
    const nuevoDoctor = await pool.query(
      `INSERT INTO doctores (nombre_doctor, cedula_profesional, telefono, correo, usuario, contrasena, estado, consultorio) 
       VALUES ($1, $2, $3, $4, $5, $6, 'Disponible', $7) RETURNING *`,
      // Pasamos la variable 'consultorio'
      [nombre, cedula_profesional, telefono, correo, usuario, contrasena, consultorio || null]
    );

    res.status(201).json(nuevoDoctor.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- 7.5. PERSONAL: Editar datos del Doctor ---
app.put('/api/doctores/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_doctor, cedula_profesional, telefono, correo, consultorio, estado_actual } = req.body;

  try {
    await pool.query(
      `UPDATE doctores 
       SET nombre_doctor = $1, 
           cedula_profesional = $2, 
           telefono = $3, 
           correo = $4,
           consultorio = $5, -- Actualizamos la columna correcta
           estado = $6
       WHERE id_doctor = $7`,
      [nombre_doctor, cedula_profesional, telefono, correo, consultorio || null, estado_actual || 'Disponible', id]
    );
    res.json({ message: "Datos del doctor actualizados correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- 8. PERSONAL: Eliminar Doctor (Soft Delete o Baja) ---
app.delete('/api/doctores/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE doctores SET estado = 'Inactivo' WHERE id_doctor = $1", [id]);
    res.json({ message: "Doctor dado de baja exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- 9. PACIENTES: Registrar nuevo paciente con contraseña hasheada ---
app.post('/api/pacientes', async (req, res) => {
  const { nombre_paciente, curp, numero_telefono, contrasena_plana } = req.body;

  if (!nombre_paciente || !curp || !numero_telefono || !contrasena_plana) {
    return res.status(400).json({ error: "Faltan datos obligatorios." });
  }

  try {
    const contrasenaHasheada = await bcrypt.hash(contrasena_plana, 10);

    const nuevoPaciente = await pool.query(
      `INSERT INTO pacientes (nombre_paciente, curp, numero_telefono, status, contrasena) 
       VALUES ($1, $2, $3, 1, $4) RETURNING *`,
      [nombre_paciente, curp, numero_telefono, contrasenaHasheada]
    );

    res.status(201).json(nuevoPaciente.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') { 
        return res.status(400).json({ error: "El CURP ingresado ya está registrado en el sistema." });
    }
    res.status(500).json({ error: error.message });
  }
});

// --- 10. PACIENTES: Editar datos del paciente ---
app.put('/api/pacientes/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_paciente, curp, numero_telefono } = req.body;

  try {
    await pool.query(
      `UPDATE pacientes 
       SET nombre_paciente = $1, curp = $2, numero_telefono = $3
       WHERE id_paciente = $4`,
      [nombre_paciente, curp, numero_telefono, id]
    );
    res.json({ message: "Paciente actualizado correctamente" });
  } catch (error) {
    if (error.code === '23505') {
        return res.status(400).json({ error: "Esa CURP ya está asignada a otro paciente." });
    }
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- 11. PACIENTES: Cambiar estado (Activar/Desactivar) ---
app.put('/api/pacientes/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { id_status } = req.body; 

  try {
    await pool.query('UPDATE pacientes SET status = $1 WHERE id_paciente = $2', [id_status, id]);
    res.json({ message: "Estado del paciente actualizado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- 12. PACIENTES: Generar nueva contraseña ---
app.put('/api/pacientes/:id/password', async (req, res) => {
  const { id } = req.params;
  const { contrasena_plana } = req.body;

  if(!contrasena_plana) return res.status(400).json({ error: "Falta la nueva contraseña" });

  try {
    const contrasenaHasheada = await bcrypt.hash(contrasena_plana, 10);
    await pool.query('UPDATE pacientes SET contrasena = $1 WHERE id_paciente = $2', [contrasenaHasheada, id]);
    
    res.json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo sin problemas en el puerto ${PORT}`);
});