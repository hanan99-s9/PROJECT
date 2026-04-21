// Check and apply theme from localStorage immediately
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const checkbox = document.getElementById('theme-toggle');
    if (checkbox) {
        checkbox.checked = theme === 'dark';
    }
}

const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);

document.addEventListener('DOMContentLoaded', () => {
    // Render Global Navbar
    renderNavbar();

    // Theme Toggle Listener (Event Delegation)
    document.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'theme-toggle') {
            const newTheme = e.target.checked ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
        }
    });

    document.addEventListener('click', (e) => {
        // Dropdown Logic
        const dropdownBtn = document.getElementById('dropdown-btn');
        const dropdown = document.getElementById('dropdown');

        if (dropdownBtn && dropdown) {
            if (dropdownBtn.contains(e.target)) {
                dropdown.classList.toggle('active');
            } else if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        }

        // Accordion Logic
        if (e.target.closest('.accordion-header')) {
            const header = e.target.closest('.accordion-header');
            const item = header.parentElement;
            const isActive = item.classList.contains('active');

            // Close all
            document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));

            // Open clicked if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        }
    });

    // Protect routes
    checkAuth();

    // Init new features
    if (!localStorage.getItem('v3_history_fix')) {
        localStorage.removeItem('maak_user_history');
        localStorage.setItem('v3_history_fix', 'true');
    }

    if (window.location.pathname.includes('contact.html')) {
        const contactForm = document.querySelector('form');
        if (contactForm) {
            contactForm.addEventListener('submit', () => {
                trackHistory('إرسال رسالة', '✉️', 'تم التواصل عبر النموذج');
            });
        }
    }

    if (window.location.pathname.includes('guide.html')) {
        document.querySelectorAll('.glass-card').forEach(card => {
            card.addEventListener('click', () => {
                const title = card.querySelector('h3');
                if (title) {
                    trackHistory(`تعلم إشارة جديدة: ${title.innerText}`, '🎓', 'تم تسجيل النقر على البطاقة');
                }
            });
        });
    }

    renderHistory();
    initFeedbackSystem();
});

function renderNavbar() {
    const navElement = document.getElementById('main-navbar');

    // Hide navbar completely on login page for a focused experience
    if (window.location.pathname.includes('login.html')) {
        if (navElement) {
            navElement.style.display = 'none';
        }
        return;
    }

    const user = localStorage.getItem("username");

    const navbarHTML = `
        <a href="index.html" class="nav-brand">
            <img src="logo.png" alt="معك" class="nav-logo">
            معك
        </a>
        <div class="nav-links">
            <a href="index.html" class="nav-link">الرئيسية</a>
            ${!user ? `<a href="login.html" class="btn" style="padding: 6px 20px; font-size: 15px; margin-right: 5px;">تسجيل الدخول</a>` : ''}
            
            <div class="dropdown" id="dropdown">
                <button class="dropdown-btn" id="dropdown-btn">
                    ${user ? user : 'القائمة'}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="dropdown-content">
                    <label class="theme-switch-wrapper" for="theme-toggle">
                        <span>وضع ليلي</span>
                        <div class="theme-switch">
                            <input type="checkbox" id="theme-toggle" ${localStorage.getItem('theme') === 'dark' ? 'checked' : ''}>
                            <span class="slider"></span>
                        </div>
                    </label>
                    ${user ? `<a href="dashboard.html">لوحة التحكم</a>` : ''}
                    <a href="guide.html">شرح لغة الإشارة</a>
                    <a href="about.html">من نحن</a>
                    <a href="faq.html">الأسئلة الشائعة</a>
                    <a href="contact.html">تواصل معنا</a>
                    ${user ? `<button onclick="logout()">تسجيل الخروج</button>` : ''}
                </div>
            </div>
        </div>
    `;

    if (navElement) {
        navElement.innerHTML = navbarHTML;
        navElement.style.display = 'flex';
    }
}

function checkAuth() {
    const isProtected = document.body.classList.contains('protected');
    const user = localStorage.getItem("username");

    // Strict redirect for protected pages if no user
    if (isProtected && !user) {
        window.location.href = "login.html";
        return; // Prevent further execution
    }

    // If logged in and on login page, redirect to dashboard
    if (document.body.classList.contains('auth-page') && user) {
        window.location.href = "dashboard.html";
    }
}

function login() {
    const nameInput = document.getElementById("username");
    if (nameInput) {
        const name = nameInput.value.trim();
        if (name === "") {
            nameInput.style.borderColor = "var(--secondary)";
            nameInput.focus();
            return;
        }
        localStorage.setItem("username", name);
        trackHistory('تسجيل الدخول', '🔑', 'تم دخول النظام');
        window.location.href = "dashboard.html";
    }
}

function logout() {
    const overlay = document.getElementById('feedback-overlay');
    if (overlay) {
        window.isLogoutFlow = true;
        overlay.classList.add('active');
        return;
    }
    executeLogout();
}

function executeLogout() {
    localStorage.removeItem("username");
    trackHistory('تسجيل الخروج', '🚪', 'تم الخروج من النظام');
    window.location.href = "index.html";
}

// User History Logic
function trackHistory(action, icon, details) {
    const history = JSON.parse(localStorage.getItem('maak_user_history')) || [];
    history.unshift({
        timestamp: Date.now(),
        action: action,
        icon: icon,
        details: details || ''
    });
    // Cap at 50 entries
    if (history.length > 50) history.length = 50;
    localStorage.setItem('maak_user_history', JSON.stringify(history));
}

function renderHistory() {
    const usernameSpan = document.getElementById('history-username');
    if (usernameSpan) {
        usernameSpan.textContent = localStorage.getItem('username') || '';
    }

    const container = document.getElementById('activity-feed');
    if (!container) return;

    const history = JSON.parse(localStorage.getItem('maak_user_history')) || [];
    if (history.length === 0) {
        container.innerHTML = `<div class="glass-card text-center" style="margin-top:40px;"><p style="font-size: 18px;">لا يوجد سجل نشاط متاح بعد.</p></div>`;
        return;
    }

    container.innerHTML = history.map((item) => {
        const date = new Date(item.timestamp);
        const timeString = date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        const dateString = date.toLocaleDateString('ar-SA');

        return `
            <div class="feed-card">
                <div class="feed-right">
                    <div class="feed-icon">${item.icon || '📌'}</div>
                    <div>
                        <h3 class="feed-action">${item.action}</h3>
                        <p class="feed-details">${item.details}</p>
                    </div>
                </div>
                <div class="feed-left">
                    <span class="feed-date">${dateString}</span>
                    <span class="feed-time">${timeString}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Emoji Feedback Logic
function initFeedbackSystem() {
    if (document.getElementById('feedback-overlay')) return; // already injected

    const isHistoryPage = window.location.pathname.includes('history.html');
    const feedbackHTML = `
        ${isHistoryPage ? '<div class="floating-btn" id="feedback-btn">💬</div>' : ''}
        <div class="feedback-modal-overlay" id="feedback-overlay">
            <div class="feedback-modal glass-card">
                <button class="feedback-close" id="feedback-close">&times;</button>
                
                <div class="feedback-step active" id="fb-step-1">
                    <h3>1. مدى سهولة الاستخدام؟</h3>
                    <div class="emoji-row" data-step="1">
                        <button class="emoji-btn">😡</button>
                        <button class="emoji-btn">🙁</button>
                        <button class="emoji-btn">😐</button>
                        <button class="emoji-btn">🙂</button>
                        <button class="emoji-btn">😍</button>
                    </div>
                </div>
                
                <div class="feedback-step" id="fb-step-2">
                    <h3>2. جودة دليل الإشارة؟</h3>
                    <div class="emoji-row" data-step="2">
                        <button class="emoji-btn">😡</button>
                        <button class="emoji-btn">🙁</button>
                        <button class="emoji-btn">😐</button>
                        <button class="emoji-btn">🙂</button>
                        <button class="emoji-btn">😍</button>
                    </div>
                </div>
                
                <div class="feedback-step" id="fb-step-3">
                    <h3>3. التقييم العام للمنصة؟</h3>
                    <div class="emoji-row" data-step="3">
                        <button class="emoji-btn">😡</button>
                        <button class="emoji-btn">🙁</button>
                        <button class="emoji-btn">😐</button>
                        <button class="emoji-btn">🙂</button>
                        <button class="emoji-btn">😍</button>
                    </div>
                </div>

                <div class="feedback-step" id="fb-step-4">
                    <h3>شكراً جزيلاً!</h3>
                    <p>تم حفظ تقييمك بنجاح ❤️</p>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', feedbackHTML);

    const btn = document.getElementById('feedback-btn');
    const overlay = document.getElementById('feedback-overlay');
    const close = document.getElementById('feedback-close');

    let currentStep = 1;
    let feedbackData = {};

    if (btn) {
        btn.addEventListener('click', () => {
            window.isLogoutFlow = false;
            overlay.classList.add('active');
        });
    }

    close.addEventListener('click', () => {
        overlay.classList.remove('active');
        if (window.isLogoutFlow) executeLogout();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            if (window.isLogoutFlow) executeLogout();
        }
    });

    const emojiValues = ['😡', '🙁', '😐', '🙂', '😍'];

    document.querySelectorAll('.emoji-row .emoji-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const stepDiv = this.closest('.emoji-row');
            const stepNum = parseInt(stepDiv.getAttribute('data-step'));

            // Calculate rating 1-5 based on index
            const index = Array.from(stepDiv.children).indexOf(this);
            feedbackData[`q${stepNum}`] = index + 1;

            // Hide current, show next
            document.getElementById(`fb-step-${stepNum}`).classList.remove('active');

            const nextStepNum = stepNum + 1;
            const nextStepDiv = document.getElementById(`fb-step-${nextStepNum}`);

            if (nextStepDiv) {
                nextStepDiv.classList.add('active');

                // If it's the thank you step, save
                if (nextStepNum === 4) {
                    feedbackData.submitted_at = Date.now();
                    localStorage.setItem('maak_user_feedback', JSON.stringify(feedbackData));
                    trackHistory('قام بتقييم المنصة', '📝', 'تم إكمال تقييم الأداء');
                    
                    if (window.isLogoutFlow) {
                        setTimeout(() => executeLogout(), 1500);
                    } else {
                        setTimeout(() => overlay.classList.remove('active'), 2500);
                    }
                }
            }
        });
    });
}
