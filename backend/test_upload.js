const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

async function run() {
  try {
    // 1. Log in
    const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rosa@artesano.com',
        password: 'Artesano123!'
      })
    });
    
    if (!loginRes.ok) {
      const errText = await loginRes.text();
      console.error('Login failed:', errText);
      return;
    }
    
    const loginData = await loginRes.json();
    const token = loginData.access_token;
    console.log('Logged in successfully! Token received.');

    // 2. Fetch categories and regions to populate valid names
    const catRes = await fetch('http://localhost:3000/api/v1/categories', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const cats = await catRes.json();
    
    const regRes = await fetch('http://localhost:3000/api/v1/regions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const regs = await regRes.json();

    // 3. Replicate the frontend template generation logic (in getCleanFile equivalent)
    const cleanJson = [
      {
        'name': 'Mochila Wayuu artesanal',
        'slug': 'mochila-wayuu-artesanal',
        'price': '125000.50',
        'stock': '12',
        'cultural_origin': 'Pueblo Wayuu - La Guajira',
        'technique': 'Tejido en crochet',
        'significance': 'Los diseños representan cosmovisión ancestral',
        'short_description': 'Hermosa mochila tejida a mano',
        'materials': 'Hilo de algodón',
        'dimensions': '30x30 cm',
        'weight': '0.5 kg',
        'care_instructions': 'Lavar a mano',
        'category_name': cats.length > 0 ? cats[0].name : 'Tejeduría',
        'region_name': regs.length > 0 ? regs[0].name : 'Acevedo',
        'image_urls': 'https://ejemplo.com/foto1.jpg',
        'status': 'draft',
        'is_handmade': 'true',
        'meta_title': 'Mochila Wayuu | Art Huila',
        'meta_description': 'Auténtica mochila colombiana'
      }
    ];

    const cleanWb = XLSX.utils.book_new();
    const cleanWs = XLSX.utils.json_to_sheet(cleanJson, {
      header: [
        'name', 'slug', 'price', 'stock', 'cultural_origin', 'technique',
        'significance', 'short_description', 'materials', 'dimensions',
        'weight', 'care_instructions', 'category_name', 'region_name',
        'image_urls', 'status', 'is_handmade', 'meta_title', 'meta_description'
      ]
    });
    XLSX.utils.book_append_sheet(cleanWb, cleanWs, "Products");
    
    const outBuffer = XLSX.write(cleanWb, { type: 'buffer', bookType: 'xlsx' });
    
    // 4. Send POST request to /products/validate using FormData
    const formData = new FormData();
    const blob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    formData.append('file', blob, 'clean_upload.xlsx');
    
    console.log('Sending validation request...');
    const valRes = await fetch('http://localhost:3000/api/v1/products/validate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    console.log('Status code:', valRes.status);
    const bodyText = await valRes.text();
    console.log('Response body:', bodyText);
    
  } catch (err) {
    console.error('Exception during run:', err);
  }
}

run();
