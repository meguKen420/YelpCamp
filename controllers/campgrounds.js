const Campground = require("../models/campground");
const { cloudinary } = require("../cloudinary");
// mapbox設定
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapboxToken = process.env.MAPBOX_TOKEN;
// geocoderがリクエスト投げるクライアント
const geocoder = mbxGeocoding({ accessToken: mapboxToken });

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render("campgrounds/index", { campgrounds });
};

module.exports.renderNewForm = (req, res) => {
    res.render("campgrounds/new");
};

module.exports.showCampground = async (req, res) => {
    const campground = await Campground.findById(req.params.id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("author");
    if (!campground) {
        req.flash("error", "キャンプ場は見つかりませんでした");
        return res.redirect("/campgrounds");
    }
    res.render("campgrounds/show", { campground });
};

module.exports.createCampground = async (req, res) => {
    // 地理情報をjsonで表現するときに使うgeoJSONを返すよ
    const geoData = await geocoder
        .forwardGeocode({
            // 地名入力インプットから緯度経度に変換したいよ
            query: req.body.campground.location,
            limit: 1,
        })
        .send();
    // if (!req.body.campground) throw new ExpressError('不正なキャンプ場のデータです', 400);
    const campground = new Campground(req.body.campground);
    // geometry撮れなかった場合のエラーハンドリング・・・
    campground.geometry = geoData.body.features[0].geometry;
    // req.filesの１個１個のファイルに対してオブジェクトを返して、配列に入れる
    campground.images = req.files.map((f) => ({ url: f.path, filename: f.filename }));
    campground.author = req.user._id;
    await campground.save();
    req.flash("success", "新しいキャンプ場を登録しました");
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash("error", "キャンプ場は見つかりませんでした");
        return res.redirect("/campgrounds");
    }

    res.render("campgrounds/edit", { campground });
};

module.exports.updateCampground = async (req, res) => {
    console.log(req.body);
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
    // 配列そのものをプッシュするわけにもいかないから、スプレッド構文で配列要素一個一個をカンマ区切りでプッシュする形にするよ
    campground.images.push(...imgs);
    await campground.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            // クラウド上のデータも消すよ
            await cloudinary.uploader.destroy(filename);
        }
        // images配列のファイル一覧とdeleteImages（["（["asdff","qwert","..."]）の中の要素を照らし合わせてファイル名が一致した分だけ取り除くよ
        await campground.updateOne({
            $pull: { images: { filename: { $in: req.body.deleteImages } } },
        });
    }
    req.flash("success", "キャンプ場を更新しました");
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash("success", "キャンプ場を削除しました");
    res.redirect("/campgrounds");
};
