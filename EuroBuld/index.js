const express = require('express');
const mssql = require('mssql');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const path = require('path'); // Подключение модуля path

dotenv.config();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/css', express.static(path.join(__dirname, 'css')));

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(express.static(path.join(__dirname))); // Это позволит обслуживать любые файлы из корня проекта

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
    res.sendFile(path.join(__dirname, 'EuroBuld.html'));  // Укажите нужный файл
});

const sqlConfig = {
    user: 'tosha',  // Замените на свой логин Windows
    password: 'tosha',  // Замените на свой пароль
    server: 'DESKTOP-MMF0NKV',  // Имя вашего SQL Server
    database: 'EuroBuld',  // Имя вашей базы данных
    options: {
        encrypt: true,
        trustServerCertificate: true,
        integratedSecurity: false  // Устанавливаем False, если используем логин и пароль
    }
};

mssql.connect(sqlConfig)
  .then(pool => {
    console.log('Connected to the database');
    app.locals.db = pool;
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });

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

    console.log("Staff Query Result: ", result.recordset); // Выводим результат запроса

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

      console.log("Users Query Result: ", result.recordset); // Выводим результат запроса

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
    console.error('Database error:', error); // Логируем ошибку
    res.status(500).send('Ошибка сервера');
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const pool = await mssql.connect(sqlConfig);
    const result = await pool.request().query(`
      SELECT ID_Users, Email, Number_Phone, Address, First_name, Last_name, Patronymic, Passport_details
      FROM Users
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Ошибка при получении Users:', err);
    res.status(500).send('Ошибка сервера');
  }
});

app.get('/api/staff', async (req, res) => {
  try {
    const pool = await mssql.connect(sqlConfig);
    const result = await pool.request().query(`
      SELECT s.ID_Staff, r.roll_name, s.Email, s.First_name, s.Last_name, s.Patronymic, 
             s.Passport_details, s.Date_birth, s.Date_employment
      FROM Staff s
      LEFT JOIN Role r ON s.ID_Role = r.ID_Role
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Ошибка при получении Staff:', err);
    res.status(500).send('Ошибка сервера');
  }
});

app.post('/api/:table', async (req, res) => {
  const { table } = req.params;  // Получаем название таблицы из URL
  const data = req.body;         // Получаем данные для добавления из тела запроса

  try {
    // Строим запрос на вставку данных
    let query = `INSERT INTO ${table} (`;
    let columns = [];
    let values = [];
    
    Object.keys(data).forEach((key, index) => {
      columns.push(key);
      values.push(`@${key}`);
    });

    query += columns.join(', ') + ') VALUES (' + values.join(', ') + ')';

    const request = app.locals.db.request();

    // Добавляем параметры для каждого поля
    Object.keys(data).forEach((key) => {
      request.input(key, data[key]);  // Для каждого параметра добавляем значение
    });

    // Выполняем запрос
    const result = await request.query(query);
    res.status(201).json(result);
  } catch (error) {
    console.error('Ошибка при добавлении:', error);
    res.status(500).send('Ошибка при добавлении записи');
  }
});


app.put('/api/:table/:id', async (req, res) => {
  const { table, id } = req.params;  // Получаем название таблицы и id из URL
  const data = req.body;             // Получаем данные для обновления из тела запроса

  try {
    // Строим запрос на обновление данных
    let query = `UPDATE ${table} SET `;
    let params = [];

    Object.keys(data).forEach((key, index) => {
      if (key !== 'id') {
        query += `${key} = @${key}${index < Object.keys(data).length - 1 ? ',' : ''}`;
        params.push({ name: key, value: data[key] });
      }
    });

    query += ` WHERE ID = @id`;  // Обновляем по ID (замените на правильное имя столбца)

    const request = app.locals.db.request();

    // Добавляем параметры для каждого поля, кроме id
    params.forEach(param => {
      request.input(param.name, param.value);
    });

    // Добавляем параметр ID
    request.input('id', mssql.Int, id);

    // Выполняем запрос
    const result = await request.query(query);
    res.status(200).json(result);
  } catch (error) {
    console.error('Ошибка при обновлении:', error);
    res.status(500).send('Ошибка при обновлении записи');
  }
});


app.delete('/api/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;

    const request = app.locals.db.request();
    request.input('id', mssql.Int, id);  // Указываем тип данных для id

    await request.query(`DELETE FROM ${table} WHERE id = @id`);
    res.send('Удалено');
  } catch (err) {
    console.error('Ошибка при удалении:', err);
    res.status(500).send('Ошибка сервера');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
