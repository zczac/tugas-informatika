let cart = [];

let subtotalBelanja = 0;
let nominalDiskon = 0;
let nominalPajak = 0;
let grandTotal = 0;
let kembalian = 0;

// Kode yang sedang akan dihapus (untuk modal konfirmasi)
let kodeBarangAkanDihapus = null;

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

// ============================================================
// AUTH
// ============================================================

function login() {
  const userEl = document.getElementById('user');
  const passEl = document.getElementById('pass');

  if (userEl.value === 'admin' && passEl.value === '1234') {
    document.getElementById('loginBox').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
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

// ============================================================
// INVENTORY (CRUD)
// ============================================================

function getInventory() {
  const data = localStorage.getItem('kasir_inventory');
  if (!data) {
    localStorage.setItem('kasir_inventory', JSON.stringify(INVENTORY_DEFAULT));
    return [...INVENTORY_DEFAULT];
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
  const searchEl = document.getElementById('searchInventory');
  const keyword = searchEl ? searchEl.value.toLowerCase().trim() : '';
  const inventory = getInventory();

  // Filter berdasarkan pencarian
  const filtered = keyword
    ? inventory.filter(i =>
        i.nama.toLowerCase().includes(keyword) ||
        i.kode.toLowerCase().includes(keyword)
      )
    : inventory;

  inventoryList.innerHTML = '';

  if (filtered.length === 0) {
    inventoryList.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; color:var(--text-muted); padding:20px;">
          ${keyword ? `Barang "${keyword}" tidak ditemukan.` : 'Inventaris masih kosong.'}
        </td>
      </tr>`;
    return;
  }

  filtered.forEach(item => {
    const tr = document.createElement('tr');

    let badgeClass = 'badge-success';
    if (item.stok === 0) badgeClass = 'badge-danger';
    else if (item.stok <= 5) badgeClass = 'badge-warning';

    tr.innerHTML = `
      <td><code>${item.kode}</code></td>
      <td><strong>${item.nama}</strong></td>
      <td>Rp ${formatRupiah(item.harga)}</td>
      <td><span class="badge ${badgeClass}">${item.stok} unit</span></td>
      <td class="aksi-col">
        <button class="btn btn-outline btn-sm"
                onclick="tambahKeKeranjangByKode('${item.kode}')"
                ${item.stok === 0 ? 'disabled' : ''}>
          + Pilih
        </button>
        <button class="btn btn-edit btn-sm"
                onclick="bukaModalEditBarang('${item.kode}')">
          Edit
        </button>
        <button class="btn btn-danger btn-sm"
                onclick="bukaModalHapusBarang('${item.kode}')">
          Hapus
        </button>
      </td>
    `;
    inventoryList.appendChild(tr);
  });
}

// ============================================================
// MODAL TAMBAH / EDIT BARANG
// ============================================================

function bukaModalTambahBarang() {
  // Reset semua field
  document.getElementById('editKodeAsli').value = '';
  document.getElementById('modalKode').value = '';
  document.getElementById('modalNama').value = '';
  document.getElementById('modalHarga').value = '';
  document.getElementById('modalStok').value = '';
  document.getElementById('modalJudul').innerText = 'Tambah Barang Baru';
  document.getElementById('modalBtnSimpan').innerText = 'Simpan Barang';
  document.getElementById('modalKode').disabled = false;

  document.getElementById('modalOverlay').classList.remove('hidden');
}

function bukaModalEditBarang(kode) {
  const inventory = getInventory();
  const barang = inventory.find(i => i.kode === kode);
  if (!barang) return;

  document.getElementById('editKodeAsli').value = barang.kode;
  document.getElementById('modalKode').value = barang.kode;
  document.getElementById('modalNama').value = barang.nama;
  document.getElementById('modalHarga').value = barang.harga;
  document.getElementById('modalStok').value = barang.stok;
  document.getElementById('modalJudul').innerText = 'Edit Barang';
  document.getElementById('modalBtnSimpan').innerText = 'Simpan Perubahan';
  document.getElementById('modalKode').disabled = true; // kode tidak bisa diubah saat edit

  document.getElementById('modalOverlay').classList.remove('hidden');
}

function simpanBarangModal() {
  const kodeAsli = document.getElementById('editKodeAsli').value;
  const kodeInput = document.getElementById('modalKode').value.trim();
  const nama = document.getElementById('modalNama').value.trim();
  const harga = parseInt(document.getElementById('modalHarga').value);
  const stok = parseInt(document.getElementById('modalStok').value);

  // Validasi
  if (!nama) {
    alert('Nama barang tidak boleh kosong!');
    document.getElementById('modalNama').focus();
    return;
  }
  if (!harga || harga <= 0) {
    alert('Harga harus lebih dari 0!');
    document.getElementById('modalHarga').focus();
    return;
  }
  if (isNaN(stok) || stok < 0) {
    alert('Stok tidak boleh kosong atau negatif!');
    document.getElementById('modalStok').focus();
    return;
  }

  const inventory = getInventory();
  const isEdit = kodeAsli !== '';

  if (isEdit) {
    // Mode Edit: update data barang yang ada
    const index = inventory.findIndex(i => i.kode === kodeAsli);
    if (index === -1) {
      alert('Barang tidak ditemukan!');
      return;
    }
    inventory[index].nama = nama;
    inventory[index].harga = harga;
    inventory[index].stok = stok;

  } else {
    // Mode Tambah: cek duplikasi kode
    const kodeAkhir = kodeInput || ('AUTO-' + Date.now().toString().slice(-6));

    const sudahAda = inventory.find(i => i.kode === kodeAkhir);
    if (sudahAda) {
      alert(`Kode barcode "${kodeAkhir}" sudah digunakan oleh barang lain!`);
      document.getElementById('modalKode').focus();
      return;
    }

    inventory.push({ kode: kodeAkhir, nama, harga, stok });
  }

  saveInventory(inventory);
  tutupModalLangsung();
  renderInventory();

  const pesan = isEdit ? 'Barang berhasil diperbarui!' : 'Barang baru berhasil ditambahkan!';
  tampilToast(pesan, 'success');
}

function tutupModal(event) {
  // Tutup hanya jika klik di overlay (luar modal-box)
  if (event.target === document.getElementById('modalOverlay')) {
    tutupModalLangsung();
  }
}

function tutupModalLangsung() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

// ============================================================
// MODAL HAPUS BARANG
// ============================================================

function bukaModalHapusBarang(kode) {
  const inventory = getInventory();
  const barang = inventory.find(i => i.kode === kode);
  if (!barang) return;

  kodeBarangAkanDihapus = kode;

  document.getElementById('hapusPreview').innerHTML = `
    <strong>${barang.nama}</strong><br>
    <span style="color:var(--text-muted); font-size:0.85rem;">Kode: ${barang.kode} | Stok: ${barang.stok} unit</span>
  `;

  document.getElementById('modalHapusOverlay').classList.remove('hidden');
}

function konfirmasiHapusBarang() {
  if (!kodeBarangAkanDihapus) return;

  const inventory = getInventory();
  const index = inventory.findIndex(i => i.kode === kodeBarangAkanDihapus);

  if (index !== -1) {
    const namaBarang = inventory[index].nama;
    inventory.splice(index, 1);
    saveInventory(inventory);
    renderInventory();
    tampilToast(`"${namaBarang}" berhasil dihapus.`, 'danger');
  }

  kodeBarangAkanDihapus = null;
  tutupModalHapusLangsung();
}

function tutupModalHapus(event) {
  if (event.target === document.getElementById('modalHapusOverlay')) {
    tutupModalHapusLangsung();
  }
}

function tutupModalHapusLangsung() {
  document.getElementById('modalHapusOverlay').classList.add('hidden');
  kodeBarangAkanDihapus = null;
}

// ============================================================
// TOAST NOTIFIKASI
// ============================================================

function tampilToast(pesan, tipe = 'success') {
  // Hapus toast lama jika ada
  const toastLama = document.getElementById('toastNotif');
  if (toastLama) toastLama.remove();

  const toast = document.createElement('div');
  toast.id = 'toastNotif';
  toast.className = `toast toast-${tipe}`;
  toast.innerText = pesan;
  document.body.appendChild(toast);

  // Animasi masuk
  setTimeout(() => toast.classList.add('show'), 10);
  // Hapus setelah 3 detik
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================
// KERANJANG
// ============================================================

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

function tambahKeKeranjang(kode, nama, harga, qtyUntukDitambah) {
  const inventory = getInventory();
  const barangInventaris = inventory.find(i => i.kode === kode);

  const itemCartExisting = cart.find(i => i.kode === kode);
  const qtyDiKeranjangSaatIni = itemCartExisting ? itemCartExisting.jumlah : 0;
  const totalStokDibutuhkan = qtyDiKeranjangSaatIni + qtyUntukDitambah;

  if (barangInventaris) {
    if (totalStokDibutuhkan > barangInventaris.stok) {
      alert(`Stok tidak mencukupi!\nStok "${nama}" tersisa: ${barangInventaris.stok} unit.\nSudah di keranjang: ${qtyDiKeranjangSaatIni} unit.`);
      return false;
    }
  }

  if (itemCartExisting) {
    itemCartExisting.jumlah += qtyUntukDitambah;
    itemCartExisting.subtotal = itemCartExisting.jumlah * itemCartExisting.harga;
  } else {
    cart.push({ kode, nama, harga, jumlah: qtyUntukDitambah, subtotal: harga * qtyUntukDitambah });
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
  const barangInventaris = inventory.find(i => i.kode === item.kode);

  if (barangInventaris && targetQty > barangInventaris.stok) {
    alert(`Stok tidak mencukupi! Stok maksimal "${item.nama}" adalah ${barangInventaris.stok} unit.`);
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

  if (cart.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px;">
          Keranjang masih kosong.
        </td>
      </tr>`;
  }

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

// ============================================================
// KALKULASI
// ============================================================

function hitungKalkulasiTotal() {
  let diskonPercent = parseFloat(document.getElementById('diskonInput').value) || 0;
  let ppnPercent = parseFloat(document.getElementById('ppnInput').value) || 0;

  diskonPercent = Math.min(100, Math.max(0, diskonPercent));
  ppnPercent = Math.min(100, Math.max(0, ppnPercent));

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
  const uangBayar = parseInt(document.getElementById('uangBayar').value) || 0;
  const changeBox = document.getElementById('changeBox');
  const kembalianDisplay = document.getElementById('kembalianDisplay');

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
    kembalianDisplay.innerText = 'Kurang Rp ' + formatRupiah(Math.abs(kembalian));
    changeBox.className = 'change-box is-invalid';
  }
}

// ============================================================
// TRANSAKSI
// ============================================================

function simpanTransaksi() {
  const uangBayar = parseInt(document.getElementById('uangBayar').value) || 0;

  if (cart.length === 0) {
    alert('Keranjang belanja masih kosong! Tambahkan barang terlebih dahulu.');
    return;
  }

  if (uangBayar < grandTotal) {
    alert(`Transaksi Gagal!\nUang pembayaran kurang Rp ${formatRupiah(grandTotal - uangBayar)}.\nTotal: Rp ${formatRupiah(grandTotal)}\nDibayar: Rp ${formatRupiah(uangBayar)}`);
    return;
  }

  // Kurangi stok
  const inventory = getInventory();
  cart.forEach(cartItem => {
    const invItem = inventory.find(i => i.kode === cartItem.kode);
    if (invItem) invItem.stok = Math.max(0, invItem.stok - cartItem.jumlah);
  });
  saveInventory(inventory);

  const diskonPercent = parseFloat(document.getElementById('diskonInput').value) || 0;
  const ppnPercent = parseFloat(document.getElementById('ppnInput').value) || 0;

  const dataTransaksi = JSON.parse(localStorage.getItem('transaksi') || '[]');
  dataTransaksi.push({
    id: 'TRX-' + Date.now(),
    tanggal: new Date().toLocaleString('id-ID'),
    items: [...cart],
    subtotal: subtotalBelanja,
    diskonPercent, nominalDiskon,
    ppnPercent, nominalPajak,
    total: grandTotal,
    uangBayar, kembalian
  });
  localStorage.setItem('transaksi', JSON.stringify(dataTransaksi));

  alert(`✅ Transaksi Berhasil!\nTotal: Rp ${formatRupiah(grandTotal)}\nKembalian: Rp ${formatRupiah(kembalian)}`);

  cart = [];
  document.getElementById('uangBayar').value = '';
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

  if (data.length === 0) {
    riwayatEl.innerHTML = `<li style="text-align:center; color:var(--text-muted); padding:15px;">Belum ada transaksi.</li>`;
  }

  data.slice().reverse().forEach(t => {
    grandAkumulatif += t.total;
    const li = document.createElement('li');
    const ringkasan = t.items ? t.items.map(i => `${i.nama} (${i.jumlah}x)`).join(', ') : '-';
    li.innerHTML = `
      <div><strong>${t.tanggal}</strong> - <span style="color:var(--primary-color);">Rp ${formatRupiah(t.total)}</span></div>
      <div style="color:var(--text-muted); font-size:0.8rem;">Item: ${ringkasan}</div>
      <div style="color:var(--text-muted); font-size:0.78rem;">Bayar: Rp ${formatRupiah(t.uangBayar)} | Kembali: Rp ${formatRupiah(t.kembalian)}</div>
    `;
    riwayatEl.appendChild(li);
  });

  statistikEl.innerText = formatRupiah(grandAkumulatif);
}

function eksporLaporanCSV() {
  const data = JSON.parse(localStorage.getItem('transaksi') || '[]');
  if (data.length === 0) {
    alert('Belum ada data riwayat transaksi yang tersimpan!');
    return;
  }

  let csvContent = 'ID Transaksi;Tanggal;Daftar Barang;Subtotal (Rp);Diskon (%);Nominal Diskon (Rp);Pajak PPN (%);Nominal Pajak (Rp);Total Akhir (Rp);Uang Bayar (Rp);Kembalian (Rp)\n';

  data.forEach(t => {
    const listBarang = t.items ? t.items.map(i => `${i.nama} x${i.jumlah}`).join(' | ') : '-';
    const row = [
      t.id || '-',
      `"${t.tanggal}"`,
      `"${listBarang.replace(/"/g, '""')}"`,
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
  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', `Laporan_Penjualan_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================
// KEYBOARD SHORTCUT
// ============================================================

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    tutupModalLangsung();
    tutupModalHapusLangsung();
  }
});
