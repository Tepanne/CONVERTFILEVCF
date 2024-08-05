// Daftar whitelist pengguna
const whitelist = {
  'topa12dewa': 'User1',
  'JONI HARMONI': 'User2',
  'dendengsapi': 'User3',
  'lanciao': 'User4',
  'tuyuljelek': 'User5'
};

function isWhitelisted(keyword) {
  return whitelist.hasOwnProperty(keyword);
}

document.getElementById('whitelistButton').addEventListener('click', function() {
  const keyword = document.getElementById('whitelistInput').value.trim();
  if (isWhitelisted(keyword)) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
  } else {
    alert('Kata kunci tidak valid!');
  }
});

// Fungsi untuk membaca dan menampilkan isi file teks ke textarea
document.getElementById('txtFileInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const content = e.target.result;
      document.getElementById('fileContent').value = content;
    };
    reader.readAsText(file);
  }
});

// Fungsi untuk menghitung kontak dalam textarea
function countContacts(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  return lines.length;
}

// Fungsi untuk menghitung kontak di menu konversi
document.getElementById('convertCountButton').addEventListener('click', function() {
  const text = document.getElementById('fileContent').value.trim();

  if (!text) {
    alert('Isi textarea tidak boleh kosong!');
    return;
  }

  const contactCount = countContacts(text);
  document.getElementById('convertContactCount').value = `Jumlah kontak: ${contactCount}`;
});

// Fungsi untuk memastikan nomor telepon dimulai dengan +
function formatPhoneNumber(number) {
  return number.startsWith('+') ? number : `+${number}`;
}

// Fungsi untuk mengkonversi file teks ke VCF
document.getElementById('convertButton').addEventListener('click', function() {
  const text = document.getElementById('fileContent').value.trim();
  const fileName = document.getElementById('convertFileNameInput').value.trim() || 'output';
  const contactName = document.getElementById('contactNameInput').value.trim() || 'Contact';

  if (!text) {
    alert('Isi textarea tidak boleh kosong!');
    return;
  }

  const contacts = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  let vcfContent = '';
  contacts.forEach((contact, index) => {
    const formattedContact = formatPhoneNumber(contact);
    vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${contactName}${index + 1}\nTEL:${formattedContact}\nEND:VCARD\n`;
  });

  const blob = new Blob([vcfContent], { type: 'text/vcard' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.vcf`;
  link.click();

  // Log activity
  logActivity('Mengkonversi file teks ke VCF');
});

// Fungsi untuk membaca dan menampilkan isi file VCF ke textarea
document.getElementById('vcfToTxtFileInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const content = e.target.result;
      const phoneNumbers = content.match(/TEL:(.+)/g)
        .map(line => line.replace('TEL:', '').trim())
        .map(number => formatPhoneNumber(number))
        .join('\n');
      document.getElementById('txtFileContent').value = phoneNumbers;
    };
    reader.readAsText(file);
  }
});

// Fungsi untuk memecah file VCF
document.getElementById('splitButton').addEventListener('click', function() {
  const file = document.getElementById('vcfFileInput').files[0];
  const contactsPerFile = parseInt(document.getElementById('contactsPerFile').value, 10);
  const fileName = document.getElementById('splitFileNameInput').value.trim() || 'split';

  if (!file || isNaN(contactsPerFile) || contactsPerFile <= 0) {
    alert('Masukkan file VCF dan jumlah kontak per file yang valid!');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result;
    const contacts = content.split('END:VCARD').map(contact => contact.trim() + '\nEND:VCARD').filter(contact => contact.length > 10);

    if (contacts.length === 0) {
      alert('File VCF tidak berisi kontak yang valid!');
      return;
    }

    // Extract original contact names
    const originalNames = contacts.map(contact => {
      const match = contact.match(/FN:(.+)/);
      return match ? match[1] : 'Contact';
    });

    let fileIndex = 1;
    let contactIndex = 1;
    const filesSplit = Math.ceil(contacts.length / contactsPerFile);
    for (let i = 0; i < contacts.length; i += contactsPerFile) {
      const chunk = contacts.slice(i, i + contactsPerFile).map((contact, index) => {
        const name = originalNames[i + index] || 'Contact';
        const newName = `${name}${contactIndex++}`;

        // Memastikan nomor telepon dimulai dengan +
        const updatedContact = contact.replace(/TEL:(.+)/g, match => `TEL:${formatPhoneNumber(match.replace('TEL:', ''))}`);
        // Memperbarui nama kontak
        return updatedContact.replace(/FN:(.+)/, `FN:${newName}`);
      }).join('\n');

      const blob = new Blob([chunk], { type: 'text/vcard' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}_${fileIndex}.vcf`;
      link.click();
      fileIndex++;
    }

    // Log activity
    logActivity(`Memecah file VCF menjadi ${filesSplit} file`);
  };
  reader.readAsText(file);
});

// Fungsi untuk menggabungkan beberapa file teks
document.getElementById('mergeButton').addEventListener('click', function() {
  const files = document.getElementById('txtFilesInput').files;
  const fileName = document.getElementById('mergedFileNameInput').value.trim() || 'merged';

  if (files.length === 0) {
    alert('Masukkan file teks untuk digabungkan!');
    return;
  }

  const readers = [];
  const filesMerged = 1; // Asuming one file is created for merging
  for (let i = 0; i < files.length; i++) {
    const reader = new FileReader();
    readers.push(new Promise((resolve) => {
      reader.onload = function(e) {
        const phoneNumbers = e.target.result.split('\n').map(line => line.trim()).filter(line => line.length > 0).map(number => formatPhoneNumber(number)).join('\n');
        resolve(phoneNumbers);
      };
      reader.readAsText(files[i]);
    }));
  }

  Promise.all(readers).then((contents) => {
    const mergedContent = contents.join('\n');
    const blob = new Blob([mergedContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.txt`;
    link.click();

    // Log activity
    logActivity('Menggabungkan file teks');
  });
});

// Fungsi untuk membuat dan menyimpan laporan aktivitas
function logActivity(action) {
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  
  const keyword = document.getElementById('whitelistInput').value.trim();
  const user = whitelist[keyword] || 'Unknown User';

  const reportContent = {
    timestamp,
    user,
    action
  };

  let reports = JSON.parse(localStorage.getItem('activityReports')) || [];
  reports.push(reportContent);
  localStorage.setItem('activityReports', JSON.stringify(reports));
}

// Menampilkan laporan aktivitas terakhir
document.addEventListener('DOMContentLoaded', function() {
  const reports = JSON.parse(localStorage.getItem('activityReports')) || [];
  if (reports.length > 0) {
    const lastReport = reports[reports.length - 1];
    const reportContent = `
      Laporan Aktivitas Terakhir:
      --------------------
      Tanggal dan Jam: ${lastReport.timestamp}
      Nama Pengguna: ${lastReport.user}
      Aksi: ${lastReport.action}
    `.trim();
    document.getElementById('reportContent').value = reportContent;
  }
});