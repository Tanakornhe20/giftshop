// 🔥 Firebase Initialization
const firebaseConfig = {
  apiKey: "AIzaSyACvlf7PWoYTcf8jrY9XuSl3xWfuLc2sAo",
  authDomain: "webapp-17166.firebaseapp.com",
  projectId: "webapp-17166",
  storageBucket: "webapp-17166.appspot.com",
  messagingSenderId: "72500006029",
  appId: "1:72500006029:web:3021a434b979bc475966c4",
  measurementId: "G-2G8F1Y4E3W"
};
firebase.initializeApp(firebaseConfig);

// 🧭 UI Navigation
function showSection(id) {
  document.querySelectorAll("main section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}
function toggleMenu() {
  document.getElementById("menu").classList.toggle("show");
}
function openAddProductForm() {
  document.getElementById("addProductPopup").style.display = "flex";
}
function closeAddProductPopup() {
  document.getElementById("addProductPopup").style.display = "none";
  document.getElementById("addProductForm").reset();
  document.getElementById("addProductForm").removeAttribute("data-edit-key");
  document.querySelector(".popup-content h3").innerText = "เพิ่มสินค้าใหม่";
}

// 📦 Stock Management
function loadStock() {
  const threshold = parseInt(document.getElementById("thresholdInput").value);
  const db = firebase.database().ref("sales");
  db.once("value").then(snapshot => {
    const data = snapshot.val();
    const stockList = document.getElementById("stockList");
    stockList.innerHTML = "";
    for (let key in data) {
      const item = data[key];
      const li = document.createElement("li");
      li.className = "product-card" + (item.quantity < threshold ? " low-stock" : "");
      li.innerHTML = `
        <div class="product-info">
          <img src="${item.imageURL}" alt="${item.product}">
          <div>
            <div class="product-name"><strong>${item.product}</strong></div>
            <div>คงเหลือ ${item.quantity} ชิ้น</div>
          </div>
        </div>
        <div class="product-actions">
          <button class="edit" onclick="editItem('${key}')">✏️</button>
          <button class="delete" onclick="deleteItem('${key}')">ลบ</button>
          <button class="minus" onclick="updateQuantity('${key}', -1)">–</button>
          <button class="plus" onclick="updateQuantity('${key}', 1)">+</button>
        </div>
      `;
      stockList.appendChild(li);
    }
  });
}

function updateQuantity(key, change) {
  const db = firebase.database().ref("sales/" + key);
  db.once("value").then(snapshot => {
    const item = snapshot.val();
    const newQty = Math.max(0, item.quantity + change);
    db.update({ quantity: newQty }).then(() => {
      loadStock();
      renderSalesChart();
    });
  });
}

function deleteItem(key) {
  if (confirm("คุณแน่ใจว่าต้องการลบสินค้านี้?")) {
    firebase.database().ref("sales/" + key).remove().then(() => {
      loadStock();
      renderSalesChart();
    });
  }
}

function filterStock() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  document.querySelectorAll(".product-card").forEach(card => {
    const name = card.querySelector(".product-name").innerText.toLowerCase();
    card.style.display = name.includes(keyword) ? "flex" : "none";
  });
}

// ✏️ Edit Product
function editItem(key) {
  const db = firebase.database().ref("sales/" + key);
  db.once("value").then(snapshot => {
    const item = snapshot.val();
    openAddProductForm();
    const form = document.getElementById("addProductForm");
    form.setAttribute("data-edit-key", key);
    form.product.value = item.product;
    form.sku.value = item.sku || "";
    form.quantity.value = item.quantity;
    form.price.value = item.price;
    form.category.value = item.category || "";
    document.querySelector(".popup-content h3").innerText = "แก้ไขสินค้า";
  });
}

// 📝 Add/Edit Product Form
document.getElementById("addProductForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const file = formData.get("image");
  const key = form.getAttribute("data-edit-key");

  const imageURL = file && file.size > 0
    ? URL.createObjectURL(file)
    : "https://via.placeholder.com/150";

  const productData = {
    product: formData.get("product"),
    sku: formData.get("sku"),
    quantity: parseInt(formData.get("quantity")),
    price: parseFloat(formData.get("price")),
    category: formData.get("category"),
    imageURL: imageURL,
    createdAt: new Date().toISOString(),
    active: true
  };

  const ref = key ? firebase.database().ref("sales/" + key) : firebase.database().ref("sales").push();
  ref.set(productData).then(() => {
    alert(key ? "แก้ไขสินค้าเรียบร้อย!" : "เพิ่มสินค้าเรียบร้อยแล้ว!");
    form.reset();
    form.removeAttribute("data-edit-key");
    document.querySelector(".popup-content h3").innerText = "เพิ่มสินค้าใหม่";
    closeAddProductPopup();
    loadStock();
    renderSalesChart();
  });
});

// 📝 Sale Form
document.getElementById("saleForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const file = formData.get("image");

  const imageURL = file && file.size > 0
    ? URL.createObjectURL(file)
    : "https://via.placeholder.com/150";

  const data = {
    product: formData.get("product"),
    quantity: parseInt(formData.get("quantity")),
    price: parseFloat(formData.get("price")),
    imageURL: imageURL,
    createdAt: new Date().toISOString(),
    active: true
  };

  firebase.database().ref("sales").push(data).then(() => {
    document.getElementById("response").innerText = "บันทึกสำเร็จแล้ว!";
    e.target.reset();
    loadStock();
    renderSalesChart();
  });
});

// 📊 Chart.js Summary
function renderSalesChart() {
  const db = firebase.database().ref("sales");
  db.once("value").then(snapshot => {
    const data = snapshot.val();
    const summary = {};

    for (let key in data) {
      const item = data[key];
      const name = item.product;
      const total = item.quantity * item.price;
      summary[name] = (summary[name] || 0) + total;
    }

    const labels = Object.keys(summary);
    const values = Object.values(summary);

    const ctx = document.getElementById("salesChart").getContext("2d");
    if (window.salesChartInstance) {
      window.salesChartInstance.destroy();
    }
    window.salesChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "ยอดขายรวม (บาท)",
          data: values,
          backgroundColor: "#3498db"
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: "สรุปยอดขายรวมรายสินค้า" }
        }
      }
    });
  });
}

// 🚀 Initialization
window.addEventListener("load", () => {
  loadStock();
  renderSalesChart();
});