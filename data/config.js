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
        avatar: "assets/groom.jpg",
        story: "Một người đàn ông điềm tĩnh, luôn quan tâm và hết lòng vì gia đình.",
        bank: {
            bankName: "MB Bank (Ngân Hàng Quân Đội)",
            accountNumber: "0399888999",
            accountOwner: "LE PHUOC DUC",
            qrImage: "assets/qr.png"
        }
    },

    bride: {
        name: "Trần Thị Thu Sương",
        shortName: "Thu Sương",
        title: "Cô Dâu",
        father: "Trần Văn Tèo",
        mother: "Bùi Thị Hiền",
        avatar: "assets/bride.jpg",
        story: "Cô gái dịu dàng, yêu đời và luôn mang đến nụ cười ấm áp.",
        bank: {
            bankName: "Vietcombank (VCB)",
            accountNumber: "999888777666",
            accountOwner: "TRAN THI THU SUONG",
            qrImage: "assets/qr2.png"
        }
    },

    // Ngày cưới & Đếm ngược
    weddingDate: "2026-10-25T10:00:00", // Định dạng ISO: YYYY-MM-DDTHH:mm:ss
    weddingDateDisplay: "25.10.2026",
    lunarDateDisplay: "16 Tháng 9 Năm Bính Ngọ (Âm Lịch)",

    // Hero Section
    hero: {
        subtitle: "SAVE THE DATE",
        title: "Lễ Thành Hôn & Tiệc Cưới",
        backgroundImage: "https://6a64e8242a4b54c07b27ba72.imgix.net/sandbox/NAM_3954.jpg",
        quote: "Tình yêu không phải là nhìn nhau, mà là cùng nhau nhìn về một hướng."
    },

    // Nhạc nền
    music: {
        url: "assets/music.mp3",
        title: "Beautiful in White - Instrumental",
        autoplay: true
    },

    // Hành trình yêu thương (Timeline)
    story: [
        {
            year: "",
            date: "",
            title: "Lần Đầu Gặp Gỡ",
            content: "Giữa giảng đường Đại học tấp nập, ánh mắt ta vô tình chạm nhau và một tình yêu đẹp bắt đầu nảy nở.",
            image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80"
        },
        {
            year: "2016",
            date: "12/12/2016",
            title: "Lời Tỏ Tình Ngọt Ngào",
            content: "Dưới ánh đèn lung linh, câu nói 'Anh yêu em' đã chính thức gắn kết hai trái tim làm một.",
            image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80"
        },
        {
            year: "2026",
            date: "13/05/2026",
            title: "Màn Cầu Hôn Bất Ngờ",
            content: "Chiếc nhẫn cầu hôn xinh xắn dưới ánh chiều hoàng hôn cùng câu trả lời \"Em đồng ý!\".",
            image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80"
        },
        {
            year: "2026",
            date: "04/06/2026",
            title: "Lễ Dạm Ngõ",
            content: "Hai bên gia đình gặp gỡ, chính thức mở lời cho hành trình về chung một nhà.",
            image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80"
        },
        {
            year: "2026",
            date: "25/10/2026",
            title: "Ngày Về Chung Một Nhà",
            content: "Được sự chúc phúc của gia đình hai bên và bạn bè, chúng mình chính thức trở thành vợ chồng!",
            image: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=600&q=80"
        }
    ],

    // Danh sách các nghi lễ & tiệc cưới
    ceremonies: [
        {
            id: "nha-gai",
            tag: "LỄ VU QUY - NHÀ GÁI",
            title: "Lễ Tư Gia Nhà Gái",
            time: "07:00 - Ngày 25/10/2026",
            address: "Số 456 Đường Nguyễn Trãi, Phường 7, Quận 5, TP. Hồ Chí Minh",
            icon: "fa-hand-holding-heart",
            mapEmbedUrl: null,
            mapDirectUrl: null
        },
        {
            id: "nha-trai",
            tag: "LỄ TÂN HÔN - NHÀ TRAI",
            title: "Lễ Tư Gia Nhà Trai",
            time: "11:00 - Ngày 25/10/2026",
            address: "18 Nguyễn Văn Cự, Phường Tân Tạo, TP. Hồ Chí Minh",
            icon: "fa-house-chimney-heart",
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
            mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.0043920387557!2d106.62297671015583!3d10.788072758935423!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752d9d5888fc19%3A0x172d76a84a0ca188!2zVHJ1bmcgdMOibSBo4buZaSBuZ2jhu4cgdGnhu4djIGPGsOG7m2kgQXNpYW5hIFBsYXphIFbGsOG7nW4gTMOgaQ!5e1!3m2!1sen!2s!4v1785003723847!5m2!1sen!2s",
            mapDirectUrl: "https://maps.app.goo.gl/72WEiNhb1SKsr6C28",
            calendarUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Ti%E1%BB%87c%20C%C6%B0%E1%BB%9Bi%20Ph%C6%B0%E1%BB%9Bc%20%C4%90%E1%BB%A9c%20%26%20Thu%20S%C6%B0%C6%A1ng&dates=20261025T103000Z%2F20261025T130000Z&details=Ti%E1%BB%87c%20M%E1%BB%ABng%20%C4%90%C3%A1m%20C%C6%B0%E1%BB%9Bi%20L%C3%AA%20Ph%C6%B0%E1%BB%9Bc%20%C4%90%E1%BB%A9c%20%26%20Tr%E1%BA%A7n%20Th%E1%BB%8B%20Thu%20S%C6%B0%C6%A1ng&location=Asiana%20Plaza%20T%C3%A2n%20Ph%C3%BA%2C%20284-286%20V%C6%B0%E1%BB%9Dn%20L%C3%A0i%2C%20TP.%20H%E1%BB%93%20Ch%C3%AD%20Minh&sf=true&output=xml"
        }
    ],

    // Album ảnh cưới (Masonry Gallery)
    gallery: [
        { src: "https://6a64e8242a4b54c07b27ba72.imgix.net/NAM_3511.jpg", title: "Khoảnh Khắc Ngọt Ngào", aspect: "tall" },
        { src: "https://6a64e8242a4b54c07b27ba72.imgix.net/NAM_3256.jpg", title: "Ánh Mắt Yêu Thương", aspect: "wide" },
        { src: "https://6a64e8242a4b54c07b27ba72.imgix.net/sandbox/NAM_2934.jpg", title: "Tay Trong Tay", aspect: "square" },
        { src: "https://6a64e8242a4b54c07b27ba72.imgix.net/sandbox/NAM_2843.jpg", title: "Nụ Cười Hạnh Phúc", aspect: "tall" },
        { src: "https://6a64e8242a4b54c07b27ba72.imgix.net/NAM_3632.jpg", title: "Bình Yên Bên Em", aspect: "square" },
        { src: "https://6a64e8242a4b54c07b27ba72.imgix.net/sandbox/NAM_3954.jpg", title: "Ngày Trọng Đại", aspect: "wide" }
    ],

    // Lời cảm ơn & Footer
    footer: {
        thankYouMessage: "Cảm ơn sự hiện diện và những lời chúc phúc ý nghĩa từ Quý vị quan khách. Sự hiện diện của quý khách là niềm vui lớn nhất cho tình yêu của chúng con!",
        copyright: "© 2026 Phước Đức & Thu Sương Wedding. Designed with ❤️."
    }
};
