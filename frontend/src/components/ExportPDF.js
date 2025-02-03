// src/components/ExportPDF.js
import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ExportPDF = () => {
  const exportToPDF = () => {
    // Use the chart container (ensure its id matches what you use in EnhancedChart)
    const input = document.getElementById('chart-container');
    if (input) {
      html2canvas(input).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape');
        // Adjust these values to fit your chart size
        pdf.addImage(imgData, 'PNG', 10, 10, 280, 150);
        pdf.save('simulation_report.pdf');
      });
    }
  };

  return (
    <button
      onClick={exportToPDF}
      className="px-4 py-2 bg-red-500 text-white font-bold rounded hover:bg-red-600 transition-colors"
    >
      Export PDF
    </button>
  );
};

export default ExportPDF;
