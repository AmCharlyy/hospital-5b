const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt'); // <-- Importamos bcrypt para hashear
require('dotenv').config();
const pool = require('./db'); 

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

async function enviarWhatsApp(telefono, nombrePlantilla, variables) {
  const WA_PHONE_ID = process.env.WA_PHONE_ID;
  const WA_TOKEN = process.env.WA_TOKEN;

  // Formatear las variables para la API de Meta
  const parameters = variables.map(text => ({ type: "text", text: String(text) }));

  const data = {
    messaging_product: "whatsapp",
    to: telefono, // Debe incluir el código de país, ej. 52 para México
    type: "template",
    template: {
      name: nombrePlantilla,
      language: { code: "es_MX" },
      components: [
        {
          type: "body",
          parameters: parameters
        }
      ]
    }
  };

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    if (result.error) console.error("Error de WhatsApp:", result.error.message);
    else console.log("WhatsApp enviado con éxito a", telefono);
  } catch (error) {
    console.error("Fallo al conectar con Meta:", error);
  }
}

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

// --- 2. PERSONAL: Doctores (Obtener) ---
app.get('/api/doctores/estado', async (req, res) => {
  try {
    const query = `
      SELECT d.id_doctor, d.nombre_doctor, e.nombre as especialidad,
             d.cedula_profesional, d.telefono, d.correo, d.usuario,
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

// --- AGENDA: Finalizar, Cancelar o Confirmar cita y avisar por WhatsApp ---
app.put('/api/citas/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  
  try {
    // 1. Actualizar el estado en la BD
    await pool.query('UPDATE citas SET estado = $1 WHERE id_cita = $2', [estado, id]);
    
    // 2. Liberar consultorio si se finaliza o cancela
    if (estado === 'Cancelada' || estado === 'Finalizada' || estado === 'Rechazada') {
      const citaRes = await pool.query('SELECT id_consultorio FROM citas WHERE id_cita = $1', [id]);
      if (citaRes.rows.length > 0 && citaRes.rows[0].id_consultorio) {
        await pool.query('UPDATE consultorios SET disponible = true WHERE id_consultorio = $1', [citaRes.rows[0].id_consultorio]);
      }
    }
// 3. OBTENER DATOS PARA EL WHATSAPP
    const datosCita = await pool.query(`
      SELECT p.numero_telefono, p.nombre_paciente, c.hora, 
             TO_CHAR(c.fecha, 'YYYY-MM-DD') as fecha, d.nombre_doctor, con.nombre_consultorio
      FROM citas c
      JOIN pacientes p ON c.id_paciente = p.id_paciente
      JOIN doctores d ON c.id_doctor = d.id_doctor
      LEFT JOIN consultorios con ON c.id_consultorio = con.id_consultorio
      WHERE c.id_cita = $1
    `, [id]);

    if (datosCita.rows.length > 0) {
      const info = datosCita.rows[0];
      let telefono = info.numero_telefono;
      
      // RED DE SEGURIDAD: Solo enviamos WhatsApp si hay un teléfono registrado
      if (telefono) {
        // Asegurarnos de que sea texto para que no explote la función startsWith
        telefono = String(telefono); 
        
        if (!telefono.startsWith("52")) telefono = "52" + telefono;

        // 4. DISPARAR EL MENSAJE SEGÚN EL ESTADO
        if (estado === 'Confirmada') {
          const vars = [info.nombre_paciente, info.fecha, info.hora, info.nombre_doctor, info.nombre_consultorio || "Por asignar"];
          enviarWhatsApp(telefono, "cita_confirmada", vars);
        } 
        else if (estado === 'Cancelada') {
          const vars = [info.nombre_paciente, info.fecha, info.hora];
          enviarWhatsApp(telefono, "cita_cancelada", vars);
        }
        else if (estado === 'Rechazada') {
          const vars = [info.nombre_paciente, info.fecha, info.hora, info.nombre_doctor];
          enviarWhatsApp(telefono, "cita_rechazada", vars);
        }
      } else {
        console.log("El paciente no tiene número de teléfono registrado. Omitiendo WhatsApp.");
      }
    }

    res.json({ message: `Cita actualizada a ${estado}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


// --- 7. PERSONAL: Añadir nuevo Doctor ---
app.post('/api/doctores', async (req, res) => {
  const { nombre, cedula_profesional, telefono, correo, usuario, contrasena } = req.body;
  
  if (!nombre || !contrasena) {
    return res.status(400).json({ error: "El nombre es obligatorio." });
  }

  try {
    //Hash contraseñas function
    const contrasenaHasheada = await bcrypt.hash(contrasena, 10);

    const nuevoDoctor = await pool.query(
      `INSERT INTO doctores (nombre_doctor, cedula_profesional, telefono, correo, usuario, contrasena, estado) 
       VALUES ($1, $2, $3, $4, $5, $6, 'Activo') RETURNING *`,
      [nombre, cedula_profesional, telefono, correo, usuario, contrasenaHasheada]
    );
    
    res.status(201).json(nuevoDoctor.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- 7.5. PERSONAL: Editar datos del Doctor (¡NUEVO!) ---
app.put('/api/doctores/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_doctor, cedula_profesional, telefono, correo } = req.body;

  try {
    await pool.query(
      `UPDATE doctores 
       SET nombre_doctor = $1, cedula_profesional = $2, telefono = $3, correo = $4
       WHERE id_doctor = $5`,
      [nombre_doctor, cedula_profesional, telefono, correo, id]
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
      `INSERT INTO pacientes 
      (nombre_paciente, curp, numero_telefono, edad, sexo, correo, status, contrasena) 
       VALUES ($1, $2, $3, 1, $4) RETURNING *`,
      [nombre_paciente, curp, numero_telefono, edad, sexo, correo, contrasenaHasheada]
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
  // 1. Agregamos edad, sexo y correo a la destructuración
  const { nombre_paciente, curp, numero_telefono, edad, sexo, correo } = req.body;

  try {
    // 2. Agregamos las columnas al UPDATE de SQL
    await pool.query(
      `UPDATE pacientes 
       SET nombre_paciente = $1, curp = $2, numero_telefono = $3, edad = $4, sexo = $5, correo = $6
       WHERE id_paciente = $7`,
      [nombre_paciente, curp, numero_telefono, edad, sexo, correo, id] // 3. Pasamos los valores
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