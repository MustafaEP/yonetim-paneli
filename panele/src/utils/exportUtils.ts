// src/utils/exportUtils.ts

export interface ExportColumn {
  field: string;
  headerName: string;
  width?: number;
  valueGetter?: (value: any, row: any) => any;
}

/**
 * CSV export fonksiyonu (Excel uyumlu)
 */
export const exportToCSV = (
  data: any[],
  columns: ExportColumn[],
  filename: string = 'export',
) => {
  try {
    // Sadece görünür kolonları al
    const visibleColumns = columns.filter((col) => col.field !== 'actions');
    
    // CSV başlık satırı
    const headers = visibleColumns.map((col) => col.headerName);
    const csvHeaders = headers.join(',');
    
    // CSV veri satırları
    const csvRows = data.map((row) =>
      visibleColumns.map((col) => {
        let value = row[col.field];
        if (col.valueGetter) {
          value = col.valueGetter(value, row);
        }
        // CSV formatına uygun hale getir (virgül ve tırnak işareti kontrolü)
        if (value === null || value === undefined) {
          return '';
        }
        const stringValue = String(value);
        // Virgül veya tırnak içeriyorsa tırnak içine al
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );
    
    // BOM ekle (Excel'de Türkçe karakterlerin doğru görünmesi için)
    const BOM = '\uFEFF';
    const csvContent = BOM + csvHeaders + '\n' + csvRows.join('\n');
    
    // Blob oluştur ve indir
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('CSV export hatası:', error);
    throw new Error('CSV export sırasında bir hata oluştu');
  }
};

/**
 * Excel export fonksiyonu (xlsx kütüphanesi ile gerçek Excel formatı)
 */
export const exportToExcel = (
  data: any[],
  columns: ExportColumn[],
  filename: string = 'export',
) => {
  try {
    // xlsx kütüphanesini dinamik import et
    import('xlsx').then((XLSX) => {
      // Sadece görünür kolonları al
      const visibleColumns = columns.filter((col) => col.field !== 'actions');
      
      // Veriyi Excel formatına dönüştür
      const worksheetData = data.map((row) => {
        const rowData: Record<string, any> = {};
        visibleColumns.forEach((col) => {
          let value = row[col.field];
          if (col.valueGetter) {
            value = col.valueGetter(value, row);
          }
          rowData[col.headerName] = value !== null && value !== undefined ? value : '';
        });
        return rowData;
      });

      // Workbook oluştur
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Kolon genişliklerini ayarla
      const colWidths = visibleColumns.map((col) => ({
        wch: col.width || 15,
      }));
      worksheet['!cols'] = colWidths;

      // Worksheet'i workbook'a ekle
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapor');

      // Excel dosyasını indir
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    }).catch((error) => {
      console.error('xlsx import hatası:', error);
      // Fallback: CSV export kullan
      exportToCSV(data, columns, filename);
    });
  } catch (error) {
    console.error('Excel export hatası:', error);
    // Fallback: CSV export kullan
    exportToCSV(data, columns, filename);
  }
};

/**
 * PDF export fonksiyonu (basit HTML tablosu olarak)
 */
export const exportToPDF = (
  data: any[],
  columns: ExportColumn[],
  filename: string = 'export',
  title: string = 'Rapor',
) => {
  try {
    // Sadece görünür kolonları al
    const visibleColumns = columns.filter((col) => col.field !== 'actions');
    
    // HTML tablosu oluştur
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #1976d2; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th { background-color: #1976d2; color: white; padding: 10px; text-align: left; }
          td { border: 1px solid #ddd; padding: 8px; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .date { color: #666; font-size: 12px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="date">Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
        <table>
          <thead>
            <tr>
              ${visibleColumns.map((col) => `<th>${col.headerName}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map((row) => `
              <tr>
                ${visibleColumns.map((col) => {
                  let value = row[col.field];
                  if (col.valueGetter) {
                    value = col.valueGetter(value, row);
                  }
                  return `<td>${value !== null && value !== undefined ? String(value) : ''}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    // Blob oluştur ve indir
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Kullanıcıya PDF'e dönüştürmesi için bilgi ver
    alert('HTML dosyası indirildi. PDF\'e dönüştürmek için tarayıcınızın yazdırma özelliğini kullanabilirsiniz (Ctrl+P > PDF olarak kaydet).');
  } catch (error) {
    console.error('PDF export hatası:', error);
    throw new Error('PDF export sırasında bir hata oluştu');
  }
};
