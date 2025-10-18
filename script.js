const scriptURL = 'https://script.google.com/macros/s/AKfycbz1GLSki9hS99VOjXN_puQ1U_R4wEkKJtM-vqfWAGP6LN_3AlLtmwk_Qp4VMrCphJ5Apw/exec';

function showSection(id) {
  document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById('menu').classList.remove('show');
}

function toggleMenu() {
  document.getElementById('menu').classList.toggle('show');
}

// โหลดยอดขายรวม
function loadTotalSales() {
  fetch(`${scriptURL}?action=totalSales`)
    .then(res => res.text())
    .then(data => document.getElementById('totalSales').innerText = data)
    .catch(err => document.getElementById('totalSales').innerText = '❌ โหลดข้อมูลไม่สำเร็จ');
}

// โหลดสต็อกสินค้า
function loadStock() {
  fetch(`${scriptURL}?action=stock`)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('stockList');
      list.innerHTML = '';
      data.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.name} - ${item.quantity} ชิ้น`;
        list.appendChild(li);
      });
    })
    .catch(err => document.getElementById('stockList').innerText = '❌ โหลดข้อมูลไม่สำเร็จ');
}

// โหลดกราฟยอดขายรายวัน
function loadSalesChart() {
  fetch(`${scriptURL}?action=salesChart`)
    .then(res => res.json())
    .then(data => {
      const labels = data.map(item => item.date);
      const totals = data.map(item => item.total);

      const ctx = document.getElementById('salesChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'ยอดขายรายวัน (บาท)',
            data: totals,
            backgroundColor: '#3498db'
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    })
    .catch(err => {
      document.getElementById('salesChart').outerHTML = '<p>❌ โหลดกราฟไม่สำเร็จ</p>';
    });
}

// บันทึกยอดขาย (แก้ไขให้ใช้ FormData)
document.getElementById('saleForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const formData = new FormData(e.target);

  fetch(scriptURL, {
    method: 'POST',
    body: formData
  })
  .then(res => res.text())
  .then(text => {
    document.getElementById('response').innerText = text;
    e.target.reset();
    loadTotalSales();     // ✅ อัปเดตยอดขายรวม
    loadSalesChart();     // ✅ อัปเดตกราฟยอดขาย
  })
  .catch(error => {
    document.getElementById('response').innerText = '❌ เกิดข้อผิดพลาด: ' + error;
  });
});

// โหลดข้อมูลเมื่อเปิดหน้า
loadTotalSales();
loadStock();
loadSalesChart();
showSection('dashboard');