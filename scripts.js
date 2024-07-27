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
      const formattedContact = contact.startsWith('+') ? contact : `+${contact}`;
      vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${contactName}${index + 1}\nTEL:${formattedContact}\nEND:VCARD\n`;
  });

  const blob = new Blob([vcfContent], { type: 'text/vcard' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.vcf`;
  link.click();
});

// Fungsi untuk membaca dan menampilkan isi file VCF ke textarea
document.getElementById('vcfToTxtFileInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
          const content = e.target.result;
          const phoneNumbers = content.match(/TEL:(.+)/g).map(line => line.replace('TEL:', '').trim()).map(number => number.startsWith('+') ? number : `+${number}`).join('\n');
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
  const contactName = document.getElementById('contactNameInput').value.trim() || 'Contact';

  if (!file || isNaN(contactsPerFile) || contactsPerFile <= 0) {
      alert('Masukkan file VCF dan jumlah kontak per file yang valid!');
      return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
      const content = e.target.result;
      const contacts = content.split('END:VCARD').map(contact => contact.trim() + '\nEND:VCARD').filter(contact => contact.length > 10);

      let fileIndex = 1;
      let contactIndex = 1;
      for (let i = 0; i < contacts.length; i += contactsPerFile) {
          const chunk = contacts.slice(i, i + contactsPerFile).map((contact, index) => {
              return contact.replace(/FN:(.+)/, `FN:${contactName}${contactIndex++}`);
          }).join('\n');
          const blob = new Blob([chunk], { type: 'text/vcard' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${fileName}_${fileIndex}.vcf`;
          link.click();
          fileIndex++;
      }
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
  for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      readers.push(new Promise((resolve) => {
          reader.onload = function(e) {
              const phoneNumbers = e.target.result.split('\n').map(line => line.trim()).filter(line => line.length > 0).map(number => number.startsWith('+') ? number : `+${number}`).join('\n');
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
  });
});
