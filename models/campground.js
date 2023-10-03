const mongoose = require("mongoose");
const Review = require("./review");
const { Schema } = mongoose;

// 画像加工用のイメージスキーマ
const imageSchema = new Schema({
    url: String,
    filename: String,
});

// テストバーチャル
// imageスキーマにサムネイルというプロパティがあるかのように定義を増やせる
// mongoDBに明示的に追加しなくていい、既にurlっていう定義はあるし
// ダウンロードする画像のサイズを小さくすることで、該当ページのパフォーマンスが改善するよ
imageSchema.virtual("thumbnail").get(function () {
    // 元のurlを置換するよ
    return this.url.replace("/upload", "/upload/w_200");
});

// jsonstringifyバーチャル間エラー対策用にオプション作成
const opts = { toJSON: { virtuals: true } };
const campgroundSchema = new Schema(
    {
        title: String,
        images: [imageSchema],
        // 受け取るgeojsonを定義するよ
        geometry: {
            type: {
                type: String, // Don't do `{ location: { type: String } }`
                enum: ["Point"], // 'location.type' must be 'Point'
                required: true,
            },
            coordinates: {
                type: [Number],
                required: true,
            },
        },
        price: Number,
        description: String,
        location: String,
        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        reviews: [
            {
                type: Schema.Types.ObjectId,
                ref: "Review",
            },
        ],
    },
    opts
);

// 本番バーチャル
// マングース内でプロパティズ内にpopupmarkupがあるように定義するよ
campgroundSchema.virtual("properties.popupMarkup").get(function () {
    return `<strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
    <p>${this.description.substring(0, 20)}...</p>`;
});

campgroundSchema.post("findOneAndDelete", async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews,
            },
        });
    }
});

module.exports = mongoose.model("Campground", campgroundSchema);
