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
 
  const parameters = variables.map(text => ({ type: "text", text: String(text) }));
 
  const data = {
    messaging_product: "whatsapp",
    to: telefono,
    type: "template",
    template: {
      name: nombrePlantilla,
      language: { code: idioma },
      components: [{ type: "body", parameters }]
    }
  };
 
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

// ==========================================
// --- 1. INFRAESTRUCTURA ---
// ==========================================

// --- Consultorios ---
app.route('/api/consultorios')
  .get(async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          id_consultorio as id_ui, 
          nombre_consultorio as nombre, 
          id_consultorio, 
          nombre_consultorio, 
          piso, 
          edificio, 
          disponible, 
          id_area,
          CASE WHEN disponible = true THEN 'disponible' ELSE 'ocupada' END as estado, 
          'Consultorio' as tipo 
        FROM consultorios
        ORDER BY id_consultorio DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  })
  .post(async (req, res) => {
    const { nombre_consultorio, piso, edificio, id_area } = req.body;
    if (!nombre_consultorio) return res.status(400).json({ error: "El nombre del consultorio es obligatorio" });

    try {
      const result = await pool.query(
        `INSERT INTO consultorios (nombre_consultorio, piso, edificio, disponible, id_area) 
         VALUES ($1, $2, $3, true, $4) RETURNING *`,
        [nombre_consultorio, piso || null, edificio || 'Principal', id_area || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error al crear consultorio:", error);
      res.status(500).json({ error: error.message });
    }
  });

app.get('/api/consultorios-disponibles', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_consultorio, nombre_consultorio 
      FROM consultorios 
      WHERE disponible = true
      ORDER BY id_consultorio ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener consultorios disponibles' });
  }
});

app.route('/api/consultorios/:id')
  .put(async (req, res) => {
    const { id } = req.params;
    const { nombre_consultorio, piso, edificio, id_area } = req.body;

    try {
      const result = await pool.query(
        `UPDATE consultorios 
         SET nombre_consultorio = $1, piso = $2, edificio = $3, id_area = $4 
         WHERE id_consultorio = $5 RETURNING *`,
        [nombre_consultorio, piso, edificio, id_area, id]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: 'Consultorio no encontrado' });
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error al actualizar consultorio:", error);
      res.status(500).json({ error: error.message });
    }
  })
  .delete(async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query(`DELETE FROM consultorios WHERE id_consultorio = $1`, [id]);
      res.json({ message: "Consultorio eliminado exitosamente" });
    } catch (error) {
      console.error("Error al eliminar consultorio:", error);
      res.status(500).json({ error: "No se puede eliminar porque tiene citas o datos enlazados." });
    }
  });

app.put('/api/consultorios/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { disponible } = req.body;

  try {
    await pool.query('UPDATE consultorios SET disponible = $1 WHERE id_consultorio = $2', [disponible, id]);
    res.json({ message: "Disponibilidad actualizada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


// --- Habitaciones ---
app.route('/api/habitaciones')
  .get(async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT * FROM habitaciones 
        ORDER BY piso ASC, numero_habitacion ASC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener habitaciones:", error);
      res.status(500).json({ error: error.message });
    }
  })
  .post(async (req, res) => {
    const { numero_habitacion, piso, tipo_habitacion, costo_dia } = req.body;
    if (!numero_habitacion || !piso || !tipo_habitacion) {
      return res.status(400).json({ error: "Faltan datos obligatorios de la habitación." });
    }

    try {
      const result = await pool.query(
        `INSERT INTO habitaciones (numero_habitacion, piso, tipo_habitacion, estado, costo_dia) 
         VALUES ($1, $2, $3, 'Disponible', $4) RETURNING *`,
        [numero_habitacion, piso, tipo_habitacion, costo_dia || 0]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error al crear habitación:", error);
      res.status(500).json({ error: error.message });
    }
  });

app.get('/api/habitaciones-disponibles', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM habitaciones 
      WHERE estado = 'Disponible' 
      ORDER BY piso ASC, numero_habitacion ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener habitaciones disponibles:", error);
    res.status(500).json({ error: error.message });
  }
});

app.route('/api/habitaciones/:id')
  .put(async (req, res) => {
    const { id } = req.params;
    const { numero_habitacion, piso, tipo_habitacion, costo_dia } = req.body;

    try {
      const result = await pool.query(
        `UPDATE habitaciones 
         SET numero_habitacion = $1, piso = $2, tipo_habitacion = $3, costo_dia = $4 
         WHERE id_habitacion = $5 RETURNING *`,
        [numero_habitacion, piso, tipo_habitacion, costo_dia, id]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: 'Habitación no encontrada' });
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error al actualizar habitación:", error);
      res.status(500).json({ error: error.message });
    }
  })
  .delete(async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM habitaciones WHERE id_habitacion = $1', [id]);
      res.json({ message: "Habitación eliminada exitosamente" });
    } catch (error) {
      console.error("Error al eliminar habitación:", error);
      res.status(500).json({ error: "No se puede eliminar la habitación si hay pacientes asignados a ella." });
    }
  });

app.put('/api/habitaciones/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    await pool.query('UPDATE habitaciones SET estado = $1 WHERE id_habitacion = $2', [estado, id]);
    res.json({ message: `Estado de la habitación actualizado a ${estado}` });
  } catch (error) {
    console.error("Error al cambiar estado de habitación:", error);
    res.status(500).json({ error: error.message });
  }
});


// --- Auxiliares ---
(async function ensureAuxiliaresTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auxiliares (
        id_auxiliar SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        tipo_auxiliar TEXT NOT NULL,
        turno TEXT NOT NULL
      );
    `);
    console.log('Tabla auxiliares verificada');
  } catch (error) {
    console.error('Error al crear/verificar la tabla auxiliares:', error);
  }
})();

app.route('/api/auxiliares')
  .get(async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT id_auxiliar, nombre, apellido, tipo_auxiliar, turno
        FROM auxiliares
        ORDER BY id_auxiliar ASC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener auxiliares' });
    }
  })
  .post(async (req, res) => {
    const { nombre, apellido, tipo_auxiliar, turno } = req.body;
    if (!nombre || !apellido || !tipo_auxiliar || !turno) {
      return res.status(400).json({ error: 'Faltan datos obligatorios de auxiliar' });
    }

    try {
      const result = await pool.query(
        `INSERT INTO auxiliares (nombre, apellido, tipo_auxiliar, turno) VALUES ($1, $2, $3, $4) RETURNING *`,
        [nombre, apellido, tipo_auxiliar, turno]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear auxiliar' });
    }
  });

app.route('/api/auxiliares/:id')
  .put(async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, tipo_auxiliar, turno } = req.body;

    try {
      const result = await pool.query(
        `UPDATE auxiliares SET nombre = $1, apellido = $2, tipo_auxiliar = $3, turno = $4 WHERE id_auxiliar = $5 RETURNING *`,
        [nombre, apellido, tipo_auxiliar, turno, id]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: 'Auxiliar no encontrado' });
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar auxiliar' });
    }
  })
  .delete(async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query('DELETE FROM auxiliares WHERE id_auxiliar = $1', [id]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'Auxiliar no encontrado' });
      res.json({ message: 'Auxiliar eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar auxiliar' });
    }
  });


// ==========================================
// --- 2. CATÁLOGOS ---
// ==========================================

app.get('/api/especialidades', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_especialidad, nombre FROM especialidades ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener especialidades' });
  }
});


// ==========================================
// --- 3. PERSONAL: Doctores ---
// ==========================================

app.get('/api/doctores/estado', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.id_doctor, d.nombre_doctor, e.nombre as especialidad,
             d.cedula_profesional, d.telefono, d.correo, d.usuario,
             d.consultorio, 
             con.nombre_consultorio as nombre_consultorio_asignado, 
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
      LEFT JOIN consultorios con ON d.consultorio = con.id_consultorio 
      WHERE d.estado != 'Inactivo' 
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.route('/api/doctores')
  .post(async (req, res) => {
    const { nombre, cedula_profesional, telefono, correo, usuario, contrasena, consultorio, id_especialidad } = req.body;
    if (!nombre || !contrasena) return res.status(400).json({ error: "El nombre es obligatorio." });

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

app.route('/api/doctores/:id')
  .put(async (req, res) => {
    const { id } = req.params;
    const { nombre_doctor, cedula_profesional, telefono, correo, consultorio, estado, id_especialidad } = req.body;

    try {
      const result = await pool.query(
        `UPDATE doctores 
         SET nombre_doctor = $1, cedula_profesional = $2, telefono = $3, correo = $4, consultorio = $5, estado = $6, id_especialidad = $7
         WHERE id_doctor = $8 RETURNING *`,
        [nombre_doctor, cedula_profesional, telefono, correo, consultorio || null, estado || 'Disponible', id_especialidad || null, id]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: "Doctor no encontrado." });
      res.json({ message: "Datos del doctor actualizados correctamente" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error interno del servidor al actualizar al doctor." });
    }
  })
  .delete(async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("UPDATE doctores SET estado = 'Inactivo' WHERE id_doctor = $1", [id]);
      res.json({ message: "Doctor dado de baja exitosamente" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });


// ==========================================
// --- 4. PACIENTES ---
// ==========================================

app.get('/api/pacientes/completo', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id_paciente, p.nombre_paciente, p.curp, p.numero_telefono, 
             p.edad, p.sexo, p.correo, 
             efp.nombre_estado as estado,
             TO_CHAR(p.fecha_registro, 'DD-MM-YYYY') as fecha_registro
      FROM pacientes p 
      LEFT JOIN estado_flujo_paciente efp ON p.status = efp.id_estado
      ORDER BY p.id_paciente DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.route('/api/pacientes')
  .post(async (req, res) => {
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

      let telPaciente = String(numero_telefono);
      if (!telPaciente.startsWith("52")) telPaciente = "52" + telPaciente;
      enviarWhatsApp(telPaciente, "bienvenida_paciente", [nombre_paciente, curp, contrasena_plana], "es");

      res.status(201).json(nuevoPaciente.rows[0]);
    } catch (error) {
      console.error(error);
      if (error.code === '23505') return res.status(400).json({ error: "El CURP ingresado ya está registrado en el sistema." });
      res.status(500).json({ error: error.message });
    }
  });

app.route('/api/pacientes/:id')
  .put(async (req, res) => {
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
      if (error.code === '23505') return res.status(400).json({ error: "Esa CURP ya está asignada a otro paciente." });
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

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

app.put('/api/pacientes/:id/baja', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE pacientes SET status = $1 WHERE id_paciente = $2 RETURNING *',
      [5, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "No encontramos al paciente. Quizás ya se dio de alta por su cuenta." });
    res.json({ message: "Paciente enviado al archivo muerto con éxito. Ya no aparecerá en las listas activas, pero sus secretos (médicos) están a salvo con nosotros." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fallo multiorgánico en el servidor al intentar procesar la baja." });
  }
});

app.put('/api/pacientes/:id/password', async (req, res) => {
  const { id } = req.params;
  const { contrasena_plana } = req.body;
  if (!contrasena_plana) return res.status(400).json({ error: "Falta la nueva contraseña" });

  try {
    const contrasenaHasheada = await bcrypt.hash(contrasena_plana, 10);
    await pool.query('UPDATE pacientes SET contrasena = $1 WHERE id_paciente = $2', [contrasenaHasheada, id]);
    res.json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// --- 5. AGENDA: Citas ---
// ==========================================

app.route('/api/citas')
  .get(async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT c.id_cita, p.nombre_paciente, d.nombre_doctor, con.nombre_consultorio, 
               TO_CHAR(c.fecha, 'YYYY-MM-DD') as fecha, c.hora, c.estado, c.tipo_cita,
               c.id_paciente, c.id_doctor, c.id_consultorio
        FROM citas c
        JOIN pacientes p ON c.id_paciente = p.id_paciente
        JOIN doctores d ON c.id_doctor = d.id_doctor
        LEFT JOIN consultorios con ON c.id_consultorio = con.id_consultorio
        ORDER BY c.fecha DESC, c.hora DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  })
  .post(async (req, res) => {
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

      await pool.query('UPDATE pacientes SET status = 2 WHERE id_paciente = $1', [id_paciente]);

      res.json(nuevaCita.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

app.put('/api/citas/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    await pool.query('UPDATE citas SET estado = $1 WHERE id_cita = $2', [estado, id]);

    if (['Cancelada', 'Finalizada', 'Rechazada'].includes(estado)) {
      const citaRes = await pool.query('SELECT id_consultorio FROM citas WHERE id_cita = $1', [id]);
      if (citaRes.rows.length > 0 && citaRes.rows[0].id_consultorio) {
        await pool.query('UPDATE consultorios SET disponible = true WHERE id_consultorio = $1', [citaRes.rows[0].id_consultorio]);
      }
    }

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
      let telefono = String(info.numero_telefono);
      if (!telefono.startsWith("52")) telefono = "52" + telefono;

      if (estado === 'Confirmada') {
        enviarWhatsApp(telefono, "confirmacion", [info.nombre_paciente, info.fecha, info.hora, info.nombre_doctor, info.nombre_consultorio || "Por asignar"]);
      } else if (estado === 'Cancelada') {
        enviarWhatsApp(telefono, "cancelacion", [info.nombre_paciente, info.fecha, info.hora]);
      } else if (estado === 'Rechazada') {
        enviarWhatsApp(telefono, "rechazado", [info.nombre_paciente, info.fecha, info.hora, info.nombre_doctor]);
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