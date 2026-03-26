const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();
const pool = require('./db'); 

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

async function enviarWhatsApp(telefono, nombrePlantilla, variables, idioma = "es_MX") {
  const WA_PHONE_ID = process.env.WA_PHONE_ID;
  const WA_TOKEN = process.env.WA_TOKEN;

  // Formatear las variables para la API de Meta
  const parameters = variables.map(text => ({ type: "text", text: String(text) }));

  const data = {
    messaging_product: "whatsapp",
    to: telefono, 
    type: "template",
    template: {
      name: nombrePlantilla,
      language: { code: idioma },
      components: [
        {
          type: "body",
          parameters: parameters
        }
      ]
    }
  };

  // 🚨 EL CHISMOSO:
  console.log("----------------------------------------");
  console.log("📢 ENVIANDO WHATSAPP A:", telefono);
  console.log("📢 LARGO DEL NÚMERO:", telefono.length, "dígitos");
  console.log("----------------------------------------");

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

// --- 1.8. Obtener Especialidades
app.get('/api/especialidades', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_especialidad, nombre FROM especialidades ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener especialidades' });
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
      SELECT p.id_paciente, p.nombre_paciente, p.curp, p.numero_telefono, 
             p.edad, p.sexo, p.correo, s.status as estado,
             TO_CHAR(p.fecha_registro, 'DD-MM-YYYY') as fecha_registro
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

// 6. --- AGENDA: Finalizar, Cancelar o Confirmar cita y avisar por WhatsApp ---
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

    //OBTENER DATOS PARA EL WHATSAPP
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
      
      // ✅ AHORA SÍ: Tomamos el número real directo de la base de datos
      let telefono = info.numero_telefono; 
      
      if (telefono) {
        telefono = String(telefono); 
        
        // Volvemos a activar la regla para que le agregue el código de país si le falta
        // (Si tu número funcionó mejor agregándole "521" en lugar de "52", cámbialo aquí)
        if (!telefono.startsWith("52")) {
          telefono = "52" + telefono; 
        }

        //DISPARAR EL MENSAJE SEGÚN EL ESTADO
        if (estado === 'Confirmada') {
          const vars = [info.nombre_paciente, info.fecha, info.hora, info.nombre_doctor, info.nombre_consultorio || "Por asignar"];
          enviarWhatsApp(telefono, "confirmacion", vars);
        } 
        else if (estado === 'Cancelada') {
          const vars = [info.nombre_paciente, info.fecha, info.hora];
          enviarWhatsApp(telefono, "cancelacion", vars);
        }
        else if (estado === 'Rechazada') {
          const vars = [info.nombre_paciente, info.fecha, info.hora, info.nombre_doctor];
          enviarWhatsApp(telefono, "rechazado", vars);
        }
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

  // Ahora recibimos 'consultorio' desde el frontend
  const { nombre, cedula_profesional, telefono, correo, usuario, contrasena, consultorio, id_especialidad} = req.body;
  
  if (!nombre || !contrasena) {
    return res.status(400).json({ error: "Campos obligatorios faltantes." });
  }

  try {
    const contrasenaHasheada = await bcrypt.hash(contrasena, 10);

    const nuevoDoctor = await pool.query(
      `INSERT INTO doctores (nombre_doctor, cedula_profesional, telefono, correo, usuario, contrasena, estado, consultorio, id_especialidad) 
       VALUES ($1, $2, $3, $4, $5, $6, 'Disponible', $7, $8) RETURNING *`,
      [nombre, cedula_profesional, telefono, correo, usuario, contrasenaHasheada, consultorio || null, id_especialidad || null]
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
  const { nombre_doctor, cedula_profesional, telefono, correo, consultorio, estado_actual } = req.body;

  try {
    const result = await pool.query(
      `UPDATE doctores 
       SET nombre_doctor = $1, cedula_profesional = $2, telefono = $3, correo = $4, consultorio = $5, estado = $6
       WHERE id_doctor = $7`,
      [nombre_doctor, cedula_profesional, telefono, correo, consultorio || null, estado_actual || 'Disponible', id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "No encontramos al paciente. Quizás ya se dio de alta por su cuenta." });
    }

    res.json({ 
      message: "Paciente enviado al archivo muerto con éxito. Ya no aparecerá en las listas activas, pero sus secretos (médicos) están a salvo con nosotros." 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fallo en el servidor al intentar procesar la baja." });
  }
});

// --- 9. PACIENTES: Registrar nuevo paciente ---
app.post('/api/pacientes', async (req, res) => {
  const { nombre_paciente, curp, numero_telefono, edad, sexo, correo, contrasena_plana } = req.body;

  if (!nombre_paciente || !curp || !numero_telefono || !contrasena_plana) {
    return res.status(400).json({ error: "Faltan datos obligatorios." });
  }

  try {
    const contrasenaHasheada = await bcrypt.hash(contrasena_plana, 10);

    const nuevoPaciente = await pool.query(
      `INSERT INTO pacientes 
      (nombre_paciente, curp, numero_telefono, edad, sexo, correo, status, contrasena, num_expediente) 
       VALUES ($1, $2, $3, $4, $5, $6, 1, $7, (SELECT COALESCE(MAX(num_expediente), 0) + 1 FROM pacientes)) RETURNING *`,
      [nombre_paciente, curp, numero_telefono, edad, sexo, correo, contrasenaHasheada]
    );

    // 🚨 DISPARAR WHATSAPP DE "BIENVENIDA" (Hack de Cita)
    let telPaciente = numero_telefono;
    if (telPaciente) {
      telPaciente = String(telPaciente);
      // Asegurarnos de que tenga el código de país
      if (!telPaciente.startsWith("52")) telPaciente = "52" + telPaciente;

      // Variables: {{1}} Nombre, {{2}} CURP, {{3}} Contraseña plana
      const varsPaciente = [nombre_paciente, curp, contrasena_plana];
      
      // ⚠️ IMPORTANTE: Cambia "nombre_de_tu_plantilla" por el nombre exacto que le pusiste en Meta
      enviarWhatsApp(telPaciente, "bienvenida_paciente", varsPaciente, "es"); 
    }

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
  const { nombre_paciente, curp, numero_telefono, edad, sexo, correo } = req.body;

  try {
    await pool.query(
      `UPDATE pacientes 
       SET nombre_paciente = $1, curp = $2, numero_telefono = $3, edad = $4, sexo = $5, correo = $6
       WHERE id_paciente = $7`,
      [nombre_paciente, curp, numero_telefono, edad, sexo, correo, id] 
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

// --- 11. PACIENTES: Cambiar estado ---
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

// --- 12. PACIENTES: Dar de baja (Soft Delete / Cambio de Estado) ---
app.put('/api/pacientes/:id/baja', async (req, res) => {
  const { id } = req.params;
  
  try {

    // Definimos que el ID 3 es 'DADO DE BAJA' en tu tabla 'status'
    const ID_STATUS_BAJA = 5; 

    const result = await pool.query(
      'UPDATE pacientes SET status = $1 WHERE id_paciente = $2 RETURNING *', 
      [ID_STATUS_BAJA, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "No encontramos al paciente. Quizás ya se dio de alta por su cuenta." });
    }

    res.json({ 
      message: "Paciente enviado al archivo muerto con éxito. Ya no aparecerá en las listas activas, pero sus secretos (médicos) están a salvo con nosotros." 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "fallo en el servidor al intentar procesar la baja." });
  }
});

// --- 13. PACIENTES: Generar nueva contraseña ---
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