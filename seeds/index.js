const mongoose = require("mongoose");
const cities = require("./cities");
const { descriptors, places } = require("./seedHelpers");
const Campground = require("../models/campground");

mongoose
    .connect("mongodb://localhost:27017/yelp-camp3", {
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
const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const randomCityIndex = Math.floor(Math.random() * cities.length);
        const price = Math.floor(Math.random() * 2000) + 1000;
        const camp = new Campground({
            author: "65143da3fed1004bbc240596",
            location: `${cities[randomCityIndex].prefecture}${cities[randomCityIndex].city}`,
            title: `${sample(descriptors)}・${sample(places)}`,
            images: [
                {
                    url: "https://res.cloudinary.com/dhrv0pglb/image/upload/v1695832921/YelpCamp/flmablcuorty8he9qcql.jpg",
                    filename: "YelpCamp/flmablcuorty8he9qcql",
                },
                {
                    url: "https://res.cloudinary.com/dhrv0pglb/image/upload/v1695832921/YelpCamp/u3ob8nlas8p9mcfesz1c.jpg",
                    filename: "YelpCamp/u3ob8nlas8p9mcfesz1c",
                },
                {
                    url: "https://res.cloudinary.com/dhrv0pglb/image/upload/v1695832921/YelpCamp/px6mhs5l9uixhdzci8s2.jpg",
                    filename: "YelpCamp/px6mhs5l9uixhdzci8s2",
                },
            ],
            description:
                "木曾路はすべて山の中である。あるところは岨づたいに行く崖の道であり、あるところは数十間の深さに臨む木曾川の岸であり、あるところは山の尾をめぐる谷の入り口である。一筋の街道はこの深い森林地帯を貫いていた。東ざかいの桜沢から、西の十曲峠まで、木曾十一宿はこの街道に添うて、二十二里余にわたる長い谿谷の間に散在していた。道路の位置も幾たびか改まったもので、古道はいつのまにか深い山間に埋もれた。",
            price,
            // 経度緯度データ
            geometry: {
                type: "Point",
                coordinates: [cities[randomCityIndex].longitude, cities[randomCityIndex].latitude],
            },
        });
        await camp.save();
    }
};

seedDB().then(() => {
    mongoose.connection.close();
});
