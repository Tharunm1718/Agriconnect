let express = require("express");
let app = express();
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
require("dotenv").config();
const bodyParser = require('body-parser');
const cloudinary = require('cloudinary').v2;

const farmer = require("./models/farmer.js");
const worker = require("./models/worker.js");
const booking = require("./models/booking.js");


app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));


async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}
main();

app.use(
  session({
    secret: process.env.SESSION_SECRET || "agriconnectSecretKey",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 24 * 60 * 60,
    }),
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    },
  })
);


function isFarmerLoggedIn(req, res, next) {
  if (!req.session.farmerId) {
    return res.redirect("/login/farmer");
  }
  next();
}

function isWorkerLoggedIn(req, res, next) {
  if (!req.session.workerId) {
    return res.redirect("/login/farmer");
  }
  next();
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_SEC_KEY || 'your_api_secret'
});

app.get("/", (req, res) => {
  res.render("home.ejs");
});


app.get("/Agriconnect/signup", (req, res) => {
  res.render("signup.ejs");
});

app.post("/Agriconnect/signup", async (req, res) => {
  let { name, phoneNumber, password, village, cap, district, state, pincode } = req.body;
  village = village.toLowerCase();
  district = district.toLowerCase();
  state = state.toLowerCase();
  const newFarmer = new farmer({
    name,
    phoneNumber,
    password,
    location: { village, district, state, pincode },
  });
  await newFarmer.save();
  req.session.newphoneNumber = phoneNumber;
  res.redirect("/upload");
});

app.post("/Agriconnect/signup/worker", async (req, res) => {
  let { name, phoneNumber, password, skills, village, district, state, pincode } = req.body;
  village = village.toLowerCase();
  district = district.toLowerCase();
  state = state.toLowerCase();
  const skillsArray = skills.split(",").map(skill => skill.trim());
  const newWorker = new worker({
    name,
    phoneNumber,
    password,
    skills: skillsArray,
    location: { village, district, state, pincode },
  });
  await newWorker.save();
  req.session.newphoneNumber = phoneNumber;
  res.redirect("/upload");
});

app.get('/upload', (req, res) => {
  res.render('profile.ejs'); 
});

app.post('/upload', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_SEC_KEY) {
      console.error('Cloudinary credentials not properly configured');
      return res.status(500).json({ error: 'Image upload service not properly configured' });
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: 'profile_pictures',
    });

    const url = cloudinary.url(result.public_id, {
      transformation: [{ width: 80, height: 80, crop: 'fill', gravity: 'face', radius: 'max' }]
    });

    const phone = req.session.newphoneNumber;
    const workerDoc = await worker.findOne({ phoneNumber: phone });
    const farmerDoc = await farmer.findOne({ phoneNumber: phone });

    if (workerDoc) {
      workerDoc.profileImage = url;
      await workerDoc.save();
    } else if (farmerDoc) {
      farmerDoc.profileImage = url;
      await farmerDoc.save();
    } else {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, url });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

app.get("/login/farmer", (req, res) => {
  res.render("farmer.ejs");
});

app.post("/login/farmer", async (req, res) => {
  const { phoneNumber, password } = req.body;

  try {
    const foundFarmer = await farmer.findOne({ phoneNumber, password });
    if (foundFarmer) {
      req.session.farmerId = foundFarmer._id;
      req.session.district = foundFarmer.location.district;

      req.session.save((err) => {
        if (err) {
          return res.status(500).send("Error during login. Please try again.");
        }
        res.redirect("/dashboard/farmer");
      });
    } else {
      res.status(401).send("Invalid phone number or password.");
    }
  } catch (err) {
    res.status(500).send("Internal server error.");
  }
});

app.post("/login/worker", async (req, res) => {
  const { phoneNumber, password } = req.body;

  try {
    const foundWorker = await worker.findOne({ phoneNumber, password });
    if (foundWorker) {
      req.session.workerId = foundWorker._id;

      req.session.save((err) => {
        if (err) {
          return res.status(500).send("Error during login. Please try again.");
        }
        res.redirect("/dashboard/worker");
      });
    } else {
      res.status(401).send("Invalid phone number or password.");
    }
  } catch (err) {
    res.status(500).send("Internal server error.");
  }
});


app.get("/dashboard/farmer", isFarmerLoggedIn, async (req, res) => {
  const farmerDetails = await farmer.findById(req.session.farmerId);
  const isbooked = await booking.findOne({ farmerId: farmerDetails._id });

  let bookedWorker = null;
  if (isbooked) {
    bookedWorker = await worker.findById(isbooked.workerId);
  }

  res.render("farmerdashboard.ejs", { isbooked, bookedWorker, farmerDetails });
});

app.get("/dashboard/worker", isWorkerLoggedIn, async (req, res) => {
  const workerDetails = await worker.findById(req.session.workerId);
  const isbooked = await booking.findOne({ workerId: workerDetails._id });

  let bookedfarmer = null;
  if (isbooked) {
    bookedfarmer = await farmer.findById(isbooked.farmerId);
  }

  res.render("workerDashBoard.ejs", { workerDetails, bookedfarmer, isbooked });
});


app.get("/book-worker-form", isFarmerLoggedIn, (req, res) => {
  res.render("workform.ejs");
});

app.post("/book-worker-form", isFarmerLoggedIn, async (req, res) => {
  const newform = req.body;
  const normalizedDistrict = req.session.district.trim().toLowerCase();
  const normalizedWorkType = newform.workType.trim().toLowerCase();
  const availableWorker = await worker.find({
    skills: newform.workType,
    "location.district": req.session.district,
  });
  req.session.availableWorker = availableWorker;
  req.session.newform = newform;
  res.redirect("/bookworker");
});

app.get("/bookworker", isFarmerLoggedIn, (req, res) => {
  const availableWorker = req.session.availableWorker;
  const newform = req.session.newform;
  const userLocation = req.session.district;
  const userId = req.session.farmerId;
  res.render("bookworker.ejs", { availableWorker, newform, userId, userLocation });
});

app.post("/bookworker", isFarmerLoggedIn, async (req, res) => {
  const { farmerId, workerId, workType, location, date } = req.body;
  const newBooking = new booking({
    farmerId,
    workerId,
    workType,
    location,
    date,
    status: "Pending",
  });
  await newBooking.save();
  res.redirect("/dashboard/farmer");
});


app.get("/avilable-jobs", isWorkerLoggedIn, async (req, res) => {
  const isbooked = await booking.find({ workerId: req.session.workerId });
  let bookedfarmer = [];

  if (isbooked.length > 0) {
    bookedfarmer = await Promise.all(
      isbooked.map(async booking => await farmer.findById(booking.farmerId))
    );
  }

  res.render("available-jobs.ejs", { isbooked, bookedfarmer });
});

app.post("/available-jobs", isWorkerLoggedIn, async (req, res) => {
  const { bookingId, status } = req.body;
  await booking.findByIdAndUpdate(bookingId, { status }, { new: true });
  res.redirect("/dashboard/worker");
});

app.get("/activity-section", isFarmerLoggedIn, async (req, res) => {
  const isbooked = await booking.find({ farmerId: req.session.farmerId });
  let bookedWorker = [];

  if (isbooked.length > 0) {
    bookedWorker = await Promise.all(
      isbooked.map(async booking => await worker.findById(booking.workerId))
    );
  }

  res.render("recent-activity.ejs", { isbooked, bookedWorker });
});

app.post("/activity-section", isFarmerLoggedIn, async (req, res) => {
  const { bookingId, completed } = req.body;
  await booking.findByIdAndUpdate(bookingId, { completed }, { new: true });
  res.redirect("/dashboard/farmer");
});


app.get("/logout/farmer", (req, res) => {
  req.session.destroy(err => {
    if (err) console.error("Error destroying farmer session:", err);
    res.redirect("/login/farmer");
  });
});

app.get("/logout/worker", (req, res) => {
  req.session.destroy(err => {
    if (err) console.error("Error destroying worker session:", err);
    res.redirect("/login/farmer");
  });
});


app.get("/check-session", (req, res) => {
  res.send(req.session);
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 AgriConnect running at http://localhost:${port}`);
});
