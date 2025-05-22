import PDFKit from 'pdfkit';
import moment from 'moment';

/**
 * Convenience function to generate a PDF report and return a buffer
 * @param title Report title
 * @param report Report data
 * @param reportType Report type ('daily', 'weekly', 'monthly', 'all')
 * @returns Promise<Buffer> Buffer containing the PDF
 */
export const generatePdfReport = async (
  title: string,
  report: any,
  reportType: string
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFKit({
        margin: 40,
        bufferPages: true,
        size: 'A4',
        info: {
          Title: title,
          Author: 'HelpVerse',
          CreationDate: new Date()
        }
      });

      // Collect PDF chunks in memory
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });

      // Generate the PDF content
      generatePdfContent(doc, report, title, reportType);

      // Finalize the document
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF report content
 * @param doc PDFKit document instance
 * @param report Report data
 * @param title Report title
 * @param type Report type ('daily', 'weekly', 'monthly', 'all')
 */
export const generatePdfContent = (
  doc: PDFKit.PDFDocument, 
  report: any, 
  title: string, 
  type: string
): void => {
  // Konfigurasi dasar
  const margin = 40;
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const contentWidth = pageWidth - (margin * 2);
  
  // Ukuran font untuk berbagai bagian
  const FONT_SIZE = {
    TITLE: 14,
    SUBTITLE: 12,
    NORMAL: 10,
    SMALL: 8,
    TABLE: 8
  };
  
  // Fungsi untuk membuat halaman baru untuk setiap bagian utama
  const addSectionPage = (sectionTitle: string): void => {
    doc.addPage();
    doc.y = margin;
    
    doc.fontSize(FONT_SIZE.SUBTITLE)
       .font('Helvetica-Bold')
       .text(sectionTitle, { underline: true });
    doc.moveDown(0.5);
  };
  
  // Fungsi pembantu
  const formatCurrency = (amount: number): string => {
    return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const formatDate = (date: string | Date): string => {
    return moment(date).format('DD MMM YYYY');
  };
  
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };
  
  // Fungsi untuk memeriksa ruang yang tersisa
  const getRemainingSpace = (): number => {
    const currentY = doc.y;
    return pageHeight - currentY - margin;
  };
  
  // Fungsi untuk menambah halaman baru
  const addNewPage = (withTitle: boolean = false): void => {
    doc.addPage();
    doc.y = margin;
    
    if (withTitle) {
      doc.fontSize(FONT_SIZE.TITLE)
         .font('Helvetica-Bold')
         .text(title, { align: 'center' });
      doc.moveDown(0.5);
    }
  };
  
  // Fungsi untuk menambahkan bagian dengan judul
  const addSection = (sectionTitle: string, minSpace: number = 150): void => {
    if (getRemainingSpace() < minSpace) {
      addNewPage(false);
    }
    
    doc.moveDown(0.5);
    doc.fontSize(FONT_SIZE.SUBTITLE)
       .font('Helvetica-Bold')
       .text(sectionTitle, { underline: true });
    doc.moveDown(0.5);
  };
  
  // Fungsi untuk menambahkan info multikolom
  const addInfoColumns = (data: Array<{label: string, value: string | number}>, columns: number = 2): void => {
    const colWidth = contentWidth / columns;
    
    // Bagi data ke dalam baris
    for (let i = 0; i < data.length; i += columns) {
      const rowData = data.slice(i, i + columns);
      const startY = doc.y;
      
      rowData.forEach((item, index) => {
        doc.fontSize(FONT_SIZE.NORMAL)
           .font('Helvetica')
           .text(`${item.label}: ${item.value}`, 
                margin + (index * colWidth), 
                startY,
                { width: colWidth - 10 });
      });
      
      // Geser posisi Y untuk baris berikutnya
      doc.y = startY + 20;
    }
  };
  
  // Fungsi untuk menambahkan keterangan
  const addCaption = (text: string): void => {
    doc.fontSize(FONT_SIZE.SMALL)
       .fillColor('#666666')  // Gunakan warna abu-abu untuk membedakan
       .font('Helvetica')
       .text(text, { align: 'center' });
    doc.fillColor('#000000');  // Reset warna
    doc.moveDown(0.5);
  };
  
  // Fungsi untuk menambahkan catatan kaki (Notes)
  const addNotes = (): void => {
    // Periksa ruang yang tersisa
    if (getRemainingSpace() < 100) {
      addNewPage(false);
    }
    
    doc.moveDown(1);
    doc.fontSize(FONT_SIZE.SUBTITLE)
       .font('Helvetica-Bold')
       .text('Notes', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(FONT_SIZE.NORMAL)
       .font('Helvetica')
       .text('1. All financial values are displayed in Malaysian Ringgit (RM).');
       
    doc.fontSize(FONT_SIZE.NORMAL)
       .text('2. Occupancy rate is calculated as the percentage of available seats that were sold.');
    
    if (type === 'all') {
      doc.fontSize(FONT_SIZE.NORMAL)
         .text('3. Event performance metrics include only confirmed orders.');
    }
  };
  
  // Mulai membuat dokumen
  // Header dan Judul Utama
  doc.fontSize(FONT_SIZE.TITLE)
     .font('Helvetica-Bold')
     .text(title, { align: 'center' });
  doc.moveDown(0.5);
  
  // Bagian Ringkasan
  addSection('Summary');
  
  // Data ringkasan dalam format multi-kolom
  let summaryData = [
    { label: 'Total Tickets Sold', value: report.ticketsSold },
    { label: 'Revenue', value: formatCurrency(report.revenue) },
    { label: 'Seat Occupancy', value: formatPercentage(report.occupancyPercentage) }
  ];
  
  if (type === 'daily') {
    summaryData.push({ label: 'Date', value: formatDate(report.date) });
  } else if (type === 'weekly') {
    summaryData.push(
      { label: 'Start Date', value: formatDate(report.startDate) }, 
      { label: 'End Date', value: formatDate(report.endDate) }
    );
  } else if (type === 'monthly') {
    summaryData.push(
      { label: 'Month', value: moment().month(report.month - 1).format('MMMM') },
      { label: 'Year', value: report.year }
    );
  } else if (type === 'all') {
    summaryData.push(
      { label: 'Total Orders', value: report.totalOrders },
      { label: 'Confirmed Orders', value: report.confirmedOrders }
    );
  }
  
  addInfoColumns(summaryData);
  
  // Tambahkan keterangan jika perlu
  if (type === 'all') {
    addCaption("* This report includes data from all completed events regardless of date.");
  }
  
  // Penjualan Tiket Berdasarkan Waktu
  if (type === 'daily') {
    addSection('Hourly Sales Analysis', 250);
    
    doc.fontSize(FONT_SIZE.NORMAL)
       .text('The table below shows ticket sales and revenue by hour for the selected date.');
    doc.moveDown(0.5);
    
    // Tampilkan data penjualan per jam
    const salesTable = {
      headers: ['Hour', 'Tickets Sold', 'Revenue (RM)'],
      rows: report.salesData.map((item: any, index: number) => [
        `${item.hour}:00 - ${item.hour}:59`,
        report.salesData[index].count.toString(),
        formatCurrency(report.revenueData[index].amount)
      ])
    };
    
    drawTable(doc, salesTable);
    
  } else if (type === 'weekly') {
    addSection('Daily Sales Analysis', 250);
    
    doc.fontSize(FONT_SIZE.NORMAL)
       .text('The table below shows ticket sales and revenue by day for the selected week.');
    doc.moveDown(0.5);
    
    const salesTable = {
      headers: ['Day', 'Tickets Sold', 'Revenue (RM)'],
      rows: report.salesData.map((item: any, index: number) => [
        item.day,
        item.count.toString(),
        formatCurrency(report.revenueData[index].amount)
      ])
    };
    
    drawTable(doc, salesTable);
    
  } else if (type === 'monthly') {
    addSection('Daily Sales Analysis', 250);
    
    doc.fontSize(FONT_SIZE.NORMAL)
       .text('The table below shows ticket sales and revenue by day for the selected month.');
    doc.moveDown(0.5);
    
    // Sortir data berdasarkan tanggal untuk memastikan urutan yang tepat
    const sortedSalesData = [...report.salesData].sort((a, b) => a.day - b.day);
    
    const salesTable = {
      headers: ['Day', 'Tickets Sold', 'Revenue (RM)'],
      rows: sortedSalesData.map((item: any) => [
        item.day.toString(),
        item.count.toString(),
        formatCurrency(report.revenueData.find((r: any) => r.day === item.day).amount)
      ])
    };
    
    drawTable(doc, salesTable);
    
  } else if (type === 'all') {
    // Transaksi terbaru
    if (report.ordersData && report.ordersData.length > 0) {
      addSection('Recent Transactions', 250);
      
      doc.fontSize(FONT_SIZE.NORMAL)
         .text('Below are the 10 most recent transactions across all events:');
      doc.moveDown(0.5);
      
      // Urutkan berdasarkan tanggal terbaru
      const recentOrders = [...report.ordersData]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
      
      const salesTable = {
        headers: ['Date', 'Event', 'Status', 'Tickets', 'Amount (RM)'],
        rows: recentOrders.map((order: any) => [
          formatDate(order.date),
          order.eventName.substring(0, 20) + (order.eventName.length > 20 ? '...' : ''),
          order.status,
          order.ticketCount.toString(),
          formatCurrency(order.totalAmount)
        ])
      };
      
      drawTable(doc, salesTable);
    }
    
    // Analisis penjualan berdasarkan bulan
    if (report.ordersByDate && Object.keys(report.ordersByDate).length > 0) {
      // Selalu buat halaman baru untuk bagian ini
      addSectionPage('Monthly Sales Trends');
      
      // Kelompokkan data berdasarkan bulan
      const monthlySales: Record<string, {orders: number, tickets: number, revenue: number}> = {};
      
      Object.entries(report.ordersByDate).forEach(([dateStr, orders]) => {
        const monthYear = moment(dateStr).format('MMM YYYY');
        
        if (!monthlySales[monthYear]) {
          monthlySales[monthYear] = { orders: 0, tickets: 0, revenue: 0 };
        }
        
        (orders as any[]).forEach(order => {
          monthlySales[monthYear].orders++;
          monthlySales[monthYear].tickets += order.ticketCount || 0;
          monthlySales[monthYear].revenue += order.totalAmount || 0;
        });
      });
      
      // Konversi ke format tabel
      const monthKeys = Object.keys(monthlySales).sort((a, b) => {
        return moment(a, 'MMM YYYY').diff(moment(b, 'MMM YYYY'));
      });
      
      // Jika terlalu banyak bulan, ambil hanya 12 bulan terakhir
      const recentMonths = monthKeys.slice(-12);
      
      const monthlyTable = {
        headers: ['Month', 'Orders', 'Tickets Sold', 'Revenue (RM)'],
        rows: recentMonths.map(month => [
          month,
          monthlySales[month].orders.toString(),
          monthlySales[month].tickets.toString(),
          formatCurrency(monthlySales[month].revenue)
        ])
      };
      
      drawTable(doc, monthlyTable);
      
      // Tambahkan keterangan
      if (monthKeys.length > 12) {
        addCaption(`* Showing the 12 most recent months out of ${monthKeys.length} total months.`);
      }
    }
    
    // Event Summary
    if (report.eventSummary && report.eventSummary.length > 0) {
      // Selalu buat halaman baru untuk bagian ini
      addSectionPage('Event Performance Summary');
      
      doc.fontSize(FONT_SIZE.NORMAL)
         .text('The table below shows performance metrics for your top events:');
      doc.moveDown(0.5);
      
      // Batasi hingga 10 event teratas (bukan 15) berdasarkan revenue
      const topEvents = [...report.eventSummary]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      
      const eventTable = {
        headers: ['Event Name', 'Total Orders', 'Confirmed', 'Tickets Sold', 'Revenue (RM)', 'Occupancy (%)'],
        rows: topEvents.map((event: any) => [
          event.name.substring(0, 25) + (event.name.length > 25 ? '...' : ''),
          event.totalOrders.toString(),
          event.confirmedOrders.toString(),
          event.ticketsSold.toString(),
          formatCurrency(event.revenue),
          formatPercentage(event.occupancyPercentage)
        ])
      };
      
      drawTable(doc, eventTable);
      
      // Tambahkan keterangan jika perlu
      if (report.eventSummary.length > 10) {
        addCaption(`* Showing top 10 events by revenue out of ${report.eventSummary.length} total events.`);
      }
    }
    
    // Order Status Distribution
    if (report.ordersData && report.ordersData.length > 0) {
      // Analisis distribusi status order
      const statusCounts: Record<string, number> = {};
      report.ordersData.forEach((order: any) => {
        const status = order.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      if (Object.keys(statusCounts).length > 0) {
        // Tambahkan di halaman yang sama jika cukup ruang
        if (getRemainingSpace() < 200) {
          addSectionPage('Order Status Distribution');
        } else {
          addSection('Order Status Distribution', 200);
        }
        
        doc.fontSize(FONT_SIZE.NORMAL)
           .text('The table below shows the distribution of orders by status:');
        doc.moveDown(0.5);
        
        const statusTable = {
          headers: ['Status', 'Count', 'Percentage (%)'],
          rows: Object.entries(statusCounts).map(([status, count]) => [
            status.charAt(0).toUpperCase() + status.slice(1), // Capitalize first letter
            count.toString(),
            formatPercentage((count / report.ordersData.length) * 100)
          ])
        };
        
        drawTable(doc, statusTable);
      }
    }
  }
  
  // Tambahkan catatan kaki
  addNotes();
};

/**
 * Helper function to draw tables in PDF
 * @param doc PDFKit document instance
 * @param table Table data with headers and rows
 * @returns The Y position after drawing the table
 */
export const drawTable = (
  doc: PDFKit.PDFDocument, 
  table: { headers: string[], rows: string[][] }
): number => {
  const { headers, rows } = table;
  
  // Konfigurasi tabel
  const margin = 40;
  const columnCount = headers.length;
  const docWidth = doc.page.width - (margin * 2);
  const rowHeight = 20; // Tingkatkan ukuran baris
  const headerHeight = 25; // Tingkatkan ukuran header
  const bottomMargin = 70; // Margin bawah yang lebih besar
  const fontSize = 9; // Font sedikit lebih besar
  
  // Pastikan ada cukup ruang di halaman ini
  const tableHeight = headerHeight + (rows.length * rowHeight) + 30; // +30 untuk padding  
  if (doc.y + tableHeight > doc.page.height - bottomMargin) {
    doc.addPage();
    doc.y = margin;
  }
  
  // Posisi awal tabel
  const tableTop = doc.y;
  
  // Tentukan lebar kolom berdasarkan tipe data
  const columnWidths: number[] = [];
  
  // Alokasi lebar kolom berdasarkan jenis data
  headers.forEach((header, index) => {
    let width = docWidth / columnCount; // Lebar default
    
    // Kolom untuk tanggal
    if (header.toLowerCase().includes('date')) {
      width = docWidth * 0.18;
    } 
    // Kolom untuk angka, mata uang, persentase
    else if (
      header.toLowerCase().includes('amount') || 
      header.toLowerCase().includes('revenue') || 
      header.toLowerCase().includes('percentage') || 
      header.toLowerCase().includes('count') || 
      header.toLowerCase().includes('tickets') ||
      header.toLowerCase().includes('occupancy') ||
      header.toLowerCase().includes('rate')
    ) {
      width = docWidth * 0.15;
    }
    // Kolom untuk nama acara atau teks panjang
    else if (
      header.toLowerCase().includes('name') || 
      header.toLowerCase().includes('event')
    ) {
      width = docWidth * 0.30;
    }
    
    columnWidths[index] = width;
  });
  
  // Normalisasi lebar agar total sama dengan lebar dokumen
  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const ratio = docWidth / totalWidth;
  
  for (let i = 0; i < columnWidths.length; i++) {
    columnWidths[i] *= ratio;
  }
  
  // Function untuk mendapatkan posisi X kolom
  const getColumnX = (columnIndex: number): number => {
    let x = margin;
    for (let i = 0; i < columnIndex; i++) {
      x += columnWidths[i];
    }
    return x;
  };
  
  // Fungsi untuk mendapatkan alignment
  const getColumnAlignment = (columnIndex: number): string => {
    const header = headers[columnIndex].toLowerCase();
    
    // Angka, mata uang, persentase - rata kanan
    if (
      header.includes('amount') || 
      header.includes('revenue') || 
      header.includes('percentage') || 
      header.includes('count') || 
      header.includes('tickets') ||
      header.includes('occupancy') ||
      header.includes('rate')
    ) {
      return 'right';
    }
    
    // Kolom pertama - rata kiri
    if (columnIndex === 0) {
      return 'left';
    }
    
    // Lainnya - tengah
    return 'center';
  };
  
  // Gambar header tabel
  const drawTableHeader = (y: number) => {
    // Background header
    doc.fillColor('#f0f0f0')
       .rect(margin, y, docWidth, headerHeight)
       .fill();
    
    doc.fillColor('#000000');
    
    headers.forEach((header, i) => {
      const x = getColumnX(i);
      
      doc.font('Helvetica-Bold')
         .fontSize(fontSize)
         .text(
           header,
           x + 5, // Lebih banyak padding
           y + 8, // Lebih banyak padding
           {
             width: columnWidths[i] - 10,
             align: getColumnAlignment(i) as any,
             baseline: 'top'
           }
         );
    });
    
    // Border bawah header
    doc.moveTo(margin, y + headerHeight)
       .lineTo(margin + docWidth, y + headerHeight)
       .lineWidth(1) // Border lebih tebal
       .stroke();
  };
  
  // Fungsi untuk menggambar baris data
  const drawRow = (rowData: string[], rowIndex: number, y: number) => {
    // Background alternatif untuk baris
    if (rowIndex % 2 === 1) {
      doc.fillColor('#f9f9f9')
         .rect(margin, y, docWidth, rowHeight)
         .fill();
    }
    
    doc.fillColor('#000000');
    
    rowData.forEach((cellData, i) => {
      const x = getColumnX(i);
      
      doc.font('Helvetica')
         .fontSize(fontSize)
         .text(
           cellData,
           x + 5, // Lebih banyak padding
           y + 5, // Lebih banyak padding
           {
             width: columnWidths[i] - 10,
             align: getColumnAlignment(i) as any,
             lineBreak: false,
             ellipsis: true,
             baseline: 'top'
           }
         );
    });
    
    // Border bawah baris
    doc.strokeColor('#dddddd')
       .moveTo(margin, y + rowHeight)
       .lineTo(margin + docWidth, y + rowHeight)
       .lineWidth(0.5)
       .stroke();
    
    doc.strokeColor('#000000'); // Reset warna
  };
  
  // Gambar header
  drawTableHeader(tableTop);
  
  // Posisi Y awal untuk baris data
  let y = tableTop + headerHeight;
  
  // Variabel untuk melacak halaman terakhir
  let currentPage = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
  
  // Gambar baris-baris data
  rows.forEach((row, rowIndex) => {
    // Cek jika perlu halaman baru
    if (y + rowHeight > doc.page.height - bottomMargin) {
      doc.addPage();
      currentPage++;
      
      // Reset posisi dan gambar header baru
      y = margin;
      
      // Gambar header di halaman baru
      drawTableHeader(y);
      
      // Update posisi
      y += headerHeight;
    }
    
    // Gambar baris
    drawRow(row, rowIndex, y);
    
    // Pindah ke posisi Y berikutnya
    y += rowHeight;
  });
  
  // Gambar border bawah tabel
  doc.moveTo(margin, y)
     .lineTo(margin + docWidth, y)
     .lineWidth(1)
     .stroke();
  
  // Gambar border kiri dan kanan
  doc.moveTo(margin, tableTop)
     .lineTo(margin, y)
     .lineWidth(1)
     .stroke();
  
  doc.moveTo(margin + docWidth, tableTop)
     .lineTo(margin + docWidth, y)
     .lineWidth(1)
     .stroke();
  
  // Gambar garis vertikal antar kolom
  for (let i = 1; i < columnWidths.length; i++) {
    const x = getColumnX(i);
    doc.moveTo(x, tableTop)
       .lineTo(x, y)
       .lineWidth(0.5)
       .stroke();
  }
  
  // Update posisi Y dokumen dengan padding
  doc.y = y + 30; // Lebih banyak ruang setelah tabel
  
  // Pastikan kembali ke halaman terakhir
  doc.switchToPage(currentPage);
  
  return y;
}; 