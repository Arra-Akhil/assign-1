
const { format } = require("date-fns");
var isValid = require("date-fns/isValid");
const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());
 
let db = null;
 
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
 
initializeDBAndServer();
 
const convertTodoDbResponseToObjectDbResponse = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};
 
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
 
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
 
const hasStatusAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};
 
const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};
 
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};
 
const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
 
app.get("/todos/", async (request, response) => {
  let data;
  let getSqlQuery = "";
 
  const {status, priority, category, search_q = ""} = request.query;
 
  const statusList = ["TO DO", "IN PROGRESS", "DONE"];
  const priorityList = ["HIGH", "MEDIUM", "LOW"];
  const categoryList = ["WORK", "HOME", "LEARNING"];
 
  switch (true) {
    case hasStatusAndPriorityProperty(request.query):
      if(statusList.includes(status)){
          if(priorityList.includes(priority)){
             getSqlQuery = `select * from todo where status = '${status}' and priority = '${priority}' and todo LIKE  "%${search_q}%";`;
          }else{
              response.status(400);
              response.send('Invalid Todo Priority');
          }
      }else{
          response.status(400);
          response.send('Invalid Todo Status');
      }
       break;
    case hasCategoryAndPriorityProperty(request.query):
      if(categoryList.includes(category)){
          if(priorityList.includes(priority)){
               getSqlQuery = `select * from todo where category = '${category}' and priority = '${priority}' and todo LIKE "%${search_q}%";`;
          }else{
              response.status(400);
              response.send('Invalid Todo Priority');
          }
      }else{
          response.status(400);
          response.send('Invalid Todo Category');
      }
      break;
    case hasCategoryAndStatusProperty(request.query):
      if(categoryList.includes(category)){
          if(statusList.includes(status)){
             getSqlQuery = `select * from todo where status = '${status}' and category = '${category}' and todo LIKE "%${search_q}%";`;
          }else{
              response.status(400);
              response.send('Invalid Todo Status');
          }
      }else{
          response.status(400);
          response.send('Invalid Todo Category');
      }
     break;
    case hasCategoryProperty(request.query):
     if(categoryList.includes(category)){
          getSqlQuery = `select * from todo where category = '${category}' and todo LIKE "%${search_q}%";`;
     }else{
         response.status(400);
         response.send('Invalid Todo Category');
     }
     break;
    case hasStatusProperty(request.query):
     if(statusList.includes(status)){
         getSqlQuery = `select * from todo where status = '${status}' and todo LIKE "%${search_q}%";`;
     }else{
         response.status(400);
         response.send('Invalid Todo Status');
     }
      break;
    case hasPriorityProperty(request.query):
     if(priorityList.includes(priority)){
       getSqlQuery = `select * from todo where priority = '${priority}' and todo LIKE "%${search_q}%";`;
     }else{
         response.status(400);
         response.send('Invalid Todo Priority');
     }
    break;
    default:
      getSqlQuery = `select * from todo where todo LIKE "%${search_q}%";`;
  }
 
  data = await db.all(getSqlQuery);
  console.log(data);
  response.send(
    data.map((item) => convertTodoDbResponseToObjectDbResponse(item))
  );
});
 
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `select * from todo where id = ${todoId};`;
  const dbResponse = await db.get(getTodoQuery);
  console.log(dbResponse);
  response.send(convertTodoDbResponseToObjectDbResponse(dbResponse));
});
 
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const newDate = new Date(date);
 
  const result = isValid(newDate);
 
  if (result===true) {
    const year = newDate.getFullYear();
    const month = newDate.getMonth();
    const day = newDate.getDate();
 
    const nDate = new Date(
      year,
      month.toLocaleString("en-US", {
        minimumIntegerDigits: 2,
        useGrouping: false,
      }),
      day.toLocaleString("en-US", {
        minimumIntegerDigits: 2,
        useGrouping: false,
      })
    );
 
    console.log(day);
    console.log(month);
    console.log(year);
 
    const formattedDate = format(nDate, "yyyy-MM-dd");
    const getDateQuery = `select * from todo where due_date LIKE "${formattedDate}";`;
    const dbResponse = await db.all(getDateQuery);
    response.send(dbResponse.map(item => (convertTodoDbResponseToObjectDbResponse(item))));
  } else {
    response.status(400);
    response.send('Invalid Due Date');
  }
});
 
 
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;
 
  const statusList = ["TO DO", "IN PROGRESS", "DONE"];
  const priorityList = ["HIGH", "MEDIUM", "LOW"];
  const categoryList = ["WORK", "HOME", "LEARNING"];
 
  if (statusList.includes(status)) {
    if (priorityList.includes(priority)) {
      if (categoryList.includes(category)) {
        if (dueDate !== undefined) {
          const newDate = new Date(dueDate);
          const result = isValid(newDate);
          if (result) {
            console.log(todoDetails);
            const createTodoQuery = `INSERT INTO TODO 
                                (id, todo, priority, status, category, due_date)
                                VALUES 
                        (${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}');`;
 
            await db.run(createTodoQuery);
            response.send("Todo Successfully Added");
          } else {
            response.status(400);
            response.send("Invalid Due Date");
          }
        }
      }else{
          response.status(400);
          response.send('Invalid Todo Category');
      }
    }else{
        response.status(400);
        response.send('Invalid Todo Priority');
    }
  }else{
      response.status(400);
      response.send('Invalid Todo Status');
  }
});
 
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateColumn = "";
  console.log(requestBody);
 
  const statusList = ["TO DO", "IN PROGRESS", "DONE"];
  const priorityList = ["HIGH", "MEDIUM", "LOW"];
  const categoryList = ["WORK", "HOME", "LEARNING"];
 
  if (requestBody.status !== undefined) {
    if (statusList.includes(requestBody.status)) {
      updateColumn = "Status";
      const getPreviousTodoQuery = `select * from todo where id = ${todoId};`;
      const previousTodo = await db.get(getPreviousTodoQuery);
      console.log(previousTodo);
 
      const {
        todo = previousTodo.todo,
        priority = previousTodo.priority,
        status = previousTodo.status,
        category = previousTodo.category,
        dueDate = previousTodo.due_date,
      } = request.body;
 
      console.log(dueDate);
 
      const updateTodoQuery = `UPDATE todo SET 
                                todo = '${todo}', priority = '${priority}',
                                status = '${status}', category = '${category}',
                                due_date = '${dueDate}'
                                where id = ${todoId};`;
 
      await db.run(updateTodoQuery);
      console.log(`${updateColumn} Updated`);
      response.send(`${updateColumn} Updated`);
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }
 
  if (requestBody.priority !== undefined) {
    if (priorityList.includes(requestBody.priority)) {
      updateColumn = "Priority";
      const getPreviousTodoQuery = `select * from todo where id = ${todoId};`;
      const previousTodo = await db.get(getPreviousTodoQuery);
      console.log(previousTodo);
 
      const {
        todo = previousTodo.todo,
        priority = previousTodo.priority,
        status = previousTodo.status,
        category = previousTodo.category,
        dueDate = previousTodo.due_date,
      } = request.body;
 
      console.log(dueDate);
 
      const updateTodoQuery = `UPDATE todo SET 
                                todo = '${todo}', priority = '${priority}',
                                status = '${status}', category = '${category}',
                                due_date = '${dueDate}'
                                where id = ${todoId};`;
 
      await db.run(updateTodoQuery);
      console.log(`${updateColumn} Updated`);
      response.send(`${updateColumn} Updated`);
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
 
  if (requestBody.category !== undefined) {
    if (categoryList.includes(requestBody.category)) {
      updateColumn = "Category";
 
      const getPreviousTodoQuery = `select * from todo where id = ${todoId};`;
      const previousTodo = await db.get(getPreviousTodoQuery);
      console.log(previousTodo);
 
      const {
        todo = previousTodo.todo,
        priority = previousTodo.priority,
        status = previousTodo.status,
        category = previousTodo.category,
        dueDate = previousTodo.due_date,
      } = request.body;
 
      console.log(dueDate);
 
      const updateTodoQuery = `UPDATE todo SET 
                                    todo = '${todo}', priority = '${priority}',
                                    status = '${status}', category = '${category}',
                                    due_date = '${dueDate}'
                                    where id = ${todoId};`;
 
      await db.run(updateTodoQuery);
      console.log(`${updateColumn} Updated`);
      response.send(`${updateColumn} Updated`);
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
 
  if (requestBody.todo !== undefined) {
    updateColumn = "Todo";
 
    const getPreviousTodoQuery = `select * from todo where id = ${todoId};`;
    const previousTodo = await db.get(getPreviousTodoQuery);
    console.log(previousTodo);
 
    const {
      todo = previousTodo.todo,
      priority = previousTodo.priority,
      status = previousTodo.status,
      category = previousTodo.category,
      dueDate = previousTodo.due_date,
    } = request.body;
 
    console.log(dueDate);
 
    const updateTodoQuery = `UPDATE todo SET 
                                todo = '${todo}', priority = '${priority}',
                                status = '${status}', category = '${category}',
                                due_date = '${dueDate}'
                                where id = ${todoId};`;
 
    await db.run(updateTodoQuery);
    console.log(`${updateColumn} Updated`);
    response.send(`${updateColumn} Updated`);
  }
 
  if (requestBody.dueDate !== undefined) {
    const newDate = new Date(requestBody.dueDate);
    const result = isValid(newDate);
 
    if (result) {
      updateColumn = "Due Date";
 
      const getPreviousTodoQuery = `select * from todo where id = ${todoId};`;
      const previousTodo = await db.get(getPreviousTodoQuery);
      console.log(previousTodo);
 
      const {
        todo = previousTodo.todo,
        priority = previousTodo.priority,
        status = previousTodo.status,
        category = previousTodo.category,
        dueDate = previousTodo.due_date,
      } = request.body;
 
      console.log(dueDate);
 
      const updateTodoQuery = `UPDATE todo SET 
                                    todo = '${todo}', priority = '${priority}',
                                    status = '${status}', category = '${category}',
                                    due_date = '${dueDate}'
                                    where id = ${todoId};`;
 
      await db.run(updateTodoQuery);
      console.log(`${updateColumn} Updated`);
      response.send(`${updateColumn} Updated`);
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});
 
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
 
  const createDeleteQuery = `DELETE FROM todo where id = ${todoId};`;
  await db.run(createDeleteQuery);
  response.send("Todo Deleted");
});
 
module.exports = app;
 




