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


  // Increase payload size limit
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.use(cookieParser());


  app.use((req, res, next) => {
    console.log('Incoming request:', req.method, req.url);
    console.log('Cookies:', req.cookies);
    console.log('Session ID:', req.sessionID);
    next();
  });
  
  // Настроим сессии
  app.use(session({
    secret: 'mamamamamdsadsadsds',
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: false,  // для HTTPS должно быть true
      sameSite: 'Lax', // добавить эту строку
      maxAge: 30 * 24 * 60 * 60 * 1000 // установите срок действия
    }
  }));

  const validationSchemas = {
    register: Joi.object({
      Email: Joi.string().email().required().messages({
        'string.email': 'Неверный формат email',
        'any.required': 'Email обязателен для заполнения'
      }),
      Password: Joi.string().min(6).required().messages({
        'string.min': 'Пароль должен содержать минимум 6 символов',
        'any.required': 'Пароль обязателен для заполнения'
      })
    }),
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
    const { email, password, rememberMe } = req.body;
  
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
        req.session.role = 'User'; // Добавляем роль для пользователя
  
        // Устанавливаем куку rememberUser только если пользователь выбрал "Запомнить меня"
        if (rememberMe) {
          res.cookie('rememberUser', email, {
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
            httpOnly: true,
            secure: false, // true если используете HTTPS
            sameSite: 'Lax'
          });
        }
        
        return res.status(200).send('User');
      }
    } catch (error) {
      console.error('Ошибка сервера:', error);
      res.status(500).send('Ошибка сервера');
    }
  });

  // Регистрация нового пользователя
  app.post('/register', async (req, res) => {
    const { error, value } = validationSchemas.register.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { Email, Password } = value;

    try {
      // Проверяем, существует ли уже пользователь с таким email
      const userCheck = await app.locals.db.request()
        .input('Email', mssql.VarChar, Email)
        .query('SELECT 1 FROM Users WHERE Email = @Email');

      if (userCheck.recordset.length > 0) {
        return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
      }

      // Создаем нового пользователя
      await app.locals.db.request()
        .input('Email', mssql.VarChar, Email)
        .input('Password', mssql.VarChar, Password)
        .query(`
          INSERT INTO Users (Email, Password)
          VALUES (@Email, @Password)
        `);

      res.status(201).json({ message: 'Регистрация успешна' });
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      res.status(500).json({ message: 'Ошибка сервера при регистрации' });
    }
  });

  // Проверка авторизации пользователя
  app.get('/api/check_auth', async (req, res) => {
    // Проверяем сессию в первую очередь
    if (req.session.userId) {
      try {
        if (req.session.role && req.session.role !== 'User') {
          // Для сотрудников
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
          }
        } else {
          // Для обычных пользователей
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
    
    // Проверяем куку rememberUser только если нет активной сессии
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

  app.get('/api/processed_customer_orders/:id', async (req, res) => {
    try {
      const result = await app.locals.db.request()
        .input('id', mssql.Int, req.params.id)
        .query(`
          SELECT 
            pco.ID_Processed_customer_orders,
            pco.ID_Customer_orders,
            pco.ID_Staff,
            pco.ID_Foreman,
            pco.ID_Status_Orders,
            CONVERT(varchar, pco.Date_Start, 23) AS Date_Start,
            CONVERT(varchar, pco.Date_Ending, 23) AS Date_Ending,
            pco.Final_sum,
            so.Name_Status
          FROM Processed_customer_orders pco
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

  //Выборка таблицы processed_customer_orders в datagrid(админ панель)
  app.put('/api/processed_customer_orders/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    try {
      await app.locals.db.request()
        .input('ID_Status_Orders', mssql.Int, data.ID_Status_Orders)
        .input('Date_Start', mssql.Date, data.Date_Start)
        .input('Date_Ending', mssql.Date, data.Date_Ending || null)
        .input('Final_sum', mssql.Decimal(10,2), data.Final_sum)
        .input('id', mssql.Int, id)
        .query(`
          UPDATE Processed_customer_orders 
          SET 
            ID_Status_Orders = @ID_Status_Orders,
            Date_Start = @Date_Start,
            Date_Ending = @Date_Ending,
            Final_sum = @Final_sum
          WHERE ID_Processed_customer_orders = @id
        `);

      res.status(200).json({ message: 'Запись обновлена' });
    } catch (error) {
      console.error('Ошибка при обновлении:', error);
      res.status(500).send('Ошибка сервера');
    }
  });

  //Выборка таблицы status_Orders в datagrid(админ панель)
  app.get('/api/status_Orders', async (req, res) => {
    try {
      const result = await app.locals.db.request().query(`
        SELECT ID_Status_Orders, Name_Status
        FROM Status_Orders
      `);
      res.json(result.recordset);
    } catch (err) {
      console.error('Ошибка при получении статусов:', err);
      res.status(500).send('Ошибка сервера');
    }
  });

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
  
    // Удаляем id, если есть
    delete data.id;
  
    // Валидация схемы, если задана
    if (schema) {
      const { error } = schema.validate(data);
      if (error) {
        return res.status(400).send(error.details[0].message); 
      }
    }
  
    try {
      // Обработка base64-изображения
      if ('ImageBase64' in data) {
        data.Image = Buffer.from(data.ImageBase64, 'base64');
        delete data.ImageBase64;
      }
  
      // Формируем SQL-запрос
      let columns = [], values = [];
      Object.keys(data).forEach(key => {
        columns.push(key);
        values.push(`@${key}`);
      });
  
      let query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')})`;
  
      const request = app.locals.db.request();
      Object.keys(data).forEach(key => {
        request.input(key, data[key]);
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

  // Обновление записи в таблице service
  app.put('/api/service/:id', async (req, res) => {
  const { id } = req.params; // ID получаем из URL, а не из тела запроса
  const { Item_Name, Item_Description, Price, ImageBase64 } = req.body;

  try {
    const checkResult = await app.locals.db.request()
      .input('id', mssql.Int, id)
      .query('SELECT 1 FROM Service WHERE ID_Service = @id');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).send('Услуга не найдена');
    }

    const updateData = {
      Item_Name,
      Item_Description: Item_Description || null,
      Price
    };

    if (ImageBase64) {
      updateData.Image = Buffer.from(ImageBase64, 'base64');
    }

    await app.locals.db.request()
      .input('Item_Name', mssql.NVarChar, updateData.Item_Name)
      .input('Item_Description', mssql.NVarChar, updateData.Item_Description)
      .input('Price', mssql.Decimal(10, 2), updateData.Price)
      .input('Image', updateData.Image ? mssql.VarBinary : mssql.NVarChar, updateData.Image || null)
      .input('id', mssql.Int, id)
      .query(`
        UPDATE Service 
        SET 
          Item_Name = @Item_Name,
          Item_Description = @Item_Description,
          Price = @Price
          ${updateData.Image ? ', Image = @Image' : ''}
        WHERE ID_Service = @id
      `);

    res.status(200).send('Услуга успешно обновлена');
  } catch (error) {
    console.error('Ошибка при обновлении услуги:', error);
    res.status(500).send('Ошибка сервера при обновлении услуги');
  }
  });

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
  
    if ('ImageBase64' in data) {
      data.Image = Buffer.from(data.ImageBase64, 'base64');
      delete data.ImageBase64;
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
  
      // Выполняем запрос
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

    const idField = idFields[table.toLowerCase()] || 'ID';

    try {
      const checkResult = await app.locals.db.request()
        .input('id', mssql.Int, id)
        .query(`SELECT 1 FROM ${table} WHERE ${idField} = @id`);
      
      if (checkResult.recordset.length === 0) {
        return res.status(404).send('Запись не найдена');
      }

      if (table === 'service') {
        const ordersCheck = await app.locals.db.request()
          .input('id', mssql.Int, id)
          .query('SELECT 1 FROM Customer_orders WHERE ID_Service = @id');
        
        if (ordersCheck.recordset.length > 0) {
          return res.status(400).send('Невозможно удалить услугу, так как она используется в заказах');
        }

        const requestsCheck = await app.locals.db.request()
          .input('id', mssql.Int, id)
          .query('SELECT 1 FROM Requests WHERE ID_Service = @id');
        
        if (requestsCheck.recordset.length > 0) {
          return res.status(400).send('Невозможно удалить услугу, так как она используется в заявках');
        }
      }

      await app.locals.db.request()
        .input('id', mssql.Int, id)
        .query(`DELETE FROM ${table} WHERE ${idField} = @id`);
      
      res.status(200).send('Запись успешно удалена');
    } catch (error) {
      console.error('Ошибка при удалении:', error);
      
      if (error.number === 547) {
        return res.status(400).send('Невозможно удалить запись, так как она связана с другими данными');
      }
      
      res.status(500).send('Ошибка сервера при удалении записи');
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
        .input('Email', mssql.NVarChar(40), Email)
        .input('Number_Phone', mssql.NVarChar(20), Number_Phone || '')
        .input('Address', mssql.NVarChar(255), Address || '') // Explicitly specify NVARCHAR with length
        .input('First_name', mssql.NVarChar(20), First_name || '')
        .input('Last_name', mssql.NVarChar(20), Last_name || '')
        .input('Patronymic', mssql.NVarChar(20), Patronymic || '')
        .input('Passport_details', mssql.NVarChar(20), Passport_details || '')
        .input('userId', mssql.Int, userId);
  
      if (Password) {
        request.input('Password', mssql.NVarChar(255), Password);
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

  app.post('/api/customer_orders', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).send('Пользователь не авторизован');
    }
  
    const { ID_Service, Order_Date, Status } = req.body;
    const ID_Users = req.session.userId;
  
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
      const orderCheck = await app.locals.db.request()
        .input('orderId', mssql.Int, ID_Customer_orders)
        .query('SELECT 1 FROM Customer_orders WHERE ID_Customers_orders = @orderId');
      
      if (orderCheck.recordset.length === 0) {
        return res.status(400).send('Указанный заказ не существует');
      }

      const processedCheck = await app.locals.db.request()
        .input('orderId', mssql.Int, ID_Customer_orders)
        .query('SELECT 1 FROM Processed_customer_orders WHERE ID_Customer_orders = @orderId');
      
      if (processedCheck.recordset.length > 0) {
        return res.status(400).send('Этот заказ уже обработан');
      }

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

  // Общая статистика
  app.get('/api/reports/general', async (req, res) => {
    const { period } = req.query;
    
    try {
      const currentData = await getGeneralStatsData(period);
      
      let previousData;
      if (period !== 'all') {
        previousData = await getGeneralStatsData(getPreviousPeriod(period));
      }
      
      const response = {
        users: calculateChange(currentData.users, previousData?.users),
        orders: calculateChange(currentData.orders, previousData?.orders),
        processed: calculateChange(currentData.processed, previousData?.processed),
        revenue: calculateChange(currentData.revenue, previousData?.revenue),
        staff: calculateChange(currentData.staff, previousData?.staff),
        requests: calculateChange(currentData.requests, previousData?.requests)
      };
      
      res.json(response);
    } catch (error) {
      console.error('Ошибка при получении общей статистики:', error);
      res.status(500).send('Ошибка сервера');
    }
  });

  // Динамика заказов
  app.get('/api/reports/orders-trend', async (req, res) => {
    const { start, end } = req.query;
    
    try {
      const result = await app.locals.db.request()
        .input('startDate', mssql.Date, start)
        .input('endDate', mssql.Date, end)
        .query(`
          WITH DateRange AS (
            SELECT CAST(@startDate AS DATE) AS Date
            UNION ALL
            SELECT DATEADD(DAY, 1, Date)
            FROM DateRange
            WHERE DATEADD(DAY, 1, Date) <= @endDate
          )
          SELECT 
            CONVERT(VARCHAR, dr.Date, 23) AS Date,
            COUNT(co.ID_Customers_orders) AS TotalOrders,
            SUM(CASE WHEN so.Name_Status = 'Завершен' THEN 1 ELSE 0 END) AS CompletedOrders
          FROM DateRange dr
          LEFT JOIN Customer_orders co ON CONVERT(DATE, co.Order_Date) = dr.Date
          LEFT JOIN Processed_customer_orders pco ON co.ID_Customers_orders = pco.ID_Customer_orders
          LEFT JOIN Status_Orders so ON pco.ID_Status_Orders = so.ID_Status_Orders
          GROUP BY dr.Date
          OPTION (MAXRECURSION 366);
        `);
      
      const labels = result.recordset.map(row => row.Date);
      const totalOrders = result.recordset.map(row => row.TotalOrders);
      const completedOrders = result.recordset.map(row => row.CompletedOrders);
      
      res.json({ labels, totalOrders, completedOrders });
    } catch (error) {
      console.error('Ошибка при получении динамики заказов:', error);
      res.status(500).send('Ошибка сервера');
    }
  });

  // Популярность услуг
  app.get('/api/reports/services-popularity', async (req, res) => {
    const { period } = req.query;
    let dateCondition = '';
    
    switch (period) {
      case 'month':
        dateCondition = 'WHERE co.Order_Date >= DATEADD(MONTH, -1, GETDATE())';
        break;
      case 'quarter':
        dateCondition = 'WHERE co.Order_Date >= DATEADD(QUARTER, -1, GETDATE())';
        break;
      case 'year':
        dateCondition = 'WHERE co.Order_Date >= DATEADD(YEAR, -1, GETDATE())';
        break;
      case 'all':
      default:
        dateCondition = '';
    }
    
    try {
      const result = await app.locals.db.request().query(`
        SELECT 
          s.Item_Name AS ServiceName,
          COUNT(co.ID_Customers_orders) AS OrderCount
        FROM Service s
        LEFT JOIN Customer_orders co ON s.ID_Service = co.ID_Service
        ${dateCondition}
        GROUP BY s.Item_Name
        ORDER BY OrderCount DESC
      `);
      
      const labels = result.recordset.map(row => row.ServiceName);
      const data = result.recordset.map(row => row.OrderCount);
      
      res.json({ labels, data });
    } catch (error) {
      console.error('Ошибка при получении популярности услуг:', error);
      res.status(500).send('Ошибка сервера');
    }
  });

  // Эффективность сотрудников
  app.get('/api/reports/staff-performance', async (req, res) => {
    const { period } = req.query;
    let dateCondition = '';
    
    switch (period) {
      case 'month':
        dateCondition = 'AND pco.Date_Start >= DATEADD(MONTH, -1, GETDATE())';
        break;
      case 'quarter':
        dateCondition = 'AND pco.Date_Start >= DATEADD(QUARTER, -1, GETDATE())';
        break;
      case 'year':
        dateCondition = 'AND pco.Date_Start >= DATEADD(YEAR, -1, GETDATE())';
        break;
    }
    
    try {
      const result = await app.locals.db.request().query(`
        SELECT 
          s.ID_Staff,
          s.First_name + ' ' + s.Last_name + ' ' + ISNULL(s.Patronymic, '') AS StaffName,
          r.roll_name AS Role,
          COUNT(pco.ID_Processed_customer_orders) AS OrderCount,
          AVG(DATEDIFF(DAY, pco.Date_Start, ISNULL(pco.Date_Ending, GETDATE()))) AS AvgDays,
          SUM(CAST(pco.Final_sum AS DECIMAL(10,2))) AS Revenue,
          CASE 
            WHEN COUNT(pco.ID_Processed_customer_orders) = 0 THEN 0
            ELSE 100 * SUM(CASE WHEN so.Name_Status = 'Завершен' THEN 1 ELSE 0 END) / COUNT(pco.ID_Processed_customer_orders)
          END AS Efficiency
        FROM Staff s
        LEFT JOIN Role r ON s.ID_Role = r.ID_Role
        LEFT JOIN Processed_customer_orders pco ON s.ID_Staff = pco.ID_Staff
        LEFT JOIN Status_Orders so ON pco.ID_Status_Orders = so.ID_Status_Orders
        WHERE pco.ID_Processed_customer_orders IS NOT NULL ${dateCondition}
        GROUP BY s.ID_Staff, s.First_name, s.Last_name, s.Patronymic, r.roll_name
        ORDER BY Revenue DESC
      `);
      
      res.json(result.recordset.map(row => ({
        id: row.ID_Staff,
        name: row.StaffName,
        role: row.Role,
        orders: row.OrderCount,
        avgDays: Math.round(row.AvgDays) || 0,
        revenue: row.Revenue || 0,
        efficiency: Math.round(row.Efficiency) || 0
      })));
    } catch (error) {
      console.error('Ошибка при получении эффективности сотрудников:', error);
      res.status(500).send('Ошибка сервера');
    }
  });

  // Финансовые показатели
  app.get('/api/reports/finance', async (req, res) => {
    const { period } = req.query;
    let groupBy, dateFormat;
    
    switch (period) {
      case 'month':
        groupBy = 'YEAR(Date), MONTH(Date)';
        dateFormat = 'YYYY-MM';
        break;
      case 'quarter':
        groupBy = 'YEAR(Date), DATEPART(QUARTER, Date)';
        dateFormat = 'YYYY-Q';
        break;
      case 'year':
        groupBy = 'YEAR(Date)';
        dateFormat = 'YYYY';
        break;
      default:
        groupBy = 'YEAR(Date), MONTH(Date)';
        dateFormat = 'YYYY-MM';
    }
    
    try {
      const result = await app.locals.db.request().query(`
        WITH FinanceData AS (
          SELECT 
            pco.Date_Start AS Date,
            CAST(pco.Final_sum AS DECIMAL(10,2)) AS Revenue,
            CAST(r.salary AS DECIMAL(10,2)) * COUNT(DISTINCT s.ID_Staff) AS Expenses
          FROM Processed_customer_orders pco
          LEFT JOIN Staff s ON pco.ID_Staff = s.ID_Staff
          LEFT JOIN Role r ON s.ID_Role = r.ID_Role
          GROUP BY pco.Date_Start, r.salary
        )
        SELECT 
          FORMAT(MIN(Date), '${dateFormat}') AS Period,
          SUM(Revenue) AS Revenue,
          SUM(Expenses) AS Expenses,
          SUM(Revenue) - SUM(Expenses) AS Profit
        FROM FinanceData
        GROUP BY ${groupBy}
        ORDER BY MIN(Date)
      `);
      
      const labels = result.recordset.map(row => row.Period);
      const revenue = result.recordset.map(row => row.Revenue || 0);
      const expenses = result.recordset.map(row => row.Expenses || 0);
      const profit = result.recordset.map(row => row.Profit || 0);
      
      res.json({ labels, revenue, expenses, profit });
    } catch (error) {
      console.error('Ошибка при получении финансовых показателей:', error);
      res.status(500).send('Ошибка сервера');
    }
  });

  // Последние заказы
  app.get('/api/reports/recent-orders', async (req, res) => {
    const { count } = req.query;
    
    try {
      const result = await app.locals.db.request()
        .input('count', mssql.Int, count)
        .query(`
          SELECT TOP (@count)
            pco.ID_Processed_customer_orders AS ID,
            u.First_name + ' ' + ISNULL(u.Last_name, '') AS Client,
            s.Item_Name AS Service,
            pco.Date_Start AS Date,
            so.Name_Status AS Status,
            pco.Final_sum AS Amount
          FROM Processed_customer_orders pco
          LEFT JOIN Customer_orders co ON pco.ID_Customer_orders = co.ID_Customers_orders
          LEFT JOIN Users u ON co.ID_Users = u.ID_Users
          LEFT JOIN Service s ON co.ID_Service = s.ID_Service
          LEFT JOIN Status_Orders so ON pco.ID_Status_Orders = so.ID_Status_Orders
          ORDER BY pco.Date_Start DESC
        `);
      
      res.json(result.recordset.map(row => ({
        id: row.ID,
        client: row.Client,
        service: row.Service,
        date: row.Date,
        status: row.Status,
        amount: row.Amount
      })));
    } catch (error) {
      console.error('Ошибка при получении последних заказов:', error);
      res.status(500).send('Ошибка сервера');
    }
  });

  // Общая статистика
  app.get('/api/reports/general', async (req, res) => {
    const { period } = req.query;
    
    try {
      const currentData = await getGeneralStatsData(period);
      
      let previousData;
      if (period !== 'all') {
        previousData = await getGeneralStatsData(getPreviousPeriod(period));
      }
      
      const response = {
        users: calculateChange(currentData.users, previousData?.users),
        orders: calculateChange(currentData.orders, previousData?.orders),
        processed: calculateChange(currentData.processed, previousData?.processed),
        revenue: calculateChange(currentData.revenue, previousData?.revenue),
        staff: calculateChange(currentData.staff, previousData?.staff),
        requests: calculateChange(currentData.requests, previousData?.requests)
      };
      
      res.json(response);
    } catch (error) {
      console.error('Ошибка при получении общей статистики:', error);
      res.status(500).send('Ошибка сервера');
    }
  });

  app.get('/api/reports/orders-trend', async (req, res) => {
    const { start, end } = req.query;
    
    try {
      const result = await app.locals.db.request()
        .input('startDate', mssql.Date, start)
        .input('endDate', mssql.Date, end)
        .query(`
          WITH DateRange AS (
            SELECT CAST(@startDate AS DATE) AS Date
            UNION ALL
            SELECT DATEADD(DAY, 1, Date)
            FROM DateRange
            WHERE DATEADD(DAY, 1, Date) <= @endDate
          )
          SELECT 
            CONVERT(VARCHAR, dr.Date, 23) AS Date,
            COUNT(co.ID_Customers_orders) AS TotalOrders,
            SUM(CASE WHEN so.Name_Status = 'Завершен' THEN 1 ELSE 0 END) AS CompletedOrders
          FROM DateRange dr
          LEFT JOIN Customer_orders co ON CONVERT(DATE, co.Order_Date) = dr.Date
          LEFT JOIN Processed_customer_orders pco ON co.ID_Customers_orders = pco.ID_Customer_orders
          LEFT JOIN Status_Orders so ON pco.ID_Status_Orders = so.ID_Status_Orders
          GROUP BY dr.Date
          OPTION (MAXRECURSION 366);
        `);
      
      const labels = result.recordset.map(row => row.Date);
      const totalOrders = result.recordset.map(row => row.TotalOrders);
      const completedOrders = result.recordset.map(row => row.CompletedOrders);
      
      res.json({ labels, totalOrders, completedOrders });
    } catch (error) {
      console.error('Ошибка при получении динамики заказов:', error);
      res.status(500).send('Ошибка сервера');
    }
  });

  // Популярность услуг
  app.get('/api/reports/services-popularity', async (req, res) => {
    const { period } = req.query;
    let dateCondition = '';
    
    switch (period) {
      case 'month':
        dateCondition = 'WHERE co.Order_Date >= DATEADD(MONTH, -1, GETDATE())';
        break;
      case 'quarter':
        dateCondition = 'WHERE co.Order_Date >= DATEADD(QUARTER, -1, GETDATE())';
        break;
      case 'year':
        dateCondition = 'WHERE co.Order_Date >= DATEADD(YEAR, -1, GETDATE())';
        break;
      case 'all':
      default:
        dateCondition = '';
    }
    
    try {
      const result = await app.locals.db.request().query(`
        SELECT 
          s.Item_Name AS ServiceName,
          COUNT(co.ID_Customers_orders) AS OrderCount
        FROM Service s
        LEFT JOIN Customer_orders co ON s.ID_Service = co.ID_Service
        ${dateCondition}
        GROUP BY s.Item_Name
        ORDER BY OrderCount DESC
      `);
      
      const labels = result.recordset.map(row => row.ServiceName);
      const data = result.recordset.map(row => row.OrderCount);
      
      res.json({ labels, data });
    } catch (error) {
      console.error('Ошибка при получении популярности услуг:', error);
      res.status(500).send('Ошибка сервера');
    }
  });

  // Эффективность сотрудников
  app.get('/api/reports/staff-performance', async (req, res) => {
    const { period } = req.query;
    let dateCondition = '';
    
    switch (period) {
      case 'month':
        dateCondition = 'AND pco.Date_Start >= DATEADD(MONTH, -1, GETDATE())';
        break;
      case 'quarter':
        dateCondition = 'AND pco.Date_Start >= DATEADD(QUARTER, -1, GETDATE())';
        break;
      case 'year':
        dateCondition = 'AND pco.Date_Start >= DATEADD(YEAR, -1, GETDATE())';
        break;
    }
    
    try {
      const result = await app.locals.db.request().query(`
        SELECT 
          s.ID_Staff,
          s.First_name + ' ' + s.Last_name + ' ' + ISNULL(s.Patronymic, '') AS StaffName,
          r.roll_name AS Role,
          COUNT(pco.ID_Processed_customer_orders) AS OrderCount,
          AVG(DATEDIFF(DAY, pco.Date_Start, ISNULL(pco.Date_Ending, GETDATE()))) AS AvgDays,
          SUM(CAST(pco.Final_sum AS DECIMAL(10,2))) AS Revenue,
          CASE 
            WHEN COUNT(pco.ID_Processed_customer_orders) = 0 THEN 0
            ELSE 100 * SUM(CASE WHEN so.Name_Status = 'Завершен' THEN 1 ELSE 0 END) / COUNT(pco.ID_Processed_customer_orders)
          END AS Efficiency
        FROM Staff s
        LEFT JOIN Role r ON s.ID_Role = r.ID_Role
        LEFT JOIN Processed_customer_orders pco ON s.ID_Staff = pco.ID_Staff
        LEFT JOIN Status_Orders so ON pco.ID_Status_Orders = so.ID_Status_Orders
        WHERE pco.ID_Processed_customer_orders IS NOT NULL ${dateCondition}
        GROUP BY s.ID_Staff, s.First_name, s.Last_name, s.Patronymic, r.roll_name
        ORDER BY Revenue DESC
      `);
      
      res.json(result.recordset.map(row => ({
        id: row.ID_Staff,
        name: row.StaffName,
        role: row.Role,
        orders: row.OrderCount,
        avgDays: Math.round(row.AvgDays) || 0,
        revenue: row.Revenue || 0,
        efficiency: Math.round(row.Efficiency) || 0
      })));
    } catch (error) {
      console.error('Ошибка при получении эффективности сотрудников:', error);
      res.status(500).send('Ошибка сервера');
    }
  });

  // Финансовые показатели
  app.get('/api/reports/finance', async (req, res) => {
    const { period } = req.query;
    let groupBy, dateFormat;
    
    switch (period) {
      case 'month':
        groupBy = 'YEAR(Date), MONTH(Date)';
        dateFormat = 'YYYY-MM';
        break;
      case 'quarter':
        groupBy = 'YEAR(Date), DATEPART(QUARTER, Date)';
        dateFormat = 'YYYY-Q';
        break;
      case 'year':
        groupBy = 'YEAR(Date)';
        dateFormat = 'YYYY';
        break;
      default:
        groupBy = 'YEAR(Date), MONTH(Date)';
        dateFormat = 'YYYY-MM';
    }
    
    try {
      const result = await app.locals.db.request().query(`
        WITH FinanceData AS (
          SELECT 
            pco.Date_Start AS Date,
            CAST(pco.Final_sum AS DECIMAL(10,2)) AS Revenue,
            CAST(r.salary AS DECIMAL(10,2)) * COUNT(DISTINCT s.ID_Staff) AS Expenses
          FROM Processed_customer_orders pco
          LEFT JOIN Staff s ON pco.ID_Staff = s.ID_Staff
          LEFT JOIN Role r ON s.ID_Role = r.ID_Role
          GROUP BY pco.Date_Start, r.salary
        )
        SELECT 
          FORMAT(MIN(Date), '${dateFormat}') AS Period,
          SUM(Revenue) AS Revenue,
          SUM(Expenses) AS Expenses,
          SUM(Revenue) - SUM(Expenses) AS Profit
        FROM FinanceData
        GROUP BY ${groupBy}
        ORDER BY MIN(Date)
      `);
      
      const labels = result.recordset.map(row => row.Period);
      const revenue = result.recordset.map(row => row.Revenue || 0);
      const expenses = result.recordset.map(row => row.Expenses || 0);
      const profit = result.recordset.map(row => row.Profit || 0);
      
      res.json({ labels, revenue, expenses, profit });
    } catch (error) {
      console.error('Ошибка при получении финансовых показателей:', error);
      res.status(500).send('Ошибка сервера');
    }
  });

  // Последние заказы
  app.get('/api/reports/recent-orders', async (req, res) => {
    const { count } = req.query;
    
    try {
      const result = await app.locals.db.request()
        .input('count', mssql.Int, count)
        .query(`
          SELECT TOP (@count)
            pco.ID_Processed_customer_orders AS ID,
            u.First_name + ' ' + ISNULL(u.Last_name, '') AS Client,
            s.Item_Name AS Service,
            pco.Date_Start AS Date,
            so.Name_Status AS Status,
            pco.Final_sum AS Amount
          FROM Processed_customer_orders pco
          LEFT JOIN Customer_orders co ON pco.ID_Customer_orders = co.ID_Customers_orders
          LEFT JOIN Users u ON co.ID_Users = u.ID_Users
          LEFT JOIN Service s ON co.ID_Service = s.ID_Service
          LEFT JOIN Status_Orders so ON pco.ID_Status_Orders = so.ID_Status_Orders
          ORDER BY pco.Date_Start DESC
        `);
      
      res.json(result.recordset.map(row => ({
        id: row.ID,
        client: row.Client,
        service: row.Service,
        date: row.Date,
        status: row.Status,
        amount: row.Amount
      })));
    } catch (error) {
      console.error('Ошибка при получении последних заказов:', error);
      res.status(500).send('Ошибка сервера');
    }
  });

  // Вспомогательные функции для отчетов
  async function getGeneralStatsData(period) {
    let dateCondition = '';
    
    switch (period) {
      case 'day':
        dateCondition = 'WHERE CAST(GETDATE() AS DATE) = CAST(CreationDate AS DATE)';
        break;
      case 'week':
        dateCondition = 'WHERE CreationDate >= DATEADD(WEEK, -1, GETDATE())';
        break;
      case 'month':
        dateCondition = 'WHERE CreationDate >= DATEADD(MONTH, -1, GETDATE())';
        break;
      case 'year':
        dateCondition = 'WHERE CreationDate >= DATEADD(YEAR, -1, GETDATE())';
        break;
      case 'all':
      default:
        dateCondition = '';
    }
    
    const result = await app.locals.db.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Users ${dateCondition.replace('CreationDate', 'GETDATE()')}) AS Users,
        (SELECT COUNT(*) FROM Customer_orders ${dateCondition.replace('CreationDate', 'Order_Date')}) AS Orders,
        (SELECT COUNT(*) FROM Processed_customer_orders ${dateCondition.replace('CreationDate', 'Date_Start')}) AS Processed,
        (SELECT ISNULL(SUM(CAST(Final_sum AS DECIMAL(10,2))), 0) FROM Processed_customer_orders ${dateCondition.replace('CreationDate', 'Date_Start')}) AS Revenue,
        (SELECT COUNT(*) FROM Staff ${dateCondition.replace('CreationDate', 'Date_employment')}) AS Staff,
        (SELECT COUNT(*) FROM Requests ${dateCondition.replace('CreationDate', 'Request_Date')}) AS Requests
    `);
    
    return result.recordset[0];
  }

  function getPreviousPeriod(period) {
    switch (period) {
      case 'day': return 'day';
      case 'week': return 'week';
      case 'month': return 'month';
      case 'year': return 'year';
      default: return 'month';
    }
  }

  function calculateChange(current, previous) {
    if (!previous || current === 0) {
      return { total: current || 0, change: 0 };
    }
    
    const change = ((current - previous) / previous) * 100;
    return { total: current, change: isFinite(change) ? change : 0 };
  }

  // Вспомогательные функции для отчетов
  async function getGeneralStatsData(period) {
    let dateCondition = '';
    
    switch (period) {
      case 'day':
        dateCondition = 'WHERE CAST(GETDATE() AS DATE) = CAST(CreationDate AS DATE)';
        break;
      case 'week':
        dateCondition = 'WHERE CreationDate >= DATEADD(WEEK, -1, GETDATE())';
        break;
      case 'month':
        dateCondition = 'WHERE CreationDate >= DATEADD(MONTH, -1, GETDATE())';
        break;
      case 'year':
        dateCondition = 'WHERE CreationDate >= DATEADD(YEAR, -1, GETDATE())';
        break;
      case 'all':
      default:
        dateCondition = '';
    }
    
    const result = await app.locals.db.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Users ${dateCondition.replace('CreationDate', 'GETDATE()')}) AS Users,
        (SELECT COUNT(*) FROM Customer_orders ${dateCondition.replace('CreationDate', 'Order_Date')}) AS Orders,
        (SELECT COUNT(*) FROM Processed_customer_orders ${dateCondition.replace('CreationDate', 'Date_Start')}) AS Processed,
        (SELECT ISNULL(SUM(CAST(Final_sum AS DECIMAL(10,2))), 0) FROM Processed_customer_orders ${dateCondition.replace('CreationDate', 'Date_Start')}) AS Revenue,
        (SELECT COUNT(*) FROM Staff ${dateCondition.replace('CreationDate', 'Date_employment')}) AS Staff,
        (SELECT COUNT(*) FROM Requests ${dateCondition.replace('CreationDate', 'Request_Date')}) AS Requests
    `);
    
    return result.recordset[0];
  }

  function getPreviousPeriod(period) {
    switch (period) {
      case 'day': return 'day';
      case 'week': return 'week';
      case 'month': return 'month';
      case 'year': return 'year';
      default: return 'month';
    }
  }

  function calculateChange(current, previous) {
    if (!previous || current === 0) {
      return { total: current || 0, change: 0 };
    }
    
    const change = ((current - previous) / previous) * 100;
    return { total: current, change: isFinite(change) ? change : 0 };
  }

  // Добавьте этот маршрут в ваш server.js
  app.get('/api/print_order/:id', async (req, res) => {
    try {
      const result = await app.locals.db.request()
        .input('id', mssql.Int, req.params.id)
        .query(`
          SELECT
            pco.ID_Processed_customer_orders AS [Номер заказа],
            s.Item_Name AS [Услуга],
            FORMAT(pco.Date_Start, 'dd.MM.yyyy') AS [Дата начала],
            FORMAT(pco.Date_Ending, 'dd.MM.yyyy') AS [Дата завершения],
            so.Name_Status AS [Статус],
            pco.Final_sum AS [Итоговая сумма],
            u.First_name + ' ' + u.Last_name + ' ' + u.Patronymic AS [Клиент ФИО],
            u.Number_Phone AS [Телефон клиента],
            u.Address AS [Адрес клиента],
            st.First_name + ' ' + st.Last_name + ' ' + st.Patronymic AS [Менеджер ФИО],
            f.First_Name + ' ' + f.Last_Name + ' ' + f.Patronymic AS [Прораб ФИО]
          FROM Processed_customer_orders pco
          INNER JOIN Customer_orders co ON pco.ID_Customer_orders = co.ID_Customers_orders
          INNER JOIN Users u ON co.ID_Users = u.ID_Users
          INNER JOIN Service s ON co.ID_Service = s.ID_Service
          INNER JOIN Status_Orders so ON pco.ID_Status_Orders = so.ID_Status_Orders
          INNER JOIN Staff st ON pco.ID_Staff = st.ID_Staff
          INNER JOIN Foremen f ON pco.ID_Foreman = f.ID_Foreman
          WHERE pco.ID_Processed_customer_orders = @id
        `);

      if (result.recordset.length === 0) {
        return res.status(404).send('Заказ не найден');
      }

      const order = result.recordset[0];
      
      const html = `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <title>Заказ #${order['Номер заказа']} | EuroBuld</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: 'Roboto', sans-serif;
              color: #333;
              line-height: 1.6;
              padding: 20px;
              background-color: #f9f9f9;
            }
            
            .document {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
              padding: 40px;
              position: relative;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e0e0e0;
            }
            
            .logo {
              font-size: 28px;
              font-weight: 700;
              color: #2c3e50;
              margin-bottom: 5px;
            }
            
            .document-title {
              font-size: 20px;
              color: #7f8c8d;
              margin-bottom: 15px;
            }
            
            .document-number {
              font-size: 16px;
              color: #7f8c8d;
            }
            
            .section {
              margin-bottom: 30px;
            }
            
            .section-title {
              font-size: 18px;
              font-weight: 500;
              color: #2c3e50;
              margin-bottom: 15px;
              padding-bottom: 5px;
              border-bottom: 1px solid #e0e0e0;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            
            .info-item {
              margin-bottom: 10px;
            }
            
            .info-label {
              font-weight: 500;
              color: #7f8c8d;
              margin-bottom: 3px;
              font-size: 14px;
            }
            
            .info-value {
              font-size: 15px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            
            th {
              background-color: #f5f5f5;
              text-align: left;
              padding: 10px 15px;
              font-weight: 500;
              font-size: 14px;
            }
            
            td {
              padding: 12px 15px;
              border-bottom: 1px solid #e0e0e0;
              vertical-align: top;
            }
            
            .total-row {
              font-weight: 500;
              background-color: #f9f9f9;
            }
            
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
            }
            
            .signature-block {
              width: 250px;
              text-align: center;
            }
            
            .signature-line {
              border-top: 1px solid #333;
              margin: 40px auto 10px;
              width: 200px;
            }
            
            .signature-name {
              font-weight: 500;
              margin-bottom: 5px;
            }
            
            .signature-position {
              color: #7f8c8d;
              font-size: 14px;
            }
            
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #7f8c8d;
              font-size: 14px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
            }
            
            .stamp {
              position: absolute;
              right: 50px;
              bottom: 100px;
              width: 150px;
              height: 150px;
              transform: rotate(15deg);
            }
            
            @media print {
              body {
                background: none;
                padding: 0;
              }
              
              .document {
                box-shadow: none;
                padding: 0;
              }
              
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="document">
            <div class="header">
              <div class="logo">EUROBULD</div>
              <div class="document-title">Договор на выполнение строительных работ</div>
              <div class="document-number">№ ${order['Номер заказа']} от ${order['Дата начала']}</div>
            </div>
            
            <div class="section">
              <div class="section-title">1. Информация о клиенте</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">ФИО</div>
                  <div class="info-value">${order['Клиент ФИО']}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Телефон</div>
                  <div class="info-value">${order['Телефон клиента']}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Адрес</div>
                  <div class="info-value">${order['Адрес клиента']}</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">2. Информация о заказе</div>
              <table>
                <thead>
                  <tr>
                    <th>Услуга</th>
                    <th>Дата начала</th>
                    <th>Дата завершения</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${order['Услуга']}</td>
                    <td>${order['Дата начала']}</td>
                    <td>${order['Дата завершения'] || 'В процессе'}</td>
                    <td>${order['Статус']}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="section">
              <div class="section-title">3. Финансовая информация</div>
              <table>
                <tr class="total-row">
                  <td colspan="3">Итоговая сумма</td>
                  <td>${order['Итоговая сумма']} руб.</td>
                </tr>
              </table>
            </div>
            
            <div class="section">
              <div class="section-title">4. Ответственные лица</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Менеджер</div>
                  <div class="info-value">${order['Менеджер ФИО']}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Прораб</div>
                  <div class="info-value">${order['Прораб ФИО']}</div>
                </div>
              </div>
            </div>
            
            <div class="signatures">
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-name">${order['Клиент ФИО']}</div>
                <div class="signature-position">Клиент</div>
              </div>
              
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-name">${order['Менеджер ФИО']}</div>
                <div class="signature-position">Менеджер</div>
              </div>
            </div>
            
            <div class="stamp">
              <svg width="150" height="150" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <!-- Внешний круг с пунктиром -->
                <circle cx="100" cy="100" r="95" stroke="#0000C0" stroke-width="3" stroke-dasharray="8,4" fill="none"/>
                
                <!-- Внутренний сплошной круг -->
                <circle cx="100" cy="100" r="80" stroke="#0000C0" stroke-width="2" fill="none"/>
                
                <!-- Верхний текст по дуге (название) -->
                <path id="topText" d="M30 100 A70 70 0 0 1 170 100" fill="none"/>
                <text font-family="Arial" font-size="14" font-weight="bold" fill="#0000C0" text-anchor="middle">
                  <textPath href="#topText" startOffset="50%">ООО "EUROBULD"</textPath>
                </text>
                
                <!-- Нижний текст по дуге (ИНН) -->
                <path id="bottomText" d="M170 100 A70 70 0 0 1 30 100" fill="none"/>
                <text font-family="Arial" font-size="12" fill="#0000C0" text-anchor="middle">
                  <textPath href="#bottomText" startOffset="50%">ИНН 123456789012</textPath>
                </text>
                
                <!-- Центральная звезда -->
                <path d="M100 40 L110 60 L130 60 L115 75 L125 95 L100 85 L75 95 L85 75 L70 60 L90 60 Z" fill="#0000C0"/>
                
                <!-- Под звездой - ОГРН -->
                <text x="100" y="120" font-family="Arial" font-size="12" fill="#0000C0" text-anchor="middle">ОГРН 1234567890123</text>
                
                <!-- В самом низу - город -->
                <text x="100" y="140" font-family="Arial" font-size="12" fill="#0000C0" text-anchor="middle">г. Москва</text>
                
                <!-- Защитный микротекст -->
                <circle cx="100" cy="100" r="70" stroke="#0000C0" stroke-width="0.5" stroke-dasharray="1,1" fill="none"/>
                <path id="microText" d="M35 100 A65 65 0 0 1 165 100" fill="none"/>
                <text font-family="Arial" font-size="5" fill="#0000C0">
                  <textPath href="#microText" startOffset="0">* ООО EUROBULD * ООО EUROBULD * ООО EUROBULD *</textPath>
                </text>
              </svg>
            </div>
            
            <div class="footer">
              <p>Дата печати: ${new Date().toLocaleDateString('ru-RU')}</p>
              <p>EUROBULD © ${new Date().getFullYear()}</p>
            </div>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 20px; padding: 20px;">
            <button onclick="window.print()" style="
              background: #3498db;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
              margin-right: 10px;
            ">Печать</button>
            
            <button onclick="window.close()" style="
              background: #e74c3c;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
            ">Закрыть</button>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 1000);
            };
          </script>
        </body>
        </html>
      `;

      res.send(html);
    } catch (err) {
      console.error('Ошибка при формировании печатной формы:', err);
      res.status(500).send('Ошибка сервера');
    }
  });

  // Общая статистика - исправленный запрос
  async function getGeneralStatsData(period) {
    let dateCondition = '';
    
    switch (period) {
      case 'day':
        dateCondition = 'WHERE CAST(GETDATE() AS DATE) = CAST(CreationDate AS DATE)';
        break;
      case 'week':
        dateCondition = 'WHERE CreationDate >= DATEADD(WEEK, -1, GETDATE())';
        break;
      case 'month':
        dateCondition = 'WHERE CreationDate >= DATEADD(MONTH, -1, GETDATE())';
        break;
      case 'year':
        dateCondition = 'WHERE CreationDate >= DATEADD(YEAR, -1, GETDATE())';
        break;
      case 'all':
      default:
        dateCondition = '';
    }
    
    const result = await app.locals.db.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Users ${dateCondition.replace('CreationDate', 'GETDATE()')}) AS Users,
        (SELECT COUNT(*) FROM Customer_orders ${dateCondition.replace('CreationDate', 'Order_Date')}) AS Orders,
        (SELECT COUNT(*) FROM Processed_customer_orders ${dateCondition.replace('CreationDate', 'Date_Start')}) AS Processed,
        (SELECT ISNULL(SUM(TRY_CONVERT(DECIMAL(10,2), Final_sum)), 0) FROM Processed_customer_orders ${dateCondition.replace('CreationDate', 'Date_Start')}) AS Revenue,
        (SELECT COUNT(*) FROM Staff ${dateCondition.replace('CreationDate', 'Date_employment')}) AS Staff,
        (SELECT COUNT(*) FROM Requests ${dateCondition.replace('CreationDate', 'Request_Date')}) AS Requests
    `);
    
    return result.recordset[0];
  }

  // Эффективность сотрудников - исправленный запрос
  app.get('/api/reports/staff-performance', async (req, res) => {
    const { period } = req.query;
    let dateCondition = '';
    
    switch (period) {
      case 'month':
        dateCondition = 'AND pco.Date_Start >= DATEADD(MONTH, -1, GETDATE())';
        break;
      case 'quarter':
        dateCondition = 'AND pco.Date_Start >= DATEADD(QUARTER, -1, GETDATE())';
        break;
      case 'year':
        dateCondition = 'AND pco.Date_Start >= DATEADD(YEAR, -1, GETDATE())';
        break;
    }
    
    try {
      const result = await app.locals.db.request().query(`
        SELECT 
          s.ID_Staff,
          s.First_name + ' ' + s.Last_name + ' ' + ISNULL(s.Patronymic, '') AS StaffName,
          r.roll_name AS Role,
          COUNT(pco.ID_Processed_customer_orders) AS OrderCount,
          AVG(DATEDIFF(DAY, pco.Date_Start, ISNULL(pco.Date_Ending, GETDATE()))) AS AvgDays,
          SUM(TRY_CONVERT(DECIMAL(10,2), pco.Final_sum)) AS Revenue,
          CASE 
            WHEN COUNT(pco.ID_Processed_customer_orders) = 0 THEN 0
            ELSE 100 * SUM(CASE WHEN so.Name_Status = 'Завершен' THEN 1 ELSE 0 END) / COUNT(pco.ID_Processed_customer_orders)
          END AS Efficiency
        FROM Staff s
        LEFT JOIN Role r ON s.ID_Role = r.ID_Role
        LEFT JOIN Processed_customer_orders pco ON s.ID_Staff = pco.ID_Staff
        LEFT JOIN Status_Orders so ON pco.ID_Status_Orders = so.ID_Status_Orders
        WHERE pco.ID_Processed_customer_orders IS NOT NULL ${dateCondition}
        GROUP BY s.ID_Staff, s.First_name, s.Last_name, s.Patronymic, r.roll_name
        ORDER BY Revenue DESC
      `);
      
      res.json(result.recordset.map(row => ({
        id: row.ID_Staff,
        name: row.StaffName,
        role: row.Role,
        orders: row.OrderCount,
        avgDays: Math.round(row.AvgDays) || 0,
        revenue: row.Revenue || 0,
        efficiency: Math.round(row.Efficiency) || 0
      })));
    } catch (error) {
      console.error('Ошибка при получении эффективности сотрудников:', error);
      res.status(500).send('Ошибка сервера');
    }
  });

  // Финансовые показатели - исправленный запрос
  app.get('/api/reports/finance', async (req, res) => {
    const { period } = req.query;
    let groupBy, dateFormat;
    
    switch (period) {
      case 'month':
        groupBy = 'YEAR(pco.Date_Start), MONTH(pco.Date_Start)';
        dateFormat = 'YYYY-MM';
        break;
      case 'quarter':
        groupBy = 'YEAR(pco.Date_Start), DATEPART(QUARTER, pco.Date_Start)';
        dateFormat = 'YYYY-Q';
        break;
      case 'year':
        groupBy = 'YEAR(pco.Date_Start)';
        dateFormat = 'YYYY';
        break;
      default:
        groupBy = 'YEAR(pco.Date_Start), MONTH(pco.Date_Start)';
        dateFormat = 'YYYY-MM';
    }
    
    try {
      const result = await app.locals.db.request().query(`
        SELECT 
          FORMAT(MIN(pco.Date_Start), '${dateFormat}') AS Period,
          SUM(TRY_CONVERT(DECIMAL(10,2), pco.Final_sum)) AS Revenue,
          SUM(TRY_CONVERT(DECIMAL(10,2), r.salary)) AS Expenses,
          SUM(TRY_CONVERT(DECIMAL(10,2), pco.Final_sum)) - SUM(TRY_CONVERT(DECIMAL(10,2), r.salary)) AS Profit
        FROM Processed_customer_orders pco
        LEFT JOIN Staff s ON pco.ID_Staff = s.ID_Staff
        LEFT JOIN Role r ON s.ID_Role = r.ID_Role
        GROUP BY ${groupBy}
        ORDER BY MIN(pco.Date_Start)
      `);
      
      const labels = result.recordset.map(row => row.Period);
      const revenue = result.recordset.map(row => row.Revenue || 0);
      const expenses = result.recordset.map(row => row.Expenses || 0);
      const profit = result.recordset.map(row => row.Profit || 0);
      
      res.json({ labels, revenue, expenses, profit });
    } catch (error) {
      console.error('Ошибка при получении финансовых показателей:', error);
      res.status(500).send('Ошибка сервера');
    }
  });

  // Добавляем новый маршрут для проверки заполненности данных пользователя
  app.get('/api/check_user_data_complete/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({ error: 'Неверный идентификатор пользователя' });
    }
    
    try {
        const result = await app.locals.db.request()
            .input('userId', mssql.Int, userId)
            .query(`
                SELECT 
                    CASE WHEN 
                        Email IS NOT NULL AND
                        Password IS NOT NULL AND
                        Number_Phone IS NOT NULL AND
                        Address IS NOT NULL AND
                        First_name IS NOT NULL AND
                        Last_name IS NOT NULL AND
                        Passport_details IS NOT NULL
                    THEN 1 ELSE 0 END AS isComplete
                FROM Users
                WHERE ID_Users = @userId
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        res.json({ isComplete: result.recordset[0].isComplete === 1 });
    } catch (err) {
        console.error('Ошибка при проверке данных пользователя:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });