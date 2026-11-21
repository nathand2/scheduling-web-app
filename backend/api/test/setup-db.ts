const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql');

const allowedHosts = new Set(['localhost', '127.0.0.1', '::1', 'mysql']);
const dbHost = process.env.DB_HOST;
const dbName = process.env.DB_DATABASE;

if (!allowedHosts.has(dbHost) || dbName !== 'scheduler_test') {
  throw new Error(
    'Refusing to initialize the test schema: DB_HOST must be local (or the CI mysql service) and DB_DATABASE must be scheduler_test.'
  );
}

const sourceSchemaPath = path.resolve(__dirname, '../init.sql');
const sourceSchema = fs.readFileSync(sourceSchemaPath, 'utf8');
const safeTestSchema = sourceSchema.replace(
  /^DROP DATABASE IF EXISTS scheduler;\r?\nCREATE DATABASE scheduler;\r?\nUSE scheduler;/m,
  'DROP DATABASE IF EXISTS scheduler_test;\nCREATE DATABASE scheduler_test;\nUSE scheduler_test;'
).replace(/^USE scheduler;$/gm, 'USE scheduler_test;');

if (
  safeTestSchema === sourceSchema ||
  safeTestSchema.includes('DROP DATABASE IF EXISTS scheduler;') ||
  !safeTestSchema.includes('DROP DATABASE IF EXISTS scheduler_test;')
) {
  throw new Error('Could not safely derive the test schema from init.sql.');
}

const connection = mysql.createConnection({
  host: dbHost,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
});

connection.query(safeTestSchema, (error) => {
  connection.end();
  if (error) {
    console.error('Unable to initialize scheduler_test:', error.message);
    process.exitCode = 1;
    return;
  }
  console.log('Initialized scheduler_test from init.sql.');
});
