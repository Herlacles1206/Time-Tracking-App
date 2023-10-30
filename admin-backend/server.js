var express = require("express");
var app = express();
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var multer = require('multer'),
  bodyParser = require('body-parser'),
  path = require('path');
var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/face_track");
var fs = require('fs');
var user = require("./model/user.js");
var ImageModel = require("./model/image.js");
const { ObjectID } = require('mongodb');

const storage = multer.memoryStorage(); // Store the file in memory
var upload = multer({
  storage: storage,

  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname)
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      return callback(/*res.end('Only images are allowed')*/ null, false)
    }
    callback(null, true)
  }
});
app.use(cors());
app.use(express.static('uploads'));
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: false
}));

app.get('/face', (req, res) => {
  try {
    if (req.query && req.query.id) {
      ImageModel.findOne({'userid': req.query.id})
      .then((img_data, err)=>{
          if(err){
            res.status(400).json({
              errorMessage: 'Something went wrong!',
              error: err,
              status: false
            });
          } else if (img_data) {
            res.set('Content-Type', img_data.contentType);
            res.send(img_data.data);
          }
          // res.render('imagepage',{items: data})
      })    
    } else {
      res.status(400).json({
        errorMessage: 'Add proper parameter first!',
        status: false
      });
    }
  } catch(e) {
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      error: e.message,
      status: false
    });
  }
});

app.post('/face', upload.single('image'), (req, res, next) => {
  try {
    if (req.file && req.body && req.body.id) {
      // Get the uploaded image from req.file
      const imageBuffer = req.file.buffer;
  
      // Create a new document in the Image collection
      const newImage = new ImageModel({
        data: imageBuffer,
        contentType: req.file.mimetype,
        userid: req.body.id
      });

      // Save the image to MongoDB
      newImage.save();
      res.status(201).json({ message: 'Face Image uploaded successfully' });
    } else {
      res.status(400).json({
        errorMessage: 'Add proper parameter first!',
        status: false
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use("/", (req, res, next) => {
  try {
    if (req.path == "/login" || req.path == "/register" || req.path == "/") {
      next();
    } else {
      /* decode jwt token if authorized*/
      jwt.verify(req.headers.token, 'shhhhh11111', function (err, decoded) {
        if (decoded && decoded.user) {
          req.user = decoded;
          next();
        } else {
          return res.status(401).json({
            errorMessage: 'User unauthorized!',
            status: false
          });
        }
      })
    }
  } catch (e) {
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      status: false
    });
  }
})

app.get("/", (req, res) => {
  res.status(200).json({
    status: true,
    title: 'Apis'
  });
});

/* login api */
app.post("/login", (req, res) => {
  try {
    if (req.body && req.body.email && req.body.password) {
      user.find({ email: req.body.email }, (err, data) => {
        if (data.length > 0) {

          // if (bcrypt.compareSync(data[0].password, req.body.password)) {
          if (data[0].password === req.body.password) {
            checkUserAndGenerateToken(data[0], req, res);
          } else {

            res.status(400).json({
              errorMessage: 'Email or password is incorrect!',
              status: false
            });
          }

        } else {
          res.status(400).json({
            errorMessage: 'Email or password is incorrect!',
            status: false
          });
        }
      })
    } else {
      res.status(400).json({
        errorMessage: 'Add proper parameter first!',
        status: false
      });
    }
  } catch (e) {
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      status: false
    });
  }

});

/* register api */
app.post("/register", (req, res) => {
  try {
    if (req.body && req.body.username && req.body.password && req.body.email) {

      user.find({ email: req.body.email }, (err, data) => {

        if (data.length == 0) {

          let User = new user({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
          });
          User.save((err, data) => {
            if (err) {
              res.status(400).json({
                errorMessage: err,
                status: false
              });
            } else {
              res.status(200).json({
                status: true,
                title: 'Registered Successfully.'
              });
            }
          });

        } else {
          res.status(400).json({
            errorMessage: `Email ${req.body.email} Already Exist!`,
            status: false
          });
        }

      });

    } else {
      res.status(400).json({
        errorMessage: 'Add proper parameter first!',
        status: false
      });
    }
  } catch (e) {
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      status: false
    });
  }
});

function checkUserAndGenerateToken(data, req, res) {
  jwt.sign({ user: data.email, id: data._id }, 'shhhhh11111', { expiresIn: '1d' }, (err, token) => {
    if (err) {
      res.status(400).json({
        status: false,
        errorMessage: err,
      });
    } else {
      res.json({
        message: 'Login Successfully.',
        token: token,
        status: true
      });
    }
  });
}

/* Api to add User */
app.post("/add-user", (req, res) => {
  try {
    if (req.body && req.body.email && req.body.username && req.body.password && req.body.confirm_password) {
      let new_user = new user();
      new_user.username = req.body.username;
      new_user.email = req.body.email;
      new_user.password = req.body.password;
      new_user.confirm_password = req.body.confirm_password;

      if (req.body.password != req.body.confirm_password) {
        res.status(200).json({
          status: true,
          title: 'Password does not match.'
        });
      } else {
        user.find({ email: req.body.email }, (err, data) => {
          if (data.length == 0) {
            new_user.save((err, data) => {
              if (err) {
                res.status(400).json({
                  errorMessage: err,
                  status: false
                });
              } else {
                res.status(200).json({
                  status: true,
                  title: 'User Added successfully.'
                });
              }
            });
          } else {
            res.status(400).json({
              errorMessage: `Email ${req.body.email} Already Exist!`,
              status: false
            });
          }
        });
      }
    } else {
      res.status(400).json({
        errorMessage: 'Add proper parameter first!',
        status: false
      });
    }
  } catch (e) {
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      status: false
    });
  }
});

/*Api to get and search user with pagination and search by name*/
app.get("/get-user", (req, res) => {
  try {
    var query = {};
    if (req.query && req.query.search) {
      query["$or"] = [];
      query["$or"].push({
        username: { $regex: req.query.search, $options: 'i' }
      });
      query["$or"].push({
        email: { $regex: req.query.search, $options: 'i' }
      });
    }
    var perPage = 5;
    var page = req.query.page || 1;
    user.find(query, { })
      .skip((perPage * page) - perPage).limit(perPage)
      .then((data) => {
        user.find(query).count()
          .then((count) => {

            if (data && data.length > 0) {
              res.status(200).json({
                status: true,
                title: 'User retrived.',
                users: data,
                current_page: page,
                total: count,
                pages: Math.ceil(count / perPage),
              });
            } else {
              res.status(400).json({
                errorMessage: 'There is no user!',
                status: false
              });
            }

          });

      }).catch(err => {
        res.status(400).json({
          errorMessage: err.message || err,
          status: false
        });
      });
  } catch (e) {
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      status: false
    });
  }

});

/* Api to update User */
app.post("/update-user", (req, res) => {
  try {
    if (req.body && req.body.username && req.body.email && req.body.password &&
      req.body.id && req.body.confirm_password) {

      if (req.body.password != req.body.confirm_password) {
        res.status(200).json({
          status: true,
          title: 'Password does not match.'
        });
      } else {
        user.findById(req.body.id, (err, new_user) => {
          if (req.body.username) {
            new_user.username = req.body.username;
          }
          if (req.body.email) {
            new_user.email = req.body.email;
          }
          if (req.body.password) {
            new_user.password = req.body.password;
          }
          if (req.body.confirm_password) {
            new_user.confirm_password = req.body.confirm_password;
          }
          new_user.save((err, data) => {
            if (err) {
              res.status(400).json({
                errorMessage: err,
                status: false
              });
            } else {
              res.status(200).json({
                status: true,
                title: 'User updated.'
              });
            }
          });
        });
      }
    } else {
      res.status(400).json({
        errorMessage: 'Add proper parameter first!',
        status: false
      });
    }
  } catch (e) {
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      status: false
    });
  }
});

/* Api to delete User */
app.post("/delete-user", (req, res) => {
  try {
    if (req.body && req.body.id) {
      user.findByIdAndRemove(req.body.id, (err, deletedUser) => {
        if (deletedUser) {
          return res.status(200).json({ title: 'User deleted successfully', status: true, deletedUser });
        } else {
          return res.status(404).json({ errorMessage: 'User not found', status: false });
        }
      });
    } else {
      res.status(400).json({
        errorMessage: 'Add proper parameter first!',
        status: false
      });
    }
  } catch (e) {
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      exMessage: e.message,
      status: false
    });
  }
});

app.listen(2000, () => {
  console.log("Server is Runing On port 2000");
});
