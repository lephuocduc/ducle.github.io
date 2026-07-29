/**
 * WEDDING CONFIGURATION DATA
 * Cấu hình toàn bộ nội dung website thiệp cưới online.
 * Mọi thay đổi về thông tin, hình ảnh, địa điểm, ngân hàng... chỉ cần chỉnh sửa tại đây.
 */

export const weddingConfig = {
    // Thông tin SEO & Meta
    seo: {
        title: "Thiệp Mời Cưới - Phước Đức & Thu Sương | Song Hỷ Cát Tường",
        description: "Trân trọng kính mời quý quan khách, họ hàng hai bên cùng bạn bè thân thiết tới dự Lễ Thành Hôn & Tiệc Cưới của Lê Phước Đức & Trần Thị Thu Sương.",
        ogImage: "assets/hero.jpg",
        favicon: "assets/favicon.ico"
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
        story: "Cô gái dịu dàng, yêu đời và luôn mang đến nụ cười ấm áp.",
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

    // Nhạc nền
    music: {
        url: "assets/audio/music.mp3",
        title: "Beautiful in White - Instrumental",
        specialUrl: "assets/audio/Tonight I celebrate my love.mp3",
        specialTitle: "Tonight I Celebrate My Love",
        autoplay: true
    },

    // Hành trình yêu thương (Timeline)
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
            year: "2026",
            date: "13/05/2026",
            title: "Màn Cầu Hôn Bất Ngờ",
            content: "Dưới ánh hoàng hôn dịu dàng, chiếc nhẫn được trao cùng câu trả lời \“Em đồng ý!\” đã viết tiếp một chương mới cho chuyện tình của chúng mình.",
            image: "assets/img/NAM_3230.webp"
        },
        {
            year: "2026",
            date: "04/06/2026",
            title: "Lễ Dạm Ngõ",
            content: "Hai bên gia đình gặp gỡ, chính thức mở lời cho hành trình về chung một nhà.",
            image: "assets/img/DSCF5692.webp"
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
            address: "Tư gia nhà gái - Ấp Giồng Kiến, Xã Thạnh Trị, tỉnh Vĩnh Long",
            icon: "fa-champagne-glasses",
            mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d2327.911756606885!2d106.58557065491705!3d10.198035858679557!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTDCsDExJzQ5LjYiTiAxMDbCsDM1JzA3LjEiRQ!5e0!3m2!1sen!2s!4v1785249568380!5m2!1sen!2s",
            mapDirectUrl: "https://maps.app.goo.gl/KofqAs6EGaQ7jEza8",
            calendarUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Ti%E1%BB%87c%20M%E1%BB%ABng%20Vu%20Quy&dates=20261024T090000%2F20261024T190000&ctz=Asia%2FHo_Chi_Minh&details=Tr%C3%A2n%20tr%E1%BB%8Dng%20k%C3%ADnh%20m%E1%BB%9Di%20qu%C3%BD%20kh%C3%A1ch%20%C4%91%E1%BA%BFn%20d%E1%BB%B1%20Ti%E1%BB%87c%20M%E1%BB%ABng%20Vu%20Quy%20t%E1%BA%A1i%20t%C6%B0%20gia%20nh%C3%A0%20g%C3%A1i.&location=T%C6%B0%20gia%20nh%C3%A0%20g%C3%A1i%20-%20%E1%BA%A4p%20Gi%E1%BB%93ng%20Ki%E1%BA%BFn%2C%20X%C3%A3%20Th%E1%BA%A1nh%20Tr%E1%BB%8B%2C%20t%E1%BB%89nh%20V%C4%A9nh%20Long&sf=true&output=xml",
            calendarWebcalUrl: "webcal://wedding.phuocducthusuong.com/assets/ics/tiec-mung-vu-quy.ics",
        },
        {
            id: "nha-gai",
            tag: "LỄ VU QUY - NHÀ GÁI",
            title: "Lễ Vu Quy",
            time: "07:00 - Ngày 25/10/2026",
            address: "Ấp Giồng Kiến, Xã Thạnh Trị, tỉnh Vĩnh Long",
            icon: "fa-hand-holding-heart",
            blessing: "Vu quy duyên thắm trăm năm<br>Con về giữ trọn nghĩa ân gia đình",
            mapEmbedUrl: null,
            mapDirectUrl: null
        },
        {
            id: "nha-trai",
            tag: "LỄ TÂN HÔN - NHÀ TRAI",
            title: "Lễ Tân Hôn",
            time: "10:00 - Ngày 25/10/2026",
            address: "18 Nguyễn Văn Cự, Phường Tân Tạo, TP. Hồ Chí Minh",
            icon: "fa-hand-holding-heart",
            blessing: "Tân hôn đẹp mối duyên lành<br>Trăm năm hòa thuận, gia đình ấm êm",
            mapEmbedUrl: null,
            mapDirectUrl: null
        },

        {
            id: "tiec-cuoi",
            tag: "TIỆC CƯỚI MẬT NGỌT",
            title: "Tiệc Mừng Đám Cưới",
            time: "17:30 - Ngày 25/10/2026",
            address: "Trung tâm hội nghị tiệc cưới Asiana Plaza Tân Phú - 284-286 Vườn Lài, Phường Phú Thọ Hòa, TP. Hồ Chí Minh",
            icon: "fa-champagne-glasses",
            mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5067.536578916534!2d106.62298207601286!3d10.78807275897688!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752d9d5888fc19%3A0x172d76a84a0ca188!2zVHJ1bmcgdMOibSBo4buZaSBuZ2jhu4sgdGnhu4djIGPGsOG7m2kgQXNpYW5hIFBsYXphIFbGsOG7nW4gTMOgaQ!5e0!3m2!1sen!2s!4v1785249616420!5m2!1sen!2s",
            mapDirectUrl: "https://maps.app.goo.gl/72WEiNhb1SKsr6C28",
            calendarUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Ti%E1%BB%87c%20C%C6%B0%E1%BB%9Bi%20Ph%C6%B0%E1%BB%9Bc%20%C4%90%E1%BB%A9c%20%26%20Thu%20S%C6%B0%C6%A1ng&dates=20261025T103000Z%2F20261025T140000Z&details=Ti%E1%BB%87c%20M%E1%BB%ABng%20%C4%90%C3%A1m%20C%C6%B0%E1%BB%9Bi&location=Asiana%20Plaza%20T%C3%A2n%20Ph%C3%BA%2C%20284-286%20V%C6%B0%E1%BB%9Dn%20L%C3%A0i%2C%20TP.%20H%E1%BB%93%20Ch%C3%AD%20Minh&sf=true&output=xml",
            calendarWebcalUrl: "webcal://wedding.phuocducthusuong.com/assets/ics/wedding.ics",
        }
    ],

    // Album ảnh cưới (Masonry Gallery)
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

    // Lời cảm ơn & Footer
    footer: {
        thankYouMessage: "Cảm ơn sự hiện diện và những lời chúc phúc ý nghĩa từ Quý vị quan khách. Sự hiện diện của quý khách là niềm vui lớn nhất cho tình yêu của chúng con!",
        copyright: "© 2026 Phước Đức & Thu Sương Wedding. Designed with ❤️."
    }
};
