const express = require("express");
const router = express.Router();
const campgrounds = require("../controllers/campgrounds");
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn, isAuthor, validateCampground } = require("../middleware");
const multer = require("multer");
const { storage } = require("../cloudinary/index");
// cloudinaryディレクトリのstorageインスタンスにファイルアップロードする
const upload = multer({ storage });

router.route("/").get(catchAsync(campgrounds.index)).post(
    isLoggedIn,
    // uploadとvalidateの順番変更しないとreqボディの値をチェックできない
    upload.array("image"),
    validateCampground,
    catchAsync(campgrounds.createCampground)
);
// imageフィールド（name属性がimageのインプット）をファイルとしてパースして、他のテキストフィールドはボディに入る
// upload.arrayは複数のファイルを受け取れる
// .post(upload.array("image"), (req, res) => {
//     console.log(req.body, req.files);
//     res.send("受け付けました");
// });

router.get("/new", isLoggedIn, campgrounds.renderNewForm);

router
    .route("/:id")
    .get(catchAsync(campgrounds.showCampground))
    .put(
        isLoggedIn,
        isAuthor,
        upload.array("image"),
        validateCampground,
        catchAsync(campgrounds.updateCampground)
    )
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

router.get("/:id/edit", isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));

module.exports = router;
