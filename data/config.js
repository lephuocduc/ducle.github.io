/**
 * WEDDING CONFIGURATION DATA
 * Cấu hình toàn bộ nội dung website thiệp cưới online.
 * Mọi thay đổi về thông tin, hình ảnh, địa điểm, ngân hàng... chỉ cần chỉnh sửa tại đây.
 */

// Domain lưu trữ hình ảnh Cloudflare R2
const R2_HOST = "https://media.phuocducthusuong.com";

export const weddingConfig = {
    // Nguồn ảnh Cloudflare R2 dùng chung toàn website
    r2Host: R2_HOST,

    // Thông tin SEO & Meta
    seo: {
        title: "Duc & Suong’s Wedding - Phước Đức & Thu Sương | Song Hỷ Cát Tường",
        ogImage: "assets/img/cover.webp",
        favicon: "assets/icons/favicon.svg"
    },

    // Thông tin Chú Rể & Cô Dâu
    groom: {
        name: "Lê Phước Đức",
        shortName: "Phước Đức",
        title: "Chú Rể",
        father: "Lê Phước Thành",
        mother: "Lê Thị Kim Tâm",
        avatar: "assets/img/groom.jpg",
        story: "Một người đàn ông điềm tĩnh, luôn quan tâm và hết lòng vì gia đình.",
        bank: {
            bankName: "TPBank (Ngân hàng Tiên Phong)",
            bankCode: "TPB",
            accountNumber: "01945354401",
            accountOwner: "LE PHUOC DUC",
            qrImage: "https://img.vietqr.io/image/TPB-01945354401-compact2.png?amount=0&addInfo=Mung%20Cuoi%20Le%20Phuoc%20Duc"
        }
    },

    bride: {
        name: "Trần Thị Thu Sương",
        shortName: "Thu Sương",
        title: "Cô Dâu",
        father: "Trần Văn Tèo",
        mother: "Bùi Thị Hiền",
        avatar: "assets/img/bride.jpg",
        story: "Một cô gái dịu dàng, yêu đời và luôn mang đến nụ cười ấm áp.",
        bank: {
            bankName: "VPBank (Ngân hàng Việt Nam Thịnh Vượng)",
            bankCode: "VPB",
            accountNumber: "0773345226",
            accountOwner: "TRAN THI THU SUONG",
            qrImage: "https://img.vietqr.io/image/VPB-0773345226-compact2.png?amount=0&addInfo=Mung%20Cuoi%20Tran%20Thi%20Thu%20Suong"
        }
    },

    // Ngày cưới & Đếm ngược
    weddingDate: "2026-10-25T00:00:00+07:00", // Giờ Việt Nam (UTC+7), cố định cho khách xem ở mọi múi giờ
    weddingDateDisplay: "25.10.2026",
    lunarDateDisplay: "16 Tháng 9 Năm Bính Ngọ (Âm Lịch)",

    // Hero Section
    hero: {
        subtitle: "SAVE THE DATE",
        title: "Lễ Thành Hôn & Tiệc Cưới",
        backgroundImage: "assets/img/cover.webp",
        quote: "Tình yêu không phải là nhìn nhau, mà là cùng nhau nhìn về một hướng."
    },

    // Hành trình yêu thương (Timeline) - Tải trực tiếp từ thư mục assets nội bộ cực nhanh
    story: [
        {
            year: "2016",
            date: "",
            title: "Lần Đầu Gặp Gỡ",
            content: "Giữa dòng đời tấp nập, thật may mắn khi anh gặp em. Từ khoảnh khắc ấy, hai trái tim dần đồng điệu và cùng nhau viết nên câu chuyện tình yêu của riêng mình.",
            image: "assets/img/IMG_1781.webp"
        },
        {
            year: "2016",
            date: "12/12/2016",
            title: "Lời Tỏ Tình Ngọt Ngào",
            content: "Dưới ánh đèn lung linh, câu nói 'Anh yêu em' đã chính thức gắn kết hai trái tim làm một.",
            image: "assets/img/LoiToTinhNgotNgao.webp"
        },
        {
            year: "2016-2026",
            date: "",
            title: "Cùng Nhau Vượt Qua Thử Thách",
            content: "Không phải lúc nào con đường tình yêu cũng trải đầy hoa hồng. Có những ngày xa cách vì công việc, những lần giận hờn vu vơ, những khó khăn tưởng chừng như thử thách cả hai. Nhưng chính trong những năm tháng ấy, hai đứa đã học cách lắng nghe, thấu hiểu và luôn chọn ở lại bên nhau. Mỗi khó khăn đi qua lại càng làm cho tình yêu thêm vững chắc, để rồi cả hai tin chắc rằng đây chính là người mình muốn đi cùng đến hết cuộc đời.",
            image: "assets/img/mosaic.webp"
        },
        {
            year: "2026",
            date: "13/05/2026",
            title: "Màn Cầu Hôn Bất Ngờ",
            content: "Dưới ánh hoàng hôn dịu dàng, chiếc nhẫn được trao cùng câu trả lời “Em đồng ý!” đã viết tiếp một chương mới cho chuyện tình của chúng mình.",
            image: "assets/img/NAM_3230.webp"
        },
        {
            year: "2026",
            date: "04/06/2026",
            title: "Lễ Dạm Ngõ",
            content: "Hai bên gia đình gặp gỡ, chính thức mở lời cho hành trình về chung một nhà.",
            image: "assets/img/DSCF5639-1.webp"
        },
        {
            year: "2026",
            date: "25/10/2026",
            title: "Ngày Về Chung Một Nhà",
            content: "Được sự chúc phúc của gia đình hai bên và bạn bè, chúng mình chính thức trở thành vợ chồng!",
            image: "assets/img/NAM_3641.webp"
        }
    ],

    // Danh sách các nghi lễ & tiệc cưới
    ceremonies: [
        {
            id: "tiec-mung-vu-quy",
            tag: "TIỆC MỪNG VU QUY - NHÀ GÁI",
            title: "Tiệc Mừng Vu Quy",
            time: "09:00 - Ngày 24/10/2026",
            startTime: "2026-10-24T09:00:00+07:00",
            endTime: "2026-10-24T19:00:00+07:00",
            address: "Tư gia nhà gái - Ấp Giồng Kiến, Xã Thạnh Trị, tỉnh Vĩnh Long",
            icon: "fa-champagne-glasses",
            mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d2327.911756606885!2d106.58557065491705!3d10.198035858679557!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTDCsDExJzQ5LjYiTiAxMDbCsDM1JzA3LjEiRQ!5e0!3m2!1sen!2s!4v1785249568380!5m2!1sen!2s"
        },
        {
            id: "nha-gai",
            tag: "LỄ VU QUY - NHÀ GÁI",
            title: "Lễ Vu Quy",
            time: "07:00 - Ngày 25/10/2026",
            startTime: "2026-10-25T07:00:00+07:00",
            endTime: "2026-10-25T09:00:00+07:00",
            address: "Ấp Giồng Kiến, Xã Thạnh Trị, tỉnh Vĩnh Long",
            icon: "fa-hand-holding-heart",
            blessing: "Vu quy duyên thắm trăm năm<br>Con về giữ trọn nghĩa ân gia đình",
            mapEmbedUrl: null
        },
        {
            id: "nha-trai",
            tag: "LỄ TÂN HÔN - NHÀ TRAI",
            title: "Lễ Tân Hôn",
            time: "10:00 - Ngày 25/10/2026",
            startTime: "2026-10-25T10:00:00+07:00",
            endTime: "2026-10-25T12:00:00+07:00",
            address: "18 Nguyễn Văn Cự, Phường Tân Tạo, TP. Hồ Chí Minh",
            icon: "fa-hand-holding-heart",
            blessing: "Tân hôn đẹp mối duyên lành<br>Trăm năm hòa thuận, gia đình ấm êm",
            mapEmbedUrl: null
        },
        {
            id: "tiec-cuoi",
            tag: "TIỆC CƯỚI MẬT NGỌT",
            title: "Tiệc Mừng Đám Cưới",
            time: "17:30 - Ngày 25/10/2026",
            startTime: "2026-10-25T17:30:00+07:00",
            endTime: "2026-10-25T21:00:00+07:00",
            address: "Trung tâm hội nghị tiệc cưới Asiana Plaza Tân Phú - 284-286 Vườn Lài, Phường Phú Thọ Hòa, TP. Hồ Chí Minh",
            icon: "fa-champagne-glasses",
            mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5067.536578916534!2d106.62298207601286!3d10.78807275897688!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752d9d5888fc19%3A0x172d76a84a0ca188!2zVHJ1bmcgdMOibSBo4buZaSBuZ2jhu4sgdGnhu4djIGPGsOG7m2kgQXNpYW5hIFBsYXphIFbGsOG7nW4gTMOgaQ!5e0!3m2!1sen!2s!4v1785249616420!5m2!1sen!2s"
        }
    ],

    // Mã PIN bảo mật để mở giao diện tải ảnh từ điện thoại trong ngày cưới (Mặc định: ngày cưới 251026)
    adminPin: "251026",

    // Cấu hình Nguồn ảnh Cloudflare R2 & Danh sách 4 Album
    // Host domain: https://media.phuocducthusuong.com
    // Cấu trúc thư mục trên R2: {folder}/thumbs/{file} và {folder}/full/{file}
    r2Gallery: {
        host: R2_HOST,
        // API Cloudflare Worker để tự động đồng bộ danh sách ảnh khi upload lên R2
        apiUrl: "https://wedding.phuocducthusuong.com/api/photos",
        // File manifest danh mục ảnh dự phòng trên R2
        manifestUrl: `${R2_HOST}/photos.json`,
        // Bật chế độ tự động đồng bộ ảnh mới nhất từ R2
        autoSync: true,
        albums: [
            {
                id: "01-pre-wedding",
                folder: "01-pre-wedding",
                title: "Pre-Wedding",
                tag: "ALBUM CƯỚI",
                icon: "fa-heart",
                // Danh sách tên file ảnh (thêm bớt tên file vào mảng này rất dễ dàng)
                images: [
                    "NAM_3641.jpg", "NAM_3511.jpg", "NAM_3814.jpg", "NAM_3256.jpg",
                    "NAM_4087.jpg", "NAM_2843.jpg", "NAM_3894.jpg", "NAM_4041.jpg",
                    "NAM_3688.jpg", "NAM_3259.jpg", "NAM_2918.jpg", "NAM_3068.jpg",
                    "NAM_3016.jpg", "NAM_2893.jpg", "NAM_2900.jpg", "NAM_2837.jpg",
                    "NAM_3230.jpg", "NAM_3648.jpg", "NAM_3954.jpg", "NAM_3540.jpg",
                    "NAM_3632.jpg", "NAM_3502.jpg", "NAM_3466.jpg", "NAM_3281.jpg",
                    "NAM_3293.jpg", "NAM_3318.jpg", "NAM_3415.jpg", "NAM_3863.jpg",
                    "NAM_4045.jpg", "NAM_2906.jpg", "NAM_2981.jpg", "NAM_3157.jpg",
                    "NAM_3186.jpg", "NAM_2934.jpg", "NAM_3369.jpg", "NAM_3833.jpg",
                    "NAM_3988.jpg", "NAM_3665.jpg", "NAM_3407.jpg", "NAM_3103.jpg"
                ]
            },
            {
                id: "02-tiec-mung-vu-quy",
                folder: "02-tiec-mung-vu-quy",
                title: "Tiệc Mừng Vu Quy",
                tag: "NHÀ GÁI • 24/10/2026",
                icon: "fa-champagne-glasses",
                images: []
            },
            {
                id: "03-vu-quy-tan-hon",
                folder: "03-vu-quy-tan-hon",
                title: "Lễ Vu Quy & Tân Hôn",
                tag: "NGHI LỄ • 25/10/2026",
                icon: "fa-ring",
                images: []
            },
            {
                id: "04-tiec-cuoi-asianaplaza",
                folder: "04-tiec-cuoi-asianaplaza",
                title: "Tiệc Cưới Asiana Plaza",
                tag: "TIỆC CƯỚI • 25/10/2026",
                icon: "fa-cake-candles",
                images: []
            }
        ]
    },

    // Album ảnh cưới tương thích ngược
    galleryDriveUrl: "https://drive.google.com/drive/folders/1ET3ro78joijlE40VfAcaFo0KQZEqONzG",
    gallery: [
        { src: "assets/img/NAM_3318.webp", title: "Ánh Mắt Yêu Thương", aspect: "wide" },
        { src: "assets/img/NAM_2906.webp", title: "Khoảnh Khắc Ngọt Ngào", aspect: "tall" },
        { src: "assets/img/NAM_3103.webp", title: "Tay Trong Tay", aspect: "square" },
        { src: "assets/img/NAM_3230.webp", title: "Lời Thề Hứa", aspect: "wide" },
        { src: "assets/img/NAM_3814.webp", title: "Nụ Cười Hạnh Phúc", aspect: "tall" },
        { src: "assets/img/NAM_2934.webp", title: "Bình Yên Bên Em", aspect: "square" },
        { src: "assets/img/NAM_3954.webp", title: "Nụ Hôn Ngọt Ngào", aspect: "square" },
        { src: "assets/img/NAM_3511.webp", title: "Ngày Trọng Đại", aspect: "wide" },
        { src: "assets/img/NAM_3648.webp", title: "Sóng Đôi Cùng Nhau", aspect: "tall" },
        { src: "assets/img/NAM_4087.webp", title: "Vũ Điệu Hạnh Phúc", aspect: "tall" },
        { src: "assets/img/NAM_3632.webp", title: "Trọn Đời Bên Nhau", aspect: "wide" },
        { src: "assets/img/NAM_2843.webp", title: "Khởi Đầu Mới", aspect: "square" }
    ],

    // Google Apps Script API URL cho phần Lời Chúc (Nếu chưa có Apps Script có thể để rỗng để dùng Mock local)
    wishesApiUrl: "https://script.google.com/macros/s/AKfycbx28t1YcVTx2h2O727DA6mpFH-RB-PjRodUD-nJswnbvlKPOZFVG8h4tlf6Cl1Q9sro/exec",

    // Lời cảm ơn & Footer
    footer: {
        thankYouMessage: "Cảm ơn sự hiện diện và những lời chúc phúc ý nghĩa từ mọi người. Sự có mặt của mọi người là niềm vui lớn nhất cho tình yêu của chúng mình!",
        copyright: "© 2026 Phước Đức & Thu Sương Wedding. Designed with ❤️."
    }
};
