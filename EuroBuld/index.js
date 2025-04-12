const express = require('express');
const mssql = require('mssql');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const Joi = require('joi');
const path = require('path'); // Подключение модуля path

dotenv.config();

const app = express();
const port = 3000;

const validationSchemas = {
  users: Joi.object({
    Email: Joi.string().email().required().messages({
      'string.email': 'Неверный формат email',
      'any.required': 'Email обязателен для заполнения'
    }),
    Password: Joi.string().required().messages({
      'any.required': 'Пароль обязателен для заполнения'
    }),
    Number_Phone: Joi.string().optional(),
    Address: Joi.string().optional(),
    First_name: Joi.string().optional(),
    Last_name: Joi.string().optional(),
    Patronymic: Joi.string().optional(),
    Passport_details: Joi.string().optional()
  }),
  
  role: Joi.object({
    roll_name: Joi.string().required().messages({
      'any.required': 'Название роли обязательно'
    }),
    salary: Joi.string().required().messages({
      'any.required': 'Зарплата обязательна'
    })
  }),
  staff: Joi.object({
    ID_Role: Joi.number().integer().required().messages({
      'any.required': 'ID роли обязателен',
      'number.base': 'ID роли должен быть числом'
    }),    
    Email: Joi.string().email().required().messages({
      'string.email': 'Неверный формат email',
      'any.required': 'Email обязателен'
    }),
    Password: Joi.string().required().messages({
      'any.required': 'Пароль обязателен'
    }),
    First_name: Joi.string().required().messages({
      'any.required': 'Имя обязательно'
    }),
    Last_name: Joi.string().required().messages({
      'any.required': 'Фамилия обязательна'
    }),
    Patronymic: Joi.string().required(),
    Passport_details: Joi.string().required(),
    Date_birth: Joi.date().required().messages({
      'date.base': 'Неверный формат даты рождения',
      'any.required': 'Дата рождения обязательна'
    }),
    Date_employment: Joi.date().required().messages({
      'date.base': 'Неверный формат даты приёма на работу',
      'any.required': 'Дата приёма обязательна'
    })
  }),
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/css', express.static(path.join(__dirname, 'css')));

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/authorization', (req, res) => {
    res.sendFile(path.join(__dirname, 'Authorization.html'));
});

app.get('/аdmin_dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'Аdmin_dashboard.html'));
});

app.get('/eurobuld', (req, res) => {
    res.sendFile(path.join(__dirname, 'EuroBuld.html'));
});

const sqlConfig = {
    user: 'tosha',
    password: 'tosha',  
    server: 'DESKTOP-MMF0NKV', 
    database: 'EuroBuld', 
    options: {
        encrypt: true,
        trustServerCertificate: true,
        integratedSecurity: false 
    }
};

app.post('/api/staff', async (req, res) => {
  const { 
    ID_Role, 
    First_name, 
    Last_name, 
    Patronymic, 
    Passport_details, 
    Date_birth, 
    Date_employment, 
    Email, 
    Password 
  } = req.body;

  if (!ID_Role || !Email || !First_name || !Last_name || !Patronymic || !Passport_details || !Date_birth || !Date_employment || !Password) {
    return res.status(400).send('Все обязательные поля должны быть заполнены!');
  }

  try {
    await app.locals.db.request()
      .input('ID_Role', mssql.Int, ID_Role)
      .input('First_name', mssql.NVarChar, First_name)
      .input('Last_name', mssql.NVarChar, Last_name)
      .input('Patronymic', mssql.NVarChar, Patronymic)
      .input('Passport_details', mssql.NVarChar, Passport_details)
      .input('Date_birth', mssql.Date, Date_birth)
      .input('Date_employment', mssql.Date, Date_employment)
      .input('Email', mssql.NVarChar, Email)
      .input('Password', mssql.NVarChar, Password)
      .query('INSERT INTO Staff (ID_Role, First_name, Last_name, Patronymic, Passport_details, Date_birth, Date_employment, Email, Password) VALUES (@ID_Role, @First_name, @Last_name, @Patronymic, @Passport_details, @Date_birth, @Date_employment, @Email, @Password)');

    res.status(201).send('Сотрудник добавлен');
  } catch (error) {
    console.error(error);
    res.status(500).send('Ошибка при добавлении сотрудника');
  }
});

mssql.connect(sqlConfig)
  .then(pool => {
    console.log('Connected to the database');
    app.locals.db = pool;
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });

//Авторизация по ролли
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const pool = await mssql.connect(sqlConfig);

  try {
    let result = await pool.request()
        .input('Email', mssql.VarChar, email)
        .query(`
          SELECT s.*, r.roll_name
          FROM Staff s
          LEFT JOIN Role r ON s.ID_Role = r.ID_Role
          WHERE s.Email = @Email
        `);

    console.log("Staff Query Result: ", result.recordset); 

    if (result.recordset.length > 0) {
      const staff = result.recordset[0];

      if (staff.Password !== password) {
          return res.status(400).send('Неверный пароль');
      }

      if (staff.roll_name === 'Admin') {
          return res.status(200).send('Admin');
      } else if (staff.roll_name === 'Manager') {
          return res.status(200).send('Manager');
      } else {
          return res.status(200).send('Employee');
      }
    } else {

      result = await pool.request()
          .input('Email', mssql.VarChar, email)
          .query('SELECT * FROM Users WHERE Email = @Email');

      console.log("Users Query Result: ", result.recordset);

      if (result.recordset.length === 0) {
          return res.status(400).send('Пользователь не найден');
      }

      const user = result.recordset[0];

      if (user.Password !== password) {
          return res.status(400).send('Неверный пароль');
      }

      return res.status(200).send('User');
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).send('Ошибка сервера');
  }
});

//Выборка таблицы users в datagrid(админ панель)
app.get('/api/users', async (req, res) => {
  try {
    const pool = await mssql.connect(sqlConfig);
    const result = await pool.request().query(`
      SELECT ID_Users, Email, Password, Number_Phone, Address, First_name, Last_name, Patronymic, Passport_details
      FROM Users
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Ошибка при получении Users:', err);
    res.status(500).send('Ошибка сервера');
  }
});

//Выборка таблицы staff в datagrid(админ панель)
app.get('/api/staff', async (req, res) => {

  try {
    const pool = await mssql.connect(sqlConfig);
    const result = await pool.request().query(`
      SELECT s.ID_Staff,
             s.ID_Role,        -- добавляем идентификатор роли
             r.roll_name,
             s.Email,
             s.Password,
             s.First_name,
             s.Last_name,
             s.Patronymic,
             s.Passport_details,
             s.Date_birth,
             s.Date_employment
      FROM Staff s
      LEFT JOIN Role r ON s.ID_Role = r.ID_Role
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Ошибка при получении Staff:', err);
    res.status(500).send('Ошибка сервера');
  }
});

//Выборка таблицы role в datagrid(админ панель)
app.get('/api/role', async (req, res) => {
  try {
    const pool = await mssql.connect(sqlConfig);
    const result = await pool.request().query(`
      SELECT ID_Role, roll_name, salary
      FROM Role
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Ошибка при получении ролей:', err);
    res.status(500).send('Ошибка сервера');
  }
});

//Выборка таблицы service в datagrid(админ панель)
app.get('/api/service', async (req, res) => {
  try {
    const pool = await mssql.connect(sqlConfig);
    const result = await pool.request().query(`
      SELECT ID_Service, Item_Name, Item_Description, Price,
        CAST('' AS XML).value(
          'xs:base64Binary(xs:hexBinary(sql:column("Image")))',
          'VARCHAR(MAX)'
        ) AS ImageBase64
      FROM Service
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Ошибка при получении services:', err);
    res.status(500).send('Ошибка сервера');
  }
});

//Выборка таблицы requests в datagrid(админ панель)
app.get('/api/requests', async (req, res) => {
  try {
    const pool = await mssql.connect(sqlConfig);
    const result = await pool.request().query(`
      SELECT r.ID_Request,s.Item_Name, r.Request_Date, r.First_name, r.Last_name, r.Email, r.Additional_Info, r.Status
      FROM Requests r
      LEFT JOIN Service s ON r.ID_Service = s.ID_Service
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Ошибка при получении заявок:', err);
    res.status(500).send('Ошибка сервера');
  }
});

//Выборка таблицы customer_orders в datagrid(админ панель)
app.get('/api/customer_orders', async (req, res) => {
  try {
    const result = await app.locals.db.request().query(`
      SELECT 
        co.ID_Customers_orders, 
        u.First_name + ' ' + u.Last_name AS User_Name,
        s.Item_Name AS Service_Name,
        co.Order_Date,
        co.Status
      FROM Customer_orders co
      LEFT JOIN Users u ON co.ID_Users = u.ID_Users
      LEFT JOIN Service s ON co.ID_Service = s.ID_Service
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Ошибка при получении customer_orders:', err);
    res.status(500).send('Ошибка сервера');
  }
});

//Выборка таблицы processed_customer_orders в datagrid(админ панель)
app.get('/api/processed_customer_orders', async (req, res) => {
  try {
    const result = await app.locals.db.request().query(`
      SELECT 
        pco.ID_Processed_customer_orders, u.First_name + ' ' + u.Last_name AS Client, st.First_name + ' ' + st.Last_name AS Staff, f.First_Name + ' ' + f.Last_Name AS Foreman, so.Name_Status, pco.Date_Start, pco.Date_Ending,  pco.Final_sum
      FROM Processed_customer_orders pco
      LEFT JOIN Customer_orders co ON pco.ID_Customer_orders = co.ID_Customers_orders
      LEFT JOIN Users u ON co.ID_Users = u.ID_Users
      LEFT JOIN Staff st ON pco.ID_Staff = st.ID_Staff
      LEFT JOIN Foremen f ON pco.ID_Foreman = f.ID_Foreman
      LEFT JOIN Status_Orders so ON pco.ID_Status_Orders = so.ID_Status_Orders
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Ошибка при получении processed_customer_orders:', err);
    res.status(500).send('Ошибка сервера');
  }
});

//Выборка таблицы foremen в datagrid(админ панель)
app.get('/api/foremen', async (req, res) => {
  try {
    const result = await app.locals.db.request().query(`
      SELECT ID_Foreman, First_Name, Last_Name, Patronymic, Number_of_Workers, Number_phone
      FROM Foremen
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Ошибка при получении foremen:', err);
    res.status(500).send('Ошибка сервера');
  }
});

//Выборка таблицы status_Orders в datagrid(админ панель)
app.get('/api/status_Orders ', async (req, res) => {
  try {
    const result = await app.locals.db.request().query(`
      SELECT ID_Status_Orders , Name_Status
      FROM Status_Orders 
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Ошибка при получении foremen:', err);
    res.status(500).send('Ошибка сервера');
  }
});

//Добавление новой записи в таблицы datagrid(админ панель)
app.post('/api/:table', async (req, res) => {
  const { table } = req.params;
  const data = req.body;
  const schema = validationSchemas[table.toLowerCase()];

  delete data.id;

  if (schema) {
    const { error } = schema.validate(data);
    if (error) {
      return res.status(400).send(error.details[0].message); 
    }
  }

  try {
    let query = `INSERT INTO ${table} (`;
    let columns = [], values = [];

    Object.keys(data).forEach(key => {
      if (key !== 'id') {
        columns.push(key);
        values.push(`@${key}`);
      }
    });

    query += columns.join(', ') + ') VALUES (' + values.join(', ') + ')';

    const request = app.locals.db.request();
    Object.keys(data).forEach(key => {
      if (key !== 'id') {
        request.input(key, data[key]);
      }
    });

    const result = await request.query(query);
    res.status(201).json({ message: 'Запись добавлена', result });
  } catch (error) {
    console.error('Ошибка при добавлении:', error);
    res.status(500).send('Ошибка при добавлении записи');
  }
});

const idFields = {
  users: 'ID_Users',
  staff: 'ID_Staff',
  role: 'ID_Role',
  service: 'ID_Service',
  customer_orders: 'ID_Customers_orders',
  processed_customer_orders: 'ID_Processed_customer_orders',
  foremen: 'ID_Foreman',
  status_orders: 'ID_Status_Orders',
  requests: 'ID_Request'
};

//Обновления записи в таблицы datagrid(админ панель)
app.put('/api/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  const data = req.body;
  const idField = idFields[table.toLowerCase()] || 'ID';

  delete data.id;

  const schema = validationSchemas[table.toLowerCase()];
  if (schema) {
    const { error } = schema.validate(data);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }
  }

  try {
    let query = `UPDATE ${table} SET `;
    let params = [];

    Object.keys(data).forEach((key, index) => {
      if (key !== 'id') {
        query += `${key} = @${key}${index < Object.keys(data).length - 1 ? ',' : ''}`;
        params.push({ name: key, value: data[key] });
      }
    });

    query += ` WHERE ${idField} = @id`;

    const request = app.locals.db.request();
    params.forEach(param => request.input(param.name, param.value));
    request.input('id', mssql.Int, id);

    const result = await request.query(query);
    res.status(200).json(result);
  } catch (error) {
    console.error('Ошибка при обновлении:', error);
    res.status(500).send('Ошибка при обновлении записи');
  }
});

//Удаление записи в таблицы datagrid(админ панель)
app.delete('/api/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  const idField = idFields[table.toLowerCase()] || 'ID';

  try {
    const request = app.locals.db.request();
    request.input('id', mssql.Int, id);

    await request.query(`DELETE FROM ${table} WHERE ${idField} = @id`);
    res.send('Удалено');
  } catch (err) {
    console.error('Ошибка при удалении:', err);
    res.status(500).send('Ошибка сервера');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
