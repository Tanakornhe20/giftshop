// Firebase config สำหรับ CDN
const firebaseConfig = {
  apiKey: "AIzaSyACvlf7PWoYTcf8jrY9XuSl3xWfuLc2sAo",
  authDomain: "webapp-17166.firebaseapp.com",
  projectId: "webapp-17166",
  storageBucket: "webapp-17166.appspot.com", // ✅ แก้เป็น .appspot.com
  messagingSenderId: "72500006029",
  appId: "1:72500006029:web:3021a434b979bc475966c4",
  measurementId: "G-2G8F1Y4E3W"
};

// เริ่มต้น Firebase
firebase.initializeApp(firebaseConfig);

// สลับหน้าเมนู
function showSection(id) {
  document.querySelectorAll("main section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// แสดง/ซ่อนเมนู
function toggleMenu() {
  document.getElementById("menu").classList.toggle("show");
}

// โหลดรายการสินค้า
function loadStock() {
  const db = firebase.database().ref("sales");
  db.once("value").then(snapshot => {
    const data = snapshot.val();
    const stockList = document.getElementById("stockList");
    stockList.innerHTML = "";
    for (let key in data) {
      const item = data[key];
      const li = document.createElement("li");
      li.className = "product-card" + (item.quantity < 5 ? " low-stock" : "");
      li.innerHTML = `
        <div class="product-info">
          <img src="${item.imageURL}" alt="${item.product}">
          <div>
            <div class="product-name"><strong>${item.product}</strong></div>
            <div>คงเหลือ ${item.quantity} ชิ้น</div>
          </div>
        </div>
        <div class="product-actions">
          <button class="delete" onclick="deleteItem('${key}')">ลบสินค้า</button>
          <button class="minus" onclick="updateQuantity('${key}', -1)">–</button>
          <button class="plus" onclick="updateQuantity('${key}', 1)">+</button>
        </div>
      `;
      stockList.appendChild(li);
    }
  });
}

// ค้นหาสินค้า
function filterStock() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  document.querySelectorAll(".product-card").forEach(card => {
    const name = card.querySelector(".product-name").innerText.toLowerCase();
    card.style.display = name.includes(keyword) ? "flex" : "none";
  });
}

// ปรับจำนวนสินค้า
function updateQuantity(key, change) {
  const db = firebase.database().ref("sales/" + key);
  db.once("value").then(snapshot => {
    const item = snapshot.val();
    const newQty = Math.max(0, item.quantity + change);
    db.update({ quantity: newQty }).then(() => loadStock());
  });
}

// ลบสินค้า
function deleteItem(key) {
  if (confirm("คุณแน่ใจว่าต้องการลบสินค้านี้?")) {
    firebase.database().ref("sales/" + key).remove().then(() => loadStock());
  }
}

// ฟอร์มเพิ่มสินค้า (ยังไม่เปิดใช้งาน)
function openAddProductForm() {
  alert("ฟอร์มเพิ่มสินค้าจะมาเร็ว ๆ นี้!");
}

// บันทึกยอดขาย
document.getElementById("saleForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const file = formData.get("image");
  const storageRef = firebase.storage().ref("images/" + file.name);

  storageRef.put(file).then(snapshot => snapshot.ref.getDownloadURL()).then(url => {
    const data = {
      product: formData.get("product"),
      quantity: parseInt(formData.get("quantity")),
      price: parseFloat(formData.get("price")),
      imageURL: url
    };
    firebase.database().ref("sales").push(data).then(() => {
      document.getElementById("response").innerText = "บันทึกสำเร็จแล้ว!";
      e.target.reset();
      loadStock();
    });
  });
});

// โหลดข้อมูลเมื่อเปิดหน้า
window.addEventListener("load", () => {
  loadStock();
});