import jsPDF from 'jspdf'

export function generateCertificate(data) {
  const { userName, archiveNumber, createdAt } = data
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Farben
  const primaryColor = [45, 80, 22]      // #2D5016
  const accentColor = [139, 115, 85]     // #8B7355
  const bgColor = [250, 249, 246]        // #FAF9F6

  // Hintergrund
  doc.setFillColor(...bgColor)
  doc.rect(0, 0, 210, 297, 'F')

  // Border
  doc.setDrawColor(...accentColor)
  doc.setLineWidth(0.5)
  doc.rect(20, 20, 170, 257)

  // Logo/Icon (einfacher Kreis mit Mikrofon-Symbol)
  doc.setFillColor(...primaryColor)
  doc.circle(105, 50, 15, 'F')
  
  // Mikrofon (vereinfacht als Text)
  doc.setFontSize(24)
  doc.setTextColor(250, 249, 246)
  doc.text('🎙', 105, 55, { align: 'center' })

  // Titel
  doc.setFontSize(32)
  doc.setTextColor(...primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text('VOICE GUARD', 105, 85, { align: 'center' })

  // Untertitel
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...accentColor)
  doc.text('Stimmen-Zertifikat', 105, 95, { align: 'center' })

  // Linie
  doc.setDrawColor(...accentColor)
  doc.setLineWidth(0.3)
  doc.line(40, 105, 170, 105)

  // Haupttext
  doc.setFontSize(12)
  doc.setTextColor(26, 26, 26)
  doc.setFont('helvetica', 'normal')
  doc.text('Diese Stimme gehört:', 105, 125, { align: 'center' })

  // Name (groß)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text(userName || 'Unbekannt', 105, 140, { align: 'center' })

  // Datum
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(26, 26, 26)
  doc.text('Aufgenommen am:', 105, 160, { align: 'center' })
  
  doc.setFont('helvetica', 'bold')
  const formattedDate = new Date(createdAt).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
  doc.text(formattedDate, 105, 170, { align: 'center' })

  // Archiv-Nummer
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Archiv-Nummer:', 105, 190, { align: 'center' })
  
  doc.setFont('courier', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...accentColor)
  doc.text(archiveNumber, 105, 200, { align: 'center' })

  // Linie
  doc.setDrawColor(...accentColor)
  doc.line(40, 215, 170, 215)

  // Beschreibungstext
  doc.setFontSize(10)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(107, 107, 107)
  const certText = 'Diese Stimme wurde authentisch aufgezeichnet und ist Teil des Voice Guard Archivs. Sie wird für die Ewigkeit bewahrt.'
  const splitText = doc.splitTextToSize(certText, 130)
  doc.text(splitText, 105, 230, { align: 'center' })

  // Footer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 107, 107)
  doc.text('Voice Guard • voiceguard.ch', 105, 270, { align: 'center' })
  doc.text('Bewahrt mit ❤️ in der Schweiz', 105, 275, { align: 'center' })

  return doc
}
