  const express = require('express');
  const session = require('express-session');
  const mssql = require('mssql');
  const dotenv = require('dotenv');
  const bodyParser = require('body-parser');
  const Joi = require('joi');
  const path = require('path'); // Подключение модуля path
  const cookieParser = require('cookie-parser');

  dotenv.config();

  const app = express();
  const port = 3000;


  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(cookieParser());


  // Настроим сессии
  app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // установите secure: true, если используете HTTPS
  }));

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
      }),
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

  // Авторизация по роли
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

      if (result.recordset.length > 0) {
        const staff = result.recordset[0];

        if (staff.Password !== password) {
            return res.status(400).send('Неверный пароль');
        }

        req.session.userId = staff.ID_Staff;
        req.session.role = staff.roll_name;
        req.session.email = staff.Email;

        const birthdayCheck = await pool.request()
    .input('userId', mssql.Int, staff.ID_Staff)
    .query(`
      SELECT 
        CASE 
          WHEN MONTH(Date_birth) = MONTH(GETDATE()) AND DAY(Date_birth) = DAY(GETDATE()) 
          THEN 1 ELSE 0 
        END AS isBirthdayToday
      FROM Staff
      WHERE ID_Staff = @userId
    `);

  if (birthdayCheck.recordset[0]?.isBirthdayToday === 1) {
    req.session.isBirthday = true;
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

        if (result.recordset.length === 0) {
            return res.status(400).send('Пользователь не найден');
        }

        const user = result.recordset[0];

        if (user.Password !== password) {
            return res.status(400).send('Неверный пароль');
        }

        req.session.userId = user.ID_Users;
        req.session.email = user.Email;

        res.cookie('rememberUser', email, { 
          maxAge: 30 * 24 * 60 * 60 * 1000, 
          httpOnly: true 
        });
        
        return res.status(200).send('User');
      }
    } catch (error) {
      console.error('Ошибка сервера:', error);
      res.status(500).send('Ошибка сервера');
    }
  });

  // Проверка авторизации пользователя
  app.get('/api/check_auth', async (req, res) => {
    if (req.session.userId && req.session.role) {
      try {
        let result = await app.locals.db.request()
          .input('userId', mssql.Int, req.session.userId)
          .query(`
            SELECT s.*, r.roll_name
            FROM Staff s
            LEFT JOIN Role r ON s.ID_Role = r.ID_Role
            WHERE s.ID_Staff = @userId
          `);

        if (result.recordset.length > 0) {
          const staff = result.recordset[0];
          return res.json({
            isAuth: true,
            userId: staff.ID_Staff,
            email: staff.Email,
            role: staff.roll_name
          });
        } else {
          return res.json({
            isAuth: true,
            userId: req.session.userId, 
            email: req.session.email, 
            role: 'User'
          });
        }
      } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);
      }
    }
    
    // Проверяем куку rememberUser
    if (req.cookies.rememberUser) {
      return res.json({
        isAuth: false,
        rememberEmail: req.cookies.rememberUser
      });
    }
    
    return res.json({ isAuth: false });
  });

  // Выход из системы
  app.post('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error('Ошибка при выходе:', err);
        return res.status(500).send('Ошибка при выходе');
      }
      
      res.clearCookie('rememberUser');
      res.clearCookie('connect.sid'); 
      
      res.status(200).send('Успешный выход');
    });
  });

  // Пример использования userId в других маршрутах
  app.get('/profile', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).send('Пожалуйста, войдите в систему');
    }

    const userId = req.session.userId;

    res.send(`Добро пожаловать, пользователь с ID: ${userId}`);
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
  //Выборка таблицы customer_orders в datagrid(админ панель)
app.get('/api/customer_orders', async (req, res) => {
  try {
    const result = await app.locals.db.request().query(`
      SELECT 
        co.ID_Customers_orders, 
        u.First_name + ' ' + ISNULL(u.Last_name, '') + ' ' + ISNULL(u.Patronymic, '') AS Client_FullName,
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
  //Выборка таблицы processed_customer_orders в datagrid(админ панель)
app.get('/api/processed_customer_orders', async (req, res) => {
  try {
    const result = await app.locals.db.request().query(`
      SELECT 
        pco.ID_Processed_customer_orders, 
        u.First_name + ' ' + ISNULL(u.Last_name, '') + ' ' + ISNULL(u.Patronymic, '') AS Client_FullName,
        st.First_name + ' ' + ISNULL(st.Last_name, '') + ' ' + ISNULL(st.Patronymic, '') AS Staff_FullName,
        f.First_Name + ' ' + ISNULL(f.Last_Name, '') + ' ' + ISNULL(f.Patronymic, '') AS Foreman_FullName,
        so.Name_Status, 
        pco.Date_Start, 
        pco.Date_Ending,  
        pco.Final_sum
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

  //Вывод товаров на страницу Service
  app.get('/api/service', async (req, res) => {
    try {
      const pool = await mssql.connect(sqlConfig);
      const result = await pool.request().query(`
        SELECT ID_Service, Item_Name, Item_Description, Price,
          CAST('' AS XML).value('xs:base64Binary(xs:hexBinary(sql:column("Image")))', 'VARCHAR(MAX)') AS ImageBase64
        FROM Service
      `);
      res.json(result.recordset);
    } catch (err) {
      console.error('Ошибка при получении services:', err);
      res.status(500).send('Ошибка сервера');
    }
  });

  //Запрос для вывода данных услуги в личный кабинет
  app.get('/api/service/:id', async (req, res) => {
    const serviceId = req.params.id;
    try {
      const pool = await mssql.connect(sqlConfig);
      const result = await pool.request()
        .input('serviceId', mssql.Int, serviceId)
        .query(`
          SELECT 
            ID_Service, 
            Item_Name, 
            Item_Description, 
            Price,
            CAST('' AS XML).value('xs:base64Binary(xs:hexBinary(sql:column("Image")))', 'VARCHAR(MAX)') AS ImageBase64
          FROM Service
          WHERE ID_Service = @serviceId
        `);

      if (result.recordset.length === 0) {
        res.status(404).send('Товар не найден');
      } else {
        res.json(result.recordset[0]);
      }
    } catch (err) {
      console.error('Ошибка при получении данных товара:', err);
      res.status(500).send('Ошибка сервера');
    }
  });

  //Вывод заказов пользователя в личный кабинет
  app.get('/api/user_orders/:userId', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).send('Пожалуйста, войдите в систему');
    }


    try {
      const result = await app.locals.db.request()
        .input('userId', mssql.Int, userId)
        .query(`
          SELECT 
            pco.ID_Processed_customer_orders AS OrderID,
            pco.Date_Start AS OrderDate,
            pco.Date_Ending AS DateEnding,
            pco.Final_sum AS FinalSum,
            so.Name_Status AS Status,
            s.Item_Name AS Service
          FROM Processed_customer_orders pco
          INNER JOIN Customer_orders co ON pco.ID_Customer_orders = co.ID_Customers_orders
          INNER JOIN Service s ON co.ID_Service = s.ID_Service
          INNER JOIN Status_Orders so ON pco.ID_Status_Orders = so.ID_Status_Orders
          WHERE co.ID_Users = @userId
        `);


      const grouped = {};
      result.recordset.forEach(row => {
        const id = row.OrderID;
        if (!grouped[id]) {
          grouped[id] = {
            OrderID: row.OrderID,
            OrderDate: row.OrderDate,
            DateEnding: row.DateEnding,
            FinalSum: row.FinalSum,
            Status: row.Status,
            Items: []
          };
        }
        if (row.Service && !grouped[id].Items.includes(row.Service)) {
          grouped[id].Items.push(row.Service);
        }
      });

      res.json(Object.values(grouped));

    } catch (err) {
      console.error('Ошибка при получении заказов пользователя:', err);
      res.status(500).send('Ошибка сервера');
    }
  });

  //Получить id авторизовавшего пользователя
  app.get('/api/get_userId', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).send({ message: 'Пользователь не авторизован' });
    }
    res.json({ userId: req.session.userId });
  });

  // Получить данные пользователя для личного кабинета
  app.get('/api/get_user_data', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Не авторизован' });

    try {
      const result = await app.locals.db.request()
        .input('userId', mssql.Int, userId)
        .query(`
          SELECT 
            Email, Number_Phone, Address, Password, First_name, Last_name, Patronymic, Passport_details
          FROM Users
          WHERE ID_Users = @userId
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      res.json(result.recordset[0]);
    } catch (err) {
      console.error('Ошибка при получении данных пользователя:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Обновить данные пользователя в личном кабинете
  app.put('/api/update_user', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Не авторизован' });

    const {
      Email,
      Number_Phone,
      Address,
      First_name,
      Last_name,
      Patronymic,
      Passport_details,
      Password
    } = req.body;

    try {
      let query = `
        UPDATE Users
        SET 
          Email = @Email,
          Number_Phone = @Number_Phone,
          Address = @Address,
          First_name = @First_name,
          Last_name = @Last_name,
          Patronymic = @Patronymic,
          Passport_details = @Passport_details
      `;

      if (Password) {
        query += `, Password = @Password`;
      }

      query += ` WHERE ID_Users = @userId`;

      const request = app.locals.db.request()
        .input('Email', mssql.VarChar(40), Email)
        .input('Number_Phone', mssql.VarChar(20), Number_Phone)
        .input('Address', mssql.VarChar(20), Address)
        .input('First_name', mssql.VarChar(20), First_name)
        .input('Last_name', mssql.VarChar(20), Last_name)
        .input('Patronymic', mssql.VarChar(20), Patronymic)
        .input('Passport_details', mssql.VarChar(20), Passport_details)
        .input('userId', mssql.Int, userId);

      if (Password) {
        request.input('Password', mssql.VarChar(255), Password);
      }

      await request.query(query);
      
      res.json({ success: true });
    } catch (err) {
      console.error('Ошибка при обновлении пользователя:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  app.post('/api/requests', async (req, res) => {
    const { error, value } = requestSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { ID_Service, First_name, Last_name, Email, Additional_Info } = value;

    try {
      await pool.request()
        .input('ID_Service', ID_Service)
        .input('First_name', First_name)
        .input('Last_name', Last_name)
        .input('Email', Email)
        .input('Additional_Info', Additional_Info || '')
        .query(`
          INSERT INTO Requests (ID_Service, First_name, Last_name, Email, Additional_Info)
          VALUES (@ID_Service, @First_name, @Last_name, @Email, @Additional_Info)
        `);
      res.status(201).json({ message: 'Заявка успешно создана' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Ошибка при создании заявки' });
    }
  });

  // Маршрут создания заказа
  app.post('/api/customer_orders', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).send('Пользователь не авторизован');
    }

    // Добавить проверку наличия обязательных полей
    const { ID_Service, Order_Date, Status } = req.body;
    const ID_Users = req.session.userId;
    const data = req.body;
    data.ID_Staff = req.session.userId; // Используем ID из сессии

    if (!ID_Service || !Order_Date || !Status) {
      return res.status(400).send('Не все обязательные поля заполнены');
    }

    try {
      await app.locals.db.request()
        .input('ID_Service', mssql.Int, ID_Service)
        .input('ID_Users', mssql.Int, ID_Users)
        .input('Order_Date', mssql.Date, Order_Date)
        .input('Status', mssql.VarChar, Status)
        .query(`
          INSERT INTO Customer_orders 
            (ID_Service, ID_Users, Order_Date, Status)
          VALUES 
            (@ID_Service, @ID_Users, @Order_Date, @Status)
        `);

      res.status(200).send('Заказ добавлен');
    } catch (error) {
      console.error('Ошибка при добавлении заказа:', error);
      res.status(500).send('Ошибка сервера: ' + error.message);
    }
  });

  // Добавляем новый маршрут для получения доступных заказов
  app.get('/api/available_orders', async (req, res) => {
    try {
        const result = await app.locals.db.request().query(`
            SELECT 
                co.ID_Customers_orders, 
                u.First_name + ' ' + ISNULL(u.Last_name, '') + ' ' + ISNULL(u.Patronymic, '') AS Client_FullName,
                s.Item_Name AS Service, 
                co.Order_Date
            FROM Customer_orders co
            LEFT JOIN Users u ON co.ID_Users = u.ID_Users
            LEFT JOIN Service s ON co.ID_Service = s.ID_Service
            LEFT JOIN Processed_customer_orders pco ON co.ID_Customers_orders = pco.ID_Customer_orders
            WHERE pco.ID_Processed_customer_orders IS NULL
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Ошибка при получении доступных заказов:', err);
        res.status(500).send('Ошибка сервера');
    }
});

  // Маршрут для получения списка начальников
  app.get('/api/foremen_list', async (req, res) => {
    try {
      const result = await app.locals.db.request().query(`
        SELECT ID_Foreman, First_Name + ' ' + Last_Name AS FullName
        FROM Foremen
      `);
      res.json(result.recordset);
    } catch (err) {
      console.error('Ошибка при получении списка начальников:', err);
      res.status(500).send('Ошибка сервера');
    }
  });

  app.post('/api/processed_customer_orders', async (req, res) => {
    const { ID_Customer_orders } = req.body;
    
    try {
      // Проверяем существование заказа
      const orderCheck = await app.locals.db.request()
        .input('orderId', mssql.Int, ID_Customer_orders)
        .query('SELECT 1 FROM Customer_orders WHERE ID_Customers_orders = @orderId');
      
      if (orderCheck.recordset.length === 0) {
        return res.status(400).send('Указанный заказ не существует');
      }

      // Проверяем, не обработан ли уже заказ
      const processedCheck = await app.locals.db.request()
        .input('orderId', mssql.Int, ID_Customer_orders)
        .query('SELECT 1 FROM Processed_customer_orders WHERE ID_Customer_orders = @orderId');
      
      if (processedCheck.recordset.length > 0) {
        return res.status(400).send('Этот заказ уже обработан');
      }

      // Добавляем запись
      await app.locals.db.request()
        .input('ID_Customer_orders', mssql.Int, ID_Customer_orders)
        .input('ID_Staff', mssql.Int, req.body.ID_Staff)
        .input('ID_Foreman', mssql.Int, req.body.ID_Foreman)
        .input('ID_Status_Orders', mssql.Int, req.body.ID_Status_Orders)
        .input('Date_Start', mssql.Date, req.body.Date_Start)
        .input('Date_Ending', mssql.Date, null)
        .input('Final_sum', mssql.Decimal(10, 2), req.body.Final_sum)
        .query(`
          INSERT INTO Processed_customer_orders 
          (ID_Customer_orders, ID_Staff, ID_Foreman, ID_Status_Orders, Date_Start, Date_Ending, Final_sum)
          VALUES 
          (@ID_Customer_orders, @ID_Staff, @ID_Foreman, @ID_Status_Orders, @Date_Start, @Date_Ending, @Final_sum)
        `);

      res.status(200).send('Заказ успешно взят в работу');
    } catch (error) {
      console.error('Ошибка при добавлении заказа:', error);
      res.status(500).send('Ошибка сервера');
    }
  });

  // Маршрут для получения списка статусов
  app.get('/api/statuses_list', async (req, res) => {
    try {
      const result = await app.locals.db.request().query(`
        SELECT ID_Status_Orders, Name_Status
        FROM Status_Orders
      `);
      res.json(result.recordset);
    } catch (err) {
      console.error('Ошибка при получении списка статусов:', err);
      res.status(500).send('Ошибка сервера');
    }
  });

  // В server.js (Express)
  app.get('/api/processed_customer_orders/staff/:staffId', async (req, res) => {
    const staffId = req.params.staffId;
    
    try {
        const result = await app.locals.db.request()
            .input('staffId', mssql.Int, staffId)
            .query(`
                SELECT 
                    pco.ID_Processed_customer_orders, 
                    u.First_name + ' ' + ISNULL(u.Last_name, '') + ' ' + ISNULL(u.Patronymic, '') AS Client_FullName,
                    st.First_name + ' ' + ISNULL(st.Last_name, '') + ' ' + ISNULL(st.Patronymic, '') AS Staff_FullName,
                    f.First_Name + ' ' + ISNULL(f.Last_Name, '') + ' ' + ISNULL(f.Patronymic, '') AS Foreman_FullName,
                    so.Name_Status, 
                    pco.Date_Start, 
                    pco.Date_Ending,  
                    pco.Final_sum
                FROM Processed_customer_orders pco
                LEFT JOIN Customer_orders co ON pco.ID_Customer_orders = co.ID_Customers_orders
                LEFT JOIN Users u ON co.ID_Users = u.ID_Users
                LEFT JOIN Staff st ON pco.ID_Staff = st.ID_Staff
                LEFT JOIN Foremen f ON pco.ID_Foreman = f.ID_Foreman
                LEFT JOIN Status_Orders so ON pco.ID_Status_Orders = so.ID_Status_Orders
                WHERE pco.ID_Staff = @staffId
            `);
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Ошибка при получении заказов сотрудника:', err);
        res.status(500).send('Ошибка сервера');
    }
});

  app.get('/api/processed_customer_orders/:id', async (req, res) => {
    try {
        const result = await app.locals.db.request()
            .input('id', mssql.Int, req.params.id)
            .query(`
                SELECT 
                    pco.ID_Processed_customer_orders,
                    u.First_name + ' ' + ISNULL(u.Last_name, '') + ' ' + ISNULL(u.Patronymic, '') AS Client_FullName,
                    st.First_name + ' ' + ISNULL(st.Last_name, '') + ' ' + ISNULL(st.Patronymic, '') AS Staff_FullName,
                    f.First_Name + ' ' + ISNULL(f.Last_Name, '') + ' ' + ISNULL(f.Patronymic, '') AS Foreman_FullName,
                    pco.ID_Customer_orders,
                    pco.ID_Staff,
                    pco.ID_Foreman,
                    pco.ID_Status_Orders,
                    CONVERT(varchar, pco.Date_Start, 23) AS Date_Start,
                    CONVERT(varchar, pco.Date_Ending, 23) AS Date_Ending,
                    pco.Final_sum,
                    so.Name_Status
                FROM Processed_customer_orders pco
                LEFT JOIN Customer_orders co ON pco.ID_Customer_orders = co.ID_Customers_orders
                LEFT JOIN Users u ON co.ID_Users = u.ID_Users
                LEFT JOIN Staff st ON pco.ID_Staff = st.ID_Staff
                LEFT JOIN Foremen f ON pco.ID_Foreman = f.ID_Foreman
                LEFT JOIN Status_Orders so ON pco.ID_Status_Orders = so.ID_Status_Orders
                WHERE pco.ID_Processed_customer_orders = @id
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).send('Заказ не найден');
        }
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Ошибка при получении заказа:', err);
        res.status(500).send('Ошибка сервера');
    }
});

  // Обновление обработанного заказа
  app.put('/api/processed_customer_orders/:id', async (req, res) => {
    const { id } = req.params;
    const { 
      ID_Staff, 
      ID_Foreman, 
      ID_Status_Orders, 
      Date_Start, 
      Date_Ending, 
      Final_sum 
    } = req.body;

    try {
      await app.locals.db.request()
        .input('ID_Staff', mssql.Int, ID_Staff)
        .input('ID_Foreman', mssql.Int, ID_Foreman)
        .input('ID_Status_Orders', mssql.Int, ID_Status_Orders)
        .input('Date_Start', mssql.Date, Date_Start)
        .input('Date_Ending', mssql.Date, Date_Ending || null)
        .input('Final_sum', mssql.Decimal(10, 2), Final_sum)
        .input('id', mssql.Int, id)
        .query(`
          UPDATE Processed_customer_orders 
          SET 
            ID_Staff = @ID_Staff,
            ID_Foreman = @ID_Foreman,
            ID_Status_Orders = @ID_Status_Orders,
            Date_Start = @Date_Start,
            Date_Ending = @Date_Ending,
            Final_sum = @Final_sum
          WHERE ID_Processed_customer_orders = @id
        `);

      res.status(200).json({ message: 'Заказ успешно обновлен' });
    } catch (error) {
      console.error('Ошибка при обновлении заказа:', error);
      res.status(500).send('Ошибка при обновлении заказа');
    }
  });

  // Проверка дня рождения сотрудника
  app.get('/api/check_birthday', async (req, res) => {
    if (!req.session.userId || !req.session.role) {
      return res.json({ isBirthday: false });
    }

    try {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentDay = today.getDate();

      const result = await app.locals.db.request()
        .input('userId', mssql.Int, req.session.userId)
        .query(`
          SELECT 
            CASE 
              WHEN MONTH(Date_birth) = ${currentMonth} AND DAY(Date_birth) = ${currentDay} 
              THEN 1 ELSE 0 
            END AS isBirthdayToday
          FROM Staff
          WHERE ID_Staff = @userId
        `);

      const isBirthday = result.recordset[0]?.isBirthdayToday === 1;
      res.json({ isBirthday });
    } catch (err) {
      console.error('Ошибка при проверке дня рождения:', err);
      res.json({ isBirthday: false });
    }
  });

  console.log(`
    ███████╗██╗   ██╗██████╗  ██████╗ ██████╗ ██╗   ██╗██╗     ██████╗ 
    ██╔════╝██║   ██║██╔══██╗██╔═══██╗██╔══██╗██║   ██║██║     ██╔══██╗
    █████╗  ██║   ██║██████╔╝██║   ██║██████╔╝██║   ██║██║     ██║  ██║
    ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══██╗██║   ██║██║     ██║  ██║
    ███████╗╚██████╔╝██║  ██║╚██████╔╝██║  ██║╚██████╔╝███████╗██████╔╝
    ╚══════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═════╝ 
    `);

  app.listen(port, () => {
    console.log(`\n🚀 Сервер успешно запущен на порту ${port}`);
    console.log(`⏰ Время запуска: ${new Date().toLocaleString()}`);
    console.log(`🌐 Доступно по адресу: http://localhost:${port}`);
    console.log(`📊 Режим работы: ${process.env.NODE_ENV || 'development'}`);
    console.log(`\n🔮 Статистика:`);
    console.log(`   • Память: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    console.log(`   • Платформа: ${process.platform}`);
    console.log(`   • Версия Node: ${process.version}`);
  });

  // Подключение к БД с таймером
  console.log('\n🔌 Подключаемся к базе данных...');
  const dbStartTime = Date.now();

  mssql.connect(sqlConfig)
    .then(pool => {
      const dbConnectTime = Date.now() - dbStartTime;
      app.locals.db = pool;
      
      console.log(`\n✅ База данных подключена за ${dbConnectTime}ms`);
      console.log(`   • Сервер: ${sqlConfig.server}`);
      console.log(`   • Имя БД: ${sqlConfig.database}`);
      console.log(`   • Пользователь: ${sqlConfig.user}`);
      
      // Периодическая проверка соединения
      setInterval(async () => {
        try {
          await pool.request().query('SELECT 1');
        } catch (err) {
          console.error('\n❌ Потеряно соединение с базой данных!');
          console.error(`   • Время: ${new Date().toLocaleString()}`);
          console.error(`   • Ошибка: ${err.message}`);
        }
      }, 60000); // Каждую минуту
    })
    .catch(err => {
      console.error('\n❌ Ошибка подключения к базе данных:');
      console.error(`   • Сообщение: ${err.message}`);
      console.error(`   • Код: ${err.code}`);
      console.error(`   • Время: ${new Date().toLocaleString()}`);
      process.exit(1);
    });

  app.use((req, res, next) => {
    const start = Date.now();
    const { method, originalUrl, ip } = req;
    
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      const emoji = statusCode >= 400 ? '❌' : '✅';
      const color = statusCode >= 400 ? '\x1b[31m' : statusCode >= 300 ? '\x1b[33m' : '\x1b[32m';
      
      console.log(`${emoji} ${color}${method} ${originalUrl} - ${statusCode} (${duration}ms)\x1b[0m from ${ip}`);
    });
    
    next();
  });

  // Мониторинг памяти
  setInterval(() => {
    const memoryUsage = process.memoryUsage();
    console.log(`\n📊 Использование памяти:`);
    console.log(`   • RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`);
    console.log(`   • Heap: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB/${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`);
  }, 3600000); // Каждый час

  // Обработка ошибок с стилизацией
  process.on('unhandledRejection', (reason, promise) => {
    console.error('\n⚠️ \x1b[41mНеперехваченный промис\x1b[0m');
    console.error(`   • Причина: ${reason}`);
    console.error(`   • Время: ${new Date().toLocaleString()}`);
  });

  process.on('uncaughtException', (err) => {
    console.error('\n🔥 \x1b[41mКритическая ошибка\x1b[0m');
    console.error(`   • Сообщение: ${err.message}`);
    console.error(`   • Стек: ${err.stack}`);
    console.error(`   • Время: ${new Date().toLocaleString()}`);
    process.exit(1);
  });

  // Вывод при завершении работы
  process.on('SIGINT', () => {
    console.log('\n👋 Получен SIGINT. Завершаем работу...');
    process.exit(0);
  });

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });