// production = 本番　node.jsが開発モードの場合の処理で、dotenvモジュールの力で.envファイルを読み込ませますよ
// 環境変数で秘匿したい重要な情報を使えるようにするよenvファイルは絶対共有しちゃだめだよ
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");

const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

const userRoutes = require("./routes/users");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");

const MongoStore = require("connect-mongo");
const { func } = require("joi");
// const dbUrl = process.env.DB_URL;
const dbUrl = process.env.DB_URL || "mongodb://0.0.0.0:27017/yelp-camp3";
mongoose
    .connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        family: 4,
        useCreateIndex: true,
        useFindAndModify: false,
    })
    .then(() => {
        console.log("MongoDBコネクションOK！！");
    })
    .catch((err) => {
        console.log("MongoDBコネクションエラー！！！");
        console.log(err);
    });

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
//SQLインジェクション対策
app.use(
    mongoSanitize({
        // 置換もできるよ
        replaceWith: "_",
    })
);

// sessoin store作成　memorystoreからの移行
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        // 本来は環境変数に格納すべき
        secret: "mysecret",
    },
    // 一定期間セッションの中身を無駄に更新しなくなるよ
    touchAfter: 24 * 3600, // time period in seconds
});

// storeエラー監視
store.on("error", (e) => {
    console.log("セッションストアエラー", e);
});

const sessionConfig = {
    // セッションはmemorystoreからmongoDBに保存されるようになるよ
    store,
    name: "session",
    secret: "mysecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        // セッションに関係したクッキーはhttp経由でしかアクセスできないよ　クライアントのjsからはアクセス無理
        // secureまでつければhhtps経由でしかアクセスできなくなるよ
        httpOnly: true,
        // secure:true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
};
app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());
// httpヘッダーにセキュリティを強化する値を差し込んでくれるよ
app.use(helmet());

const scriptSrcUrls = ["https://api.mapbox.com", "https://cdn.jsdelivr.net"];
const styleSrcUrls = ["https://api.mapbox.com", "https://cdn.jsdelivr.net"];
const connectSrcUrls = [
    "https://api.mapbox.com",
    "https://*.tiles.mapbox.com",
    "https://events.mapbox.com",
];
const fontSrcUrls = [];
const imgSrcUrls = [
    // 自分の食らうディナリーの画像のみ許可するよ　他人のは？
    `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`,
    "https://images.unsplash.com",
];

// コンテンツやスクリプトの取得を制御するポリシーを設定するよ
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            childSrc: ["blob:"],
            objectSrc: [],
            imgSrc: ["'self'", "blob:", "data:", ...imgSrcUrls],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

app.get("/", (req, res) => {
    res.render("home");
});

app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.all("*", (req, res, next) => {
    next(new ExpressError("ページが見つかりませんでした", 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) {
        err.message = "問題が起きました";
    }
    res.status(statusCode).render("error", { err });
});

app.listen(3000, () => {
    console.log("ポート3000でリクエスト待受中...");
});
