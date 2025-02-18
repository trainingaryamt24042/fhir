const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 3000;

const pool = new Pool({
  host: 'w3.training5.modak.com',
  user: 'mt24042',
  password: 'mt24042@m06y24',
  database: 'postgres',
  port: 5432,
});

app.use(cors());

app.get('/patient-history', async (req, res) => {
  const { name } = req.query; // Accept name as a query parameter

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'The "name" query parameter is required.',
    });
  }

  try {
    const query = `
      SELECT
          pd.first_name,
          ph.s_no,
          ph.patient_id,
          ph.provider_name,
          prov.unique_provider_id,
          ph.doctor_name,
          ph.date_of_visit,
          ph.discharge_date,
          ph.payer,
          ph.disease,
          ph.path_lab_reports,
          ph.medicines_advised,
          ph.severity,
          pd.gender
      FROM 
          patient_history ph
      JOIN 
          people_details pd
      ON 
          ph.patient_id = pd.id
      LEFT JOIN 
          provider_details prov
      ON 
          ph.provider_name = prov.provider_name
      WHERE 
          pd.first_name ILIKE $1 -- Use ILIKE for case-insensitive partial matching
      GROUP BY 
          pd.first_name, ph.s_no, ph.patient_id, ph.provider_name, prov.unique_provider_id,
          ph.doctor_name, ph.date_of_visit, ph.discharge_date, ph.payer, ph.disease,
          ph.path_lab_reports, ph.medicines_advised, ph.severity, pd.gender;
    `;

    const result = await pool.query(query, [`%${name}%`]); // Add wildcards to search for partial names
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No patient history found for names matching: ${name}`,
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching patient history:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching patient history.',
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
