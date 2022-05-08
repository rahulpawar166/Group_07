const express = require("express");
const constructorMethod = require(".");
const data = require("../data");
const userData = data.users;
const postMessage = data.message;
const router = express.Router();
const xss = require("xss");

router.get("/", async (req, res) => {
  const allMessage = await postMessage.getMessage(req.session.user.username);

  if (allMessage == [] || allMessage == "") {
    res
      .status(200)
      .render("message/message", { noMessage: "There is no message" });
  }

  res.status(200).render("message/message", { allMessage: allMessage });
});

router.get("/groupmessage", async (req, res) => {
  res.status(200).render("message/groupmessage");
});

router.post("/groupmessage", async (req, res) => {
  let allUserArray = xss(req.body.sendto).split(",");
  console.log(allUserArray);
  let output;
  let sendBy = req.session.user.username;
  let date = new Date().toDateString();
  let message = xss(req.body.message);
  let i = 0;
  let receivedBy;

  // try {
  //   for (let i = 0; i < allUserArray.length; i++) {
  //     await userData.getUserByUsername(allUserArray[i]);
  //   }
  // } catch (e) {
  //   console.log("error", e);
  //   res.status(400).render("message/groupmessage", {
  //     error: "Please verify if all the usernames are correct",
  //   });
  //   return;
  // }

  try {
    if (xss(req.body.sendto.length < 1)) throw "Send field cannot be empty";
    if (xss(req.body.message < 1)) throw "Send message cannot be empty";
    for (let i = 0; i < allUserArray.length; i++) {
      await userData.getUserByUsername(allUserArray[i]);
    }
    allUserArray = allUserArray.map((each) => each.trim(each));
    allUserArray = allUserArray.filter((element) => {
      return element !== "";
    });

    for (i = 0; i < allUserArray.length; i++) {
      receivedBy = allUserArray[i];
      output = await postMessage.createMessage(
        message,
        receivedBy,
        sendBy,
        date
      );
    }
    if (output) {
      res.redirect("/private/message");
    }
  } catch (e) {
    if (e) {
      console.log("error", e);
      res.status(400).render("message/groupmessage", { error: e });
      return;
    } else {
      res.status(500).json({
        error: "Internal Server Error",
      });
    }
  }
});

router.get("/viewall/:id", async (req, res) => {
  try {
    if (!req.params.id) throw "Id cannot be empty";
    if (typeof req.params.id !== "string") throw "Id cannot be empty";
    const allMessage = await postMessage.getSpecificMessage(req.params.id);
    console.log("allMessage", allMessage);
    if (allMessage.length < 1) {
      res.render("message/individualMessage", {
        message: "No conversation is found",
      });
    }
    res.render("message/individualMessage", {
      allMessage: allMessage,
      sender: allMessage[0].sendBy,
      receiver: allMessage[0].receivedBy,
    });
  } catch (e) {
    if (e) {
      const out = { errors: e };
      console.log("error", e);
      res.status(400).render("message/groupmessage", { error: e.message });
      return;
    } else {
      res.status(500).json({
        error: "Internal Server Error",
      });
    }
  }
});

router.post("/", async (req, res) => {
  try {
    // let { message, messageTo, sender, receiver } 
    let message=xss(req.body.message);
    let  messageTo=xss(req.body.messageTo);
    let sender=xss(req.body.sender);
    let receiver=xss(req.body.receiver)
    let sendBy, receivedBy;
    if (xss(req.body.messageTo)) {
      sendBy = req.session.user.username;
      receivedBy = messageTo;
    }
    if (xss(req.body.sender) || xss(req.body.receiver)) {
      sendBy = sender;
      receivedBy = receiver;
    }
    sendBy = req.session.user.username;
    if (sendBy) {
      if (sendBy == sender) {
        receivedBy = receiver;
      } else {
        receivedBy = sender;
      }
    }

    date = new Date().toDateString();
    const output = await postMessage.createMessage(
      message,
      receivedBy,
      sendBy,
      date
    );

    if (output) {
      res.redirect("/private");
    }
  } catch (e) {
    if (e) {
      const out = { errors: e };
      res.status(400).render("post/postRoom", { error: e.message });
      return;
    } else {
      res.status(500).json({
        error: "Internal Server Error",
      });
    }
  }
});
router.post("/indi", async (req, res) => {
  try {
    let message=xss(req.body.message);
    let receivedBy=xss(req.body.receiver)

    if(!message || !receivedBy) throw "Message cannot be empty"
    if(!receivedBy) throw "Receiver cannot be empty"

    sendBy = req.session.user.username;
    date = new Date().toDateString();
    const output = await postMessage.createMessage(
      message,
      receivedBy,
      sendBy,
      date
    );

    if (output) {
      res.redirect("/private");
    }
  } catch (e) {
    if (e) {
      const out = { errors: e };
      res.status(400).render("post/postRoom", { error: e.message });
      return;
    } else {
      res.status(500).json({
        error: "Internal Server Error",
      });
    }
  }
});
module.exports = router;
