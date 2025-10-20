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

// ✅ โหลด dropdown SKU
function loadProductOptions() {
  const select = document.getElementById("productSelect");
  select.innerHTML = `<option value="">-- เลือกสินค้า --</option>`;
  firebase.database().ref("products").once("value").then(snapshot => {
    const products = snapshot.val();
    for (let key in products) {
      const item = products[key];
      const option = document.createElement("option");
      option.value = item.sku;
      option.text = `${item.product} (${item.sku})`;
      select.appendChild(option);
    }
  });
}

// ✅ แสดง preview สินค้าเมื่อเลือก SKU
function updateSalePreview() {
  const sku = document.getElementById("productSelect").value;
  const preview = document.getElementById("salePreview");
  const nameEl = document.getElementById("previewName");
  const stockEl = document.getElementById("previewStock");
  const imageEl = document.getElementById("previewImage");

  if (!sku) {
    preview.style.display = "none";
    return;
  }

  firebase.database().ref("products").once("value").then(snapshot => {
    const products = snapshot.val();
    for (let key in products) {
      const item = products[key];
      if (item.sku === sku) {
        nameEl.innerText = item.product;
        stockEl.innerText = item.quantity;
        imageEl.src = item.imageURL || "https://via.placeholder.com/150";
        preview.style.display = "flex";
        document.querySelector("#saleForm input[name='product']").value = item.product;
        break;
      }
    }
  });
}

// ✅ สแกนบาร์โค้ดเพื่อเลือก SKU
async function startBarcodeScan() {
  if (!("BarcodeDetector" in window)) {
    alert("เบราว์เซอร์ไม่รองรับการสแกนบาร์โค้ด");
    return;
  }

  const detector = new BarcodeDetector({ formats: ["code_128", "ean_13", "qr_code"] });
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  const video = document.createElement("video");
  video.srcObject = stream;
  video.setAttribute("playsinline", true);
  video.play();

  const scanInterval = setInterval(async () => {
    const barcodes = await detector.detect(video);
    if (barcodes.length > 0) {
      const sku = barcodes[0].rawValue;
      document.getElementById("productSelect").value = sku;
      updateSalePreview();
      stream.getTracks().forEach(track => track.stop());
      video.remove();
      clearInterval(scanInterval);
      alert(`สแกนสำเร็จ: ${sku}`);
    }
  }, 1000);
}

// ✅ บันทึกยอดขายและตัด stock
document.getElementById("saleForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const file = formData.get("image");

  const imageURL = file && file.size > 0
    ? URL.createObjectURL(file)
    : "https://via.placeholder.com/150";

  const sku = formData.get("sku");
  const quantitySold = parseInt(formData.get("quantity"));

  const data = {
    sku: sku,
    product: formData.get("product"),
    quantity: quantitySold,
    price: parseFloat(formData.get("price")),
    imageURL: imageURL,
    createdAt: new Date().toISOString(),
    active: true
  };

  firebase.database().ref("sales").push(data).then(() => {
    document.getElementById("response").innerText = "✅ บันทึกยอดขายสำเร็จแล้ว!";
    e.target.reset();
    document.getElementById("salePreview").style.display = "none";

    // 🔥 ตัด stock
    firebase.database().ref("products").once("value").then(snapshot => {
      const products = snapshot.val();
      for (let key in products) {
        const item = products[key];
        if (item.sku === sku) {
          const newQty = Math.max(0, item.quantity - quantitySold);
          firebase.database().ref("products/" + key).update({ quantity: newQty });
          break;
        }
      }
    });
  });
});

let billItems = [];

function loadBillProductOptions() {
  const select = document.getElementById("billProductSelect");
  select.innerHTML = `<option value="">-- เลือกสินค้า --</option>`;
  firebase.database().ref("products").once("value").then(snapshot => {
    const products = snapshot.val();
    for (let key in products) {
      const item = products[key];
      const option = document.createElement("option");
      option.value = item.sku;
      option.text = `${item.product} (${item.sku})`;
      select.appendChild(option);
    }
  });
}

document.getElementById("billItemForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const sku = document.getElementById("billProductSelect").value;
  const quantity = parseInt(document.getElementById("billQuantity").value);
  const price = parseFloat(document.getElementById("billPrice").value);

  firebase.database().ref("products").once("value").then(snapshot => {
    const products = snapshot.val();
    for (let key in products) {
      const item = products[key];
      if (item.sku === sku) {
        billItems.push({ sku, product: item.product, quantity, price });
        renderBillTable();
        e.target.reset();
        break;
      }
    }
  });
});

function renderBillTable() {
  const tbody = document.querySelector("#billTable tbody");
  tbody.innerHTML = "";
  let total = 0;

  billItems.forEach((item, index) => {
    const row = document.createElement("tr");
    const sum = item.quantity * item.price;
    total += sum;
    row.innerHTML = `
      <td>${item.product}</td>
      <td>${item.quantity}</td>
      <td>${item.price}</td>
      <td>${sum}</td>
      <td><button onclick="removeBillItem(${index})">🗑️</button></td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById("billTotal").innerText = total.toLocaleString();
}

function removeBillItem(index) {
  billItems.splice(index, 1);
  renderBillTable();
}

function submitBill() {
  if (billItems.length === 0) {
    alert("กรุณาเพิ่มรายการก่อนบันทึกบิล");
    return;
  }

  const total = billItems.reduce((sum, i) => sum + i.quantity * i.price, 0);
  const bill = {
    createdAt: new Date().toISOString(),
    customer: "ลูกค้าทั่วไป",
    items: billItems,
    total: total
  };

  firebase.database().ref("bills").push(bill).then(() => {
    document.getElementById("billResponse").innerText = "✅ บันทึกบิลเรียบร้อยแล้ว!";
    billItems.forEach(item => {
      firebase.database().ref("products").once("value").then(snapshot => {
        const products = snapshot.val();
        for (let key in products) {
          const p = products[key];
          if (p.sku === item.sku) {
            const newQty = Math.max(0, p.quantity - item.quantity);
            firebase.database().ref("products/" + key).update({ quantity: newQty });
            break;
          }
        }
      });
    });
    billItems = [];
    renderBillTable();
  });
}

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
          title: {
            display: true,
            text: "สรุปยอดขายรวมรายสินค้า",
            font: {
              size: 18
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return value.toLocaleString() + " บาท";
              }
            }
          }
        }
      }
    });
  });
}
// 🚀 Initialization
window.addEventListener("load", () => {
  loadStock();            // โหลดสินค้าคงคลัง
  renderSalesChart();     // โหลดกราฟยอดขาย
  loadProductOptions();   // ✅ โหลด dropdown SKU สำหรับฟอร์มยอดขาย
});