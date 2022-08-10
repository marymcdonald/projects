const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const { body, validationResult } = require("express-validator");

const app = express();
const host = "localhost";
const port = 3000;

// Static data for initial testing
let todoLists = require("./lib/seed-data");
const Todo = require("./lib/todo");
const TodoList = require("./lib/todolist");
const { sortTodoLists } = require("./lib/sort");

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  name: "launch-school-todos-session-id",
  resave: false,
  saveUninitialized: true,
  secret: "this is not very secure",
}));
app.use(flash());

//Extract session info
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// Find a todo list with the indicated ID. Returns `undefined` if not found.
// Note that `todoListId` must be numeric.
const loadTodoList = todoListId => {
  return todoLists.find(todoList => todoList.id === todoListId);
};

app.get("/", (req, res) => {
  res.redirect("/lists");
});

app.get("/lists/new", (req, res) => {
  res.render("new-list");
});

app.get("/lists", (req, res) => {
  res.render("lists", {
    todoLists: sortTodoLists(todoLists),
  });
});


app.post("/lists",
  [
    body("todoListTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The list title is required.")
      .isLength({ max: 100 })
      .withMessage("List title must be between 1 and 100 characters.")
      .custom(title => {
        let duplicate = todoLists.find(list => list.title === title);
        return duplicate === undefined;
      })
      .withMessage("List title must be unique."),
  ],
  (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      res.render("new-list", {
        flash: req.flash(),
        todoListTitle: req.body.todoListTitle,
      });
    } else {
      todoLists.push(new TodoList(req.body.todoListTitle));
      req.flash("success", "The todo list has been created.");
      res.redirect("/lists");
    }
  }
);

app.get("/lists/:todoListId", (req, res, next) => {
  let listID = req.params.todoListId;
  let desiredList = loadTodoList(+listID);
  if (desiredList === undefined) {
    next(new Error(`Not Found.`));
  } else {
    res.render("list", {
      todoList: desiredList,
      todos: sortTodoLists(desiredList.todos),
    });
  }
});

app.get("/lists/:todoListId/edit", (req, res, next) => {
  let listID = req.params.todoListId;
  let desiredList = loadTodoList(+listID);
  if (desiredList === undefined) {
    next(new Error(`Not Found.`));
  } else {
    res.render("edit-list", {
      todoList: desiredList,
    });
  }
});

app.post("/lists/:todoListId/todos", 
[
  body("todoTitle")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Todo title is required.")
    .isLength({ max: 100 })
    .withMessage("Todo title must be between 1 and 100 characters.")
],
(req, res, next) => {
  let todoListId = req.params.todoListId;
  let todoList = loadTodoList(+todoListId);

  if (!todoList) {
    next(new Error(`Not Found.`));
  } else {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      res.render("list", {
        flash: req.flash(),
        todoTitle: req.body.todoTitle,
        todoList: todoList,
        todos: sortTodoLists(todoList.todos),
      });
    } else {
      let newTodo = new Todo(req.body.todoTitle);
      todoList.add(newTodo);
      req.flash("success", `${req.body.todoTitle} has been created.`);
      res.redirect(`/lists/${todoListId}`);
    }
  }

});

app.post("/lists/:todoListId/todos/:todoId/toggle", (req, res, next) => {
let {todoListId, todoId} = {...req.params};
let desiredList = loadTodoList(+todoListId);
let desiredTodo = desiredList.findById(+todoId);

if (desiredTodo === undefined) {
  next(new Error(`Not found.`));
} else {
  let index = desiredList.findIndexOf(desiredTodo);
  let title = desiredTodo.title;

  if(!desiredTodo.isDone()) {
    desiredList.markDoneAt(index);
    req.flash("success", `${title} completed!`);
  } else {
    desiredList.markUndoneAt(index);
    req.flash("info", `${title} marked incomplete.`);
  }

  res.redirect(`/lists/${todoListId}`);
}

});

app.post("/lists/:todoListId/todos/:todoId/destroy", (req, res, next) => {
  let {todoListId, todoId} = {...req.params};
  let desiredList = loadTodoList(+todoListId);
  let desiredTodo = desiredList.findById(+todoId);

  if (desiredTodo === undefined) {
    next(new Error(`Not found.`));
  } else {
    let index = desiredList.findIndexOf(desiredTodo);
    let title = desiredTodo.title;
    
    desiredList.removeAt(index);
    req.flash("success", `${title} deleted from list.`);
  
    res.redirect(`/lists/${todoListId}`);
  }
});

app.post("/lists/:todoListId/complete_all", (req, res, next) => {
  let todoListId = req.params.todoListId;
  let desiredList = loadTodoList(+todoListId);

  if (desiredList === undefined) {
    next(new Error(`Not found.`));
  } else {
    desiredList.markAllDone();
    req.flash("success", "List marked complete!");
    res.redirect(`/lists/${todoListId}`);
  }
});

//Delete todo list
app.post("/lists/:todoListId/destroy", (req, res, next) => {
  let todoListId = req.params.todoListId;
  let index = todoLists.findIndex(list => list.id === +todoListId);

  if(index === -1) {
    next(new Error("Not Found."));
  } else {
    todoLists.splice(index, 1);
    req.flash("success", "Todo list deleted");
    res.redirect('/lists');
  }
})


//error handler
app.use((err, req, res, _next) => {
  console.log(err);
  res.status(404).send(err.message);
});

app.listen(port, host, () => {
  console.log(`Todos is listening on port ${port} of ${host}!`);
});