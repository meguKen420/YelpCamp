const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

// 保管場所（クラウディナリーのクラウド上）・フォーマット形式
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "YelpCamp",
        allowed_format: ["jpeg", "jpg", "png"],
    },
});

module.exports = {
    cloudinary,
    storage,
};
