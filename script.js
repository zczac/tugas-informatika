
let cart = [];

let subtotalBelanja = 0;
let nominalDiskon = 0;
let nominalPajak = 0;
let grandTotal = 0;
let kembalian = 0;

const INVENTORY_DEFAULT = [
  { kode: '8991234001', nama: 'Kopi Kapal Api 165g', harga: 15000, stok: 25 },
  { kode: '8991234002', nama: 'Indomie Goreng', harga: 3500, stok: 100 },
  { kode: '8991234003', nama: 'Minyak Goreng 1L', harga: 18000, stok: 20 },
  { kode: '8991234004', nama: 'Gula Pasir 1kg', harga: 16500, stok: 30 },
  { kode: '8991234005', nama: 'Susu UHT 1L', harga: 19500, stok: 15 }
];

function formatRupiah(angka) {
  return Number(angka || 0).toLocaleString('id-ID');
}

function login() {
  const userEl = document.getElementById('user');
  const passEl = document.getElementById('pass');
  const loginBox = document.getElementById('loginBox');
  const appBox = document.getElementById('app');

  if (userEl.value === 'admin' && passEl.value === '1234') {
    loginBox.classList.add('hidden');
    appBox.classList.remove('hidden');
    inialisasiAplikasi();
  } else {
    alert('Login gagal! Gunakan username "admin" dan password "1234".');
  }
}

function logout() {
  document.getElementById('loginBox').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function inialisasiAplikasi() {

  document.getElementById('tanggal').innerText = 'Tanggal: ' + new Date().toLocaleString('id-ID');

  initInventory();
  renderInventory();
  tampilRiwayat();
  renderCart();
}

function getInventory() {
  const data = localStorage.getItem('kasir_inventory');
  if (!data) {
    localStorage.setItem('kasir_inventory', JSON.stringify(INVENTORY_DEFAULT));
    return INVENTORY_DEFAULT;
  }
  return JSON.parse(data);
}

function saveInventory(inventoryData) {
  localStorage.setItem('kasir_inventory', JSON.stringify(inventoryData));
}

function initInventory() {
  getInventory();
}

function renderInventory() {
  const inventoryList = document.getElementById('inventoryList');
  const inventory = getInventory();

  inventoryList.innerHTML = '';

  inventory.forEach(item => {
    const tr = document.createElement('tr');

    let badgeClass = 'badge-success';
    if (item.stok === 0) badgeClass = 'badge-danger';
    else if (item.stok <= 5) badgeClass = 'badge-warning';

    tr.innerHTML = `
      <td><code>${item.kode}</code></td>
      <td><strong>${item.nama}</strong></td>
      <td>Rp ${formatRupiah(item.harga)}</td>
      <td><span class="badge ${badgeClass}">${item.stok} unit</span></td>
      <td>
        <button class="btn btn-outline" style="padding:4px 8px; font-size:0.8rem;"
                onclick="tambahKeKeranjangByKode('${item.kode}')" ${item.stok === 0 ? 'disabled' : ''}>
          + Pilih
        </button>
      </td>
    `;
    inventoryList.appendChild(tr);
  });
}

function handleBarcodeEnter(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    cariBarcode();
  }
}

function cariBarcode() {
  const barcodeInput = document.getElementById('barcodeInput');
  const kode = barcodeInput.value.trim();

  if (!kode) {
    alert('Masukkan atau scan kode barcode terlebih dahulu!');
    return;
  }

  const inventory = getInventory();
  const barang = inventory.find(item => item.kode === kode);

  if (!barang) {
    alert(`Barang dengan kode barcode "${kode}" tidak ditemukan dalam inventaris.`);
    return;
  }

  const berhasil = tambahKeKeranjang(barang.kode, barang.nama, barang.harga, 1);
  if (berhasil) {
    barcodeInput.value = '';
    barcodeInput.focus();
  }
}

function tambahKeKeranjangByKode(kodeBarang) {
  const inventory = getInventory();
  const barang = inventory.find(i => i.kode === kodeBarang);
  if (barang) {
    tambahKeKeranjang(barang.kode, barang.nama, barang.harga, 1);
  }
}

function tambahBarangManual() {
  const namaEl = document.getElementById('nama');
  const hargaEl = document.getElementById('harga');
  const jumlahEl = document.getElementById('jumlah');

  const nama = namaEl.value.trim();
  const harga = parseInt(hargaEl.value);
  const jumlah = parseInt(jumlahEl.value) || 1;

  if (!nama || !harga || harga <= 0 || jumlah <= 0) {
    alert('Silakan lengkapi Nama Barang, Harga (>0), dan Jumlah yang valid!');
    return;
  }

  const inventory = getInventory();
  const barangAda = inventory.find(i => i.nama.toLowerCase() === nama.toLowerCase());

  const kode = barangAda ? barangAda.kode : 'MANUAL-' + Date.now().toString().slice(-4);

  const berhasil = tambahKeKeranjang(kode, nama, harga, jumlah);
  if (berhasil) {
    namaEl.value = '';
    hargaEl.value = '';
    jumlahEl.value = '1';
  }
}

function tambahKeKeranjang(kode, nama, harga, qtyQtyUntukDitambah) {
  const inventory = getInventory();
  const barangInvetaris = inventory.find(i => i.kode === kode);

  const itemCartExisting = cart.find(i => i.kode === kode);
  const qtyDiKeranjangSaatIni = itemCartExisting ? itemCartExisting.jumlah : 0;

  const totalStokDibutuhkan = qtyDiKeranjangSaatIni + qtyQtyUntukDitambah;

  if (barangInvetaris) {
    if (totalStokDibutuhkan > barangInvetaris.stok) {
      alert(`Stok tidak mencukupi!\nStok "${nama}" tersisa: ${barangInvetaris.stok} unit.\nSudah di keranjang: ${qtyDiKeranjangSaatIni} unit.`);
      return false;
    }
  }

  if (itemCartExisting) {
    itemCartExisting.jumlah += qtyQtyUntukDitambah;
    itemCartExisting.subtotal = itemCartExisting.jumlah * itemCartExisting.harga;
  } else {
    cart.push({
      kode: kode,
      nama: nama,
      harga: harga,
      jumlah: qtyQtyUntukDitambah,
      subtotal: harga * qtyQtyUntukDitambah
    });
  }

  renderCart();
  return true;
}

function ubahJumlahCart(index, perubahan) {
  const item = cart[index];
  if (!item) return;

  const targetQty = item.jumlah + perubahan;
  if (targetQty <= 0) {
    hapusItemKeranjang(index);
    return;
  }

  const inventory = getInventory();
  const barangInvetaris = inventory.find(i => i.kode === item.kode);

  if (barangInvetaris && targetQty > barangInvetaris.stok) {
    alert(`Stok tidak mencukupi! Stok maksimal "${item.nama}" adalah ${barangInvetaris.stok} unit.`);
    return;
  }

  item.jumlah = targetQty;
  item.subtotal = item.jumlah * item.harga;
  renderCart();
}

function hapusItemKeranjang(index) {
  cart.splice(index, 1);
  renderCart();
}

function renderCart() {
  const tbody = document.getElementById('list');
  tbody.innerHTML = '';
  subtotalBelanja = 0;

  cart.forEach((item, index) => {
    subtotalBelanja += item.subtotal;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code>${item.kode}</code></td>
      <td><strong>${item.nama}</strong></td>
      <td>Rp ${formatRupiah(item.harga)}</td>
      <td>
        <button class="btn btn-outline" style="padding:2px 6px;" onclick="ubahJumlahCart(${index}, -1)">-</button>
        <strong style="margin: 0 6px;">${item.jumlah}</strong>
        <button class="btn btn-outline" style="padding:2px 6px;" onclick="ubahJumlahCart(${index}, 1)">+</button>
      </td>
      <td>Rp ${formatRupiah(item.subtotal)}</td>
      <td>
        <button class="btn btn-danger" onclick="hapusItemKeranjang(${index})">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  hitungKalkulasiTotal();
}

function hitungKalkulasiTotal() {
  const diskonInput = document.getElementById('diskonInput');
  const ppnInput = document.getElementById('ppnInput');

  let diskonPercent = parseFloat(diskonInput.value) || 0;
  let ppnPercent = parseFloat(ppnInput.value) || 0;

  if (diskonPercent < 0) diskonPercent = 0;
  if (diskonPercent > 100) diskonPercent = 100;
  if (ppnPercent < 0) ppnPercent = 0;
  if (ppnPercent > 100) ppnPercent = 100;

  nominalDiskon = Math.round(subtotalBelanja * (diskonPercent / 100));
  const subtotalSetelahDiskon = subtotalBelanja - nominalDiskon;

  nominalPajak = Math.round(subtotalSetelahDiskon * (ppnPercent / 100));

  grandTotal = subtotalSetelahDiskon + nominalPajak;

  document.getElementById('subtotalDisplay').innerText = formatRupiah(subtotalBelanja);
  document.getElementById('nominalDiskonDisplay').innerText = formatRupiah(nominalDiskon);
  document.getElementById('nominalPajakDisplay').innerText = formatRupiah(nominalPajak);
  document.getElementById('total').innerText = formatRupiah(grandTotal);

  hitungKembalian();
}

function hitungKembalian() {
  const uangBayarInput = document.getElementById('uangBayar');
  const changeBox = document.getElementById('changeBox');
  const kembalianDisplay = document.getElementById('kembalianDisplay');

  const uangBayar = parseInt(uangBayarInput.value) || 0;
  kembalian = uangBayar - grandTotal;

  if (cart.length === 0) {
    kembalianDisplay.innerText = 'Rp 0';
    changeBox.className = 'change-box';
    return;
  }

  if (kembalian >= 0) {
    kembalianDisplay.innerText = 'Rp ' + formatRupiah(kembalian);
    changeBox.className = 'change-box is-valid';
  } else {
    const kurang = Math.abs(kembalian);
    kembalianDisplay.innerText = 'Kurang Rp ' + formatRupiah(kurang);
    changeBox.className = 'change-box is-invalid';
  }
}

function simpanTransaksi() {
  const uangBayarInput = document.getElementById('uangBayar');
  const uangBayar = parseInt(uangBayarInput.value) || 0;

  if (cart.length === 0) {
    alert('Keranjang belanja masih kosong! Tambahkan barang terlebih dahulu.');
    return;
  }

  if (uangBayar < grandTotal) {
    const kekurangannya = grandTotal - uangBayar;
    alert(`Transaksi Gagal!\nUang pembayaran kurang Rp ${formatRupiah(kekurangannya)}.\nTotal Belanja: Rp ${formatRupiah(grandTotal)}\nUang Dibayar: Rp ${formatRupiah(uangBayar)}`);
    return;
  }

  const inventory = getInventory();
  cart.forEach(cartItem => {
    const invItem = inventory.find(i => i.kode === cartItem.kode);
    if (invItem) {
      invItem.stok = Math.max(0, invItem.stok - cartItem.jumlah);
    }
  });

  saveInventory(inventory);

  const diskonPercent = parseFloat(document.getElementById('diskonInput').value) || 0;
  const ppnPercent = parseFloat(document.getElementById('ppnInput').value) || 0;

  const dataTransaksi = JSON.parse(localStorage.getItem('transaksi') || '[]');
  const transaksiBaru = {
    id: 'TRX-' + Date.now(),
    tanggal: new Date().toLocaleString('id-ID'),
    items: [...cart],
    subtotal: subtotalBelanja,
    diskonPercent: diskonPercent,
    nominalDiskon: nominalDiskon,
    ppnPercent: ppnPercent,
    nominalPajak: nominalPajak,
    total: grandTotal,
    uangBayar: uangBayar,
    kembalian: kembalian
  };

  dataTransaksi.push(transaksiBaru);
  localStorage.setItem('transaksi', JSON.stringify(dataTransaksi));

  alert(`Transaksi Berhasil Disimpan!\nTotal: Rp ${formatRupiah(grandTotal)}\nUang Bayar: Rp ${formatRupiah(uangBayar)}\nKembalian: Rp ${formatRupiah(kembalian)}`);

  cart = [];
  uangBayarInput.value = '';
  document.getElementById('diskonInput').value = '0';
  document.getElementById('ppnInput').value = '11';

  renderCart();
  renderInventory();
  tampilRiwayat();
}

function tampilRiwayat() {
  const riwayatEl = document.getElementById('riwayat');
  const statistikEl = document.getElementById('statistik');
  const data = JSON.parse(localStorage.getItem('transaksi') || '[]');

  riwayatEl.innerHTML = '';
  let grandAkumulatif = 0;

  data.slice().reverse().forEach(t => {
    grandAkumulatif += t.total;
    const li = document.createElement('li');

    const ringkasanItem = t.items ? t.items.map(i => `${i.nama} (${i.jumlah}x)`).join(', ') : '-';

    li.innerHTML = `
      <div><strong>${t.tanggal}</strong> - <span style="color:var(--primary-color);">Rp ${formatRupiah(t.total)}</span></div>
      <div style="color:var(--text-muted); font-size:0.8rem;">Item: ${ringkasanItem}</div>
      <div style="color:var(--text-muted); font-size:0.78rem;">Bayar: Rp ${formatRupiah(t.uangBayar)} | Kembali: Rp ${formatRupiah(t.kembalian)}</div>
    `;
    riwayatEl.appendChild(li);
  });

  statistikEl.innerText = formatRupiah(grandAkumulatif);
}

function eksporLaporanCSV() {
  const data = JSON.parse(localStorage.getItem('transaksi') || '[]');

  if (data.length === 0) {
    alert('Belum ada data riwayat transaksi yang tersimpan untuk diekspor!');
    return;
  }

  let csvContent = 'ID Transaksi;Tanggal;Daftar Barang;Subtotal (Rp);Diskon (%);Nominal Diskon (Rp);Pajak PPN (%);Nominal Pajak (Rp);Total Akhir (Rp);Uang Bayar (Rp);Kembalian (Rp)\n';

  data.forEach(t => {
    const listBarangStr = t.items
      ? t.items.map(i => `${i.nama} x${i.jumlah}`).join(' | ')
      : '-';

    const safeListBarang = `"${listBarangStr.replace(/"/g, '""')}"`;
    const safeTanggal = `"${t.tanggal}"`;

    const row = [
      t.id || '-',
      safeTanggal,
      safeListBarang,
      t.subtotal || t.total,
      t.diskonPercent || 0,
      t.nominalDiskon || 0,
      t.ppnPercent || 0,
      t.nominalPajak || 0,
      t.total,
      t.uangBayar || t.total,
      t.kembalian || 0
    ].join(';');

    csvContent += row + '\n';
  });

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const tanggalHariIni = new Date().toISOString().split('T')[0];

  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan_Penjualan_Kasir_${tanggalHariIni}.csv`);
  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
