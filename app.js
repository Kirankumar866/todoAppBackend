const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS todo (
        id INTEGER PRIMARY KEY,
        todo TEXT,
        priority TEXT,
        status TEXT
      );
    `);

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API 1
app.get("/todos/", async (req, res) => {
  const { status, priority, search_q } = req.query;
  let query = "SELECT * FROM todo";

  if (status) {
    query += ` WHERE status = '${status}'`;
  }

  if (priority) {
    query += status
      ? ` AND priority = '${priority}'`
      : ` WHERE priority = '${priority}'`;
  }

  if (search_q) {
    query +=
      status || priority
        ? ` AND todo LIKE '%${search_q}%'`
        : ` WHERE todo LIKE '%${search_q}%'`;
  }

  const todos = await db.all(query);
  res.send(todos);
});

// API 2
app.get("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const todo = await db.get(`SELECT * FROM todo WHERE id = ${todoId}`);
  res.send(todo);
});

// API 3
app.post("/todos/", async (req, res) => {
  const { id, todo, priority, status } = req.body;
  await db.run(
    `INSERT INTO todo (id, todo, priority, status) VALUES (${id}, '${todo}', '${priority}', '${status}')`
  );
  res.send("Todo Successfully Added");
});

// API 4
app.put("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const { todo, priority, status } = req.body;

  if (status) {
    await db.run(`UPDATE todo SET status = '${status}' WHERE id = ${todoId}`);
    res.send("Status Updated");
  } else if (priority) {
    await db.run(
      `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId}`
    );
    res.send("Priority Updated");
  } else if (todo) {
    await db.run(`UPDATE todo SET todo = '${todo}' WHERE id = ${todoId}`);
    res.send("Todo Updated");
  } else {
    res.status(400).send("Invalid Update Request");
  }
});

// API 5
app.delete("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  await db.run(`DELETE FROM todo WHERE id = ${todoId}`);
  res.send("Todo Deleted");
});

module.exports = app;
