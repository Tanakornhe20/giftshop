# ร้าน Gift shop
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>ระบบขายสินค้า</title>
  <style>
    nav a { margin: 10px; cursor: pointer; }
    section { display: none; margin-top: 20px; }
    section.active { display: block; }
  </style>
</head>
<body>
  <h1>ระบบจัดการขายสินค้า</h1>
  <nav>
    <a onclick="showSection('dashboard')">📊 Dashboard</a>
    <a onclick="showSection('stock')">📦 สินค้าคงคลัง</a>
    <a onclick="showSection('sales')">📝 บันทึกยอดขาย</a>
  </nav>

  <!-- Dashboard -->
  <section id="dashboard">
    <h2>ยอดขายรวมทั้งหมด</h2>
    <p id="totalSales">กำลังโหลด...</p>
  </section>

  <!-- Stock -->
  <section id="stock">
    <h2>รายการสินค้าคงคลัง</h2>
    <ul id="stockList">กำลังโหลด...</ul>
  </section>

  <!-- Sales Form -->
  <section id="sales">
    <h2>บันทึกยอดขาย</h2>
    <form id="saleForm">
      <label>สินค้า:</label><br>
      <input type="text" name="product" required><br>
      <label>จำนวน:</label><br>
      <input type="number" name="quantity" required><br>
      <label>ราคาต่อหน่วย:</label><br>
      <input type="number" name="price" required><br><br>
      <button type="submit">บันทึก</button>
    </form>
    <p id="response"></p>
  </section>

  <script>
    function showSection(id) {
      document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
      document.getElementById(id).classList.add('active');
    }

    // เรียกข้อมูลยอดขายรวมจาก Google Apps Script
    fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=totalSales')
      .then(res => res.text())
      .then(data => document.getElementById('totalSales').innerText = data);

    // เรียกข้อมูล Stock
    fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=stock')
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
        quantity: formData.get('quantity'),
        price: formData.get('price')
      };

      fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec', {
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

    // เริ่มต้นแสดง Dashboard
    showSection('dashboard');
  </script>
</body>
</html>