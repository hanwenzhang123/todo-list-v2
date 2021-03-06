//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');
const date = require(__dirname + "/date.js");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true});  //connect mongodb

const itemsSchema = {
  name: String
};

const Item = mongoose.model('item', itemsSchema);    //model always capitalize

const item1 = new Item ({
  name: 'Welcome to Your To Do List ^_^'
});

const item2 = new Item ({
  name: 'Click + to add a new item.'
});

const item3 = new Item ({
  name: '<-- Check to delete an item.'
});

const defaultItems = [item1, item2, item3];

const day = date.getDate();

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model('List', listSchema)

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){      //{} find all, the foundItems can be any name as a result
    
    if (foundItems.length === 0) {    //no items in the collection
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err)
        } else {
          console.log('Successfully saved default items to DB.')
        }
      });
      res.redirect('/');
    } else {
      res.render("list", {listTitle: day, newListItems: foundItems});
    }
});
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect('/' + customListName)
      } else {
        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
      }
    });
});


app.post("/", function(req, res){

  const itemName = req.body.newItem;    //newItem is the name of the input in the form
  const listName = req.body.list;
  
  const item = new Item({
    name: itemName      //the data from list.ejs
  });

  if (listName === day){
    item.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);   //take to the customListName
    })
  }
});

app.post('/delete', function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === day) {  
      Item.findByIdAndRemove(checkedItemId, function(err){
        if(!err) {
          console.log('Successfully deleted checked item.');
          res.redirect('/')
        }
      });
    } else {    //delete list from the custom list
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
        if (!err) {
          res.redirect('/' + listName);
        }
      })
    }
});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function(){
  console.log("Server is running on port 3000");
});
