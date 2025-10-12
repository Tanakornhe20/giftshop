const scriptURL = 'https://script.google.com/macros/s/AKfycbxbpFAaPrX5BcpY0BDUMnuqzVHP39CFOFmk5qOmK1veNJPAm5drz9vjBNluXKmLGWuFGw/exec';

function showSection(id) {
  document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// โหลดยอดขายรวม
fetch(`${scriptURL}?action=totalSales`)
  .then(res => res.text())
  .then(data => document.getElementById('totalSales').innerText = data);

// โหลดข้อมูลสต็อก
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
  });

// บันทึกยอดขาย
document.getElementById('saleForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = {
    product: formData.get('product'),
    quantity: Number(formData.get('quantity')),
    price: Number(formData.get('price'))
  };

  fetch(scriptURL, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(res => res.text())
  .then(text => {
    document.getElementById('response').innerText = text;
    e.target.reset();
  });
});

// เริ่มต้นที่ Dashboard
showSection('dashboard');