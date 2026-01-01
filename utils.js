// --- utils.js ---
// 通用工具函數

function showToast(msg) {
    let div = document.createElement('div');
    div.className = 'toast';
    div.innerText = msg;
    document.getElementById('toast-container').appendChild(div);
    setTimeout(() => div.remove(), 1200); 
}