let total=0;

function login(){
 if(user.value==='admin' && pass.value==='1234'){
   loginBox.classList.add('hidden');
   app.classList.remove('hidden');
 }else alert('Login gagal');
}

tanggal.innerText='Tanggal: '+new Date().toLocaleString();

function tambahBarang(){
 let n=nama.value,h=parseInt(harga.value),j=parseInt(jumlah.value);
 if(!n||!h||!j)return alert('Lengkapi data');
 let sub=h*j;
 total+=sub;
 totalEl();
 let r=list.insertRow();
 r.insertCell(0).innerText=n;
 r.insertCell(1).innerText=h;
 r.insertCell(2).innerText=j;
 r.insertCell(3).innerText=sub;
 let b=document.createElement('button');
 b.innerText='Hapus';
 b.onclick=()=>{total-=sub;totalEl();r.remove();}
 r.insertCell(4).appendChild(b);
 nama.value='';harga.value='';jumlah.value='';
}

function totalEl(){document.getElementById('total').innerText=total.toLocaleString();}

function simpanTransaksi(){
 let data=JSON.parse(localStorage.getItem('transaksi')||'[]');
 data.push({tanggal:new Date().toLocaleString(),total});
 localStorage.setItem('transaksi',JSON.stringify(data));
 tampilRiwayat();
}

function tampilRiwayat(){
 let data=JSON.parse(localStorage.getItem('transaksi')||'[]');
 riwayat.innerHTML='';
 let grand=0;
 data.forEach(d=>{
   grand+=d.total;
   let li=document.createElement('li');
   li.innerText=d.tanggal+' - Rp '+d.total.toLocaleString();
   riwayat.appendChild(li);
 });
 statistik.innerText=grand.toLocaleString();
}
tampilRiwayat();
