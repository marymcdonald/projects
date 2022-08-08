const express = require("express");
const morgan = require("morgan");

const app = express();
const host = "localhost";
const port = 3000;

// Static data for initial testing
let todoLists = require("./lib/seed-data");
const Todo = require("./lib/todo");
const TodoList = require("./lib/todolist");

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

const compareByTitle = lists => {
  return lists.slice().sort((todoListA, todoListB) => {
    let titleA = todoListA.title.toLowerCase();
    let titleB = todoListB.title.toLowerCase();

    if (titleA < titleB) {
      return -1;
    } else if (titleA > titleB) {
      return 1;
    } else {
      return 0;
    }
  });
};



// return the list of todo lists sorted by completion status and title.
const sortTodoLists = lists => {
  let notDoneList = compareByTitle(lists.filter(list => !list.isDone()));
  let doneList = compareByTitle(lists.filter(list => list.isDone()));


  let sortedList = [].concat(notDoneList, doneList);
  
  return sortedList;
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

app.post("/lists", (req, res) => {
  let title = req.body.todoListTitle.trim();
  if (title.length === 0) {
    res.render("new-list", {
      errorMessage: "A title was not provided",
    });
  } else if (title.length > 100) {
    res.render("new-list", {
      errorMessage: "List title must be between 1 and 100 characters.",
      todoListTitle: title,
    });
  } else if (todoLists.some(list => list.title === title)) {
    res.render("new-list", {
      errorMessage: "List title must be unique.",
      todoListTitle: title,
    });
  } else {
    todoLists.push(new TodoList(title));
    res.redirect("/lists");
  }
});

app.listen(port, host, () => {
  console.log(`Todos is listening on port ${port} of ${host}!`);
});