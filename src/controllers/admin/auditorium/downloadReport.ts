import { Request, Response, NextFunction } from 'express';
import { IUser } from '../../../types';
import moment from 'moment';
import PDFDocument from 'pdfkit';
import { getScheduleData } from './getSchedule';
import { getEventsHeldData } from './getEvents';
import { getUtilizationData } from './getUtilization';

// Interface untuk request dengan user
interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * @desc    Download auditorium report in PDF format
 * @route   GET /api/admin/auditorium/download-report
 * @access  Private (Admin)
 */
export const downloadAuditoriumReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Set no-cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Get report type from query parameter
    const validTypes = ['schedule', 'events-held', 'utilization', 'all'];
    const type = req.query.type && validTypes.includes(req.query.type as string) 
      ? req.query.type as string 
      : 'all';
    
    // Get date range
    const { from, to } = req.query;
    
    let startDate: Date;
    const endDate = to ? new Date(to as string) : new Date();
    
    // If no 'from' date specified, use very old date (all time)
    if (from) {
      startDate = new Date(from as string);
    } else {
      // Default to all time - get earliest possible date
      startDate = new Date(2000, 0, 1); // January 1, 2000 as a safe default
    }
    
    // Set hours to get full days
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    // Fetch data based on report type
    let scheduleData = null;
    let eventsHeldData = null;
    let utilizationData = null;
    let reportTitle = '';
    
    // Check if it's all time view (startDate is January 1, 2000)
    const isAllTime = startDate.getFullYear() === 2000 && startDate.getMonth() === 0 && startDate.getDate() === 1;
    
    const formattedStartDate = isAllTime ? 'All Time' : moment(startDate).format('DD MMM YYYY');
    const formattedEndDate = moment(endDate).format('DD MMM YYYY');
    
    const dateRangeText = isAllTime ? 'All Time' : `${formattedStartDate} - ${formattedEndDate}`;
    
    switch(type) {
      case 'schedule':
        scheduleData = await getScheduleData(startDate, endDate);
        reportTitle = `Auditorium Schedule Report (${dateRangeText})`;
        break;
      
      case 'events-held':
        eventsHeldData = await getEventsHeldData(startDate, endDate);
        reportTitle = `Events Held Report (${dateRangeText})`;
        break;
      
      case 'utilization':
        utilizationData = await getUtilizationData(startDate, endDate);
        reportTitle = `Auditorium Utilization Report (${dateRangeText})`;
        break;
      
      case 'all':
      default:
        scheduleData = await getScheduleData(startDate, endDate);
        eventsHeldData = await getEventsHeldData(startDate, endDate);
        utilizationData = await getUtilizationData(startDate, endDate);
        reportTitle = `Comprehensive Auditorium Report (${dateRangeText})`;
        break;
    }
    
    // Check if we have any data to show
    if (
      (type === 'schedule' && (!scheduleData || scheduleData.length === 0)) ||
      (type === 'events-held' && (!eventsHeldData || eventsHeldData.length === 0)) ||
      (type === 'utilization' && (!utilizationData || utilizationData.length === 0)) ||
      (type === 'all' && (!scheduleData || scheduleData.length === 0) && 
                         (!eventsHeldData || eventsHeldData.length === 0) && 
                         (!utilizationData || utilizationData.length === 0))
    ) {
      res.status(200).json({
        message: "Insufficient data for the selected period."
      });
      return;
    }
    
    // Create PDF document
    const doc = new PDFDocument({ 
      margin: 50, 
      bufferPages: true,
      size: 'A4',
      info: {
        Title: reportTitle,
        Author: 'HelpVerse Admin Dashboard',
        CreationDate: new Date()
      }
    });
    
    // Set the default font
    doc.font('Helvetica');
    
    // Handle client disconnection
    req.on('close', () => {
      try {
        doc.end();
      } catch (e) {
        console.error("Error ending PDF document on connection close:", e);
      }
    });
    
    // Set response headers
    const filename = `auditorium-report-${moment().format('YYYY-MM-DD')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    // Buffer to hold PDF data
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    doc.on('end', () => {
      if (!res.headersSent) {
        const result = Buffer.concat(chunks);
        res.send(result);
      }
    });
    
    // Generate PDF content
    generateAuditoriumReport(doc, {
      title: reportTitle,
      scheduleData,
      eventsHeldData,
      utilizationData,
      dateRange: {
        startDate,
        endDate
      },
      reportType: type
    });
    
    // Finalize document
    doc.end();
    
  } catch (err) {
    console.error("Error in downloadAuditoriumReport:", err);
    next(err);
  }
};

// Function to generate PDF report for auditorium
function generateAuditoriumReport(doc: typeof PDFDocument, data: any) {
  const { 
    title,
    scheduleData, 
    eventsHeldData, 
    utilizationData, 
    dateRange, 
    reportType 
  } = data;
  
  // Add header pada halaman pertama
  doc.fontSize(18).font('Helvetica-Bold').text('HelpVerse', { align: 'center' });
  doc.fontSize(14).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.moveDown(0.5);
  
  // Add date range information
  doc.fontSize(10).font('Helvetica').text(
    `Generated on: ${moment().format('DD MMM YYYY, HH:mm')}`, 
    { align: 'center' }
  );
  doc.moveDown(1);
  
  // Add summary section
  doc.fontSize(12).font('Helvetica-Bold').text('Summary', doc.page.margins.left, doc.y, { underline: true, align: 'left' });
  doc.moveDown(0.5);
  
  // Calculate summary statistics
  const totalEvents = eventsHeldData ? eventsHeldData.length : 0;
  const totalSchedules = scheduleData ? scheduleData.length : 0;
  
  // Check if any dates in the range are in the future
  const now = new Date();
  const hasUpcomingDates = dateRange.endDate > now;
  
  // Count upcoming events
  const upcomingEvents = eventsHeldData 
    ? eventsHeldData.filter((event: any) => event.isUpcoming).length
    : 0;
  
  // Count past events
  const pastEvents = totalEvents - upcomingEvents;
  
  // Average utilization
  let avgUtilization = 0;
  if (utilizationData && utilizationData.length > 0) {
    avgUtilization = utilizationData.reduce((sum: number, record: any) => {
      // Ensure we're using the utilization_percentage value
      let percentage = record.utilization_percentage;
      
      // If it's undefined but we have the raw values, calculate it
      if (percentage === undefined && record.total_hours_available) {
        percentage = (record.total_hours_used / record.total_hours_available) * 100;
      }
      
      return sum + (percentage || 0);
    }, 0) / utilizationData.length;
  }
  
  // Average event occupancy
  let avgOccupancy = 0;
  if (eventsHeldData && eventsHeldData.length > 0) {
    avgOccupancy = eventsHeldData.reduce((sum: number, event: any) => {
      return sum + (event.occupancy || 0);
    }, 0) / eventsHeldData.length;
  }
  
  // Display summary statistics
  doc.fontSize(10).font('Helvetica')
    .text(`Report Period: ${dateRange.startDate.getFullYear() === 2000 && dateRange.startDate.getMonth() === 0 && dateRange.startDate.getDate() === 1 
      ? 'All Time' 
      : `${moment(dateRange.startDate).format('DD MMM YYYY')} to ${moment(dateRange.endDate).format('DD MMM YYYY')}`}`)
    .text(`Total Events: ${totalEvents}${upcomingEvents > 0 ? ` (${pastEvents} past, ${upcomingEvents} upcoming)` : ''}`)
    .text(`Total Scheduled Bookings: ${totalSchedules}`)
    .text(`Average Auditorium Utilization: ${avgUtilization.toFixed(1)}%`)
    .text(`Average Event Occupancy: ${avgOccupancy.toFixed(1)}%`);
  
  // Add note for future dates if applicable
  if (hasUpcomingDates) {
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica').text('* Note: For future events, occupancy rates and utilization may include projections based on current booking data and historical patterns.');
  }
  
  doc.moveDown(2);
  
  // Bagian 1: Auditorium Schedule
  if (reportType === 'all' || reportType === 'schedule') {
    addScheduleSection(doc, scheduleData);
    doc.moveDown(3);
  }
  
  // Bagian 2: Past Events
  if (reportType === 'all' || reportType === 'events-held') {
    addEventsHeldSection(doc, eventsHeldData);
    doc.moveDown(3);
  }
  
  // Bagian 3: Auditorium Utilization
  if (reportType === 'all' || reportType === 'utilization') {
    addUtilizationSection(doc, utilizationData);
  }
  
  // Add page numbers
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).font('Helvetica')
      .text(
        `Page ${i + 1} of ${totalPages}`,
        doc.page.margins.left,
        doc.page.height - doc.page.margins.bottom - 10,
        { align: 'center' }
      );
  }
}

// Add schedule section to PDF
function addScheduleSection(doc: typeof PDFDocument, scheduleData: any[]) {
  if (!scheduleData || scheduleData.length === 0) return;
  
  // Judul halaman - pastikan pada posisi yang tepat
  const yPos = doc.y;
  
  // Periksa apakah cukup ruang untuk judul dan header tabel (minimal 100 points)
  if (doc.page.height - doc.page.margins.bottom - yPos < 100) {
    // Tidak cukup ruang, buat halaman baru
    doc.addPage();
  }
  
  // Judul halaman - gunakan posisi awal halaman dengan alignment kiri
  doc.fontSize(12).font('Helvetica-Bold').text('Auditorium Schedule', doc.page.margins.left, doc.y, { underline: true, align: 'left' });
  doc.moveDown(0.5);
  
  // Table header
  const tableTop = doc.y;
  const tableLeft = doc.page.margins.left;
  // Menghitung lebar halaman yang tersedia
  const pageWidth = doc.page.width - (doc.page.margins.left + doc.page.margins.right);
  // Menyesuaikan lebar kolom dengan proporsi yang tepat
  const colWidths = [
    Math.floor(pageWidth * 0.38), // Event (~38%)
    Math.floor(pageWidth * 0.18), // Date (~18%)
    Math.floor(pageWidth * 0.18), // Time (~18%)
    Math.floor(pageWidth * 0.26)  // Organizer (~26%)
  ];
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
  
  // Header tabel
  doc.rect(tableLeft, tableTop, tableWidth, 25).fillAndStroke('#f0f0f0', '#000000');
  
  doc.fillColor('#000000');
  doc.fontSize(10).font('Helvetica-Bold')
    .text('Event', tableLeft + 10, tableTop + 8)
    .text('Date', tableLeft + colWidths[0] + 10, tableTop + 8)
    .text('Time', tableLeft + colWidths[0] + colWidths[1] + 10, tableTop + 8)
    .text('Organizer', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10, tableTop + 8);
  
  // Table rows
  let currentY = tableTop + 25;
  doc.fontSize(9).font('Helvetica');
  
  scheduleData.forEach((schedule, index) => {
    // Format date and time
    const date = moment(schedule.startTime).format('DD MMM YYYY');
    const startTime = moment(schedule.startTime).format('HH:mm');
    const endTime = moment(schedule.endTime).format('HH:mm');
    const time = `${startTime} - ${endTime}`;
    
    // Get event name
    const eventName = schedule.event && typeof schedule.event === 'object' && 'name' in schedule.event
      ? schedule.event.name
      : 'N/A';
    
    // Get organizer name
    const organizer = schedule.booked_by && typeof schedule.booked_by === 'object'
      ? (schedule.booked_by.organizerName || schedule.booked_by.fullName || schedule.booked_by.username)
      : 'N/A';
    
    // Warna latar belakang alternatif untuk baris
    const rowHeight = 20;
    
    // Periksa apakah perlu halaman baru
    if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom - 30) {
      doc.addPage();
      
      // Tambahkan header pada halaman baru dengan posisi yang tepat di awal halaman
      doc.fontSize(12).font('Helvetica-Bold').text('Auditorium Schedule (continued)', doc.page.margins.left, doc.y, { underline: true, align: 'left' });
      doc.moveDown(0.5);
      
      // Ulangi header tabel
      currentY = doc.y;
      doc.rect(tableLeft, currentY, tableWidth, 25).fillAndStroke('#f0f0f0', '#000000');
      
      doc.fillColor('#000000');
      doc.fontSize(10).font('Helvetica-Bold')
        .text('Event', tableLeft + 10, currentY + 8)
        .text('Date', tableLeft + colWidths[0] + 10, currentY + 8)
        .text('Time', tableLeft + colWidths[0] + colWidths[1] + 10, currentY + 8)
        .text('Organizer', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10, currentY + 8);
      
      currentY += 25;
      doc.fontSize(9).font('Helvetica');
    }
    
    // Warna latar belakang alternatif untuk baris
    if (index % 2 === 0) {
      doc.rect(tableLeft, currentY, tableWidth, rowHeight).fill('#f9f9f9');
    }
    
    // Border untuk seluruh baris
    doc.rect(tableLeft, currentY, tableWidth, rowHeight).stroke('#dddddd');
    
    // Write row
    doc.fillColor('#000000')
       .text(eventName, tableLeft + 10, currentY + 5, { width: colWidths[0] - 20, ellipsis: true })
       .text(date, tableLeft + colWidths[0] + 10, currentY + 5, { width: colWidths[1] - 20 })
       .text(time, tableLeft + colWidths[0] + colWidths[1] + 10, currentY + 5, { width: colWidths[2] - 20 })
       .text(organizer, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10, currentY + 5, 
          { width: colWidths[3] - 20, ellipsis: true });
    
    currentY += rowHeight;
  });
  
  doc.moveDown(1);
}

// Add events held section to PDF
function addEventsHeldSection(doc: typeof PDFDocument, eventsData: any[]) {
  if (!eventsData || eventsData.length === 0) return;
  
  // Judul halaman - pastikan pada posisi yang tepat
  const yPos = doc.y;
  
  // Periksa apakah cukup ruang untuk judul dan header tabel (minimal 100 points)
  if (doc.page.height - doc.page.margins.bottom - yPos < 100) {
    // Tidak cukup ruang, buat halaman baru
    doc.addPage();
  }
  
  // Judul halaman - gunakan posisi awal halaman dengan alignment kiri
  doc.fontSize(12).font('Helvetica-Bold').text('Past Events', doc.page.margins.left, doc.y, { underline: true, align: 'left' });
  doc.moveDown(0.5);
  
  // Table header
  const tableTop = doc.y;
  const tableLeft = doc.page.margins.left;
  // Menghitung lebar halaman yang tersedia
  const pageWidth = doc.page.width - (doc.page.margins.left + doc.page.margins.right);
  // Menyesuaikan lebar kolom dengan proporsi yang tepat
  const colWidths = [
    Math.floor(pageWidth * 0.35), // Event (~35%)
    Math.floor(pageWidth * 0.16), // Date (~16%)
    Math.floor(pageWidth * 0.25), // Organizer (~25%)
    Math.floor(pageWidth * 0.12), // Occupancy (~12%)
    Math.floor(pageWidth * 0.12)  // Hours (~12%)
  ];
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
  
  // Header tabel
  doc.rect(tableLeft, tableTop, tableWidth, 25).fillAndStroke('#f0f0f0', '#000000');
  
  doc.fillColor('#000000');
  doc.fontSize(10).font('Helvetica-Bold')
    .text('Event', tableLeft + 10, tableTop + 8)
    .text('Date', tableLeft + colWidths[0] + 10, tableTop + 8)
    .text('Organizer', tableLeft + colWidths[0] + colWidths[1] + 10, tableTop + 8)
    .text('Occupancy', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10, tableTop + 8)
    .text('Hours', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 10, tableTop + 8);
  
  // Table rows
  let currentY = tableTop + 25;
  doc.fontSize(9).font('Helvetica');
  
  // Sort events - filter past events first (non-upcoming)
  const pastEvents = eventsData.filter(event => !event.isUpcoming);
  
  // Sort past events by date (most recent first)
  const sortedEvents = pastEvents.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  sortedEvents.forEach((event, index) => {
    // Format date
    const date = moment(event.date).format('DD MMM YYYY');
    
    // Get organizer name
    const organizer = event.organizer && typeof event.organizer === 'object'
      ? (event.organizer.organizerName || event.organizer.fullName || event.organizer.username)
      : 'N/A';
    
    // Format occupancy and usage hours
    const occupancy = event.occupancy !== null ? `${event.occupancy}%` : 'N/A';
    const usageHours = event.usageHours !== null ? `${event.usageHours.toFixed(1)}` : 'N/A';
    
    // Warna latar belakang alternatif untuk baris
    const rowHeight = 20;
    
    // Periksa apakah perlu halaman baru
    if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom - 30) {
      doc.addPage();
      
      // Tambahkan header pada halaman baru dengan posisi yang tepat di awal halaman
      doc.fontSize(12).font('Helvetica-Bold').text('Past Events (continued)', doc.page.margins.left, doc.y, { underline: true, align: 'left' });
      doc.moveDown(0.5);
      
      // Ulangi header tabel
      currentY = doc.y;
      doc.rect(tableLeft, currentY, tableWidth, 25).fillAndStroke('#f0f0f0', '#000000');
      
      doc.fillColor('#000000');
      doc.fontSize(10).font('Helvetica-Bold')
        .text('Event', tableLeft + 10, currentY + 8)
        .text('Date', tableLeft + colWidths[0] + 10, currentY + 8)
        .text('Organizer', tableLeft + colWidths[0] + colWidths[1] + 10, currentY + 8)
        .text('Occupancy', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10, currentY + 8)
        .text('Hours', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 10, currentY + 8);
      
      currentY += 25;
      doc.fontSize(9).font('Helvetica');
    }
    
    // Warna latar belakang alternatif untuk baris
    if (index % 2 === 0) {
      doc.rect(tableLeft, currentY, tableWidth, rowHeight).fill('#f9f9f9');
    }
    
    // Border untuk seluruh baris
    doc.rect(tableLeft, currentY, tableWidth, rowHeight).stroke('#dddddd');
    
    // Write row
    doc.fillColor('#000000')
       .text(event.name, tableLeft + 10, currentY + 5, { width: colWidths[0] - 20, ellipsis: true })
       .text(date, tableLeft + colWidths[0] + 10, currentY + 5, { width: colWidths[1] - 20 })
       .text(organizer, tableLeft + colWidths[0] + colWidths[1] + 10, currentY + 5, { width: colWidths[2] - 20, ellipsis: true })
       .text(occupancy, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10, currentY + 5, { width: colWidths[3] - 20, align: 'center' })
       .text(usageHours, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 10, currentY + 5, { width: colWidths[4] - 20, align: 'center' });
    
    currentY += rowHeight;
  });
  
  doc.moveDown(1);
}

// Add utilization section to PDF
function addUtilizationSection(doc: typeof PDFDocument, utilizationData: any[]) {
  if (!utilizationData || utilizationData.length === 0) return;
  
  // Judul halaman - pastikan pada posisi yang tepat
  const yPos = doc.y;
  
  // Periksa apakah cukup ruang untuk judul dan header tabel (minimal 100 points)
  if (doc.page.height - doc.page.margins.bottom - yPos < 100) {
    // Tidak cukup ruang, buat halaman baru
    doc.addPage();
  }
  
  // Judul halaman - gunakan posisi awal halaman
  doc.fontSize(12).font('Helvetica-Bold').text('Auditorium Utilization', doc.page.margins.left, doc.y, { underline: true, align: 'left' });
  doc.moveDown(0.5);
  
  // Table header
  const tableTop = doc.y;
  const tableLeft = doc.page.margins.left;
  // Menghitung lebar halaman yang tersedia
  const pageWidth = doc.page.width - (doc.page.margins.left + doc.page.margins.right);
  // Menyesuaikan lebar kolom dengan proporsi yang tepat
  const colWidths = [
    Math.floor(pageWidth * 0.18), // Date (~18%)
    Math.floor(pageWidth * 0.17), // Hours Used (~17%)
    Math.floor(pageWidth * 0.17), // Hours Available (~17%)
    Math.floor(pageWidth * 0.18), // Utilization (~18%)
    Math.floor(pageWidth * 0.30)  // Events (~30%)
  ];
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
  
  // Header tabel
  doc.rect(tableLeft, tableTop, tableWidth, 25).fillAndStroke('#f0f0f0', '#000000');
  
  doc.fillColor('#000000');
  doc.fontSize(10).font('Helvetica-Bold')
    .text('Date', tableLeft + 10, tableTop + 8)
    .text('Hours Used', tableLeft + colWidths[0] + 10, tableTop + 8)
    .text('Hours Available', tableLeft + colWidths[0] + colWidths[1] + 10, tableTop + 8)
    .text('Utilization', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10, tableTop + 8)
    .text('Events', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 10, tableTop + 8);
  
  // Table rows
  let currentY = tableTop + 25;
  doc.fontSize(9).font('Helvetica');
  
  // Sort utilization records by date (most recent first)
  const sortedData = [...utilizationData].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  sortedData.forEach((record, index) => {
    // Format date
    const date = moment(record.date).format('DD MMM YYYY');
    
    // Format hours and utilization
    const hoursUsed = parseFloat(record.total_hours_used).toFixed(1);
    const hoursAvailable = record.total_hours_available;
    const utilization = `${record.utilization_percentage !== undefined ? 
      record.utilization_percentage : 
      ((record.total_hours_used / record.total_hours_available) * 100).toFixed(1)}%`;
    
    // Format events - nama event bukan jumlah event
    let eventNames = 'None';
    
    // Fungsi pembantu untuk mendapatkan nama event dari objek event yang populated
    const getEventName = (evt: any): string => {
      if (!evt) return 'Untitled Event';
      if (typeof evt === 'string') return evt;
      if (evt.name) return evt.name;
      return 'Untitled Event';
    };
    
    try {
      // Periksa events dari record.events (array of events)
      if (record.events && Array.isArray(record.events) && record.events.length > 0) {
        // Jika events sudah di-populate, maka akan memiliki properti name
        if (record.events[0] && typeof record.events[0] === 'object' && record.events[0].name) {
          eventNames = record.events.map(getEventName).join(', ');
        }
        // Jika populatedEvents ada (dari perubahan kita sebelumnya)
        else if (record.populatedEvents && Array.isArray(record.populatedEvents) && record.populatedEvents.length > 0) {
          eventNames = record.populatedEvents.map(getEventName).join(', ');
        }
        // Jika events adalah array yang berisikan ID saja (tidak dipopulate)
        else {
          eventNames = 'Event Data Unavailable';
        }
      }
    } catch (error) {
      console.error('Error processing event names:', error);
      eventNames = 'Error Processing Events';
    }
    
    // Warna latar belakang alternatif untuk baris
    const rowHeight = 20;
    // Memeriksa apakah rowHeight cukup untuk teks event names
    const eventNameHeight = doc.heightOfString(eventNames, { 
      width: colWidths[4] - 20, 
      ellipsis: true 
    });
    const adjustedRowHeight = Math.max(rowHeight, eventNameHeight + 10);
    
    // Periksa apakah perlu halaman baru
    // Gunakan nilai yang lebih besar untuk memastikan ada ruang cukup
    if (currentY + adjustedRowHeight > doc.page.height - doc.page.margins.bottom - 30) {
      doc.addPage();
      
      // Tambahkan header pada halaman baru dengan posisi yang tepat di awal halaman
      doc.fontSize(12).font('Helvetica-Bold').text('Auditorium Utilization (continued)', doc.page.margins.left, doc.y, { underline: true, align: 'left' });
      doc.moveDown(0.5);
      
      // Ulangi header tabel
      currentY = doc.y;
      doc.rect(tableLeft, currentY, tableWidth, 25).fillAndStroke('#f0f0f0', '#000000');
      
      doc.fillColor('#000000');
      doc.fontSize(10).font('Helvetica-Bold')
        .text('Date', tableLeft + 10, currentY + 8)
        .text('Hours Used', tableLeft + colWidths[0] + 10, currentY + 8)
        .text('Hours Available', tableLeft + colWidths[0] + colWidths[1] + 10, currentY + 8)
        .text('Utilization', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10, currentY + 8)
        .text('Events', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 10, currentY + 8);
      
      currentY += 25;
      doc.fontSize(9).font('Helvetica');
    }
    
    if (index % 2 === 0) {
      doc.rect(tableLeft, currentY, tableWidth, adjustedRowHeight).fill('#f9f9f9');
    }
    
    // Border untuk seluruh baris
    doc.rect(tableLeft, currentY, tableWidth, adjustedRowHeight).stroke('#dddddd');
    
    // Write row - pastikan semua text berada di sebelah kiri kolom masing-masing
    doc.fillColor('#000000')
       .text(date, tableLeft + 10, currentY + 5, { width: colWidths[0] - 20 })
       .text(hoursUsed, tableLeft + colWidths[0] + 10, currentY + 5, { width: colWidths[1] - 20, align: 'center' })
       .text(hoursAvailable.toString(), tableLeft + colWidths[0] + colWidths[1] + 10, currentY + 5, { width: colWidths[2] - 20, align: 'center' })
       .text(utilization, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10, currentY + 5, { width: colWidths[3] - 20, align: 'center' })
       .text(eventNames, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 10, currentY + 5, { 
          width: colWidths[4] - 20, 
          ellipsis: true,
          lineBreak: false // Mencegah text melebihi batas kolom
       });
    
    currentY += adjustedRowHeight;
  });
  
  doc.moveDown(1);
} 