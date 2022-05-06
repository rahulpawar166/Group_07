const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const exphbs = require("express-handlebars");
var fileUpload = require("express-fileupload");
const app = express();

// const data = require("./data");
// const postMessage = data.message;
const mongoCollections = require("./config/mongoCollections");
const messages = mongoCollections.messages;

const configRoutes = require("./routes");
const { connect } = require("./routes/users");



app.use(
  fileUpload({
    createParentPath: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use("/public", express.static(__dirname + "/public"));
app.use(
  express.urlencoded({
    extended: true,
  })
);

const handlebarsInstance = exphbs.create({
  defaultLayout: "main",
  // Specify helpers which are only registered on this instance.
  helpers: {
    asJSON: (obj, spacing) => {
      if (typeof spacing === "number")
        return new Handlebars.SafeString(JSON.stringify(obj, null, spacing));

      return new Handlebars.SafeString(JSON.stringify(obj));
    },
  },
});

const rewriteUnsupportedBrowserMethods = (req, res, next) => {
  // If the user posts to the server with a property called _method, rewrite the request's method
  // To be that method; so if they post _method=PUT you can now allow browsers to POST to a route that gets
  // rewritten in this middleware to a PUT route
  if (req.body && req.body._method) {
    req.method = req.body._method;
    delete req.body._method;
  }

  // let the next middleware run:
  next();
};

app.use(express.urlencoded({ extended: true }));
app.use(rewriteUnsupportedBrowserMethods);

app.engine("handlebars", handlebarsInstance.engine);
app.set("view engine", "handlebars");

app.use(
  session({
    name: "AuthCookie",
    secret: "some secret string!",
    resave: false,
    saveUninitialized: true,
  })
);

app.use("/private", (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/");
  } else {
    next();
  }
});

app.use("/login", (req, res, next) => {
  if (req.session.user) {
    return res.redirect("/private");
  } else {
    next();
  }
});

app.use("/signup", (req, res, next) => {
  if (req.session.user) {
    return res.redirect("/");
  } else {
    next();
  }
});

app.use("/aboutUs", (req, res, next)=> {
  if(req.session.user){
    return res.redirect("/private/aboutUs");
  } else {
    next();
  }
})

app.use(async (req, res, next) => {
  const current_time = new Date();
  const expire_time = new Date();
  expire_time.setHours(expire_time.getHours() + 1);
  res.cookie("last", current_time.toString(), { expires: expire_time });
  res.cookie("abc", "def");
  next();
});

const LoginCheck = function (req) {
  return !!req.session.user;
};

const LoginDetail = function (req, res, next) {
  var date = [new Date().toUTCString()];
  var url = req.originalUrl;
  var method = req.method;
  if (LoginCheck(req)) {
    console.log("[" + date + "]: " + method + " " + url + " (Authenticated)");
  } else {
    console.log(
      "[" + date + "]: " + req.method + " " + url + " (Not Authenticated)"
    );
  }
  next();
};
app.use(LoginDetail);
configRoutes(app);

const server = app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log("Your routes will be running on http://localhost:3000");
});

// include socket io for ther server
// const io = require('socket.io').listen(server)
const io = require('socket.io')(server);
io.on('connection', function (socket) {
  console.log('a user is connected...');
  
  // receive messages from chatMSg event of client
  socket.on('chatMsg', async function(details) {
      console.log('Received Message is : ' + details);
      // broadcasting the message to all connected users of chatMsg event
      socket.emit('chatMsg',details.message); 
      //Save Chat to the database
      const message_detail = {
        message: details.message,
        sendBy: details.sendBy,
        receivedBy: details.receivedBy,
        date: Date()
      };
      const messageCollection = await messages();
      const inserted_user = await messageCollection.insertOne(message_detail);

      console.log("inserted_user", inserted_user)
      console.log("Message", details.message)

    
  });
});
