require("dotenv").config();
if (process.platform === "win32" && process.env.USE_PUBLIC_DNS !== "false") {
  // The local Windows DNS resolver on the developer's network refused Node SRV queries.
  // Render runs on Linux and therefore keeps the platform's default resolver.
  require("node:dns").setServers(["8.8.8.8", "8.8.4.4"]);
}
const express = require("express");
const mongoose = require("mongoose");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required in production. Set it in your hosting environment.");
}

app.set("view engine","ejs");
app.use(expressLayouts);
app.set("layout", "layouts/boilerplate");
app.set("views",path.join(__dirname,"views"));
app.set("trust proxy",1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan("dev"));
app.use(express.urlencoded({extended:true,limit:"1mb"}));
app.use(express.json({limit:"1mb"}));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"public")));

// Render health checks use this endpoint to confirm the app and database are ready.
app.get("/healthz", (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? "ok" : "database_not_ready",
    database: databaseReady ? "connected" : "disconnected"
  });
});

app.use(session({
  secret:process.env.SESSION_SECRET || "local-development-secret-change-before-deploy",
  resave:false,
  saveUninitialized:false,
  store: MongoStore.create({ mongoUrl:process.env.MONGO_URI, collectionName:"sessions" }),
  cookie:{
    httpOnly:true,
    sameSite:"lax",
    secure:process.env.NODE_ENV==="production",
    maxAge:1000*60*60*24*7
  }
}));
app.use(flash());
app.use((req,res,next)=>{
  res.locals.req = req;
  res.locals.currentAdmin = req.session.adminName || null;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentPath = req.path;
  res.locals.publicBaseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get("host")}`;
  next();
});

app.use("/",require("./routes/home"));
app.use("/",require("./routes/auth"));
app.use("/admin",require("./routes/admin"));
app.use(notFound);
app.use(errorHandler);

connectDB()
  .then(()=>app.listen(PORT, "0.0.0.0", ()=>console.log(`Surajpur Virasat listening on 0.0.0.0:${PORT}`)))
  .catch(err=>{console.error("Database connection failed:",err);process.exit(1);});

module.exports = app;
