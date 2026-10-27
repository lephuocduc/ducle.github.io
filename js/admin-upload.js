/**
 * ADMIN-UPLOAD.JS - ES6 MODULE
 * Quản trị đăng tải hình ảnh bí mật dành cho Cô Dâu & Chú Rể
 * - Xác thực bảo mật bằng mã PIN (lưu session)
 * - Nén ảnh tự động trên Canvas (giảm từ 10MB xuống ~250KB siêu nét, tải cực nhanh trên 4G)
 * - Tải nhiều ảnh cùng lúc lên Google Apps Script / Drive & cập nhật realtime vào Album
 * - Hỗ trợ lưu trữ cục bộ LocalStorage phòng khi mất mạng hoặc chưa triển khai Apps Script
 */

const SESSION_KEY = "wedding_admin_authenticated";
const LOCAL_PHOTOS_KEY = "wedding_custom_uploaded_photos";

let currentAlbums = [];
let currentAdminPin = "251026";
let currentApiUrl = "";
let onPhotoUploadedCallback = null;
let onPhotoDeletedCallback = null;
let selectedFiles = []; // Danh sách file đang chờ tải lên { file, previewUrl, id, title }

export function initAdminUpload({ albums, adminPin, apiUrl, onPhotoUploaded, onPhotoDeleted }) {
    currentAlbums = albums || [];
    currentAdminPin = String(adminPin || "251026").trim();
    currentApiUrl = apiUrl || "";
    onPhotoUploadedCallback = onPhotoUploaded;
    onPhotoDeletedCallback = onPhotoDeleted;

    setupPinModal();
    setupUploadModal();
}

export function isUserAdmin() {
    return sessionStorage.getItem(SESSION_KEY) === "true";
}

export function logoutAdmin() {
    sessionStorage.removeItem(SESSION_KEY);
    showToast("Đã đăng xuất khỏi quyền quản trị ảnh.");
    window.dispatchEvent(new CustomEvent("wedding-admin-state-changed", { detail: { isAdmin: false } }));
}

export function openAdminAccess(targetAlbumId = "") {
    if (isUserAdmin()) {
        openUploadModal(targetAlbumId);
    } else {
        openPinModal(targetAlbumId);
    }
}

/**
 * 1. QUẢN LÝ MODAL MÃ PIN
 */
function setupPinModal() {
    const modal = document.getElementById("admin-pin-modal");
    const form = document.getElementById("admin-pin-form");
    const input = document.getElementById("admin-pin-input");
    const closeBtn = document.getElementById("admin-pin-close");
    const toggleEye = document.getElementById("pin-toggle-visibility");
    const errorMsg = document.getElementById("pin-error-msg");

    if (!modal || !form || !input) return;

    if (toggleEye) {
        toggleEye.addEventListener("click", () => {
            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";
            toggleEye.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
        });
    }

    const closeModal = () => {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
        input.value = "";
        if (errorMsg) errorMsg.style.display = "none";
        document.body.classList.remove("no-scroll");
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target === modal || e.target.classList.contains("admin-modal-overlay")) closeModal();
    };

    form.onsubmit = (e) => {
        e.preventDefault();
        const enteredPin = input.value.trim();

        if (enteredPin === currentAdminPin) {
            sessionStorage.setItem(SESSION_KEY, "true");
            closeModal();
            showToast("✨ Xác thực thành công! Chào mừng Cô Dâu & Chú Rể.");
            window.dispatchEvent(new CustomEvent("wedding-admin-state-changed", { detail: { isAdmin: true } }));

            const pendingAlbumId = modal.dataset.pendingAlbumId || "";
            setTimeout(() => {
                openUploadModal(pendingAlbumId);
            }, 300);
        } else {
            if (errorMsg) {
                errorMsg.textContent = "Mã PIN không chính xác. Vui lòng thử lại!";
                errorMsg.style.display = "block";
            }
            input.classList.add("shake-error");
            setTimeout(() => input.classList.remove("shake-error"), 500);
            input.focus();
            input.select();
        }
    };
}

export function openPinModal(targetAlbumId = "") {
    const modal = document.getElementById("admin-pin-modal");
    const input = document.getElementById("admin-pin-input");
    const errorMsg = document.getElementById("pin-error-msg");
    if (!modal) return;

    modal.dataset.pendingAlbumId = targetAlbumId || "";
    if (errorMsg) errorMsg.style.display = "none";
    if (input) input.value = "";

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");

    setTimeout(() => {
        if (input) input.focus();
    }, 150);
}

/**
 * 2. QUẢN LÝ MODAL UPLOAD ẢNH
 */
function setupUploadModal() {
    const modal = document.getElementById("admin-upload-modal");
    const closeBtn = document.getElementById("admin-upload-close");
    const cancelBtn = document.getElementById("upload-cancel-btn");
    const logoutBtn = document.getElementById("admin-logout-btn");
    const dropzone = document.getElementById("upload-dropzone");
    const fileInput = document.getElementById("upload-file-input");
    const albumSelect = document.getElementById("upload-album-select");
    const submitBtn = document.getElementById("upload-submit-btn");
    const clearAllBtn = document.getElementById("upload-clear-all");

    if (!modal) return;

    const closeModal = () => {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("no-scroll");
        resetUploadForm();
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;

    modal.onclick = (e) => {
        if (e.target === modal || e.target.classList.contains("admin-modal-overlay")) closeModal();
    };

    if (logoutBtn) {
        logoutBtn.onclick = () => {
            closeModal();
            logoutAdmin();
        };
    }

    populateAlbumSelect();

    if (dropzone && fileInput) {
        dropzone.addEventListener("click", () => fileInput.click());

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
            });
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            if (dt && dt.files && dt.files.length) {
                handleFilesSelected(dt.files);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length) {
                handleFilesSelected(e.target.files);
            }
        });
    }

    if (clearAllBtn) {
        clearAllBtn.onclick = () => {
            selectedFiles = [];
            renderSelectedPreviews();
        };
    }

    if (submitBtn) {
        submitBtn.onclick = handleStartUpload;
    }
}

export function openUploadModal(targetAlbumId = "") {
    const modal = document.getElementById("admin-upload-modal");
    const albumSelect = document.getElementById("upload-album-select");
    if (!modal) return;

    populateAlbumSelect();

    if (albumSelect && targetAlbumId) {
        albumSelect.value = targetAlbumId;
    }

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
}

function populateAlbumSelect() {
    const albumSelect = document.getElementById("upload-album-select");
    if (!albumSelect || !Array.isArray(currentAlbums)) return;

    const currentVal = albumSelect.value;
    albumSelect.innerHTML = "";

    currentAlbums.forEach(album => {
        const option = document.createElement("option");
        option.value = album.id;
        option.textContent = `${album.title} (${album.tag || 'Sự kiện'})`;
        albumSelect.appendChild(option);
    });

    if (currentVal) albumSelect.value = currentVal;
}

function handleFilesSelected(files) {
    const validFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (validFiles.length === 0) {
        showToast("Vui lòng chọn file hình ảnh hợp lệ!", "error");
        return;
    }

    validFiles.forEach(file => {
        const id = "sel-" + Math.random().toString(36).substring(2, 9);
        const previewUrl = URL.createObjectURL(file);
        selectedFiles.push({
            id,
            file,
            previewUrl,
            title: file.name.replace(/\.[^/.]+$/, "")
        });
    });

    renderSelectedPreviews();
}

function renderSelectedPreviews() {
    const previewSection = document.getElementById("upload-preview-section");
    const previewGrid = document.getElementById("upload-preview-grid");
    const previewCount = document.getElementById("upload-preview-count");
    const submitBtn = document.getElementById("upload-submit-btn");

    if (!previewSection || !previewGrid) return;

    if (selectedFiles.length === 0) {
        previewSection.style.display = "none";
        previewGrid.innerHTML = "";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-cloud-arrow-up"></i> Bắt Đầu Tải Lên';
        }
        return;
    }

    previewSection.style.display = "block";
    previewCount.textContent = `${selectedFiles.length} ảnh đã chọn`;
    previewGrid.innerHTML = "";

    selectedFiles.forEach((item) => {
        const card = document.createElement("div");
        card.className = "upload-preview-card";
        const sizeMb = (item.file.size / (1024 * 1024)).toFixed(1);

        card.innerHTML = `
            <img src="${item.previewUrl}" alt="Preview" />
            <button type="button" class="preview-remove-btn" data-id="${item.id}" title="Xóa ảnh này">&times;</button>
            <span class="preview-size-tag">${sizeMb} MB</span>
        `;

        card.querySelector(".preview-remove-btn")?.addEventListener("click", (e) => {
            e.stopPropagation();
            removeSelectedFile(item.id);
        });

        previewGrid.appendChild(card);
    });

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-cloud-arrow-up"></i> Bắt Đầu Tải Lên (${selectedFiles.length} ảnh)`;
    }
}

function removeSelectedFile(id) {
    const idx = selectedFiles.findIndex(f => f.id === id);
    if (idx !== -1) {
        URL.revokeObjectURL(selectedFiles[idx].previewUrl);
        selectedFiles.splice(idx, 1);
        renderSelectedPreviews();
    }
}

function resetUploadForm() {
    selectedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
    selectedFiles = [];
    const fileInput = document.getElementById("upload-file-input");
    const captionInput = document.getElementById("upload-caption-input");
    const progressContainer = document.getElementById("upload-progress-container");
    const alertBox = document.getElementById("upload-alert-box");

    if (fileInput) fileInput.value = "";
    if (captionInput) captionInput.value = "";
    if (progressContainer) progressContainer.style.display = "none";
    if (alertBox) alertBox.style.display = "none";

    renderSelectedPreviews();
}

/**
 * 3. TIẾN TRÌNH TẢI ẢNH (NÉN CANVAS + GỬI APPS SCRIPT)
 */
async function handleStartUpload() {
    if (selectedFiles.length === 0) return;

    const albumSelect = document.getElementById("upload-album-select");
    const captionInput = document.getElementById("upload-caption-input");
    const shouldCompress = document.getElementById("upload-compress-check")?.checked ?? true;
    const progressContainer = document.getElementById("upload-progress-container");
    const progressBar = document.getElementById("upload-progress-bar");
    const progressStatus = document.getElementById("upload-progress-status");
    const progressPercent = document.getElementById("upload-progress-percent");
    const submitBtn = document.getElementById("upload-submit-btn");
    const alertBox = document.getElementById("upload-alert-box");

    const albumId = albumSelect ? albumSelect.value : (currentAlbums[0]?.id || "tiec-truoc-vu-quy");
    const defaultCaption = captionInput ? captionInput.value.trim() : "";

    if (progressContainer) progressContainer.style.display = "block";
    if (submitBtn) submitBtn.disabled = true;
    if (alertBox) alertBox.style.display = "none";

    const total = selectedFiles.length;
    let completed = 0;
    let successCount = 0;
    const uploadedPhotos = [];

    for (let i = 0; i < total; i++) {
        const item = selectedFiles[i];
        const currentNum = i + 1;

        if (progressStatus) progressStatus.textContent = `Đang xử lý & tải ảnh ${currentNum}/${total}...`;
        const percent = Math.round(((currentNum - 0.5) / total) * 100);
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressPercent) progressPercent.textContent = `${percent}%`;

        try {
            let base64Data = "";
            let mimeType = item.file.type || "image/jpeg";

            if (shouldCompress) {
                const compressed = await compressImageToDataUrl(item.file, 1600, 1600, 0.82);
                base64Data = compressed.dataUrl;
                mimeType = compressed.mimeType;
            } else {
                base64Data = await readFileAsDataUrl(item.file);
            }

            const title = defaultCaption || item.title || "Ảnh kỷ niệm";

            const photoResult = await uploadToAppsScript({
                pin: currentAdminPin,
                albumId,
                title,
                base64: base64Data,
                mimeType,
                filename: `wedding_${albumId}_${Date.now()}_${i + 1}.jpg`
            });

            if (photoResult && photoResult.success && photoResult.photo) {
                uploadedPhotos.push(photoResult.photo);
                successCount++;
            } else {
                console.warn("[upload] Apps Script không phản hồi hoặc chưa cấu hình, lưu fallback cục bộ");
                const localPhoto = {
                    id: "local-" + Date.now() + "-" + i,
                    albumId: albumId,
                    title: title,
                    src: base64Data,
                    aspect: "wide",
                    createdTime: new Date().toISOString()
                };
                uploadedPhotos.push(localPhoto);
                savePhotoToLocalStorage(localPhoto);
                successCount++;
            }
        } catch (err) {
            console.error(`[upload] Lỗi tải ảnh ${item.file.name}:`, err);
        }

        completed++;
        const finalPercent = Math.round((completed / total) * 100);
        if (progressBar) progressBar.style.width = `${finalPercent}%`;
        if (progressPercent) progressPercent.textContent = `${finalPercent}%`;
    }

    if (progressStatus) progressStatus.textContent = `Hoàn tất tải lên ${successCount}/${total} ảnh!`;

    if (uploadedPhotos.length > 0 && typeof onPhotoUploadedCallback === "function") {
        onPhotoUploadedCallback(albumId, uploadedPhotos);
    }

    if (alertBox) {
        alertBox.className = "upload-alert-box alert-success";
        alertBox.innerHTML = `
            <strong>🎉 Tải lên thành công ${successCount} ảnh vào Album!</strong>
            <p>Ảnh đã được thêm trực tiếp vào album để mọi người cùng thưởng thức.</p>
        `;
        alertBox.style.display = "block";
    }

    showToast(`🎉 Đã tải lên thành công ${successCount} bức ảnh!`);

    setTimeout(() => {
        const modal = document.getElementById("admin-upload-modal");
        if (modal) modal.classList.remove("active");
        document.body.classList.remove("no-scroll");
        resetUploadForm();
    }, 1800);
}

async function uploadToAppsScript(payload) {
    if (!currentApiUrl) {
        return { success: false, error: "No API URL" };
    }

    try {
        const formData = new URLSearchParams();
        formData.append("action", "uploadPhoto");
        formData.append("pin", payload.pin);
        formData.append("albumId", payload.albumId);
        formData.append("title", payload.title);
        formData.append("base64", payload.base64);
        formData.append("mimeType", payload.mimeType);
        formData.append("filename", payload.filename);

        const response = await fetch(currentApiUrl, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        console.warn("[uploadToAppsScript] Lỗi gửi ảnh tới Apps Script:", err);
        return { success: false, error: err.message };
    }
}

function compressImageToDataUrl(file, maxW = 1600, maxH = 1600, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxW || height > maxH) {
                    if (width / height > maxW / maxH) {
                        height = Math.round((height * maxW) / width);
                        width = maxW;
                    } else {
                        width = Math.round((width * maxH) / height);
                        height = maxH;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                    resolve({ dataUrl: e.target.result, mimeType: file.type || "image/jpeg" });
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                let mimeType = "image/webp";
                let dataUrl = canvas.toDataURL(mimeType, quality);
                if (!dataUrl || dataUrl.indexOf("data:image/webp") !== 0) {
                    mimeType = "image/jpeg";
                    dataUrl = canvas.toDataURL(mimeType, quality);
                }

                resolve({ dataUrl, mimeType });
            };
            img.onerror = () => resolve({ dataUrl: e.target.result, mimeType: file.type || "image/jpeg" });
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function getLocalStoragePhotos() {
    try {
        const raw = localStorage.getItem(LOCAL_PHOTOS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function savePhotoToLocalStorage(photo) {
    try {
        const list = getLocalStoragePhotos();
        list.push(photo);
        if (list.length > 50) list.shift();
        localStorage.setItem(LOCAL_PHOTOS_KEY, JSON.stringify(list));
    } catch (e) {
        console.warn("[LocalStorage] Không thể lưu ảnh vào bộ nhớ tạm:", e);
    }
}

export function deletePhotoRecord(photoId, albumId) {
    try {
        const list = getLocalStoragePhotos();
        const filtered = list.filter(p => p.id !== photoId);
        localStorage.setItem(LOCAL_PHOTOS_KEY, JSON.stringify(filtered));
    } catch (e) {}

    if (currentApiUrl) {
        const formData = new URLSearchParams();
        formData.append("action", "deletePhoto");
        formData.append("pin", currentAdminPin);
        formData.append("id", photoId);

        fetch(currentApiUrl, { method: "POST", body: formData }).catch(e => console.warn(e));
    }

    if (typeof onPhotoDeletedCallback === "function") {
        onPhotoDeletedCallback(albumId, photoId);
    }

    showToast("Đã xóa ảnh khỏi album!");
}

function showToast(message, type = "success") {
    let toast = document.getElementById("wedding-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "wedding-toast";
        toast.className = "wedding-toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `wedding-toast active toast-${type}`;

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove("active");
    }, 3500);
}
