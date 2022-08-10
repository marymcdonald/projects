// Compare object titles alphabetically (case-insensitive)
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




module.exports = {
  // return the list of todo lists sorted by completion status and title.
sortTodoLists(lists) {
  let notDoneList = compareByTitle(lists.filter(list => !list.isDone()));
  let doneList = compareByTitle(lists.filter(list => list.isDone()));


  let sortedList = [].concat(notDoneList, doneList);
  
  return sortedList;
  },
};