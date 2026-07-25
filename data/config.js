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
        father: "Lê Văn An",
        mother: "Nguyễn Thị Bình",
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
        father: "Nguyễn Văn Cường",
        mother: "Trần Thị Dung",
        avatar: "assets/bride.jpg",
        story: "Cô gái dịu dàng, yêu đời và luôn mang đến nụ cười ấm áp.",
        bank: {
            bankName: "Vietcombank (VCB)",
            accountNumber: "999888777666",
            accountOwner: "TRAN THI THU SUONG",
            qrImage: "assets/qr.png"
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
        backgroundImage: "assets/hero.jpg",
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
            year: "2022",
            date: "15/02/2022",
            title: "Lần Đầu Gặp Gỡ",
            content: "Tại một quán cà phê nhỏ giữa lòng thành phố, ánh mắt ta chạm nhau và một tình yêu đẹp bắt đầu nảy nở.",
            image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80"
        },
        {
            year: "2023",
            date: "24/12/2023",
            title: "Lời Tỏ Tình Ngọt Ngào",
            content: "Dưới ánh đèn lung linh đêm Giáng Sinh, câu nói 'Anh yêu em' đã chính thức gắn kết hai trái tim làm một.",
            image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80"
        },
        {
            year: "2026",
            date: "14/02/2026",
            title: "Màn Cầu Hôn Bất Ngờ",
            content: "Chiếc nhẫn cầu hôn xinh xắn dưới bãi biển chiều hoàng hôn cùng câu trả lời 'Em đồng ý!'.",
            image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80"
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
            id: "nha-trai",
            tag: "LỄ THÀNH HÔN - NHÀ TRAI",
            title: "Lễ Tư Gia Nhà Trai",
            time: "08:30 - Ngày 25/10/2026",
            address: "Số 123 Đường Hạnh Phúc, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
            icon: "fa-house-chimney-heart",
            mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.469771694605!2d106.70280831533413!3d10.775317792322306!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f46df3c07e7%3A0x6b63c22b10287a91!2zTmjDoCBow6F0IFRow6BuaCBwaOG7kSBIw7IgQ2jDrSBNaW5o!5e0!3m2!1svi!2s!4v1650000000000!5m2!1svi!2s",
            mapDirectUrl: "https://maps.google.com"
        },
        {
            id: "nha-gai",
            tag: "LỄ VU QUY - NHÀ GÁI",
            title: "Lễ Tư Gia Nhà Gái",
            time: "07:00 - Ngày 24/10/2026",
            address: "Số 456 Đường Nguyễn Trãi, Phường 7, Quận 5, TP. Hồ Chí Minh",
            icon: "fa-hand-holding-heart",
            mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.689626359556!2d106.67133731533399!3d10.758362692333798!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752efd3d49265b%3A0x6eb722c2a0db7d47!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBLaW5oIHThur8gVFAuSENN!5e0!3m2!1svi!2s!4v1650000000000!5m2!1svi!2s",
            mapDirectUrl: "https://maps.google.com"
        },
        {
            id: "tiec-cuoi",
            tag: "TIỆC CƯỚI MẬT NGỌT",
            title: "Tiệc Mừng Đám Cưới",
            time: "11:30 - Ngày 25/10/2026",
            address: "Trung Tâm Hội Nghị & Đám Cưới Song Hỷ - Sảnh Diamond, 789 Đường Lê Duẩn, Quận 1, TP. Hồ Chí Minh",
            icon: "fa-champagne-glasses",
            mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.431352458428!2d106.69766931533414!3d10.7782679923203!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f3922619717%3A0x93309a4730623d91!2zRGluaCBUaOG7kXQgTmjhuqF0!5e0!3m2!1svi!2s!4v1650000000000!5m2!1svi!2s",
            mapDirectUrl: "https://maps.google.com"
        }
    ],

    // Album ảnh cưới (Masonry Gallery)
    gallery: [
        { src: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80", title: "Khoảnh Khắc Ngọt Ngào", aspect: "tall" },
        { src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80", title: "Ánh Mắt Yêu Thương", aspect: "wide" },
        { src: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80", title: "Tay Trong Tay", aspect: "square" },
        { src: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80", title: "Nụ Cười Hạnh Phúc", aspect: "tall" },
        { src: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80", title: "Bình Yên Bên Em", aspect: "square" },
        { src: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80", title: "Ngày Trọng Đại", aspect: "wide" }
    ],

    // Lời cảm ơn & Footer
    footer: {
        thankYouMessage: "Cảm ơn sự hiện diện và những lời chúc phúc ý nghĩa từ Quý vị quan khách. Sự hiện diện của bạn là niềm vui lớn nhất cho tình yêu của chúng mình!",
        copyright: "© 2026 Phước Đức & Thu Sương Wedding. Designed with ❤️."
    }
};
