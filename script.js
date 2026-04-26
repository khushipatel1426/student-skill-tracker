// State Variables
let skills = JSON.parse(localStorage.getItem('skillsTracker_data')) || [];

// DOM Elements
const addSkillForm = document.getElementById('add-skill-form');
const skillNameInput = document.getElementById('skill-name');
const skillProgressInput = document.getElementById('skill-progress');
const progressValDisplay = document.getElementById('progress-val');
const skillsGrid = document.getElementById('skills-grid');

const statTotal = document.getElementById('stat-total');
const statAvg = document.getElementById('stat-avg');
const statCompleted = document.getElementById('stat-completed');

const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

const barChartCanvas = document.getElementById('barChart');
const pieChartCanvas = document.getElementById('pieChart');

// Update Modal Elements
const updateModal = document.getElementById('update-modal');
const closeModal = document.getElementById('close-modal');
const updateSkillNameDisplay = document.getElementById('update-skill-name-display');
const updateSkillProgressInput = document.getElementById('update-skill-progress');
const updateProgressValDisplay = document.getElementById('update-progress-val');
const saveUpdateBtn = document.getElementById('save-update-btn');
let currentEditingId = null;

// Weekly Report Elements
const weeklyUpgraded = document.getElementById('weekly-upgraded');
const weeklyFocus = document.getElementById('weekly-focus');

// Chart Instances
let barChartInstance = null;
let pieChartInstance = null;

// Color Palette for charts and cards
const colorPalette = [
    { name: 'purple', class: 'bg-gradient-purple', icon: 'fa-code', hex: '#8b5cf6' },
    { name: 'blue', class: 'bg-gradient-blue', icon: 'fa-globe', hex: '#3b82f6' },
    { name: 'green', class: 'bg-gradient-green', icon: 'fa-database', hex: '#10b981' },
    { name: 'orange', class: 'bg-gradient-orange', icon: 'fa-server', hex: '#f59e0b' },
    { name: 'pink', class: 'bg-gradient-pink', icon: 'fa-mobile-screen', hex: '#ec4899' }
];

// Motivational Messages
const messages = [
    "Every line of code is a step toward mastery.",
    "Consistency is the key to mastering new skills.",
    "Small progress every day adds up to big results.",
    "Stay focused, stay consistent, and keep learning.",
    "Embrace the struggle, it's where the learning happens."
];
document.getElementById('motivational-msg').innerText = `"${messages[Math.floor(Math.random() * messages.length)]}"`;


// --- Initialization ---
function init() {
    loadTheme();
    setupEventListeners();
    updateUI();
}

// --- Event Listeners ---
function setupEventListeners() {
    // Add Skill Form
    skillProgressInput.addEventListener('input', (e) => {
        progressValDisplay.innerText = `${e.target.value}%`;
    });
    
    addSkillForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addSkill(skillNameInput.value.trim(), parseInt(skillProgressInput.value));
    });

    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Update Modal
    updateSkillProgressInput.addEventListener('input', (e) => {
        updateProgressValDisplay.innerText = `${e.target.value}%`;
    });
    closeModal.addEventListener('click', closeUpdateModal);
    saveUpdateBtn.addEventListener('click', saveSkillUpdate);
}

// --- Main Functions ---

function addSkill(name, progress) {
    if (!name) return;
    
    const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    
    const newSkill = {
        id: Date.now().toString(),
        name: name,
        progress: progress,
        colorClass: randomColor.class,
        icon: randomColor.icon,
        hex: randomColor.hex
    };

    skills.push(newSkill);
    saveData();
    
    // Reset Form
    skillNameInput.value = '';
    skillProgressInput.value = 50;
    progressValDisplay.innerText = '50%';
    
    updateUI();
    showToast(`Added successfully: ${name}`, 'success');
}

function deleteSkill(id) {
    skills = skills.filter(skill => skill.id !== id);
    saveData();
    updateUI();
    showToast('Skill deleted', 'error');
}

function openUpdateModal(id) {
    const skill = skills.find(s => s.id === id);
    if (!skill) return;
    
    currentEditingId = id;
    updateSkillNameDisplay.innerText = skill.name;
    updateSkillProgressInput.value = skill.progress;
    updateProgressValDisplay.innerText = `${skill.progress}%`;
    
    updateModal.classList.add('active');
}

function closeUpdateModal() {
    updateModal.classList.remove('active');
    currentEditingId = null;
}

function saveSkillUpdate() {
    if (!currentEditingId) return;
    
    const newProgress = parseInt(updateSkillProgressInput.value);
    const skillIndex = skills.findIndex(s => s.id === currentEditingId);
    
    if (skillIndex > -1) {
        skills[skillIndex].progress = newProgress;
        saveData();
        updateUI();
        showToast('Skill progress updated!', 'success');
    }
    
    closeUpdateModal();
}

function updateUI() {
    renderSkillsGrids();
    calculateStats();
    updateCharts();
}

function renderSkillsGrids() {
    skillsGrid.innerHTML = '';
    
    if (skills.length === 0) {
        skillsGrid.innerHTML = `
            <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h3 style="color: var(--text-muted);">No skills added yet. Start your journey today!</h3>
            </div>
        `;
        return;
    }

    skills.forEach(skill => {
        const card = document.createElement('div');
        card.className = 'glass-card skill-item hover-float';
        
        // Progress text color
        let statusText = skill.progress === 100 ? 'Mastered' : 'Learning';
        let statusColor = skill.progress === 100 ? 'var(--success)' : 'var(--text-muted)';

        card.innerHTML = `
            <div class="skill-item-header">
                <div class="skill-title-group">
                    <div class="skill-icon ${skill.colorClass}">
                        <i class="fa-solid ${skill.icon}"></i>
                    </div>
                    <h4>${skill.name}</h4>
                </div>
                <div class="skill-actions">
                    <button class="action-btn edit" onclick="openUpdateModal('${skill.id}')" title="Edit Progress">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteSkill('${skill.id}')" title="Delete">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
            <div class="skill-progress-container">
                <div class="skill-progress-header">
                    <span style="color: ${statusColor}; font-weight: 600;">${statusText}</span>
                    <span>${skill.progress}%</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill ${skill.colorClass}" style="width: ${skill.progress}%;"></div>
                </div>
            </div>
        `;
        skillsGrid.appendChild(card);
    });
}

function calculateStats() {
    const total = skills.length;
    let completed = 0;
    let sumProgress = 0;

    skills.forEach(skill => {
        sumProgress += skill.progress;
        if (skill.progress === 100) completed++;
    });

    const avg = total > 0 ? Math.round(sumProgress / total) : 0;
    
    // Animate numbers up (simplified approach)
    statTotal.innerText = total;
    statAvg.innerText = `${avg}%`;
    statCompleted.innerText = completed;

    // Weekly Insights pseudo-calculation
    const upgradedCount = total > 0 ? Math.ceil(total / 3) : 0; // Fake some data for weekly insights
    weeklyUpgraded.innerText = upgradedCount;

    if (total > 0) {
        // Find highest progressing skill not at 100
        const focusSkills = skills.filter(s => s.progress < 100).sort((a,b) => b.progress - a.progress);
        if (focusSkills.length > 0) {
            weeklyFocus.innerText = focusSkills[0].name;
        } else {
            weeklyFocus.innerText = "Master of all!";
        }
    } else {
        weeklyFocus.innerText = "None";
    }
}

// --- Chart.js ---
function updateCharts() {
    const isDark = body.classList.contains('dark-mode');
    const textColor = isDark ? '#e2e8f0' : '#475569';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

    const labels = skills.map(skill => skill.name);
    const data = skills.map(skill => skill.progress);
    const bgColors = skills.map(skill => skill.hex);

    // Bar Chart
    const barCtx = barChartCanvas.getContext('2d');
    if (barChartInstance) barChartInstance.destroy();

    barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['No Data'],
            datasets: [{
                label: 'Progress (%)',
                data: data.length ? data : [0],
                backgroundColor: bgColors.length ? bgColors : ['#cbd5e1'],
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { display: false }
                }
            }
        }
    });

    // Pie Chart
    const pieCtx = pieChartCanvas.getContext('2d');
    if (pieChartInstance) pieChartInstance.destroy();

    let completedCount = skills.filter(s => s.progress === 100).length;
    let learningCount = skills.length - completedCount;

    pieChartInstance = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress'],
            datasets: [{
                data: skills.length ? [completedCount, learningCount] : [0, 1],
                backgroundColor: ['#10b981', '#6366f1'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: textColor }
                }
            },
            cutout: '70%'
        }
    });
}

// --- Utils ---

function saveData() {
    localStorage.setItem('skillsTracker_data', JSON.stringify(skills));
}

function loadTheme() {
    const savedTheme = localStorage.getItem('skillsTracker_theme');
    if (savedTheme === 'dark') {
        body.classList.replace('light-mode', 'dark-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        body.classList.replace('dark-mode', 'light-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}

function toggleTheme() {
    if (body.classList.contains('light-mode')) {
        body.classList.replace('light-mode', 'dark-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        localStorage.setItem('skillsTracker_theme', 'dark');
    } else {
        body.classList.replace('dark-mode', 'light-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        localStorage.setItem('skillsTracker_theme', 'light');
    }
    updateCharts(); // Re-render charts with correct text colors
}

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
    
    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <div>
            <p style="font-weight: 600; font-size: 0.95rem;">${type === 'success' ? 'Success' : 'Notice'}</p>
            <p style="font-size: 0.85rem; color: var(--text-muted);">${message}</p>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Expose necessary functions to global scope for inline handlers mapped strings (onclick attributes)
window.deleteSkill = deleteSkill;
window.openUpdateModal = openUpdateModal;

// Run App
init();
